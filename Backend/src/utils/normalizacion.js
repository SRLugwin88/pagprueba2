
const formatNom = (str) => {
  // Validar que el campo no esté vacío, nulo o indefinido
  if (!str || str.trim() === "") {
    throw new Error("El campo no puede estar vacío.");
  }

  // Lista de abreviaturas que deben seguir el formato de primera letra mayúscula y el resto en minúscula
  const abbrs = new Set(["gral", "srl", "inc"]);

  return str
    .toLowerCase() // Convertir a minúsculas
    .split(' ') // Dividir en palabras
    .map((word) => {
      if (abbrs.has(word)) {
        // Si es una abreviatura, primera letra mayúscula y el resto en minúscula
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Para palabras normales, primera letra mayúscula y el resto en minúscula
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' '); // Unir las palabras con espacios
};

module.exports = formatNom;