const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const organismo = require('./organismo');

const documento = sequelize.define('documento', {
  id_doc: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  clase: {
    type: DataTypes.ENUM('Entrada', 'Salida'),
    allowNull: false
  },
  NumeroDoc: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false
  },
  medio: {
    type: DataTypes.ENUM('WhatsApp', 'Correo electrónico', 'Correo postal', 'Papel'),
    allowNull: false
  },
  tipo_documento: {
    type: DataTypes.ENUM('Acta', 'Factura', 'Informe', 'Memorándum', 'Nota', 'Resolución', 'Otro'),
    allowNull: false
  },
  objetivo: {
    type: DataTypes.ENUM('Requerimiento técnico', 'Administrativo', 'Respuesta', 'Otro'),
    allowNull: false
  },
  id_org: {
    type: DataTypes.INTEGER,
    references: {
      model: organismo,
      key: 'id_org'
    }
  },
  estado_doc: {
    type: DataTypes.ENUM('Iniciado', 'En trámite', 'Finalizado'),
    allowNull: false,
    field:'estado' // Cambiado a 'estado' para evitar conflicto con la palabra reservada 'estado'
  },
  observaciones: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: false // Desactivamos timestamps para evitar los errores con createdAt y updatedAt
});

module.exports = documento;
