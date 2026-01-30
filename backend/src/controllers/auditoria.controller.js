const auditoriaService = require('../services/auditoria.service');
const logger = require('../utils/logger');

/**
 * Controller de Auditoria
 * Base de datos: Cassandra
 * RF5: Auditoria, Trazabilidad y Control Normativo
 */

// Obtener eventos de auditoria
exports.getEventos = async (req, res) => {
  try {
    const { tipoEvento, entidad, fechaInicio, fechaFin, limit } = req.query;

    const eventos = await auditoriaService.getEventos({
      tipoEvento,
      entidad,
      fechaInicio,
      fechaFin,
      limit: parseInt(limit) || 100
    });

    res.json({
      total: eventos.length,
      eventos
    });
  } catch (error) {
    logger.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error obteniendo eventos de auditoria' });
  }
};

// Obtener historial de una entidad
exports.getByEntidad = async (req, res) => {
  try {
    const { tipo, id } = req.params;

    const historial = await auditoriaService.getByEntidad(tipo, id);

    res.json({
      entidad: tipo,
      entidadId: id,
      totalEventos: historial.length,
      historial
    });
  } catch (error) {
    logger.error('Error obteniendo historial entidad:', error);
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
};

// Obtener acciones de un usuario
exports.getByUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limit } = req.query;

    const acciones = await auditoriaService.getByUsuario(
      usuarioId,
      parseInt(limit) || 100
    );

    res.json({
      usuarioId,
      totalAcciones: acciones.length,
      acciones
    });
  } catch (error) {
    logger.error('Error obteniendo acciones usuario:', error);
    res.status(500).json({ error: 'Error obteniendo acciones' });
  }
};

// Estadisticas de auditoria
exports.getEstadisticas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const estadisticas = await auditoriaService.getEstadisticas(
      fechaInicio,
      fechaFin
    );

    res.json({
      periodo: { fechaInicio, fechaFin },
      estadisticas
    });
  } catch (error) {
    logger.error('Error obteniendo estadisticas:', error);
    res.status(500).json({ error: 'Error obteniendo estadisticas' });
  }
};
