const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

// Ruta para solicitar restablecimiento de contraseña
router.post('/requestPasswordReset', authController.requestPasswordReset);

// Ruta para restablecer la contraseña
router.post('/reset-password', authController.resetPassword);
module.exports = router;
