// hooks/index.js
const { beforeCreateUsuario, beforeUpdateUsuario, afterCreateUsuario } = require('./usuarioHooks');

module.exports = {
  beforeCreateUsuario,
  beforeUpdateUsuario,
  afterCreateUsuario,
};