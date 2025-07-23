const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/db');
const { validatePassword } = require('../utils/validatePass');
const { ESTADOS } = require('../utils/constantes'); 

class Usuario extends Model {}

Usuario.init({
  id_usuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El campo username no puede estar vacío.' },
    },
  },
  contrasena: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255], 
      isStrongPassword(value) {
        const error = validatePassword(value);
        if (error) {
          throw new Error(error);
        }
      },
    },
  },
  id_rol: {
    type: DataTypes.INTEGER,
    references: {
      model: 'role',
      key: 'id_rol',
    },
  },
  estado: {
    type: DataTypes.ENUM(...Object.values(ESTADOS)), 
    defaultValue: ESTADOS.PENDIENTE,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  id_empleado: {
    type: DataTypes.INTEGER,
    unique: true,
    references: {
      model: 'empleado',
      key: 'id_empleado',
    },
  },
}, {
  sequelize,
  modelName: 'Usuario',
  tableName: 'usuario',
  timestamps: false,
});

module.exports = Usuario;