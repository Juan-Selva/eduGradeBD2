const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const institucionController = require('../controllers/institucion.controller');
const { validators } = require('../middlewares');
const { institucion } = validators;
const validate = validators.validate;

/**
 * @swagger
 * tags:
 *   name: Instituciones
 *   description: Gestion de instituciones educativas
 */

/**
 * @swagger
 * /api/instituciones:
 *   get:
 *     summary: Obtener instituciones con filtros
 *     tags: [Instituciones]
 *     parameters:
 *       - in: query
 *         name: sistemaEducativo
 *         schema:
 *           type: string
 *           enum: [UK, US, DE, AR]
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *       - in: query
 *         name: pais
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de instituciones
 */
router.get('/', institucion.validateQuery, validate, institucionController.getAll);

/**
 * @swagger
 * /api/instituciones/{id}:
 *   get:
 *     summary: Obtener institucion por ID
 *     tags: [Instituciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Institucion encontrada
 *       404:
 *         description: Institucion no encontrada
 */
router.get('/:id', institucion.validateId, validate, institucionController.getById);

/**
 * @swagger
 * /api/instituciones/codigo/{codigo}:
 *   get:
 *     summary: Obtener institucion por codigo
 *     tags: [Instituciones]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Institucion encontrada
 *       404:
 *         description: Institucion no encontrada
 */
router.get('/codigo/:codigo',
  [param('codigo').trim().notEmpty().withMessage('Codigo requerido')],
  validate,
  institucionController.getByCodigo
);

/**
 * @swagger
 * /api/instituciones:
 *   post:
 *     summary: Crear nueva institucion
 *     tags: [Instituciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *               - tipo
 *               - sistemaEducativo
 *               - pais
 *     responses:
 *       201:
 *         description: Institucion creada
 *       400:
 *         description: Datos invalidos
 */
router.post('/', institucion.createInstitucion, validate, institucionController.create);

/**
 * @swagger
 * /api/instituciones/{id}:
 *   put:
 *     summary: Actualizar institucion
 *     tags: [Instituciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Institucion actualizada
 *       404:
 *         description: Institucion no encontrada
 */
router.put('/:id', institucion.updateInstitucion, validate, institucionController.update);

/**
 * @swagger
 * /api/instituciones/{id}:
 *   delete:
 *     summary: Eliminar institucion (soft delete)
 *     tags: [Instituciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Institucion eliminada
 *       404:
 *         description: Institucion no encontrada
 */
router.delete('/:id', institucion.validateId, validate, institucionController.delete);

module.exports = router;
