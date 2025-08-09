const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const Departamento = require('./departamento');

const Empleado = sequelize.define('empleado', {
  id_empleado: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dni: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false,
    validate: {
      isNumeric: { msg: 'DNI solo puede contener números.' },
      len: [7, 8] 
    }
  },
  direccion: {
    type: DataTypes.STRING
  },
  telefono: {
    type: DataTypes.BIGINT,
    unique: true,
    allowNull: false, // Cambiado a true para hacerlo opcional
    validate: {
      isNumeric: { msg: 'Teléfono solo puede contener números.' },
      len: [10, 15] 
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: { msg: 'Debe proporcionar un email válido.' }
    }
  },
  estado: {
    type: DataTypes.ENUM('Activo', 'Inactivo', 'Licencia'),
    allowNull: false,
    defaultValue: 'Activo'
  },
  id_dpto: {
    type: DataTypes.INTEGER,
    references: {
      model: Departamento,
      key: 'id_dpto'
    }
  },
  es_responsable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rol_solicitado: {
    type: DataTypes.ENUM('Administrador', 'Secretario', 'Empleado')
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  tableName: 'empleado',
  timestamps: true 
});

module.exports = Empleado;
