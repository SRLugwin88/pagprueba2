const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/db');

class Notificacion extends Model {}
Notificacion.init({
  id_notificacion: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true
  },
  mensaje: {
    type: DataTypes.STRING,
    allowNull: false
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id_usuario'
    }
  },
  id_usuario_decision: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuario',
      key: 'id_usuario'
    }
  },
  fecha_decision: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Notificacion',
  timestamps: true,
  createdAt: 'fecha_creacion',
  updatedAt: false
});


module.exports = Notificacion;
