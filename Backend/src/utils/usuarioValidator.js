// utils/usuarioValidator.js
const { body } = require('express-validator');

const usuarioValidator = [
 
    // Validar nombre_completo
  body('nombre_completo')
    .notEmpty().withMessage('Nombre completo es requerido')
    .isLength({ min: 6 }).withMessage('Nombre completo debe tener al menos 6 caracteres')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Nombre completo solo puede contener letras y espacios')
    .custom((value) => {
      const palabras = value.trim().split(/\s+/); 
      if (palabras.length < 2) {
        throw new Error('El nombre completo debe incluir al menos un nombre y un apellido');
      }
      return true;
    }),

  // Validar DNI
  body('dni')
    .notEmpty().withMessage('DNI es requerido')
    .isLength({ min: 7, max: 8 }).withMessage('DNI debe tener 7 o 8 dígitos')
    .isNumeric().withMessage('DNI solo puede contener números'),

  // Validar teléfono
  body('telefono')
    .optional()
    .isLength({ min: 10, max: 15 }).withMessage('Teléfono debe tener entre 10 y 15 dígitos')
    .isNumeric().withMessage('Teléfono solo puede contener números'),

  // Validar dirección
  body('direccion')
    .optional()
    .isLength({ min: 5, max: 100 }).withMessage('Dirección debe tener entre 5 y 100 caracteres'),

  // Validar departamento
  body('departamento')
    .notEmpty().withMessage('Departamento es requerido')
    .isLength({ min: 2 }).withMessage('Departamento debe tener al menos 2 caracteres'),
    
  // Validar email
  body('email')
    .notEmpty().withMessage('Correo electrónico es obligatorio')
    .isEmail().withMessage('Email no válido')
    .matches(/@.*\.(com|com\.ar)$/).withMessage('El correo electrónico debe contener "@" y terminar en ".com" o ".com.ar"'),

  // Validar contraseña
  body('contrasena')
    .notEmpty().withMessage('Contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una letra mayúscula')
    .matches(/\d/).withMessage('La contraseña debe tener al menos un número')
    .matches(/[_*]/).withMessage('La contraseña debe tener al menos un carácter especial (_*)'),

  // Validar rol_solicitado
  body('rol_solicitado')
    .notEmpty().withMessage('Rol es requerido')
    .isIn(['Administrador', 'Secretario', 'Empleado']).withMessage('Rol no válido'),
];

module.exports = usuarioValidator;