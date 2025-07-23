const role = require('../models/role');

// Obtener todos los roles (solo Administrador)
const getRoles = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (req.userRol !== 'Administrador') {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  try {
    const roles = await role.findAll();
    if (isDev) console.log('Roles obtenidos:', roles.length);
    res.json(roles);
  } catch (err) {
    if (isDev) console.error('Error al obtener roles:', err.message);
    res.status(500).json({ error: isDev ? 'Error al obtener roles: ' + err.message : 'Error al obtener roles' });
  }
};

// Crear un nuevo rol (solo Administrador)
const createRole = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (req.userRol !== 'Administrador') {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  try {
    const newRole = await role.create(req.body);
    if (isDev) console.log('Rol creado:', newRole.id);
    res.json(newRole);
  } catch (err) {
    if (isDev) console.error('Error al crear rol:', err.message);
    res.status(500).json({ error: isDev ? 'Error al crear rol: ' + err.message : 'Error al crear rol' });
  }
};

// Actualizar un rol (solo Administrador)
const updateRole = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (req.userRol !== 'Administrador') {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  try {
    const roleToUpdate = await role.findByPk(req.params.id);
    if (!roleToUpdate) return res.status(404).json({ message: 'Rol no encontrado' });
    
    await roleToUpdate.update(req.body);
    if (isDev) console.log('Rol actualizado:', roleToUpdate.id);
    res.json(roleToUpdate);
  } catch (err) {
    if (isDev) console.error('Error al actualizar rol:', err.message);
    res.status(500).json({ error: isDev ? 'Error al actualizar rol: ' + err.message : 'Error al actualizar rol' });
  }
};

// Eliminar un rol (solo Administrador)
const deleteRole = async (req, res) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (req.userRol !== 'Administrador') {
    return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
  }
  try {
    const roleToDelete = await role.findByPk(req.params.id);
    if (!roleToDelete) return res.status(404).json({ message: 'Rol no encontrado' });
    
    await roleToDelete.destroy();
    if (isDev) console.log('Rol eliminado:', roleToDelete.id);
    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (err) {
    if (isDev) console.error('Error al eliminar rol:', err.message);
    res.status(500).json({ error: isDev ? 'Error al eliminar rol: ' + err.message : 'Error al eliminar rol' });
  }
};

module.exports = {
  getRoles,
  createRole,
  updateRole,
  deleteRole
};

