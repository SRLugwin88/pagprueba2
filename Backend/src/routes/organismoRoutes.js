const express = require('express');
const router = express.Router();
const organismoController = require('../controllers/organismoController');
const { verifyToken } = require('../middleware/auth');
const authRole = require('../middleware/authRole');

// Obtener todos los organismos (solo Administrador y Secretario)
router.get('/getorganismos', verifyToken, authRole(['Administrador', 'Secretario']), organismoController.getOrganismos);

// Crear un nuevo organismo (solo Administrador y Secretario)
router.post('/createorganismo', verifyToken, authRole(['Administrador', 'Secretario']), organismoController.createOrganismo);

// Actualizar un organismo (solo Administrador y Secretario)
router.put('/updateorganismo/:id_org', verifyToken, authRole(['Administrador', 'Secretario']), organismoController.updateOrganismo);

// Eliminar un organismo (solo Administrador)
router.delete('/deleteorganismo/:id_org', verifyToken, authRole(['Administrador']), organismoController.deleteOrganismo);

module.exports = router;