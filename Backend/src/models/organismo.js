const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const formatNom = require('../utils/normalizacion'); 

const Organismo = sequelize.define('organismo', {
  id_org: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      // Normalizar el nombre antes de guardarlo
      this.setDataValue('nombre', formatNom(value, {
        abbrs: ['gral', 'srl', 'inc'], // Abreviaturas específicas para organismos
        emptyErrorMessage: 'El nombre del organismo no puede estar vacío.',
      }));
    },
    validate: {
      notEmpty: {
        msg: 'El nombre del organismo no puede estar vacío.',
      },
      len: {
        args: [3, 50], 
        msg: 'El nombre del organismo debe tener entre 3 y 50 caracteres.',
      },
      is: {
        args: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, // Solo letras y espacios
        msg: 'El nombre del organismo solo puede contener letras y espacios.',
      },
    },
  },
  tipo: {
    type: DataTypes.ENUM('Nacional', 'Provincial', 'Municipal', 'Particular', 'Proveedor', 'Empresa', 'Informante', 'Otros'),
    allowNull: false,
  },
  direccion: {
    type: DataTypes.STRING,
  },
  telefono: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: {
        msg: 'El email debe ser válido.',
      },
    },
  },
}, {
  timestamps: false, // Desactiva createdAt y updatedAt
  charset: 'utf8mb4', // Compatibilidad con caracteres especiales
  collate: 'utf8mb4_unicode_ci', // Collation insensible a mayúsculas/minúsculas
  indexes: [
    {
      unique: true,
      fields: ['nombre'], // Índice único en el campo nombre
      name: 'unique_nombre_index',
    },
  ],
});

module.exports = Organismo;