const transferenciaService = require('../services/transferencia.service');
const logger = require('../utils/logger');

/**
 * Determine HTTP status code from service error messages.
 */
function getErrorStatus(error, fallbackStatus = 400) {
  if (error.message.includes('no encontrad')) return 404;
  return fallbackStatus;
}

/**
 * Simular transferencia (dry-run)
 */
exports.simular = async (req, res) => {
  try {
    const { estudianteId, institucionDestinoId } = req.body;
    const resultado = await transferenciaService.simular(estudianteId, institucionDestinoId);

    res.json({
      message: 'Simulacion de transferencia completada',
      data: resultado
    });
  } catch (error) {
    logger.error('Error simulando transferencia:', error);
    res.status(getErrorStatus(error)).json({
      error: 'TRANSFER_SIMULATION_ERROR',
      message: error.message
    });
  }
};

/**
 * Ejecutar transferencia
 */
exports.ejecutar = async (req, res) => {
  try {
    const { estudianteId, institucionDestinoId } = req.body;
    const usuarioId = req.user?._id?.toString() || 'system';
    const ip = req.ip;

    const resultado = await transferenciaService.ejecutar(
      estudianteId, institucionDestinoId, usuarioId, ip
    );

    res.status(201).json({
      message: 'Transferencia completada exitosamente',
      data: resultado
    });
  } catch (error) {
    logger.error('Error ejecutando transferencia:', error);
    res.status(getErrorStatus(error)).json({
      error: 'TRANSFER_ERROR',
      message: error.message
    });
  }
};

/**
 * Obtener historial de transferencias por estudiante
 */
exports.getByEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const resultado = await transferenciaService.getByEstudiante(estudianteId);

    res.json({ data: resultado });
  } catch (error) {
    logger.error('Error obteniendo transferencias:', error);
    res.status(getErrorStatus(error, 500)).json({
      error: 'TRANSFER_QUERY_ERROR',
      message: error.message
    });
  }
};
