const validatePassword = (password) => {
  // Validar que la contraseña no sea nula o vacía
  if (!password || password.trim() === "") {
    return "La contraseña es obligatoria.";
  }

  // Expresión regular para validar la contraseña
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=/[\]]).{8,}$/;

  // Validar la contraseña con la expresión regular
  if (!regex.test(password)) {
    return "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial.";
  }

  // Si la contraseña es válida, devolver una cadena vacía
  return "";
};

module.exports = { validatePassword };