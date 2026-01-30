/**
 * Export centralizado de todos los middlewares
 */

const { asyncHandler, errorHandler, notFoundHandler } = require('./errorHandler');
const {
  authenticate,
  authenticateOptional,
  requireRole,
  requirePermission,
  requireOwnerOrAdmin,
  generarAccessToken,
  generarRefreshToken
} = require('./auth');
const {
  generalLimiter,
  authLimiter,
  createLimiter,
  readLimiter,
  reportLimiter,
  strictLimiter
} = require('./rateLimit');
const validators = require('./validators');
const errors = require('./errors');

module.exports = {
  // Error handling
  asyncHandler,
  errorHandler,
  notFoundHandler,

  // Authentication
  authenticate,
  authenticateOptional,
  requireRole,
  requirePermission,
  requireOwnerOrAdmin,
  generarAccessToken,
  generarRefreshToken,

  // Rate limiting
  generalLimiter,
  authLimiter,
  createLimiter,
  readLimiter,
  reportLimiter,
  strictLimiter,

  // Validators
  validators,

  // Errors
  errors
};
