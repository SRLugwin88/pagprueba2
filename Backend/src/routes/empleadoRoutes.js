const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { verifyToken } = require('../middleware/auth');
const authRole = require('../middleware/authRole'); 
const { ROLES } = require('../utils/constantes');

//  Endpoints create y delete deshabilitados temporalmente por requerimiento de lógica de negocio ---
router.post('/', verifyToken, empleadoController.createEmpleado); // Deshabilitado: La creación se maneja en el proceso de registro/auth.


// Solo Administrador y Secretario pueden obtener empleados
router.get('/getEmpleados', verifyToken, authRole([ROLES.ADMINISTRADOR, ROLES.SECRETARIO, ROLES.EMPLEADO]), empleadoController.getEmpleados);

// Solo Administrador y Secretario pueden actualizar empleados
router.put('/updateEmpleado/:id', verifyToken, authRole([ROLES.ADMINISTRADOR, ROLES.SECRETARIO]), empleadoController.updateEmpleado);

module.exports = router;
