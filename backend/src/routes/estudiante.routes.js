const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudiante.controller');
const { validators } = require('../middlewares');
const { estudiante } = validators;
const validate = validators.validate;

/**
 * @swagger
 * tags:
 *   name: Estudiantes
 *   description: Gestion de estudiantes
 */

/**
 * @swagger
 * /api/estudiantes:
 *   get:
 *     summary: Obtener todos los estudiantes
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numero de pagina
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Cantidad por pagina
 *       - in: query
 *         name: paisOrigen
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *         description: Filtrar por pais de origen
 *     responses:
 *       200:
 *         description: Lista de estudiantes
 */
router.get('/', estudiante.validateQuery, validate, estudianteController.getAll);

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   get:
 *     summary: Obtener estudiante por ID
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estudiante encontrado
 *       404:
 *         description: Estudiante no encontrado
 */
router.get('/:id', estudiante.validateId, validate, estudianteController.getById);

/**
 * @swagger
 * /api/estudiantes/dni/{dni}:
 *   get:
 *     summary: Obtener estudiante por DNI
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: path
 *         name: dni
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estudiante encontrado
 *       404:
 *         description: Estudiante no encontrado
 */
router.get('/dni/:dni', estudiante.validateDni, validate, estudianteController.getByDni);

/**
 * @swagger
 * /api/estudiantes:
 *   post:
 *     summary: Crear nuevo estudiante
 *     tags: [Estudiantes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Estudiante'
 *     responses:
 *       201:
 *         description: Estudiante creado
 *       400:
 *         description: Datos invalidos
 */
router.post('/', estudiante.createEstudiante, validate, estudianteController.create);

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   put:
 *     summary: Actualizar estudiante
 *     tags: [Estudiantes]
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
 *             $ref: '#/components/schemas/Estudiante'
 *     responses:
 *       200:
 *         description: Estudiante actualizado
 *       404:
 *         description: Estudiante no encontrado
 */
router.put('/:id', estudiante.updateEstudiante, validate, estudianteController.update);

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   delete:
 *     summary: Eliminar estudiante (soft delete)
 *     tags: [Estudiantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estudiante eliminado
 *       404:
 *         description: Estudiante no encontrado
 */
router.delete('/:id', estudiante.validateId, validate, estudianteController.delete);

module.exports = router;
