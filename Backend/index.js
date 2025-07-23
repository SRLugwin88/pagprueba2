// Cargar variables de entorno PRIMERO
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });


const models = require('./src/models/IndexModel');
const app = require('./src/app');

// Sincronizar los modelos con la base de datos
models.sequelize.sync().then(() => {
  console.log('Modelos sincronizados con la base de datos');
}).catch((err) => {
  console.error('Error al sincronizar los modelos:', err);
});

// Configuración y arranque del servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
  }
});
