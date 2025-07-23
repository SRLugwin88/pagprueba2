// config/config.js
module.exports = {
    jwtSecret: process.env.SESSION_SECRET, 
    jwtExpiresIn: '24h' 
  };
  