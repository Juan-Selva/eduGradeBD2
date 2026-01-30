const { Estudiante } = require('../models');
const logger = require('../utils/logger');

/**
 * Controller de Estudiantes
 * Base de datos: MongoDB
 */

// Obtener todos los estudiantes
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, paisOrigen, estado, institucionId } = req.query;

    const query = {};
    if (paisOrigen) query.paisOrigen = paisOrigen;
    if (estado) query.estado = estado;
    if (institucionId) query.institucionId = institucionId;

    const estudiantes = await Estudiante.find(query)
      .populate('institucionId', 'nombre nombreCorto codigo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Estudiante.countDocuments(query);

    res.json({
      data: estudiantes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error obteniendo estudiantes:', error);
    res.status(500).json({ error: 'Error obteniendo estudiantes' });
  }
};

// Obtener estudiante por ID
exports.getById = async (req, res) => {
  try {
    const estudiante = await Estudiante.findById(req.params.id)
      .populate('institucionId', 'nombre nombreCorto codigo sistemaEducativo');

    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json(estudiante);
  } catch (error) {
    logger.error('Error obteniendo estudiante:', error);
    res.status(500).json({ error: 'Error obteniendo estudiante' });
  }
};

// Obtener estudiante por DNI
exports.getByDni = async (req, res) => {
  try {
    const estudiante = await Estudiante.findOne({ dni: req.params.dni });

    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    res.json(estudiante);
  } catch (error) {
    logger.error('Error obteniendo estudiante por DNI:', error);
    res.status(500).json({ error: 'Error obteniendo estudiante' });
  }
};

// Crear estudiante
exports.create = async (req, res) => {
  try {
    const estudiante = new Estudiante(req.body);
    await estudiante.save();

    logger.info(`Estudiante creado: ${estudiante._id}`);
    res.status(201).json(estudiante);
  } catch (error) {
    logger.error('Error creando estudiante:', error);

    if (error.code === 11000) {
      return res.status(400).json({ error: 'DNI ya registrado' });
    }

    res.status(400).json({ error: error.message });
  }
};

// Actualizar estudiante
exports.update = async (req, res) => {
  try {
    const estudiante = await Estudiante.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    logger.info(`Estudiante actualizado: ${estudiante._id}`);
    res.json(estudiante);
  } catch (error) {
    logger.error('Error actualizando estudiante:', error);
    res.status(400).json({ error: error.message });
  }
};

// Eliminar estudiante (soft delete)
exports.delete = async (req, res) => {
  try {
    const estudiante = await Estudiante.findByIdAndUpdate(
      req.params.id,
      { estado: 'inactivo' },
      { new: true }
    );

    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    logger.info(`Estudiante eliminado (soft): ${estudiante._id}`);
    res.json({ message: 'Estudiante eliminado', estudiante });
  } catch (error) {
    logger.error('Error eliminando estudiante:', error);
    res.status(500).json({ error: 'Error eliminando estudiante' });
  }
};
