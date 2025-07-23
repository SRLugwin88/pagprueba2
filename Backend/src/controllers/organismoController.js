const Organismo = require('../models/organismo');
const formatNom = require('../utils/normalizacion'); 

// Obtener todos los organismos (solo Administrador y Secretario)
const getOrganismos = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Verificar si el usuario tiene el rol de Administrador o Secretario
    if (req.userRol !== 'Administrador' && req.userRol !== 'Secretario') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const organismos = await Organismo.findAll();
    if (isDev) console.log('Organismos obtenidos:', organismos.length);
    res.status(200).json(organismos);
  } catch (err) {
    if (isDev) console.error('Error al obtener los organismos:', err.message);
    res.status(500).json({ error: isDev ? 'Error al obtener los organismos: ' + err.message : 'Error al obtener los organismos' });
  }
};

// Crear un nuevo organismo (solo Administrador y Secretario)
const createOrganismo = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Verificar si el usuario tiene el rol de Administrador o Secretario
    if (req.userRol !== 'Administrador' && req.userRol !== 'Secretario') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const { nombre, tipo, direccion, telefono, email } = req.body;

    // Validar que los campos requeridos no estén vacíos
    if (!nombre || !tipo) {
      return res.status(400).json({ message: 'El nombre y el tipo son requeridos' });
    }

    // Normalizar el nombre antes de crear el organismo
    const nombreNormalizado = formatNom(nombre, {
      abbrs: ['gral', 'srl', 'inc'], // Abreviaturas específicas para organismos
      emptyErrorMessage: 'El nombre del organismo no puede estar vacío.',
    });

    const newOrganismo = await Organismo.create({
      nombre: nombreNormalizado,
      tipo,
      direccion,
      telefono,
      email,
    });
    if (isDev) console.log('Organismo creado:', newOrganismo.id_org);
    res.status(201).json(newOrganismo);
  } catch (err) {
    if (isDev) console.error('Error al crear el organismo:', err.message);
    res.status(500).json({ error: isDev ? 'Error al crear el organismo: ' + err.message : 'Error al crear el organismo' });
  }
};

// Actualizar un organismo (solo Administrador y Secretario)
const updateOrganismo = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Verificar si el usuario tiene el rol de Administrador o Secretario
    if (req.userRol !== 'Administrador' && req.userRol !== 'Secretario') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const { id_org } = req.params;
    const { nombre, tipo, direccion, telefono, email } = req.body;

    // Validar que los campos requeridos no estén vacíos
    if (!nombre || !tipo) {
      return res.status(400).json({ message: 'El nombre y el tipo son requeridos' });
    }

    // Normalizar el nombre antes de actualizar el organismo
    const nombreNormalizado = formatNom(nombre, {
      abbrs: ['gral', 'srl', 'inc'], // Abreviaturas específicas para organismos
      emptyErrorMessage: 'El nombre del organismo no puede estar vacío.',
    });

    const organismoToUpdate = await Organismo.findByPk(id_org);
    if (!organismoToUpdate) {
      return res.status(404).json({ message: 'Organismo no encontrado' });
    }

    await organismoToUpdate.update({
      nombre: nombreNormalizado,
      tipo,
      direccion,
      telefono,
      email,
    });
    if (isDev) console.log('Organismo actualizado:', organismoToUpdate.id_org);
    res.status(200).json(organismoToUpdate);
  } catch (err) {
    if (isDev) console.error('Error al actualizar el organismo:', err.message);
    res.status(500).json({ error: isDev ? 'Error al actualizar el organismo: ' + err.message : 'Error al actualizar el organismo' });
  }
};

// Eliminar un organismo (solo Administrador)
const deleteOrganismo = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    // Verificar si el usuario tiene el rol de Administrador
    if (req.userRol !== 'Administrador') {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }

    const { id_org } = req.params;

    const organismoToDelete = await Organismo.findByPk(id_org);
    if (!organismoToDelete) {
      return res.status(404).json({ message: 'Organismo no encontrado' });
    }

    await organismoToDelete.destroy();
    if (isDev) console.log('Organismo eliminado:', organismoToDelete.id_org);
    res.status(200).json({ message: 'Organismo eliminado exitosamente' });
  } catch (err) {
    if (isDev) console.error('Error al eliminar el organismo:', err.message);
    res.status(500).json({ error: isDev ? 'Error al eliminar el organismo: ' + err.message : 'Error al eliminar el organismo' });
  }
};

// Exportar las funciones como un objeto
module.exports = {
  getOrganismos,
  createOrganismo,
  updateOrganismo,
  deleteOrganismo,
};