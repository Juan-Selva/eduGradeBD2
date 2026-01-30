const conversionService = require('../services/conversion.service');
const { Calificacion } = require('../models');
const logger = require('../utils/logger');

/**
 * Controller de Conversiones
 * Cache: Redis
 */

// Convertir calificacion
exports.convertir = async (req, res) => {
  try {
    const { sistemaOrigen, sistemaDestino, valorOriginal } = req.body;

    if (!sistemaOrigen || !sistemaDestino || !valorOriginal) {
      return res.status(400).json({
        error: 'Debe proporcionar sistemaOrigen, sistemaDestino y valorOriginal'
      });
    }

    if (sistemaOrigen === sistemaDestino) {
      return res.status(400).json({
        error: 'El sistema origen y destino deben ser diferentes'
      });
    }

    const resultado = await conversionService.convertir(
      sistemaOrigen,
      sistemaDestino,
      valorOriginal
    );

    res.json(resultado);
  } catch (error) {
    logger.error('Error en conversion:', error);
    res.status(400).json({ error: error.message });
  }
};

// Convertir a multiples sistemas
exports.convertirMultiple = async (req, res) => {
  try {
    const { sistemaOrigen, valorOriginal } = req.body;

    if (!sistemaOrigen || !valorOriginal) {
      return res.status(400).json({
        error: 'Debe proporcionar sistemaOrigen y valorOriginal'
      });
    }

    const resultado = await conversionService.convertirMultiple(
      sistemaOrigen,
      valorOriginal
    );

    res.json(resultado);
  } catch (error) {
    logger.error('Error en conversion multiple:', error);
    res.status(400).json({ error: error.message });
  }
};

// Obtener conversiones de una calificacion
exports.getByCalificacion = async (req, res) => {
  try {
    const { calificacionId } = req.params;
    const { sistemaDestino } = req.query;

    const calificacion = await Calificacion.findOne({
      $or: [
        { _id: calificacionId },
        { calificacionId: calificacionId }
      ]
    });

    if (!calificacion) {
      return res.status(404).json({ error: 'Calificacion no encontrada' });
    }

    if (sistemaDestino) {
      // Conversion a un sistema especifico
      const resultado = await conversionService.convertir(
        calificacion.sistemaOrigen,
        sistemaDestino,
        calificacion.valorOriginal
      );
      return res.json(resultado);
    }

    // Conversion a todos los sistemas
    const resultado = await conversionService.convertirMultiple(
      calificacion.sistemaOrigen,
      calificacion.valorOriginal
    );

    res.json({
      calificacionId: calificacion.calificacionId,
      ...resultado
    });
  } catch (error) {
    logger.error('Error obteniendo conversiones:', error);
    res.status(400).json({ error: error.message });
  }
};

// Obtener reglas de conversion
exports.getReglas = async (req, res) => {
  try {
    const { sistemaOrigen, sistemaDestino } = req.query;
    const reglas = conversionService.getReglas();

    res.json(reglas);
  } catch (error) {
    logger.error('Error obteniendo reglas:', error);
    res.status(500).json({ error: 'Error obteniendo reglas' });
  }
};

// Obtener tabla de equivalencias
exports.getTablaEquivalencias = async (req, res) => {
  try {
    const { sistemaOrigen, sistemaDestino } = req.params;

    const tabla = conversionService.getTablaEquivalencias(
      sistemaOrigen,
      sistemaDestino
    );

    res.json(tabla);
  } catch (error) {
    logger.error('Error obteniendo tabla:', error);
    res.status(400).json({ error: error.message });
  }
};
