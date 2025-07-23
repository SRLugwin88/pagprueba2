const bcrypt = require('bcrypt');

const hashPassword = async (user) => {
  if (user.contrasena) {
    const salt = await bcrypt.genSalt(10);
    user.contrasena = await bcrypt.hash(user.contrasena, salt);
  }
};

module.exports = hashPassword;