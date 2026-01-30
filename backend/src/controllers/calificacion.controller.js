const { Calificacion, Estudiante, Materia, Institucion } = require('../models');
const auditoriaService = require('../services/auditoria.service');
const logger = require('../utils/logger');

/**
 * Controller de Calificaciones
 * Base de datos: MongoDB
 * Caracteristica: INMUTABLE (append-only)
 */

// Obtener calificaciones con filtros
exports.getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      estudianteId,
      materiaId,
      sistemaOrigen,
      anio,
      estado = 'vigente'
    } = req.query;

    const query = { estado };
    if (estudianteId) query.estudianteId = estudianteId;
    if (materiaId) query.materiaId = materiaId;
    if (sistemaOrigen) query.sistemaOrigen = sistemaOrigen;
    if (anio) query['cicloLectivo.anio'] = parseInt(anio);

    const calificaciones = await Calificacion.find(query)
      .populate('estudianteId', 'nombre apellido dni')
      .populate('materiaId', 'nombre codigo')
      .populate('institucionId', 'nombre codigo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ fechaEvaluacion: -1 });

    const total = await Calificacion.countDocuments(query);

    res.json({
      data: calificaciones,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error obteniendo calificaciones:', error);
    res.status(500).json({ error: 'Error obteniendo calificaciones' });
  }
};

// Obtener calificacion por ID
exports.getById = async (req, res) => {
  try {
    const calificacion = await Calificacion.findById(req.params.id)
      .populate('estudianteId')
      .populate('materiaId')
      .populate('institucionId');

    if (!calificacion) {
      return res.status(404).json({ error: 'Calificacion no encontrada' });
    }

    res.json(calificacion);
  } catch (error) {
    logger.error('Error obteniendo calificacion:', error);
    res.status(500).json({ error: 'Error obteniendo calificacion' });
  }
};

// Obtener calificaciones de un estudiante
exports.getByEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const { incluirCorregidas = false } = req.query;

    const query = { estudianteId };
    if (!incluirCorregidas) {
      query.estado = 'vigente';
    }

    const calificaciones = await Calificacion.find(query)
      .populate('materiaId', 'nombre codigo sistemaEducativo')
      .populate('institucionId', 'nombre')
      .sort({ fechaEvaluacion: -1 });

    // Calcular promedio normalizado
    const promedios = {};
    calificaciones.forEach(cal => {
      const normalizado = cal.getValorNormalizado();
      if (normalizado !== null) {
        if (!promedios[cal.sistemaOrigen]) {
          promedios[cal.sistemaOrigen] = { suma: 0, count: 0 };
        }
        promedios[cal.sistemaOrigen].suma += normalizado;
        promedios[cal.sistemaOrigen].count += 1;
      }
    });

    const promediosPorSistema = {};
    Object.keys(promedios).forEach(sistema => {
      promediosPorSistema[sistema] = (promedios[sistema].suma / promedios[sistema].count).toFixed(2);
    });

    res.json({
      estudiante: estudianteId,
      totalCalificaciones: calificaciones.length,
      promediosPorSistema,
      calificaciones
    });
  } catch (error) {
    logger.error('Error obteniendo calificaciones del estudiante:', error);
    res.status(500).json({ error: 'Error obteniendo calificaciones' });
  }
};

// Crear calificacion (INMUTABLE)
exports.create = async (req, res) => {
  try {
    const {
      estudianteId,
      materiaId,
      institucionId,
      sistemaOrigen,
      valorOriginal,
      tipoEvaluacion,
      fechaEvaluacion,
      cicloLectivo,
      observaciones
    } = req.body;

    // Validar que existan las referencias
    const [estudiante, materia, institucion] = await Promise.all([
      Estudiante.findById(estudianteId),
      Materia.findById(materiaId),
      Institucion.findById(institucionId)
    ]);

    if (!estudiante) {
      return res.status(400).json({ error: 'Estudiante no encontrado' });
    }
    if (!materia) {
      return res.status(400).json({ error: 'Materia no encontrada' });
    }
    if (!institucion) {
      return res.status(400).json({ error: 'Institucion no encontrada' });
    }

    // Crear calificacion
    const calificacion = new Calificacion({
      estudianteId,
      materiaId,
      institucionId,
      sistemaOrigen,
      valorOriginal,
      tipoEvaluacion,
      fechaEvaluacion: new Date(fechaEvaluacion),
      cicloLectivo,
      observaciones,
      auditoria: {
        usuarioRegistro: req.headers['x-user-id'] || 'sistema',
        ipRegistro: req.ip
      }
    });

    await calificacion.save();

    // Registrar en auditoria (Cassandra)
    await auditoriaService.registrarEvento({
      tipoEvento: 'CREATE',
      entidad: 'calificacion',
      entidadId: calificacion.calificacionId,
      usuarioId: req.headers['x-user-id'] || 'sistema',
      datos: { sistemaOrigen, tipoEvaluacion },
      ip: req.ip
    });

    logger.info(`Calificacion creada: ${calificacion.calificacionId}`);

    res.status(201).json({
      message: 'Calificacion registrada exitosamente',
      calificacion,
      hashIntegridad: calificacion.hashIntegridad
    });
  } catch (error) {
    logger.error('Error creando calificacion:', error);
    res.status(400).json({ error: error.message });
  }
};

// Corregir calificacion (crea nueva version)
exports.corregir = async (req, res) => {
  try {
    const { id } = req.params;
    const { valorOriginal, motivoCorreccion } = req.body;

    if (!motivoCorreccion) {
      return res.status(400).json({ error: 'Debe indicar el motivo de la correccion' });
    }

    // Obtener calificacion original
    const original = await Calificacion.findById(id);
    if (!original) {
      return res.status(404).json({ error: 'Calificacion no encontrada' });
    }

    if (original.estado !== 'vigente') {
      return res.status(400).json({ error: 'Solo se pueden corregir calificaciones vigentes' });
    }

    // Marcar original como corregida
    original.estado = 'corregida';
    await original.save();

    // Crear nueva version
    const nuevaVersion = new Calificacion({
      estudianteId: original.estudianteId,
      materiaId: original.materiaId,
      institucionId: original.institucionId,
      sistemaOrigen: original.sistemaOrigen,
      valorOriginal,
      tipoEvaluacion: original.tipoEvaluacion,
      fechaEvaluacion: original.fechaEvaluacion,
      cicloLectivo: original.cicloLectivo,
      version: original.version + 1,
      versionAnteriorId: original.calificacionId,
      esCorreccion: true,
      motivoCorreccion,
      auditoria: {
        usuarioRegistro: req.headers['x-user-id'] || 'sistema',
        ipRegistro: req.ip
      }
    });

    await nuevaVersion.save();

    // Registrar en auditoria
    await auditoriaService.registrarEvento({
      tipoEvento: 'UPDATE',
      entidad: 'calificacion',
      entidadId: nuevaVersion.calificacionId,
      usuarioId: req.headers['x-user-id'] || 'sistema',
      datos: {
        versionAnterior: original.calificacionId,
        motivoCorreccion
      },
      ip: req.ip
    });

    logger.info(`Calificacion corregida: ${original.calificacionId} -> ${nuevaVersion.calificacionId}`);

    res.status(201).json({
      message: 'Correccion registrada exitosamente',
      versionAnterior: original.calificacionId,
      nuevaVersion: nuevaVersion
    });
  } catch (error) {
    logger.error('Error corrigiendo calificacion:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verificar integridad
exports.verificarIntegridad = async (req, res) => {
  try {
    const calificacion = await Calificacion.findById(req.params.id);

    if (!calificacion) {
      return res.status(404).json({ error: 'Calificacion no encontrada' });
    }

    const integridadValida = calificacion.verificarIntegridad();

    res.json({
      calificacionId: calificacion.calificacionId,
      hashRegistrado: calificacion.hashIntegridad,
      integridadValida,
      mensaje: integridadValida
        ? 'La calificacion no ha sido alterada'
        : 'ALERTA: La calificacion puede haber sido modificada'
    });
  } catch (error) {
    logger.error('Error verificando integridad:', error);
    res.status(500).json({ error: 'Error verificando integridad' });
  }
};

// Obtener historial de versiones
exports.getHistorial = async (req, res) => {
  try {
    const calificacion = await Calificacion.findById(req.params.id);

    if (!calificacion) {
      return res.status(404).json({ error: 'Calificacion no encontrada' });
    }

    // Buscar todas las versiones
    const versiones = await Calificacion.find({
      $or: [
        { calificacionId: calificacion.calificacionId },
        { versionAnteriorId: calificacion.calificacionId },
        { calificacionId: calificacion.versionAnteriorId }
      ]
    }).sort({ version: 1 });

    res.json({
      totalVersiones: versiones.length,
      versiones
    });
  } catch (error) {
    logger.error('Error obteniendo historial:', error);
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
};
