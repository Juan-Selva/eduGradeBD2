const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const calificacionController = require('../controllers/calificacion.controller');
const { validators } = require('../middlewares');
const { calificacion } = validators;
const validate = validators.validate;

/**
 * @swagger
 * tags:
 *   name: Calificaciones
 *   description: Gestion de calificaciones academicas
 */

/**
 * @swagger
 * /api/calificaciones:
 *   get:
 *     summary: Obtener calificaciones con filtros
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: query
 *         name: estudianteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: materiaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sistemaOrigen
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de calificaciones
 */
router.get('/', calificacion.validateQuery, validate, calificacionController.getAll);

/**
 * @swagger
 * /api/calificaciones/{id}:
 *   get:
 *     summary: Obtener calificacion por ID
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calificacion encontrada
 */
router.get('/:id', calificacion.validateId, validate, calificacionController.getById);

/**
 * @swagger
 * /api/calificaciones/estudiante/{estudianteId}:
 *   get:
 *     summary: Obtener todas las calificaciones de un estudiante
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: estudianteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calificaciones del estudiante
 */
router.get('/estudiante/:estudianteId',
  [param('estudianteId').isMongoId().withMessage('ID de estudiante invalido')],
  validate,
  calificacionController.getByEstudiante
);

/**
 * @swagger
 * /api/calificaciones:
 *   post:
 *     summary: Registrar nueva calificacion en formato original
 *     tags: [Calificaciones]
 *     description: |
 *       Registra una calificacion en su formato original segun el sistema educativo.
 *       La calificacion es INMUTABLE una vez registrada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estudianteId
 *               - materiaId
 *               - institucionId
 *               - sistemaOrigen
 *               - valorOriginal
 *               - tipoEvaluacion
 *               - fechaEvaluacion
 *             properties:
 *               estudianteId:
 *                 type: string
 *               materiaId:
 *                 type: string
 *               institucionId:
 *                 type: string
 *               sistemaOrigen:
 *                 type: string
 *                 enum: [UK, US, DE, AR]
 *               valorOriginal:
 *                 type: object
 *                 description: Valor segun sistema (uk, us, de, ar)
 *               tipoEvaluacion:
 *                 type: string
 *               fechaEvaluacion:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Calificacion registrada exitosamente
 *       400:
 *         description: Datos invalidos
 */
router.post('/', calificacion.createCalificacion, validate, calificacionController.create);

/**
 * @swagger
 * /api/calificaciones/{id}/corregir:
 *   post:
 *     summary: Corregir una calificacion (crea nueva version)
 *     tags: [Calificaciones]
 *     description: |
 *       Las calificaciones son INMUTABLES. Esta operacion crea una nueva version
 *       y marca la anterior como 'corregida'.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - valorOriginal
 *               - motivoCorreccion
 *             properties:
 *               valorOriginal:
 *                 type: object
 *               motivoCorreccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Nueva version creada
 */
router.post('/:id/corregir', calificacion.corregirCalificacion, validate, calificacionController.corregir);

/**
 * @swagger
 * /api/calificaciones/{id}/verificar:
 *   get:
 *     summary: Verificar integridad de una calificacion
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de verificacion
 */
router.get('/:id/verificar', calificacion.validateId, validate, calificacionController.verificarIntegridad);

/**
 * @swagger
 * /api/calificaciones/{id}/historial:
 *   get:
 *     summary: Obtener historial de versiones de una calificacion
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de versiones
 */
router.get('/:id/historial', calificacion.validateId, validate, calificacionController.getHistorial);

module.exports = router;
