const { Usuario, Role, Empleado, Departamento, Notificacion,  sequelize } = require('../models/IndexModel');
const { validationResult } = require('express-validator');
const formatNom = require('../utils/normalizacion');
const { ESTADOS, ROLES } = require('../utils/constantes');
const bcrypt = require('bcrypt');

const roles = {
  [ROLES.SECRETARIO]: 1,
  [ROLES.ADMINISTRADOR]: 2,
  [ROLES.EMPLEADO]: 3,
};

//  Crear usuario , empleado y notificación
const createUsuario = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nombre_completo, dni, email, contrasena, departamento, rol_solicitado, direccion, telefono, estado, es_responsable } = req.body;
  const id_rol = roles[rol_solicitado];
  if (!id_rol) {
    return res.status(400).json({ message: 'Rol solicitado no válido.' });
  }

  const transaction = await sequelize.transaction();
  try {
     // Verificar si el departamento existe
     const departamentoExistente = await Departamento.findOne({ where: { nombre: departamento } });
     if (!departamentoExistente) {
       await transaction.rollback();
       return res.status(400).json({ message: 'El departamento proporcionado no es válido.' });
     }
    // Verificar si ya existe un usuario con el mismo DNI o email
    const usuarioExistente = await Usuario.findOne({ where: { username: dni } });
    if (usuarioExistente) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El DNI ya está registrado.' });
    }

    const empleadoExistente = await Empleado.findOne({ where: { email } });
    if (empleadoExistente) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El email ya está registrado.' });
    }

    // Crear empleado y usuario
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const normalizedNombreCompleto = formatNom(nombre_completo);
    
    // Preparar datos del empleado
    const empleadoData = {
      nombre_completo: normalizedNombreCompleto,
      dni: parseInt(dni),
      direccion: direccion || null,
      telefono:parseInt(telefono),
      email,
      estado: estado || 'Activo',
      id_dpto: departamentoExistente.id_dpto,
      es_responsable: es_responsable || false,
      rol_solicitado
    };
    
    if (isDev) console.log('Datos del empleado a crear:', empleadoData);
    
    const empleado = await Empleado.create(empleadoData, { transaction });
    
    if (!empleado || !empleado.id_empleado) {
      await transaction.rollback();
      return res.status(500).json({ message: 'Error al registrar usuario: Empleado no generado.' });
    }
    const usuario = await Usuario.create({
      username: dni,
      contrasena: hashedPassword,
      id_rol,
      estado: ESTADOS.PENDIENTE,
      id_empleado: empleado.id_empleado
    }, { transaction });
 
    if (!usuario || !usuario.id_usuario) {
      await transaction.rollback();
      return res.status(500).json({ message: 'Error al registrar usuario: Usuario no generado.' });
    }
    // Crear notificación para el secretario
    const notificacion = await Notificacion.create(
      {
        id_usuario: usuario.id_usuario,
        mensaje: `El usuario con DNI ${dni} ha solicitado el rol de ${rol_solicitado}.`,
        leida: false // Marcamos como no leída
      },
      { transaction }
    );

    await transaction.commit();

    // Respuesta de éxito
    if (isDev) console.log('Usuario y notificación creados:', usuario.id_usuario, notificacion.id_notificacion);
    res.status(201).json({
      message: 'Registro enviado. Notificación creada. Esperando aprobación.',
      usuario,
      notificacion
    });
  } catch (error) {
    await transaction.rollback();
    if (isDev) {
      console.error('Error completo al registrar usuario:', error);
      console.error('Stack trace:', error.stack);
    }
    // Si es un error de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      if (isDev) console.error('Errores de validación específicos:', validationErrors);
      return res.status(400).json({ 
        message: 'Errores de validación', 
        errors: validationErrors 
      });
    }
    // Si es un error de constraint único
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'campo desconocido';
      return res.status(400).json({ 
        message: `El ${field} ya está registrado.`, 
        error: 'Duplicate entry' 
      });
    }
    res.status(500).json({ 
      message: isDev ? 'Error al registrar usuario: ' + error.message : 'Error al registrar usuario',
      type: error.name
    });
  }
};

// Funcion para Obtener todos los usuarios
const getUsuarios = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Obtener todos los usuarios con su estado, rol y detalles del empleado
    const usuarios = await Usuario.findAll({
      attributes: ['id_usuario', 'estado'], 
      include: [
        {
          model: Empleado,
          as: 'empleado',
          attributes: ['nombre_completo', 'dni'], 
        },
        {
          model: Role,
          as: 'rol',
          attributes: ['rol'] 
        }
      ]
    });

    if (!usuarios.length) {
      return res.status(404).json({ message: 'No se encontraron usuarios registrados.' });
    }

    if (isDev) console.log('Usuarios obtenidos:', usuarios.length);
    res.status(200).json({ usuarios });
  } catch (error) {
    if (isDev) console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: isDev ? 'Error al obtener usuarios: ' + error.message : 'Error al obtener usuarios' });
  }
};

module.exports = { createUsuario, getUsuarios };