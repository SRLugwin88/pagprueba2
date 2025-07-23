const Sequelize = require('sequelize');
const sequelize = require('../../config/db');

// Importar los modelos
const Usuario = require('./usuario');
const Notificacion = require('./notificacion');
const Departamento = require('./departamento'); 
const Role = require('./role');
const Documento = require('./documento');
const Organismo = require('./organismo');
const Empleado = require('./empleado');
const Pase = require('./pase');

// Inicializar los modelos
const models = {
  Usuario,
  Notificacion,
  Departamento,
  Role,
  Documento,
  Organismo,
  Empleado,
  Pase,
  sequelize,
  Sequelize,
};

// Definir las relaciones entre los modelos

// 1. Relaciones de Usuario
Usuario.associate = function(models) {
  Usuario.belongsTo(models.Role, {
    foreignKey: 'id_rol',
    as: 'rol',
    onDelete: 'SET NULL'
  });

  Usuario.belongsTo(models.Empleado, {
    foreignKey: 'id_empleado',
    as: 'empleado',
    onDelete: 'CASCADE'
  });

  Usuario.hasMany(models.Notificacion, {
    foreignKey: 'id_usuario',
    as: 'notificaciones_enviadas'
  });

  Usuario.hasMany(models.Notificacion, {
    foreignKey: 'id_usuario_decision',
    as: 'notificaciones_decididas'
  });
};

// 2. Relaciones de Notificacion
Notificacion.associate = function(models) {
  Notificacion.belongsTo(models.Usuario, {
    foreignKey: 'id_usuario',
    as: 'remitente'
  });

  Notificacion.belongsTo(models.Usuario, {
    foreignKey: 'id_usuario_decision',
    as: 'decidido_por'
  });
};

// 3. Relaciones de Empleado
Empleado.associate = function(models) {
  Empleado.hasOne(models.Usuario, {
    foreignKey: 'id_empleado',
    as: 'usuario'
  });

  Empleado.belongsTo(models.Departamento, {
    foreignKey: 'id_dpto',
    as: 'departamento'
  });
};

// 4. Relaciones de Departamento
Departamento.associate = function(models) {
  Departamento.hasMany(models.Empleado, {
    foreignKey: 'id_dpto',
    as: 'empleados'
  });
};

// 5. Relaciones de Role
Role.associate = function(models) {
  Role.hasMany(models.Usuario, {
    foreignKey: 'id_rol',
    as: 'usuarios'
  });
};

// 6. Relaciones de Documento y Organismo
Documento.belongsTo(Organismo, {
  foreignKey: 'id_org',
  as: 'organismo'
});

Organismo.hasMany(Documento, {
  foreignKey: 'id_org',
  as: 'documentos'
});

// 7. Relaciones de Pase
Pase.associate = function(models) {
  Pase.belongsTo(models.Documento, { 
    foreignKey: 'id_doc', 
    as: 'documento' // Necesario para acceder a `NumeroDoc`
  });

  Pase.belongsTo(models.Empleado, { foreignKey: 'id_receptor', as: 'receptor' });
  Pase.belongsTo(models.Departamento, { foreignKey: 'id_departamento_actual', as: 'departamentoActual' });
  Pase.belongsTo(models.Departamento, { foreignKey: 'id_departamento_destino', as: 'departamentoDestino' });
};



// Ejecutar la función `associate()` en cada modelo
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Sincronizar modelos
sequelize.sync({ force: false }).then(() => {
  console.log('Tablas sincronizadas.');
}).catch(error => {
  console.error('Error al sincronizar las tablas:', error);
});


module.exports = models;
