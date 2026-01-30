const { Institucion } = require('../models');
const auditoriaService = require('../services/auditoria.service');
const logger = require('../utils/logger');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, sistemaEducativo, tipo, pais } = req.query;
    const query = {};
    if (sistemaEducativo) query.sistemaEducativo = sistemaEducativo;
    if (tipo) query.tipo = tipo;
    if (pais) query.pais = pais;

    const instituciones = await Institucion.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ nombre: 1 });

    const total = await Institucion.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.json({
      data: instituciones,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages }
    });
  } catch (error) {
    logger.error('Error obteniendo instituciones:', error);
    res.status(500).json({ error: 'Error obteniendo instituciones' });
  }
};

exports.getById = async (req, res) => {
  try {
    const institucion = await Institucion.findById(req.params.id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institucion no encontrada' });
    }
    res.json(institucion);
  } catch (error) {
    logger.error('Error obteniendo institucion:', error);
    res.status(500).json({ error: 'Error obteniendo institucion' });
  }
};

exports.getByCodigo = async (req, res) => {
  try {
    const institucion = await Institucion.findOne({ codigo: req.params.codigo });
    if (!institucion) {
      return res.status(404).json({ error: 'Institucion no encontrada' });
    }
    res.json(institucion);
  } catch (error) {
    logger.error('Error obteniendo institucion:', error);
    res.status(500).json({ error: 'Error obteniendo institucion' });
  }
};

exports.create = async (req, res) => {
  try {
    const institucion = new Institucion(req.body);
    await institucion.save();

    // Registrar evento de auditoría
    await auditoriaService.registrarEvento({
      tipoEvento: 'CREATE',
      entidad: 'institucion',
      entidadId: institucion._id.toString(),
      usuarioId: req.user?.id || 'sistema',
      datos: { nombre: institucion.nombre, codigo: institucion.codigo },
      ip: req.ip
    });

    res.status(201).json(institucion);
  } catch (error) {
    logger.error('Error creando institucion:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const institucion = await Institucion.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!institucion) {
      return res.status(404).json({ error: 'Institucion no encontrada' });
    }

    // Registrar evento de auditoría
    await auditoriaService.registrarEvento({
      tipoEvento: 'UPDATE',
      entidad: 'institucion',
      entidadId: req.params.id,
      usuarioId: req.user?.id || 'sistema',
      datos: { cambios: Object.keys(req.body) },
      ip: req.ip
    });

    res.json(institucion);
  } catch (error) {
    logger.error('Error actualizando institucion:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const institucion = await Institucion.findByIdAndUpdate(
      req.params.id, { estado: 'inactiva' }, { new: true }
    );
    if (!institucion) {
      return res.status(404).json({ error: 'Institucion no encontrada' });
    }

    // Registrar evento de auditoría
    await auditoriaService.registrarEvento({
      tipoEvento: 'DELETE',
      entidad: 'institucion',
      entidadId: req.params.id,
      usuarioId: req.user?.id || 'sistema',
      datos: {},
      ip: req.ip
    });

    res.json({ message: 'Institucion eliminada', institucion });
  } catch (error) {
    logger.error('Error eliminando institucion:', error);
    res.status(500).json({ error: 'Error eliminando institucion' });
  }
};
