const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');

const Pase = sequelize.define('pase', {
  id_pase: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fecha_ingreso: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW 
  },
  fecha_salida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  objetivo: {
    type: DataTypes.STRING
  },
  id_receptor: {
    type: DataTypes.INTEGER,
    references: {
      model: 'empleado',
      key: 'id_empleado'
    }
  },
  id_departamento_actual: {
    type: DataTypes.INTEGER,
    references: {
      model: 'departamento',
      key: 'id_dpto'
    }
  },
  id_departamento_destino: {
    type: DataTypes.INTEGER,
    references: {
      model: 'departamento',
      key: 'id_dpto'
    }
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  id_doc: {
    type: DataTypes.INTEGER,
    references: {
      model: 'documento',
      key: 'id_doc'
    }
  }
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 'pase'
});

module.exports = Pase;