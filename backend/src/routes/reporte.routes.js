const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporte.controller');

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Reportes analiticos y estadisticas (Cassandra)
 */

/**
 * @swagger
 * /api/reportes/resumen:
 *   get:
 *     summary: Resumen general para dashboard
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Totales de estudiantes, instituciones, materias y calificaciones
 */
router.get('/resumen', reporteController.getResumen);

/**
 * @swagger
 * /api/reportes/promedios-materia:
 *   get:
 *     summary: Promedios agrupados por materia
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pais
 *         schema:
 *           type: string
 *           enum: [AR, UK, US, DE]
 *         description: Filtrar por pais/sistema educativo
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordenar por promedio
 *     responses:
 *       200:
 *         description: Lista de materias con estadisticas
 */
router.get('/promedios-materia', reporteController.getPromediosPorMateria);

/**
 * @swagger
 * /api/reportes/promedios-institucion:
 *   get:
 *     summary: Promedios agrupados por institucion
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pais
 *         schema:
 *           type: string
 *           enum: [AR, UK, US, DE]
 *         description: Filtrar por pais
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordenar por promedio
 *     responses:
 *       200:
 *         description: Lista de instituciones con estadisticas
 */
router.get('/promedios-institucion', reporteController.getPromediosPorInstitucion);

/**
 * @swagger
 * /api/reportes/promedio/pais:
 *   get:
 *     summary: Promedio de calificaciones por pais
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pais
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *     responses:
 *       200:
 *         description: Promedios por pais
 */
router.get('/promedio/pais', reporteController.getPromedioPorPais);

/**
 * @swagger
 * /api/reportes/promedio/institucion:
 *   get:
 *     summary: Promedio de calificaciones por institucion
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: institucionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Promedios por institucion
 */
router.get('/promedio/institucion', reporteController.getPromedioPorInstitucion);

/**
 * @swagger
 * /api/reportes/distribucion:
 *   get:
 *     summary: Distribucion de calificaciones
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: sistemaEducativo
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Distribucion de notas
 */
router.get('/distribucion', reporteController.getDistribucion);

/**
 * @swagger
 * /api/reportes/aprobacion:
 *   get:
 *     summary: Tasa de aprobacion
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: pais
 *         schema:
 *           type: string
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: string
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tasas de aprobacion
 */
router.get('/aprobacion', reporteController.getTasaAprobacion);

/**
 * @swagger
 * /api/reportes/historico:
 *   get:
 *     summary: Comparacion historica entre sistemas
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: anioInicio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: anioFin
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos historicos comparativos
 */
router.get('/historico', reporteController.getComparacionHistorica);

/**
 * @swagger
 * /api/reportes/top-materias:
 *   get:
 *     summary: Top 10 materias por rendimiento
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: criterio
 *         schema:
 *           type: string
 *           enum: [promedio, aprobacion, cantidad]
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Top 10 materias
 */
router.get('/top-materias', reporteController.getTopMaterias);

module.exports = router;
