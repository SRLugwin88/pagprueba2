const authRole = (roles) => {
  return (req, res, next) => {
    // Verificar si el usuario está autenticado y tiene un rol
    if (!req.userRol) {
      return res.status(403).json({ message: 'Acceso denegado. Usuario no autenticado o sin rol.' });
    }

    // Verificar si el rol del usuario está en la lista de roles permitidos
    if (roles.includes(req.userRol)) {
      next(); // Permitir el acceso
    } else {
      // Crear un mensaje de error dinámico
      const rolesPermitidos = roles.join(', ');
      return res.status(403).json({ message: `Acceso denegado. Sólo los ${rolesPermitidos} pueden realizar esta acción.` });
    }
  };
};

module.exports = authRole;