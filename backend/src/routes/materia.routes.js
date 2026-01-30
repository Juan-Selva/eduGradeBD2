const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const materiaController = require('../controllers/materia.controller');
const { validators } = require('../middlewares');
const { materia } = validators;
const validate = validators.validate;

/**
 * @swagger
 * tags:
 *   name: Materias
 *   description: Gestion de materias/asignaturas
 */

/**
 * @swagger
 * /api/materias:
 *   get:
 *     summary: Obtener materias con filtros
 *     tags: [Materias]
 *     parameters:
 *       - in: query
 *         name: sistemaEducativo
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *       - in: query
 *         name: nivel
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de materias
 */
router.get('/', materia.validateQuery, validate, materiaController.getAll);

/**
 * @swagger
 * /api/materias/{id}:
 *   get:
 *     summary: Obtener materia por ID
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Materia encontrada
 *       404:
 *         description: Materia no encontrada
 */
router.get('/:id', materia.validateId, validate, materiaController.getById);

/**
 * @swagger
 * /api/materias/sistema/{sistema}:
 *   get:
 *     summary: Obtener materias por sistema educativo
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: sistema
 *         required: true
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *     responses:
 *       200:
 *         description: Materias del sistema
 */
router.get('/sistema/:sistema',
  [param('sistema').isIn(['UK', 'US', 'DE', 'AR']).withMessage('Sistema invalido')],
  validate,
  materiaController.getBySistema
);

/**
 * @swagger
 * /api/materias:
 *   post:
 *     summary: Crear nueva materia
 *     tags: [Materias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *               - sistemaEducativo
 *               - nivel
 *     responses:
 *       201:
 *         description: Materia creada
 *       400:
 *         description: Datos invalidos
 */
router.post('/', materia.createMateria, validate, materiaController.create);

/**
 * @swagger
 * /api/materias/{id}:
 *   put:
 *     summary: Actualizar materia
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Materia actualizada
 *       404:
 *         description: Materia no encontrada
 */
router.put('/:id', materia.updateMateria, validate, materiaController.update);

/**
 * @swagger
 * /api/materias/{id}:
 *   delete:
 *     summary: Eliminar materia (soft delete)
 *     tags: [Materias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Materia eliminada
 *       404:
 *         description: Materia no encontrada
 */
router.delete('/:id', materia.validateId, validate, materiaController.delete);

module.exports = router;
