const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors');

/**
 * Middleware que procesa los resultados de express-validator
 * Debe usarse despues de las reglas de validacion
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    throw new ValidationError('Error de validacion', formattedErrors);
  }

  next();
};

module.exports = validate;
