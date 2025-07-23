const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config/config');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'No se proporcionó ningún token.' });
  }

  const tokenParts = token.split(' ');
  if (tokenParts[0] !== 'Bearer' || tokenParts.length !== 2) {
    return res.status(403).json({ message: 'Formato de token inválido.' });
  }

  jwt.verify(tokenParts[1], jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    req.userId = decoded.id;
    req.userRol = decoded.rol;
    next();
  });
};

module.exports = {
  verifyToken
};
