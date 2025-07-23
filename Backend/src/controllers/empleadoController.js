const empleado = require('../models/empleado');
const Departamento = require('../models/departamento');

// Obtener todos los empleados (solo Administrador y Secretario)
const getEmpleados = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    const empleados = await empleado.findAll({
      include: [{
        model: Departamento,
        as: 'departamento',
        attributes: ['id_dpto', 'nombre'] // Incluye tanto el ID como el nombre del departamento
      }]
    });

    // Validar que cada empleado tenga un departamento asignado
    if (isDev) {
      empleados.forEach(emp => {
        if (!emp.departamento || !emp.departamento.id_dpto) {
          console.warn(`El empleado ${emp.nombre_completo} no tiene un departamento asignado correctamente.`);
        }
      });
      console.log('Empleados obtenidos:', empleados.length);
    }

    res.json(empleados);
  } catch (err) {
    if (isDev) console.error("Error al obtener empleados:", err.message);
    res.status(500).json({ error: isDev ? err.message : 'Error al obtener empleados' });
  }
};

// Actualizar un empleado (solo Administrador y Secretario)
const updateEmpleado = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (!['Administrador', 'Secretario'].includes(req.userRol)) {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  try {
    const empleadoToUpdate = await empleado.findByPk(req.params.id, {
      include: [{
        association: 'departamento',
        attributes: ['nombre']
      }]
    });

    if (!empleadoToUpdate) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    await empleadoToUpdate.update(req.body);

    const empleadoActualizadoConDepartamento = await empleado.findByPk(req.params.id, {
      include: [{
        association: 'departamento',
        attributes: ['nombre']
      }]
    });

    if (isDev) console.log('Empleado actualizado:', empleadoActualizadoConDepartamento.id_empleado);
    res.json(empleadoActualizadoConDepartamento);
  } catch (err) {
    if (isDev) console.error('Error al actualizar empleado:', err.message);
    res.status(500).json({ error: isDev ? err.message : 'Error al actualizar empleado' });
  }
};

// --- Funciones del controlador para crear y eliminar empleados estan deshabilitadas a nivel de ruta ---
// Crear un nuevo empleado (solo Administrador y Secretario)
const createEmpleado = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (!['Administrador', 'Secretario'].includes(req.userRol)) {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  try {
    const newEmpleado = await empleado.create(req.body);
    if (isDev) console.log('Empleado creado:', newEmpleado.id_empleado);
    res.json(newEmpleado);
  } catch (err) {
    if (isDev) console.error('Error al crear empleado:', err.message);
    res.status(500).json({ error: isDev ? err.message : 'Error al crear empleado' });
  }
};


module.exports = {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
};
