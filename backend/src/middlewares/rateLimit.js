const rateLimit = require('express-rate-limit');
const { RateLimitError } = require('./errors');

/**
 * Genera respuesta estandarizada para rate limit
 */
const rateLimitHandler = (req, res, next, options) => {
  res.status(429).json({
    error: 'RATE_LIMIT_EXCEEDED',
    message: options.message || 'Demasiadas solicitudes, intente mas tarde',
    retryAfter: Math.ceil(options.windowMs / 1000)
  });
};

/**
 * Rate limiter general para toda la API
 * 100 requests por minuto por IP
 */
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test'
});

/**
 * Rate limiter para autenticacion
 * 5 intentos por 15 minutos por IP (previene brute force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: 'Demasiados intentos de autenticacion, intente en 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test',
  skipSuccessfulRequests: true // Solo cuenta intentos fallidos
});

/**
 * Rate limiter para creacion de recursos
 * 30 creaciones por minuto por IP
 */
const createLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30,
  message: 'Demasiadas operaciones de creacion, intente mas tarde',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test'
});

/**
 * Rate limiter para lectura intensiva
 * 200 lecturas por minuto por IP
 */
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200,
  message: 'Demasiadas consultas, intente mas tarde',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test'
});

/**
 * Rate limiter para reportes (operaciones costosas)
 * 10 reportes por minuto por IP
 */
const reportLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10,
  message: 'Demasiadas solicitudes de reportes, intente mas tarde',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test'
});

/**
 * Rate limiter estricto para operaciones sensibles
 * 3 operaciones por hora por IP
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: 'Limite de operaciones sensibles alcanzado, intente en 1 hora',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => process.env.NODE_ENV === 'test'
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter,
  readLimiter,
  reportLimiter,
  strictLimiter
};
