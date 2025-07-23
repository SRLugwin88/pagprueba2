const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const usuarioValidator = require('../utils/usuarioValidator');
const { verifyToken } = require('../middleware/auth');
const authRole = require('../middleware/authRole');
const { ROLES } = require('../utils/constantes');

// Ruta para crear usuario (sin restricción de rol)
router.post('/createUsuario', usuarioValidator, usuarioController.createUsuario);


// Ruta protegida: solo Secretario y Administrador pueden ver la lista de usuarios
router.get('/getUsuarios', verifyToken, authRole([ROLES.SECRETARIO, ROLES.ADMINISTRADOR]), usuarioController.getUsuarios);

module.exports = router;

