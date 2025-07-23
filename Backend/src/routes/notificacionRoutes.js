const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { verifyToken } = require('../middleware/auth');
const authRole = require('../middleware/authRole');
const { ROLES } = require('../utils/constantes'); 

// Obtener notificaciones (filtradas por estado) ejemplo `get /notificaciones?estado=Aprobado
router.get('/', verifyToken, authRole([ROLES.SECRETARIO, ROLES.ADMINISTRADOR]), notificacionController.getNotificaciones);

// Rutas protegidas: solo el Secretario puede aprobar o rechazar usuarios
router.put('/aprobar/:id_notificacion', verifyToken, authRole([ROLES.SECRETARIO]), notificacionController.approveUser);
router.put('/rechazar/:id_notificacion', verifyToken, authRole([ROLES.SECRETARIO]), notificacionController.rejectUser);


module.exports = router;