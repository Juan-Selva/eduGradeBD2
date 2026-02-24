const express = require('express');
const router = express.Router();
const transferenciaController = require('../controllers/transferencia.controller');
const { authenticate, createLimiter } = require('../middlewares');
const { transferencia: transferenciaValidator } = require('../middlewares/validators');
const validate = require('../middlewares/validators/validate');

/**
 * @swagger
 * tags:
 *   name: Transferencias
 *   description: Transferencias de estudiantes entre instituciones
 */

/**
 * @swagger
 * /api/transferencias/simular:
 *   post:
 *     summary: Simular transferencia (dry-run)
 *     tags: [Transferencias]
 *     security:
 *       - bearerAuth: []
 */
router.post('/simular',
  authenticate,
  transferenciaValidator.validateSimular,
  validate,
  transferenciaController.simular
);

/**
 * @swagger
 * /api/transferencias:
 *   post:
 *     summary: Ejecutar transferencia
 *     tags: [Transferencias]
 *     security:
 *       - bearerAuth: []
 */
router.post('/',
  authenticate,
  createLimiter,
  transferenciaValidator.validateEjecutar,
  validate,
  transferenciaController.ejecutar
);

/**
 * @swagger
 * /api/transferencias/estudiante/{estudianteId}:
 *   get:
 *     summary: Obtener historial de transferencias de un estudiante
 *     tags: [Transferencias]
 *     security:
 *       - bearerAuth: []
 */
router.get('/estudiante/:estudianteId',
  authenticate,
  transferenciaController.getByEstudiante
);

module.exports = router;
