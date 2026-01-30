const logger = require('../utils/logger');
const { AppError, ValidationError, DatabaseError } = require('./errors');

/**
 * Wrapper para controladores async
 * Elimina la necesidad de try-catch en cada controlador
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Convierte errores de Mongoose a errores de aplicacion
 */
const handleMongooseError = (err) => {
  // Error de validacion de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    return new ValidationError('Error de validacion', errors);
  }

  // Error de ID invalido (CastError)
  if (err.name === 'CastError') {
    return new ValidationError(`ID invalido: ${err.value}`, [
      { field: err.path, message: 'Formato de ID invalido' }
    ]);
  }

  // Error de duplicado (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'campo';
    return new ValidationError(`El ${field} ya existe`, [
      { field, message: `Este ${field} ya esta registrado` }
    ]);
  }

  return null;
};

/**
 * Convierte errores de JWT a errores de aplicacion
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token invalido', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Token expirado', 401, 'TOKEN_EXPIRED');
  }

  return null;
};

/**
 * Middleware de manejo de errores 404
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
};

/**
 * Middleware centralizado de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Intentar convertir errores conocidos
  const mongooseError = handleMongooseError(err);
  if (mongooseError) error = mongooseError;

  const jwtError = handleJWTError(err);
  if (jwtError) error = jwtError;

  // Si no es un error operacional, es un bug
  if (!(error instanceof AppError)) {
    error = new AppError(
      process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message || 'Error interno del servidor',
      500,
      'INTERNAL_ERROR'
    );
    error.isOperational = false;
  }

  // Log del error
  if (!error.isOperational || error.statusCode >= 500) {
    logger.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  } else {
    logger.warn('Error operacional:', {
      code: error.code,
      message: error.message,
      path: req.path
    });
  }

  // Respuesta al cliente
  const response = error.toJSON ? error.toJSON() : {
    error: error.code || 'ERROR',
    message: error.message
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler
};
