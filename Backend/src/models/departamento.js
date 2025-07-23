const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const formatNom = require('../utils/normalizacion'); // Importar la función de normalización

const Departamento = sequelize.define('departamento', {
    id_dpto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING(50), 
        allowNull: false,
        unique: true,
        set(value) {
            // Normalizar el nombre antes de guardarlo
            this.setDataValue('nombre', formatNom(value));
        },
        validate: {
            notEmpty: {
                msg: 'El nombre del departamento no puede estar vacío.',
            },
            len: {
                args: [3, 50], 
                msg: 'El nombre del departamento debe tener entre 3 y 50 caracteres.',
            },
            is: {
                args: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, // Solo letras y espacios
                msg: 'El nombre del departamento solo puede contener letras y espacios.',
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

module.exports = Departamento;