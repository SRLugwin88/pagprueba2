// Importaciones necesarias
const { Notificacion } = require('../models/IndexModel');
const hashPassword = require('../utils/hashPassword');

/**
 * Hook beforeUpdateUsuario: 
 * - Hashea la nueva contraseña si cambia. 
 * - Actualiza la notificación cuando el estado del usuario cambia.
 *
 * Este hook se ejecuta antes de actualizar cualquier usuario en la base de datos.
 */
const beforeUpdateUsuario = async (user) => {
  try {
    // Si la contraseña ha cambiado, aplicamos hashing antes de guardar
    const isDev = process.env.NODE_ENV !== 'production';
    if (user.contrasena && user.changed('contrasena')) {
      if (isDev) console.log('Nueva contraseña detectada, aplicando hash...');
      await hashPassword(user);
    }

    // Si el estado del usuario cambia, actualizamos la notificación relacionada
    if (user.changed('estado')) {
      if (isDev) console.log(`Actualizando estado del usuario a: ${user.estado}`);

      // Buscar notificación asociada al usuario
      const notificacion = await Notificacion.findOne({
        where: { id_usuario: user.id_usuario }
      });

      if (notificacion) {
        notificacion.mensaje = `Cuenta ${user.estado}`;
        await notificacion.save();
        if (isDev) console.log('Notificación actualizada correctamente.');
      } else {
        if (isDev) console.log('No se encontró una notificación para actualizar.');
      }
    }
  } catch (error) {
    console.error('Error en beforeUpdateUsuario:', error);
    throw error;
  }
};

// Exportamos el hook para su uso en el modelo Usuario
module.exports = { beforeUpdateUsuario };
