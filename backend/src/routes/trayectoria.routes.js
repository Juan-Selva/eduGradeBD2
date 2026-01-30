const express = require('express');
const router = express.Router();
const trayectoriaController = require('../controllers/trayectoria.controller');

/**
 * @swagger
 * tags:
 *   name: Trayectorias
 *   description: Trayectorias academicas y relaciones (Neo4j)
 */

/**
 * @swagger
 * /api/trayectorias/estudiante/{estudianteId}:
 *   get:
 *     summary: Obtener trayectoria completa de un estudiante
 *     tags: [Trayectorias]
 *     description: |
 *       Devuelve la trayectoria academica completa incluyendo:
 *       - Instituciones
 *       - Materias cursadas
 *       - Calificaciones con conversiones
 *       - Equivalencias aplicadas
 *     parameters:
 *       - in: path
 *         name: estudianteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: incluirConversiones
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Trayectoria completa
 */
router.get('/estudiante/:estudianteId', trayectoriaController.getByEstudiante);

/**
 * @swagger
 * /api/trayectorias/equivalencias:
 *   get:
 *     summary: Obtener equivalencias entre materias
 *     tags: [Trayectorias]
 *     parameters:
 *       - in: query
 *         name: materiaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sistemaOrigen
 *         schema:
 *           type: string
 *       - in: query
 *         name: sistemaDestino
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equivalencias encontradas
 */
router.get('/equivalencias', trayectoriaController.getEquivalencias);

/**
 * @swagger
 * /api/trayectorias/equivalencias:
 *   post:
 *     summary: Crear equivalencia entre materias
 *     tags: [Trayectorias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               materiaOrigenId:
 *                 type: string
 *               materiaDestinoId:
 *                 type: string
 *               tipoEquivalencia:
 *                 type: string
 *                 enum: [total, parcial]
 *               porcentajeEquivalencia:
 *                 type: number
 *     responses:
 *       201:
 *         description: Equivalencia creada
 */
router.post('/equivalencias', trayectoriaController.crearEquivalencia);

/**
 * @swagger
 * /api/trayectorias/camino/{estudianteId}:
 *   get:
 *     summary: Obtener camino academico (grafo de relaciones)
 *     tags: [Trayectorias]
 *     parameters:
 *       - in: path
 *         name: estudianteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grafo de trayectoria academica
 */
router.get('/camino/:estudianteId', trayectoriaController.getCaminoAcademico);

module.exports = router;
