const sequelize = require('../../config/db');
const { Notificacion, Usuario, Departamento, Empleado } = require('../models/IndexModel');
const handleError = require('../utils/errorHandler');
const { ESTADOS } = require('../utils/constantes');
const sendEmail = require('../utils/emailSender');


//Función auxiliar para estructurar la respuesta
const buildNotificationResponse = (notificaciones) => {
  if (!notificaciones.length) {
    return { 
      message: 'No hay notificaciones disponibles', 
      conteo: 0, 
      notificaciones: [] 
    };
  }
  return { conteo: notificaciones.length, notificaciones };
};

//  Funcion para obtener notificaciones con filtros
const getNotificaciones = async (req, res) => {
  try {
    const { estado } = req.query;
    const estadoFiltro = estado || ESTADOS.PENDIENTE; // Filtra por estado si no se envía otro parámetro

    const notificaciones = await Notificacion.findAll({
      include: [
        { 
          model: Usuario, 
          as: 'remitente', // Usuario NUEVO que solicitó el registro al sistema
          attributes: ['id_usuario', 'estado'], 
          where: { estado: estadoFiltro }, 
          include: [
            { 
              model: Empleado, 
              as: 'empleado',
              attributes: ['id_empleado','dni', 'nombre_completo', 'rol_solicitado'], // datos personales del empleado
              include: [
                { model: Departamento, as: 'departamento', attributes: ['nombre'] }
              ]
            }
          ]
        },
        { 
          model: Usuario, 
          as: 'decidido_por', // Secretario que toma la decisión(aprobar/rechazar)
          attributes: ['id_usuario'], 
          include: [
            { 
              model: Empleado, 
              as: 'empleado',
              attributes: ['nombre_completo'] // Accedemos  al nombre del secretario que tomo la desicion  
            }            
          ]
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });
    res.status(200).json(buildNotificationResponse(notificaciones));
  } catch (error) {
    handleError(res, error, 'Error al obtener notificaciones');
  }
};

// Funcion para acciones de aprobación/rechazo de usuario
const handleNotificationAction = async (req, res, estado) => {
  let transaction;
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    transaction = await sequelize.transaction();
    const { id_notificacion } = req.params;
    const notificacion = await Notificacion.findByPk(id_notificacion, {
      transaction,
      include: [{ model: Usuario, as: 'remitente', include: [{ model: Empleado, as: 'empleado' }] }]
    });
    if (!notificacion) {
      await transaction.rollback();
      if (isDev) console.log(' Notificación no encontrada. ID:', id_notificacion);
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    const usuario = notificacion.remitente;

    if (!usuario) {
      await transaction.rollback();
      if (isDev) console.log(' Usuario asociado no encontrado en la notificación.');
      return res.status(404).json({ message: 'Usuario asociado no encontrado' });
    }

    //  Verificar permisos de aprobación/rechazo
    if (!req.userId || (req.userRol !== 'Administrador' && req.userRol !== 'Secretario')) {
      await transaction.rollback();
      if (isDev) console.log(' Permisos insuficientes para realizar la acción.');
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    //  **Actualizar estado del usuario**
    if (isDev) console.log('Actualizando estado del usuario:', usuario.id_usuario, 'Nuevo estado:', estado);
    
    await usuario.update({ estado }, { transaction });

    if (isDev) console.log(' Estado actualizado correctamente.');

    //  **Enviar correo al usuario**
    const mensaje = estado === ESTADOS.APROBADO
      ? `Hola ${usuario.empleado.nombre_completo},\n\nTu solicitud ha sido APROBADA.\n\n📌 **Detalles de tu cuenta:**\n🔹 Usuario: ${usuario.empleado.dni}\n🔹 Contraseña: ******\n🔹 Estado: Aprobado\n\n✅ Ya puedes acceder al sistema.`
      : `Hola ${usuario.empleado.nombre_completo},\n\nTu solicitud ha sido RECHAZADA.\n\nPara más información, comunícate con Mesa de Entrada.`;

    if (isDev) console.log('Enviando correo a:', usuario.empleado.email);

    sendEmail(usuario.empleado.email, `Estado de tu registro: ${estado}`, mensaje)
      .then(() => { if (isDev) console.log(` Correo enviado a ${usuario.empleado.email}`); })
      .catch(error => { if (isDev) console.error(' Error al enviar correo:', error); });

    //  **Actualizar notificación**
    if (isDev) console.log('Marcando la notificación como leída:', id_notificacion);
    
    await Notificacion.update(
      {
        leida: true,
        fecha_decision: new Date(),
        id_usuario_decision: req.userId 
      },
      { where: { id_notificacion }, transaction }
    );

    if (isDev) console.log(' Notificación actualizada correctamente.');

    await transaction.commit();

    if (isDev) console.log(' Acción completada con éxito.');
    
    return res.status(200).json({ success: true, message: `Usuario ${estado.toLowerCase()} exitosamente` });

  } catch (error) {
    if (transaction) await transaction.rollback();
    if (isDev) console.error(' Error al procesar la acción de notificación:', error);
    return res.status(500).json({ message: 'Error al procesar la acción de notificación' });
  }
};


//  **Funciones para aprobar o rechazar usuario**
const approveUser = (req, res) => handleNotificationAction(req, res, ESTADOS.APROBADO);
const rejectUser = (req, res) => handleNotificationAction(req, res, ESTADOS.RECHAZADO);

module.exports = {
  getNotificaciones,
  approveUser,
  rejectUser
};
