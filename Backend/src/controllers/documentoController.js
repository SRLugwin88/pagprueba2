const models = require('../models/IndexModel');
const documento = models.Documento;
const Organismo = models.Organismo;
const { Sequelize } = require('sequelize');

// Definir opciones ENUM globalmente
const enumOptions = {
  clase: ['Entrada', 'Salida'], 
  medio: ['WhatsApp', 'Correo electrónico', 'Correo postal', 'Papel'],
  tipo_documento: ['Acta', 'Factura', 'Informe', 'Memorándum', 'Nota', 'Resolución', 'Otro'],
  objetivo: ['Requerimiento técnico', 'Administrativo', 'Respuesta', 'Otro'],
  estado_doc: ['Iniciado', 'En trámite', 'Finalizado']
};

// Obtener opciones ENUM dinámicamente
const getEnumOptions = async (req, res) => {
  try {
    res.status(200).json(enumOptions);
  } catch (error) {
    console.error('Error obteniendo opciones ENUM:', error);
    res.status(500).json({ error: 'Error al obtener opciones ENUM' });
  }
};

// Obtener todos los documentos
const getDocumentos = async (req, res) => {
  try {
    const documentos = await documento.findAll({
      include: [{
        model: Organismo,
        as: 'organismo',
        attributes: ['nombre']
      }],
      order: [['id_doc', 'DESC']]
    });
    res.json(documentos);
  } catch (err) {
    console.error('Error al obtener documentos:', err.message);
    res.status(500).json({ error: 'Error al recuperar documentos' });
  }
};

// Crear un nuevo documento
const createDocumento = async (req, res) => {
  try {
    const { clase, fecha_registro, medio, tipo_documento, objetivo, id_org, estado_doc, observaciones } = req.body;

    // **Validar que los valores ENUM sean correctos**
    if (!enumOptions.clase.includes(clase)) {
      return res.status(400).json({ error: `Valor inválido en 'clase'. Opciones permitidas: ${enumOptions.clase.join(', ')}` });
    }

    // **Determinar prefijo según la clase**
    let NumeroDoc = req.body.NumeroDoc; // Respeta si el usuario lo ingresó manualmente
    const prefijo = clase === "Salida" ? "S" : clase === "Entrada" ? "E" : null;

    if (prefijo) {
      let nuevoNumero = 1;

      // **Obtener el último número registrado**
      const ultimoDocumento = await documento.findOne({
        where: { NumeroDoc: { [Sequelize.Op.like]: `${prefijo}-%` } },
        order: [[Sequelize.literal("CAST(SUBSTRING(NumeroDoc, 5) AS UNSIGNED)"), 'DESC']] // Extrae solo el número y lo ordena
      });

      if (ultimoDocumento) {
        nuevoNumero = parseInt(ultimoDocumento.NumeroDoc.replace(prefijo + '-', ''), 10) + 1;
      }

      // **Asegurar unicidad del `NumeroDoc`**
      do {
        NumeroDoc = `${prefijo}-${String(nuevoNumero).padStart(10, '0')}`;
        const documentoExistente = await documento.findOne({ where: { NumeroDoc } });

        if (documentoExistente) {
          nuevoNumero++; // Incrementar hasta encontrar uno único
        } else {
          break; // Si no existe, usamos este número
        }
      } while (true);
    }

    // **Crear el documento con `NumeroDoc` único**
    const newDocumento = await documento.create({
      NumeroDoc,
      clase,
      fecha_registro,
      medio,
      tipo_documento,
      objetivo,
      id_org,
      estado_doc,
      observaciones
    });

    res.status(201).json(newDocumento);
  } catch (err) {
    console.error('Error al crear documento:', err.message);
    res.status(500).json({ error: 'Error al crear el documento' });
  }
};


// Actualizar un documento existente
const updateDocumento = async (req, res) => {
    try {
        const documentoToUpdate = await documento.findByPk(req.params.id_doc);
        if (!documentoToUpdate) {
            return res.status(404).json({ message: 'Documento no encontrado' });
        }

        await documentoToUpdate.update(req.body);
        res.json(documentoToUpdate);
    } catch (err) {
        console.error('Error al actualizar documento:', err.message);
        res.status(500).json({ error: 'Error al actualizar el documento' });
    }
};



module.exports = {
  getEnumOptions,
  getDocumentos,
  createDocumento,
  updateDocumento,
 
};
