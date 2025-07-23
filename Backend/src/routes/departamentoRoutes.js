const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');
const { verifyToken } = require('../middleware/auth');
const authRole = require('../middleware/authRole');

// Obtener todos los departamentos (Administrador, Secretario y Empleado)
router.get('/getdepartamentos',  departamentoController.getDepartamentos);

// Crear un nuevo departamento (solo Administrador y Secretario)
router.post('/createdepartamento', verifyToken, authRole(['Administrador', 'Secretario']), departamentoController.createDepartamento);

// Actualizar un departamento (solo Administrador y Secretario)
router.put('/updatedepartamento/:id_dpto', verifyToken, authRole(['Administrador', 'Secretario']), departamentoController.updateDepartamento);

// Eliminar un departamento (solo Administrador)
router.delete('/deletedepartamento/:id_dpto', verifyToken, authRole(['Administrador']), departamentoController.deleteDepartamento);

module.exports = router;