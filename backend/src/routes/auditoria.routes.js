const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoria.controller');

/**
 * @swagger
 * tags:
 *   name: Auditoria
 *   description: Registros de auditoria y trazabilidad (Cassandra)
 */

/**
 * @swagger
 * /api/auditoria/eventos:
 *   get:
 *     summary: Obtener eventos de auditoria
 *     tags: [Auditoria]
 *     parameters:
 *       - in: query
 *         name: tipoEvento
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, CONVERSION, LOGIN]
 *       - in: query
 *         name: entidad
 *         schema:
 *           type: string
 *           enum: [calificacion, estudiante, institucion, materia]
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Lista de eventos de auditoria
 */
router.get('/eventos', auditoriaController.getEventos);

/**
 * @swagger
 * /api/auditoria/entidad/{tipo}/{id}:
 *   get:
 *     summary: Obtener historial de auditoria de una entidad
 *     tags: [Auditoria]
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [calificacion, estudiante, institucion, materia]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de la entidad
 */
router.get('/entidad/:tipo/:id', auditoriaController.getByEntidad);

/**
 * @swagger
 * /api/auditoria/usuario/{usuarioId}:
 *   get:
 *     summary: Obtener acciones de un usuario
 *     tags: [Auditoria]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Acciones del usuario
 */
router.get('/usuario/:usuarioId', auditoriaController.getByUsuario);

/**
 * @swagger
 * /api/auditoria/estadisticas:
 *   get:
 *     summary: Estadisticas de auditoria
 *     tags: [Auditoria]
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estadisticas de eventos
 */
router.get('/estadisticas', auditoriaController.getEstadisticas);

module.exports = router;
