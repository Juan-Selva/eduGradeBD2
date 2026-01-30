const { body, param, query } = require('express-validator');

const paisesValidos = ['UK', 'US', 'DE', 'AR'];
const estadosValidos = ['activo', 'inactivo', 'graduado', 'transferido'];
const generosValidos = ['M', 'F', 'O'];

/**
 * Validaciones para crear estudiante
 */
const createEstudiante = [
  body('dni')
    .trim()
    .notEmpty().withMessage('El DNI es requerido')
    .isLength({ min: 6, max: 20 }).withMessage('El DNI debe tener entre 6 y 20 caracteres'),

  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),

  body('fechaNacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es requerida')
    .isISO8601().withMessage('Formato de fecha invalido (use YYYY-MM-DD)')
    .toDate(),

  body('paisOrigen')
    .notEmpty().withMessage('El pais de origen es requerido')
    .isIn(paisesValidos).withMessage(`Pais invalido. Valores permitidos: ${paisesValidos.join(', ')}`),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 }).withMessage('Telefono invalido'),

  body('genero')
    .optional()
    .isIn(generosValidos).withMessage(`Genero invalido. Valores permitidos: ${generosValidos.join(', ')}`),

  body('pasaporte')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 }).withMessage('Pasaporte invalido'),

  body('direccion')
    .optional()
    .isObject().withMessage('La direccion debe ser un objeto'),

  body('direccion.calle')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La calle no puede exceder 200 caracteres'),

  body('direccion.ciudad')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres'),

  body('direccion.provincia')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La provincia no puede exceder 100 caracteres'),

  body('direccion.codigoPostal')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El codigo postal no puede exceder 20 caracteres'),

  body('direccion.pais')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El pais no puede exceder 100 caracteres')
];

/**
 * Validaciones para actualizar estudiante
 */
const updateEstudiante = [
  param('id')
    .isMongoId().withMessage('ID de estudiante invalido'),

  body('dni')
    .optional()
    .trim()
    .isLength({ min: 6, max: 20 }).withMessage('El DNI debe tener entre 6 y 20 caracteres'),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('apellido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),

  body('fechaNacimiento')
    .optional()
    .isISO8601().withMessage('Formato de fecha invalido (use YYYY-MM-DD)')
    .toDate(),

  body('paisOrigen')
    .optional()
    .isIn(paisesValidos).withMessage(`Pais invalido. Valores permitidos: ${paisesValidos.join(', ')}`),

  body('estado')
    .optional()
    .isIn(estadosValidos).withMessage(`Estado invalido. Valores permitidos: ${estadosValidos.join(', ')}`),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('genero')
    .optional()
    .isIn(generosValidos).withMessage(`Genero invalido. Valores permitidos: ${generosValidos.join(', ')}`)
];

/**
 * Validacion de ID en params
 */
const validateId = [
  param('id')
    .isMongoId().withMessage('ID invalido')
];

/**
 * Validacion de DNI en params
 */
const validateDni = [
  param('dni')
    .trim()
    .notEmpty().withMessage('DNI requerido')
    .isLength({ min: 6, max: 20 }).withMessage('DNI invalido')
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
    .isInt({ min: 1, max: 100 }).withMessage('Limite debe ser entre 1 y 100')
    .toInt(),

  query('paisOrigen')
    .optional()
    .isIn(paisesValidos).withMessage(`Pais invalido. Valores permitidos: ${paisesValidos.join(', ')}`),

  query('estado')
    .optional()
    .isIn(estadosValidos).withMessage(`Estado invalido. Valores permitidos: ${estadosValidos.join(', ')}`)
];

module.exports = {
  createEstudiante,
  updateEstudiante,
  validateId,
  validateDni,
  validateQuery
};
