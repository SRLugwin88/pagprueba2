
// Este archivo solo debe contener la configuración y exportación de la app de Express
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// ** orígenes permitidos**
const devOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:3000",
  "http://localhost:8080",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "file://",
  null
];
const prodOrigins = [
  process.env.CLIENT_URL // Solo el frontend real en producción
];

module.exports = app;

// **Middleware global de CORS - COMPATIBLE CON CREDENTIALS**
app.use(cors({
  origin: function (origin, callback) {
    const isDev = process.env.NODE_ENV !== 'production';
    const allowed = isDev ? devOrigins : prodOrigins;
    // Permitir solicitudes sin origen (aplicaciones móviles, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      if (isDev) {
        console.log('Origen permitido dinámicamente:', origin);
        callback(null, true); // Permitir todos en desarrollo
      } else {
        callback(new Error('No autorizado por CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization']
}));

// **Middlewares principales**
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
  app.use((req, res, next) => {
    const origin = req.get('Origin');
    console.log(`${req.method} ${req.path} - Origin: ${origin || 'No origin'}`);
    if (req.method === "OPTIONS") {
      console.log('Respondiendo a preflight request');
      return res.status(200).end();
    }
    next();
  });
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// **Configuración de sesiones con MySQLStore**
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'none'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// **Configuración de Nodemailer**
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// **Carga de rutas**
const routes = {
  auth: require('./routes/authRoutes'),
  usuario: require('./routes/usuarioRoutes'),
  role: require('./routes/roleRoutes'),
  pase: require('./routes/paseRoutes'),
  documento: require('./routes/documentoRoutes'),
  empleado: require('./routes/empleadoRoutes'),
  departamento: require('./routes/departamentoRoutes'),
  organismo: require('./routes/organismoRoutes'),
  notificacion: require('./routes/notificacionRoutes')
};

// **Registro de rutas en Express**
Object.keys(routes).forEach(route => {
  app.use(`/${route}`, routes[route]);
});

// **Ruta de prueba**
app.get('/', (_req, res) => {
  res.send('¡Bienvenido a GesDoc26!');
});

// **Manejo de rutas no encontradas**
app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// **Middleware para manejo de errores**
app.use((err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    console.error("Error detectado:", err.stack);
    if (err.message && err.message.includes("CORS")) {
      console.warn("⚠ Bloqueo por CORS detectado, revisa la configuración.");
    }
  }
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: isDev ? err.message : undefined
  });
});

module.exports = app;
