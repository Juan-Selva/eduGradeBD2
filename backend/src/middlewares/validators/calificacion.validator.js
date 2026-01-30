const { body, param, query } = require('express-validator');

const sistemasValidos = ['UK', 'US', 'DE', 'AR'];
const tiposEvaluacion = [
  'parcial', 'final', 'recuperatorio',
  'coursework', 'exam', 'modulo',
  'quiz', 'midterm', 'assignment',
  'trabajo_practico', 'oral', 'escrito'
];
const periodosValidos = ['anual', 'semestre1', 'semestre2', 'trimestre1', 'trimestre2', 'trimestre3'];
const estadosValidos = ['vigente', 'corregida', 'anulada'];

/**
 * Validaciones para crear calificacion
 */
const createCalificacion = [
  body('estudianteId')
    .notEmpty().withMessage('El ID de estudiante es requerido')
    .isMongoId().withMessage('ID de estudiante invalido'),

  body('materiaId')
    .notEmpty().withMessage('El ID de materia es requerido')
    .isMongoId().withMessage('ID de materia invalido'),

  body('institucionId')
    .notEmpty().withMessage('El ID de institucion es requerido')
    .isMongoId().withMessage('ID de institucion invalido'),

  body('sistemaOrigen')
    .notEmpty().withMessage('El sistema de origen es requerido')
    .isIn(sistemasValidos).withMessage(`Sistema invalido. Valores permitidos: ${sistemasValidos.join(', ')}`),

  body('tipoEvaluacion')
    .notEmpty().withMessage('El tipo de evaluacion es requerido')
    .isIn(tiposEvaluacion).withMessage(`Tipo invalido. Valores permitidos: ${tiposEvaluacion.join(', ')}`),

  body('fechaEvaluacion')
    .notEmpty().withMessage('La fecha de evaluacion es requerida')
    .isISO8601().withMessage('Formato de fecha invalido (use YYYY-MM-DD)')
    .toDate(),

  body('cicloLectivo')
    .optional()
    .isObject().withMessage('Ciclo lectivo debe ser un objeto'),

  body('cicloLectivo.anio')
    .optional()
    .isInt({ min: 1990, max: 2100 }).withMessage('Anio invalido'),

  body('cicloLectivo.periodo')
    .optional()
    .isIn(periodosValidos).withMessage(`Periodo invalido. Valores permitidos: ${periodosValidos.join(', ')}`),

  body('valorOriginal')
    .notEmpty().withMessage('El valor original es requerido')
    .isObject().withMessage('El valor original debe ser un objeto'),

  // Validaciones UK
  body('valorOriginal.uk.letra')
    .optional()
    .isIn(['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U']).withMessage('Letra UK invalida'),

  body('valorOriginal.uk.numerico')
    .optional()
    .isInt({ min: 1, max: 9 }).withMessage('Nota numerica UK debe ser entre 1 y 9'),

  // Validaciones US
  body('valorOriginal.us.letra')
    .optional()
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']).withMessage('Letra US invalida'),

  body('valorOriginal.us.porcentaje')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Porcentaje debe ser entre 0 y 100'),

  body('valorOriginal.us.gpa')
    .optional()
    .isFloat({ min: 0, max: 4 }).withMessage('GPA debe ser entre 0 y 4'),

  // Validaciones DE
  body('valorOriginal.de.nota')
    .optional()
    .isFloat({ min: 1, max: 6 }).withMessage('Nota alemana debe ser entre 1 y 6'),

  body('valorOriginal.de.puntos')
    .optional()
    .isInt({ min: 0, max: 15 }).withMessage('Puntos Abitur deben ser entre 0 y 15'),

  // Validaciones AR
  body('valorOriginal.ar.nota')
    .optional()
    .isFloat({ min: 1, max: 10 }).withMessage('Nota argentina debe ser entre 1 y 10'),

  body('valorOriginal.ar.instancia')
    .optional()
    .isIn(['regular', 'diciembre', 'febrero', 'libre']).withMessage('Instancia invalida'),

  // Auditoria
  body('auditoria')
    .optional()
    .isObject().withMessage('Auditoria debe ser un objeto'),

  body('auditoria.usuarioRegistro')
    .optional()
    .trim()
    .notEmpty().withMessage('Usuario de registro es requerido'),

  body('observaciones')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Observaciones no pueden exceder 1000 caracteres')
];

/**
 * Validacion para correccion de calificacion
 */
const corregirCalificacion = [
  param('id')
    .isMongoId().withMessage('ID de calificacion invalido'),

  body('motivoCorreccion')
    .trim()
    .notEmpty().withMessage('El motivo de correccion es requerido')
    .isLength({ min: 10, max: 500 }).withMessage('El motivo debe tener entre 10 y 500 caracteres'),

  body('valorOriginal')
    .notEmpty().withMessage('El nuevo valor es requerido')
    .isObject().withMessage('El valor debe ser un objeto')
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
    .isInt({ min: 1, max: 100 }).withMessage('Limite debe ser entre 1 y 100')
    .toInt(),

  query('estudianteId')
    .optional()
    .isMongoId().withMessage('ID de estudiante invalido'),

  query('materiaId')
    .optional()
    .isMongoId().withMessage('ID de materia invalido'),

  query('sistemaOrigen')
    .optional()
    .isIn(sistemasValidos).withMessage(`Sistema invalido. Valores permitidos: ${sistemasValidos.join(', ')}`),

  query('estado')
    .optional()
    .isIn(estadosValidos).withMessage(`Estado invalido. Valores permitidos: ${estadosValidos.join(', ')}`),

  query('anio')
    .optional()
    .isInt({ min: 1990, max: 2100 }).withMessage('Anio invalido')
    .toInt()
];

module.exports = {
  createCalificacion,
  corregirCalificacion,
  validateId,
  validateQuery
};
