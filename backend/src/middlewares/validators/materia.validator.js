const { body, param, query } = require('express-validator');

const sistemasValidos = ['UK', 'US', 'DE', 'AR'];
const areasValidas = [
  'matematicas', 'ciencias', 'lengua', 'idiomas',
  'historia', 'geografia', 'arte', 'musica',
  'educacion_fisica', 'tecnologia', 'otra'
];
const estadosValidos = ['activa', 'inactiva', 'descontinuada'];

/**
 * Validaciones para crear materia
 */
const createMateria = [
  body('codigo')
    .trim()
    .notEmpty().withMessage('El codigo es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El codigo debe tener entre 2 y 50 caracteres')
    .matches(/^[A-Z0-9_-]+$/i).withMessage('El codigo solo puede contener letras, numeros, guiones y guiones bajos'),

  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('nombreIngles')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('El nombre en ingles no puede exceder 200 caracteres'),

  body('sistemaEducativo')
    .notEmpty().withMessage('El sistema educativo es requerido')
    .isIn(sistemasValidos).withMessage(`Sistema invalido. Valores permitidos: ${sistemasValidos.join(', ')}`),

  body('nivel')
    .trim()
    .notEmpty().withMessage('El nivel es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nivel debe tener entre 2 y 100 caracteres'),

  body('area')
    .optional()
    .isIn(areasValidas).withMessage(`Area invalida. Valores permitidos: ${areasValidas.join(', ')}`),

  body('creditos')
    .optional()
    .isFloat({ min: 0 }).withMessage('Los creditos deben ser un numero positivo'),

  body('horasSemanales')
    .optional()
    .isFloat({ min: 0 }).withMessage('Las horas semanales deben ser un numero positivo'),

  body('horasTotales')
    .optional()
    .isFloat({ min: 0 }).withMessage('Las horas totales deben ser un numero positivo'),

  body('componentesEvaluacion')
    .optional()
    .isObject().withMessage('Los componentes de evaluacion deben ser un objeto'),

  body('prerequisitos')
    .optional()
    .isArray().withMessage('Los prerequisitos deben ser un array'),

  body('prerequisitos.*')
    .optional()
    .isMongoId().withMessage('ID de prerequisito invalido')
];

/**
 * Validaciones para actualizar materia
 */
const updateMateria = [
  param('id')
    .isMongoId().withMessage('ID de materia invalido'),

  body('codigo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El codigo debe tener entre 2 y 50 caracteres')
    .matches(/^[A-Z0-9_-]+$/i).withMessage('El codigo solo puede contener letras, numeros, guiones y guiones bajos'),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('sistemaEducativo')
    .optional()
    .isIn(sistemasValidos).withMessage(`Sistema invalido. Valores permitidos: ${sistemasValidos.join(', ')}`),

  body('nivel')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nivel debe tener entre 2 y 100 caracteres'),

  body('area')
    .optional()
    .isIn(areasValidas).withMessage(`Area invalida. Valores permitidos: ${areasValidas.join(', ')}`),

  body('estado')
    .optional()
    .isIn(estadosValidos).withMessage(`Estado invalido. Valores permitidos: ${estadosValidos.join(', ')}`),

  body('creditos')
    .optional()
    .isFloat({ min: 0 }).withMessage('Los creditos deben ser un numero positivo')
];

/**
 * Validacion de ID en params
 */
const validateId = [
  param('id')
    .isMongoId().withMessage('ID invalido')
];

/**
 * Validacion de query params para listado
 */
const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Pagina debe ser un numero positivo')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Limite debe ser entre 1 y 500')
    .toInt(),

  query('sistemaEducativo')
    .optional()
    .isIn(sistemasValidos).withMessage(`Sistema invalido. Valores permitidos: ${sistemasValidos.join(', ')}`),

  query('area')
    .optional()
    .isIn(areasValidas).withMessage(`Area invalida. Valores permitidos: ${areasValidas.join(', ')}`),

  query('estado')
    .optional()
    .isIn(estadosValidos).withMessage(`Estado invalido. Valores permitidos: ${estadosValidos.join(', ')}`),

  query('nivel')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('Nivel invalido')
];

module.exports = {
  createMateria,
  updateMateria,
  validateId,
  validateQuery
};
