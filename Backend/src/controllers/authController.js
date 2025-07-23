const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuario = require('../models/usuario');
const { jwtSecret, jwtExpiresIn } = require('../../config/config');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { validatePassword } = require('../utils/validatePass');
const transporter = require('../../config/nodemailer'); 
const { ESTADOS} = require('../utils/constantes'); 
const Role = require('../models/role');
const Empleado = require('../models/empleado');
const Usuario = require('../models/usuario');


// Función para inicio de sesión
const login = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Extraer los datos correctamente desde req.body
    const { username, contrasena } = req.body;

    // Validar que username está definido
    if (!username) {
      if (isDev) console.error("ERROR: `username` no está definido.");
      return res.status(400).json({ message: "Falta el parámetro `username`" });
    }

    if (isDev) console.log(" Username recibido:", username);

    // Busca al usuario en la base de datos
    const user = await Usuario.findOne({ 
      where: { username, estado: ESTADOS.APROBADO }, 
      include: [
        { model: Role, as: 'rol' },
        { model: Empleado, as: 'empleado', include: [{ model: require('../models/departamento'), as: 'departamento' }] }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado o no aprobado. Por favor, verifica tu usuario y estado." });
    }

    // Verificar contraseña usando bcrypt (todas las contraseñas están hasheadas)
    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);
    
    if (!isPasswordValid) {
      if (isDev) console.log('Contraseña incorrecta para usuario:', username);
      return res.status(401).json({ message: 'Contraseña incorrecta. Por favor, intente nuevamente.' });
    }
    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol.rol },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        username: user.username, 
        email: user.empleado.email,
        nombre_completo: user.empleado.nombre_completo,
        id_empleado: user.id_empleado,
        dni: user.empleado.dni,
        id_rol: user.id_rol,
        estado: user.estado,
        rol: user.rol.rol,
        // Agregar info de departamento
        departamento: user.empleado.departamento ? {
          id_dpto: user.empleado.departamento.id_dpto,
          nombre: user.empleado.departamento.nombre
        } : null
      },
    });
  } catch (error) {
    if (isDev) console.error('Error en /auth/login:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: isDev ? error.message : undefined });
  }
};

const requestPasswordReset = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const username = req.body.username ? req.body.username.trim() : null;
  const email = req.body.email ? req.body.email.trim() : null;

  try {
    // Busca al usuario en la base de datos
    const user = await Usuario.findOne({
      where: { username },
      include: [{ model: Empleado, as: 'empleado' }]
    });

    if (!user || user.empleado.email !== email) {
      return res.status(404).json({ message: 'DNI o correo electrónico incorrectos' });
    }

    // Genera un token único y una fecha de expiración
    const token = crypto.randomBytes(20).toString('hex');
    const expirationDate = new Date(Date.now() + 3600000); // Expira en 1 hora

    // Guarda el token en la base de datos
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expirationDate;
    await user.save();

    // Genera el enlace de recuperación
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5001';
    const resetLink = `${clientUrl}/resetPassword/${token}`;

    // Configura el correo correctamente
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Restablecimiento de contraseña - GesDoc26',
      text: `Por favor haga clic en el siguiente enlace para restablecer su contraseña: ${resetLink}`
    };

    // Envía el correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        if (isDev) console.error('Error al enviar el correo:', error);
        return res.status(500).json({ message: 'Error al enviar el correo' });
      }
      if (isDev) console.log('Correo enviado:', info.response);
      res.status(200).json({ message: 'Correo enviado con éxito' });
    });

  } catch (error) {
    if (isDev) console.error('Error en requestPasswordReset:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

  

// Función para restablecer la contraseña
const resetPassword = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const { token, newPassword } = req.body;

  try {
    // Validar la contraseña en el backend
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Busca al usuario por el token y verifica la fecha de expiración
    const user = await usuario.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }, // Token no expirado
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Guarda la contraseña en texto plano (el hook del modelo usuario se encargará de hashearla)
    user.contrasena = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save(); 

    res.status(200).json({ message: 'Contraseña restablecida con éxito' });
  } catch (error) {
    if (isDev) console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  login,
  requestPasswordReset,
  resetPassword
};