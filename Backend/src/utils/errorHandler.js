// utils/errorHandler.js 
// Funcion utilitaria para manejo de errores
const handleError = (res, error, message, statusCode = 500) => {
    console.error(message, error);
    res.status(statusCode).json({ success: false, message, error: error.message });
  };
  
  module.exports = handleError;