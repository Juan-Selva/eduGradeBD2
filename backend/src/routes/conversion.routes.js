const express = require('express');
const router = express.Router();
const conversionController = require('../controllers/conversion.controller');

/**
 * @swagger
 * tags:
 *   name: Conversiones
 *   description: Conversion y normalizacion de calificaciones entre sistemas
 */

/**
 * @swagger
 * /api/conversiones/convertir:
 *   post:
 *     summary: Convertir calificacion a otro sistema
 *     tags: [Conversiones]
 *     description: |
 *       Convierte una calificacion de un sistema educativo a otro.
 *       Soporta conversiones: UK, US, DE, AR en cualquier direccion.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sistemaOrigen
 *               - sistemaDestino
 *               - valorOriginal
 *             properties:
 *               sistemaOrigen:
 *                 type: string
 *                 enum: [UK, US, DE, AR]
 *               sistemaDestino:
 *                 type: string
 *                 enum: [UK, US, DE, AR]
 *               valorOriginal:
 *                 type: object
 *                 description: Valor en formato del sistema origen
 *     responses:
 *       200:
 *         description: Conversion exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sistemaOrigen:
 *                   type: string
 *                 sistemaDestino:
 *                   type: string
 *                 valorOriginal:
 *                   type: object
 *                 valorConvertido:
 *                   type: object
 *                 reglaAplicada:
 *                   type: string
 *                 fecha:
 *                   type: string
 */
router.post('/convertir', conversionController.convertir);

/**
 * @swagger
 * /api/conversiones/multiple:
 *   post:
 *     summary: Convertir calificacion a multiples sistemas
 *     tags: [Conversiones]
 *     description: Convierte una calificacion a todos los sistemas disponibles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sistemaOrigen
 *               - valorOriginal
 *             properties:
 *               sistemaOrigen:
 *                 type: string
 *                 enum: [UK, US, DE, AR]
 *               valorOriginal:
 *                 type: object
 *     responses:
 *       200:
 *         description: Conversiones a todos los sistemas
 */
router.post('/multiple', conversionController.convertirMultiple);

/**
 * @swagger
 * /api/conversiones/calificacion/{calificacionId}:
 *   get:
 *     summary: Obtener todas las conversiones de una calificacion
 *     tags: [Conversiones]
 *     parameters:
 *       - in: path
 *         name: calificacionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sistemaDestino
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *         description: Filtrar por sistema destino
 *     responses:
 *       200:
 *         description: Conversiones de la calificacion
 */
router.get('/calificacion/:calificacionId', conversionController.getByCalificacion);

/**
 * @swagger
 * /api/conversiones/reglas:
 *   get:
 *     summary: Obtener reglas de conversion vigentes
 *     tags: [Conversiones]
 *     parameters:
 *       - in: query
 *         name: sistemaOrigen
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *       - in: query
 *         name: sistemaDestino
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *     responses:
 *       200:
 *         description: Reglas de conversion
 */
router.get('/reglas', conversionController.getReglas);

/**
 * @swagger
 * /api/conversiones/tabla/{sistemaOrigen}/{sistemaDestino}:
 *   get:
 *     summary: Obtener tabla de equivalencias entre dos sistemas
 *     tags: [Conversiones]
 *     parameters:
 *       - in: path
 *         name: sistemaOrigen
 *         required: true
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *       - in: path
 *         name: sistemaDestino
 *         required: true
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *     responses:
 *       200:
 *         description: Tabla de equivalencias
 */
router.get('/tabla/:sistemaOrigen/:sistemaDestino', conversionController.getTablaEquivalencias);

module.exports = router;
