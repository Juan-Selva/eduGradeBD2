/**
 * Clase base para errores de la aplicacion
 * Extiende Error nativo con campos adicionales para manejo estructurado
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      statusCode: this.statusCode
    };
  }
}

module.exports = AppError;
