const { Pase, Documento, Empleado, Departamento } = require('../models/IndexModel');

const createPase = async (req, res) => {
  const rolesPermitidos = ['Administrador', 'Secretario', 'Empleado'];  
  if (!rolesPermitidos.includes(req.userRol)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Rol no autorizado'
    });
  }
  const { id_doc, id_departamento_actual, id_departamento_destino, id_receptor, objetivo, descripcion } = req.body;

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) console.log('BODY RECIBIDO EN BACKEND:', req.body);

  // Validación básica
  if (!id_doc || !id_departamento_actual || !id_departamento_destino || !id_receptor) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios',
      required: ['id_doc', 'id_departamento_actual', 'id_departamento_destino', 'id_receptor']
    });
  }
  if (typeof id_doc !== 'number' || typeof id_departamento_actual !== 'number' || typeof id_departamento_destino !== 'number' || typeof id_receptor !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Los campos id_doc, id_departamento_actual, id_departamento_destino e id_receptor deben ser números.'
    });
  }
  if (typeof objetivo !== 'string' || typeof descripcion !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Los campos objetivo y descripcion deben ser cadenas de texto.'
    });
  }
  if (id_departamento_actual === id_departamento_destino) {
    return res.status(400).json({
      success: false,
      message: 'El departamento destino no puede ser igual al origen'
    });
  }
  // Verificar si ya existe un pase idéntico (mismo documento, receptor y destino)
  const paseExistente = await Pase.findOne({
    where: {
      id_doc,
      id_receptor,
      id_departamento_destino,
    },
  });
  if (paseExistente) {
    return res.status(400).json({
      success: false,
      message: "Ya existe un pase idéntico (mismo documento, receptor y destino).",
    });
  }
  // Si no existe, continuar con la creación
  const t = await Pase.sequelize.transaction();
  try {
    const [documento, receptor, deptoActual, deptoDestino, ultimoPase] = await Promise.all([
      Documento.findByPk(id_doc, { transaction: t }),
      Empleado.findByPk(id_receptor, {
        include: [{
          model: Departamento,
          as: 'departamento',
          attributes: ['id_dpto', 'nombre']
        }],
        transaction: t
      }),
      Departamento.findByPk(id_departamento_actual, { transaction: t }),
      Departamento.findByPk(id_departamento_destino, { transaction: t }),
      Pase.findOne({
        where: { id_doc },
        order: [['fecha_ingreso', 'DESC']],
        transaction: t
      })
    ]);
    // Validaciones adicionales
    if (!documento) throw new Error('Documento no encontrado');
    if (!receptor) throw new Error('Receptor no existe');
    if (!deptoActual || !deptoDestino) throw new Error('Departamento no existe');
    if (ultimoPase) {
      if (ultimoPase.id_departamento_actual === Number(id_departamento_destino)) {
        throw new Error('Documento ya está en el departamento destino');
      }
      await ultimoPase.update({ 
        fecha_salida: Pase.sequelize.literal('CURRENT_TIMESTAMP'),
        objetivo: objetivo || 'Traslado completado'
      }, { transaction: t });
    }
    // La fecha de salida la pone el sistema automáticamente
    const nuevoPase = await Pase.create({
      id_doc,
      id_departamento_actual,
      id_departamento_destino,
      id_receptor,
      objetivo: objetivo || 'En revisión',
      descripcion: descripcion || null,
      fecha_salida: new Date() // <-- aquí el sistema la genera
    }, { transaction: t });
    if (documento.estado_doc === 'Iniciado') {
      await documento.update({ estado_doc: 'En trámite' }, { transaction: t });
    }
    await t.commit();
    if (isDev) console.log('Pase creado:', nuevoPase.id_pase);
    return res.status(201).json({
      success: true,
      message: 'Pase creado exitosamente',
      data: {
        id: nuevoPase.id_pase,
        documento: documento.NumeroDoc,
        receptor: receptor.nombre_completo,
        departamento_origen: deptoActual.nombre,
        departamento_destino: deptoDestino.nombre,
        fecha_ingreso: nuevoPase.fecha_ingreso,
        fecha_salida: nuevoPase.fecha_salida, // incluir en la respuesta
        objetivo: nuevoPase.objetivo
      }
    });
  } catch (error) {
    await t.rollback();
    if (isDev) console.error('Error en createPase:', error.message);
    const statusCode = error.message.includes('no encontrado') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: isDev ? error.message : 'Error al crear el pase',
      ...(isDev && { stack: error.stack })
    });
  }
};

// Obtener pases por documento
const getPasesByDocumento = async (req, res) => {
  try {
    const { id_doc } = req.params; 

    // Validación
    if (!id_doc || isNaN(Number(id_doc))) {
      return res.status(400).json({ 
        success: false, 
        message: "El parámetro id_doc es requerido y debe ser un número" 
      });
    }

    const pases = await Pase.findAll({
      where: { id_doc: Number(id_doc) },
      order: [['fecha_ingreso', 'ASC']],
      include: [{
        model: Documento,
        as: 'documento',
        attributes: ['NumeroDoc']
      }],
      attributes: [
        'id_pase',
        'id_doc', 
        'fecha_ingreso',
        'fecha_salida',
        'objetivo',
        'descripcion'
      ]
    });

    if (!pases.length) {
      return res.status(404).json({ 
        success: false, 
        message: `No se encontraron pases para el documento ${id_doc}` 
      });
    }

    // Formateamos la respuesta para incluir NumeroDoc de manera clara
    const response = {
      id_doc: Number(id_doc),
      numero_doc: pases[0].documento?.NumeroDoc, 
      historial: pases.map(pase => ({
        id_pase: pase.id_pase,
        fecha_ingreso: pase.fecha_ingreso,
        fecha_salida: pase.fecha_salida,
        objetivo: pase.objetivo,
        descripcion: pase.descripcion
      }))
    };

    res.json({ 
      success: true, 
      data: response 
    });

  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) console.error("Error en getPasesByDocumento:", error);
    res.status(500).json({ 
      success: false, 
      message: isDev ? "Error al recuperar el historial: " + error.message : "Error al recuperar el historial"
    });
  }
};

// Obtener todos los pases ordenados por fecha_ingreso DESC
const getAllPases = async (req, res) => {
  try {
    const pases = await Pase.findAll({
      order: [['fecha_ingreso', 'DESC']],
      include: [
        {
          model: Documento,
          as: 'documento',
          attributes: ['NumeroDoc']
        },
        {
          model: Departamento,
          as: 'departamentoActual', 
          attributes: ['nombre']
        },
        {
          model: Departamento,
          as: 'departamentoDestino', 
          attributes: ['nombre']
        },
        {
          model: Empleado,
          as: 'receptor',
          attributes: ['nombre_completo']
        }
      ],
      attributes: [
        'id_pase',
        'id_doc',
        'fecha_ingreso',
        'fecha_salida',
        'objetivo',
        'descripcion'
      ]
    });
    // Formatear respuesta para tabla
    const data = pases.map(pase => ({
      id_pase: pase.id_pase,
      numero_doc: pase.documento?.NumeroDoc || '',
      fecha_ingreso: pase.fecha_ingreso,
      fecha_salida: pase.fecha_salida,
      departamento_origen: pase.departamentoActual?.nombre || '',
      departamento_destino: pase.departamentoDestino?.nombre || '',
      receptor: pase.receptor?.nombre_completo || '',
      objetivo: pase.objetivo,
      descripcion: pase.descripcion
    }));
    res.json({ success: true, data });
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) console.error("Error en getAllPases:", error);
    res.status(500).json({ 
      success: false, 
      message: isDev ? "Error al recuperar los pases: " + error.message : "Error al recuperar los pases"
    });
  }
};

// Actualizar pase
const updatePase = async (req, res) => {
  if (!['Administrador', 'Secretario', 'Empleado'].includes(req.userRol)) {
    return res.status(403).json({ 
      success: false,
      message: 'No tienes permiso para actualizar pases' 
    });
  }

  try {
    const { id } = req.params;
    const { fecha_ingreso, fecha_salida, descripcion } = req.body;

    const pase = await Pase.findByPk(id);
    if (!pase) {
      return res.status(404).json({
        success: false,
        message: 'Pase no encontrado'
      });
    }

    if (fecha_ingreso && fecha_salida) {
      const ingreso = new Date(fecha_ingreso);
      const salida = new Date(fecha_salida);
      
      if (salida < ingreso) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de salida no puede ser anterior a la fecha de ingreso'
        });
      }
    }

    await pase.update({
      fecha_ingreso: fecha_ingreso || pase.fecha_ingreso,
      fecha_salida: fecha_salida || pase.fecha_salida,
      descripcion: descripcion || pase.descripcion
    });

    return res.json({
      success: true,
      message: 'Pase actualizado correctamente',
      data: pase
    });

  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) console.error('Error al actualizar pase:', error);
    return res.status(500).json({
      success: false,
      message: isDev ? 'Error al actualizar el pase: ' + error.message : 'Error al actualizar el pase'
    });
  }
};

// Eliminar pase
const deletePase = async (req, res) => {
  if (req.userRol !== 'Administrador') {
    return res.status(403).json({ 
      success: false,
      message: 'No tienes permiso para realizar esta acción' 
    });
  }

  try {
    const pase = await Pase.findByPk(req.params.id_pase);
    if (!pase) {
      return res.status(404).json({
        success: false,
        message: 'Pase no encontrado'
      });
    }
    
    await pase.destroy();
    return res.json({
      success: true,
      message: 'Pase eliminado exitosamente'
    });

  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) console.error('Error al eliminar pase:', error);
    return res.status(500).json({
      success: false,
      message: isDev ? 'Error al eliminar el pase: ' + error.message : 'Error al eliminar el pase'
    });
  }
};

module.exports = {
  getPasesByDocumento,
  createPase,
  updatePase,
  deletePase,
  getAllPases
};