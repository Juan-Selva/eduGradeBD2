const { body } = require('express-validator');

const transferenciaFields = [
  body('estudianteId')
    .notEmpty().withMessage('El ID del estudiante es requerido')
    .isMongoId().withMessage('ID de estudiante invalido'),
  body('institucionDestinoId')
    .notEmpty().withMessage('El ID de la institucion destino es requerido')
    .isMongoId().withMessage('ID de institucion invalido')
];

module.exports = {
  validateSimular: transferenciaFields,
  validateEjecutar: transferenciaFields
};
