const AppError = require('./AppError');

/**
 * Error de validacion - 400 Bad Request
 */
class ValidationError extends AppError {
  constructor(message = 'Datos de entrada invalidos', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors
    };
  }
}

/**
 * Error de autenticacion - 401 Unauthorized
 */
class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Error de autorizacion - 403 Forbidden
 */
class AuthorizationError extends AppError {
  constructor(message = 'No autorizado para esta accion') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Error de recurso no encontrado - 404 Not Found
 */
class NotFoundError extends AppError {
  constructor(resource = 'Recurso', identifier = '') {
    const message = identifier
      ? `${resource} con identificador '${identifier}' no encontrado`
      : `${resource} no encontrado`;
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

/**
 * Error de conflicto - 409 Conflict
 */
class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Error de rate limit - 429 Too Many Requests
 */
class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes, intente mas tarde') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Error de base de datos - 500
 */
class DatabaseError extends AppError {
  constructor(message = 'Error de base de datos') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

/**
 * Error de servicio externo - 502
 */
class ExternalServiceError extends AppError {
  constructor(service = 'servicio externo', message = 'Error de servicio externo') {
    super(`${message}: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
};
