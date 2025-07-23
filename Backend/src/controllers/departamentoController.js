const departamento = require('../models/departamento');
const formatNom = require('../utils/normalizacion'); // Importar la función de normalización

// Obtener todos los departamentos (permitido para todos)
const getDepartamentos = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    const departamentos = await departamento.findAll();
    res.status(200).json({ departamentos });
  } catch (err) {
    res.status(500).json({ error: isDev ? 'Error al obtener los departamentos: ' + err.message : 'Error al obtener los departamentos' });
  }
};

// Crear un nuevo departamento (solo Administrador y Secretario)
const createDepartamento = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Verificar si el usuario tiene el rol de Administrador o Secretario
    if (req.userRol !== 'Administrador' && req.userRol !== 'Secretario') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const { nombre } = req.body;

    // Validar que el nombre no esté vacío
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del departamento es requerido' });
    }

    // Normalizar el nombre antes de crear el departamento
    const nombreNormalizado = formatNom(nombre);

    const newDepartamento = await departamento.create({ nombre: nombreNormalizado });
    res.status(201).json(newDepartamento);
  } catch (err) {
    res.status(500).json({ error: isDev ? 'Error al crear el departamento: ' + err.message : 'Error al crear el departamento' });
  }
};

// Actualizar un departamento (solo Administrador y Secretario)
const updateDepartamento = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Verificar si el usuario tiene el rol de Administrador o Secretario
    if (req.userRol !== 'Administrador' && req.userRol !== 'Secretario') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const { id_dpto } = req.params;
    const { nombre } = req.body;

    // Validar que el nombre no esté vacío
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre del departamento es requerido' });
    }

    // Normalizar el nombre antes de actualizar el departamento
    const nombreNormalizado = formatNom(nombre);

    const departamentoToUpdate = await departamento.findByPk(id_dpto);
    if (!departamentoToUpdate) {
      return res.status(404).json({ message: 'Departamento no encontrado' });
    }

    await departamentoToUpdate.update({ nombre: nombreNormalizado });
    res.status(200).json(departamentoToUpdate);
  } catch (err) {
    res.status(500).json({ error: isDev ? 'Error al actualizar el departamento: ' + err.message : 'Error al actualizar el departamento' });
  }
};

// Eliminar un departamento (solo Administrador)
const deleteDepartamento = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Verificar si el usuario tiene el rol de Administrador
    if (req.userRol !== 'Administrador') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const { id_dpto } = req.params;

    const departamentoToDelete = await departamento.findByPk(id_dpto);
    if (!departamentoToDelete) {
      return res.status(404).json({ message: 'Departamento no encontrado' });
    }

    await departamentoToDelete.destroy();
    res.status(200).json({ message: 'Departamento eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: isDev ? 'Error al eliminar el departamento: ' + err.message : 'Error al eliminar el departamento' });
  }
};


// Exportar las funciones como un objeto
module.exports = {
  getDepartamentos,
  createDepartamento,
  updateDepartamento,
  deleteDepartamento
};