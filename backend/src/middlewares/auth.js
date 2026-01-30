const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { AuthenticationError, AuthorizationError } = require('./errors');

const JWT_SECRET = process.env.JWT_SECRET || 'clave-secreta-desarrollo-no-usar-en-produccion';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

/**
 * Genera token de acceso JWT
 */
const generarAccessToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      email: usuario.email,
      rol: usuario.rol
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

/**
 * Genera token de refresh
 */
const generarRefreshToken = (usuario) => {
  return jwt.sign(
    { id: usuario._id },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRATION }
  );
};

/**
 * Middleware de autenticacion
 * Verifica el token JWT y agrega el usuario al request
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token de acceso requerido');
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuario
    const usuario = await Usuario.findById(decoded.id);

    if (!usuario) {
      throw new AuthenticationError('Usuario no encontrado');
    }

    if (usuario.estado !== 'activo') {
      throw new AuthenticationError('Cuenta inactiva o bloqueada');
    }

    if (usuario.estaBloqueado()) {
      throw new AuthenticationError('Cuenta temporalmente bloqueada');
    }

    // Agregar usuario al request
    req.user = usuario;
    req.userId = usuario._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Token invalido'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Token expirado'));
    }
    next(error);
  }
};

/**
 * Middleware opcional de autenticacion
 * No falla si no hay token, pero si hay, lo valida
 */
const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);

    if (usuario && usuario.estado === 'activo') {
      req.user = usuario;
      req.userId = usuario._id;
    }

    next();
  } catch (error) {
    // Ignorar errores de token y continuar sin usuario
    next();
  }
};

/**
 * Middleware que requiere un rol especifico
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Autenticacion requerida'));
    }

    if (!roles.includes(req.user.rol)) {
      return next(new AuthorizationError(`Rol requerido: ${roles.join(' o ')}`));
    }

    next();
  };
};

/**
 * Middleware que requiere un permiso especifico
 */
const requirePermission = (...permisos) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Autenticacion requerida'));
    }

    const tienePermiso = permisos.some(p => req.user.tienePermiso(p));

    if (!tienePermiso) {
      return next(new AuthorizationError(`Permiso requerido: ${permisos.join(' o ')}`));
    }

    next();
  };
};

/**
 * Middleware que requiere ser admin o el propio usuario
 */
const requireOwnerOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Autenticacion requerida'));
    }

    const resourceId = req.params[paramName];
    const isOwner = req.user._id.toString() === resourceId;
    const isAdmin = req.user.rol === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AuthorizationError('No autorizado para este recurso'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authenticateOptional,
  requireRole,
  requirePermission,
  requireOwnerOrAdmin,
  generarAccessToken,
  generarRefreshToken,
  JWT_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION
};
