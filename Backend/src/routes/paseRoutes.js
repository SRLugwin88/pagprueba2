const express = require('express');
const router = express.Router();
const paseController = require('../controllers/paseController');
const { verifyToken } = require('../middleware/auth');
const authRole = require('../middleware/authRole'); 
const { ROLES } = require('../utils/constantes');

// Rutas para pases
router.get('/getPases/:id_doc', verifyToken, authRole([ROLES.ADMINISTRADOR, ROLES.SECRETARIO, ROLES.EMPLEADO]), paseController.getPasesByDocumento);
router.post('/createPase', verifyToken, authRole([ROLES.ADMINISTRADOR, ROLES.SECRETARIO, ROLES.EMPLEADO]), paseController.createPase);
router.put('/updatePase/:id', verifyToken, authRole([ROLES.ADMINISTRADOR,ROLES.SECRETARIO, ROLES.EMPLEADO]), paseController.updatePase);
router.delete('/deletePase/:id_pase', verifyToken, authRole([ROLES.ADMINISTRADOR]), paseController.deletePase);
// Ruta para obtener todos los pases (todos los roles pueden acceder)
router.get('/getPases', verifyToken, authRole([ROLES.ADMINISTRADOR, ROLES.SECRETARIO, ROLES.EMPLEADO]), paseController.getAllPases);

module.exports = router;