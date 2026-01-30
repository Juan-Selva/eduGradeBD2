const { body, param, query } = require('express-validator');

const sistemasValidos = ['UK', 'US', 'DE', 'AR'];
const tiposValidos = ['primaria', 'secundaria', 'preparatoria', 'universidad', 'instituto'];
const estadosValidos = ['activa', 'inactiva', 'clausurada'];
const nivelesEducativos = [
  // UK
  'GCSE', 'A-Level', 'AS-Level',
  // US
  'Elementary', 'Middle', 'High School', 'College',
  // DE
  'Grundschule', 'Hauptschule', 'Realschule', 'Gymnasium', 'Abitur',
  // AR
  'Primario', 'Secundario', 'Terciario', 'Universitario'
];

/**
 * Validaciones para crear institucion
 */
const createInstitucion = [
  body('codigo')
    .trim()
    .notEmpty().withMessage('El codigo es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El codigo debe tener entre 2 y 50 caracteres')
    .matches(/^[A-Z0-9_-]+$/i).withMessage('El codigo solo puede contener letras, numeros, guiones y guiones bajos'),

  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('nombreCorto')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('El nombre corto no puede exceder 50 caracteres'),

  body('tipo')
    .notEmpty().withMessage('El tipo es requerido')
    .isIn(tiposValidos).withMessage(`Tipo invalido. Valores permitidos: ${tiposValidos.join(', ')}`),

  body('sistemaEducativo')
    .notEmpty().withMessage('El sistema educativo es requerido')
    .isIn(sistemasValidos).withMessage(`Sistema invalido. Valores permitidos: ${sistemasValidos.join(', ')}`),

  body('pais')
    .trim()
    .notEmpty().withMessage('El pais es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El pais debe tener entre 2 y 100 caracteres'),

  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La region no puede exceder 100 caracteres'),

  body('ciudad')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La ciudad no puede exceder 100 caracteres'),

  body('direccion')
    .optional()
    .isObject().withMessage('La direccion debe ser un objeto'),

  body('direccion.calle')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('La calle no puede exceder 200 caracteres'),

  body('direccion.codigoPostal')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El codigo postal no puede exceder 20 caracteres'),

  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 }).withMessage('Telefono invalido'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('website')
    .optional()
    .trim()
    .isURL().withMessage('URL de website invalida'),

  body('nivelesEducativos')
    .optional()
    .isArray().withMessage('Los niveles educativos deben ser un array'),

  body('nivelesEducativos.*')
    .optional()
    .isIn(nivelesEducativos).withMessage(`Nivel educativo invalido. Valores permitidos: ${nivelesEducativos.join(', ')}`),

  body('acreditaciones')
    .optional()
    .isArray().withMessage('Las acreditaciones deben ser un array'),

  body('acreditaciones.*.nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre de la acreditacion es requerido'),

  body('acreditaciones.*.organizacion')
    .optional()
    .trim()
    .notEmpty().withMessage('La organizacion de la acreditacion es requerida')
];

/**
 * Validaciones para actualizar institucion
 */
const updateInstitucion = [
  param('id')
    .isMongoId().withMessage('ID de institucion invalido'),

  body('codigo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El codigo debe tener entre 2 y 50 caracteres')
    .matches(/^[A-Z0-9_-]+$/i).withMessage('El codigo solo puede contener letras, numeros, guiones y guiones bajos'),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('tipo')
    .optional()
    .isIn(tiposValidos).withMessage(`Tipo invalido. Valores permitidos: ${tiposValidos.join(', ')}`),

  body('sistemaEducativo')
    .optional()
    .isIn(sistemasValidos).withMessage(`Sistema invalido. Valores permitidos: ${sistemasValidos.join(', ')}`),

  body('estado')
    .optional()
    .isIn(estadosValidos).withMessage(`Estado invalido. Valores permitidos: ${estadosValidos.join(', ')}`),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invalido')
    .normalizeEmail(),

  body('website')
    .optional()
    .trim()
    .isURL().withMessage('URL de website invalida')
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

  query('tipo')
    .optional()
    .isIn(tiposValidos).withMessage(`Tipo invalido. Valores permitidos: ${tiposValidos.join(', ')}`),

  query('estado')
    .optional()
    .isIn(estadosValidos).withMessage(`Estado invalido. Valores permitidos: ${estadosValidos.join(', ')}`),

  query('pais')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Pais invalido')
];

module.exports = {
  createInstitucion,
  updateInstitucion,
  validateId,
  validateQuery
};
