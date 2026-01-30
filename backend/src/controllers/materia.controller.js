const { Materia } = require('../models');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, sistemaEducativo, area, nivel } = req.query;
    const query = {};
    if (sistemaEducativo) query.sistemaEducativo = sistemaEducativo;
    if (area) query.area = area;
    if (nivel) query.nivel = nivel;

    const materias = await Materia.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ nombre: 1 });

    const total = await Materia.countDocuments(query);
    const pages = Math.ceil(total / limit);
    res.json({ data: materias, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages } });
  } catch (error) {
    logger.error('Error obteniendo materias:', error);
    res.status(500).json({ error: 'Error obteniendo materias' });
  }
};

exports.getById = async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id).populate('prerequisitos');
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json(materia);
  } catch (error) {
    logger.error('Error obteniendo materia:', error);
    res.status(500).json({ error: 'Error obteniendo materia' });
  }
};

exports.getBySistema = async (req, res) => {
  try {
    const materias = await Materia.find({ sistemaEducativo: req.params.sistema }).sort({ nombre: 1 });
    res.json(materias);
  } catch (error) {
    logger.error('Error obteniendo materias por sistema:', error);
    res.status(500).json({ error: 'Error obteniendo materias' });
  }
};

exports.create = async (req, res) => {
  try {
    const materia = new Materia(req.body);
    await materia.save();
    res.status(201).json(materia);
  } catch (error) {
    logger.error('Error creando materia:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json(materia);
  } catch (error) {
    logger.error('Error actualizando materia:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, { estado: 'inactiva' }, { new: true });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json({ message: 'Materia eliminada', materia });
  } catch (error) {
    logger.error('Error eliminando materia:', error);
    res.status(500).json({ error: 'Error eliminando materia' });
  }
};
