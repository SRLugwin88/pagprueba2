// src/models/role.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../config/db');

class Role extends Model {}

Role.init(
  {
    id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    rol: {
      type: DataTypes.ENUM('Administrador', 'Secretario', 'Empleado'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'role',
    timestamps: false,
  }
);

module.exports = Role;