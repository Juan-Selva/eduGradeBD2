const { Usuario } = require('../models');
const auditoriaService = require('../services/auditoria.service');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
  AuthenticationError,
  ValidationError,
  ConflictError
} = require('../middlewares/errors');
const {
  generarAccessToken,
  generarRefreshToken,
  JWT_SECRET
} = require('../middlewares/auth');
const jwt = require('jsonwebtoken');

/**
 * Registro de nuevo usuario
 * POST /api/auth/register
 */
exports.register = asyncHandler(async (req, res) => {
  const { email, password, nombre, apellido, rol = 'consulta' } = req.body;

  // Verificar si el email ya existe
  const existente = await Usuario.findOne({ email: email.toLowerCase() });
  if (existente) {
    throw new ConflictError('El email ya esta registrado');
  }

  // Solo admins pueden crear usuarios con roles elevados
  if (rol !== 'consulta' && (!req.user || req.user.rol !== 'admin')) {
    throw new ValidationError('No autorizado para asignar este rol');
  }

  // Obtener permisos por defecto segun rol
  const permisos = Usuario.getPermisosPorRol(rol);

  // Crear usuario
  const usuario = new Usuario({
    email: email.toLowerCase(),
    password,
    nombre,
    apellido,
    rol,
    permisos
  });

  await usuario.save();

  logger.info(`Usuario registrado: ${usuario.email}`);

  res.status(201).json({
    message: 'Usuario registrado exitosamente',
    usuario: {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol
    }
  });
});

/**
 * Login de usuario
 * POST /api/auth/login
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email y password son requeridos');
  }

  // Buscar usuario incluyendo password
  const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+password');

  if (!usuario) {
    throw new AuthenticationError('Credenciales invalidas');
  }

  // Verificar si esta bloqueado
  if (usuario.estaBloqueado()) {
    throw new AuthenticationError('Cuenta bloqueada temporalmente. Intente mas tarde');
  }

  // Verificar password
  const passwordValido = await usuario.compararPassword(password);

  if (!passwordValido) {
    await usuario.registrarIntentoFallido();
    throw new AuthenticationError('Credenciales invalidas');
  }

  // Verificar estado
  if (usuario.estado !== 'activo') {
    throw new AuthenticationError('Cuenta inactiva');
  }

  // Resetear intentos fallidos
  await usuario.resetearIntentosFallidos();

  // Generar tokens
  const accessToken = generarAccessToken(usuario);
  const refreshToken = generarRefreshToken(usuario);

  // Guardar refresh token
  usuario.refreshTokens.push({
    token: refreshToken,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
  });

  // Limpiar tokens expirados
  usuario.refreshTokens = usuario.refreshTokens.filter(
    t => t.expires > new Date()
  );

  await usuario.save();

  // Registrar evento de auditoría
  await auditoriaService.registrarEvento({
    tipoEvento: 'LOGIN',
    entidad: 'usuario',
    entidadId: usuario._id.toString(),
    usuarioId: usuario._id.toString(),
    datos: { email: usuario.email },
    ip: req.ip
  });

  logger.info(`Login exitoso: ${usuario.email}`);

  res.json({
    accessToken,
    refreshToken,
    usuario: {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      permisos: usuario.permisos
    }
  });
});

/**
 * Refresh token
 * POST /api/auth/refresh
 */
exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token requerido');
  }

  // Verificar token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Refresh token invalido o expirado');
  }

  // Buscar usuario
  const usuario = await Usuario.findById(decoded.id);

  if (!usuario) {
    throw new AuthenticationError('Usuario no encontrado');
  }

  // Verificar que el refresh token existe y es valido
  const tokenValido = usuario.refreshTokens.find(
    t => t.token === refreshToken && t.expires > new Date()
  );

  if (!tokenValido) {
    throw new AuthenticationError('Refresh token invalido o expirado');
  }

  if (usuario.estado !== 'activo') {
    throw new AuthenticationError('Cuenta inactiva');
  }

  // Generar nuevo access token
  const accessToken = generarAccessToken(usuario);

  res.json({
    accessToken,
    usuario: {
      id: usuario._id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol
    }
  });
});

/**
 * Logout
 * POST /api/auth/logout
 */
exports.logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken && req.user) {
    // Remover el refresh token especifico
    req.user.refreshTokens = req.user.refreshTokens.filter(
      t => t.token !== refreshToken
    );
    await req.user.save();
  }

  // Registrar evento de auditoría
  if (req.user) {
    await auditoriaService.registrarEvento({
      tipoEvento: 'LOGOUT',
      entidad: 'usuario',
      entidadId: req.user._id.toString(),
      usuarioId: req.user._id.toString(),
      datos: { email: req.user.email },
      ip: req.ip
    });
  }

  logger.info(`Logout: ${req.user?.email}`);

  res.json({ message: 'Logout exitoso' });
});

/**
 * Logout de todas las sesiones
 * POST /api/auth/logout-all
 */
exports.logoutAll = asyncHandler(async (req, res) => {
  // Limpiar todos los refresh tokens
  req.user.refreshTokens = [];
  await req.user.save();

  logger.info(`Logout de todas las sesiones: ${req.user.email}`);

  res.json({ message: 'Sesiones cerradas exitosamente' });
});

/**
 * Obtener usuario actual
 * GET /api/auth/me
 */
exports.me = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findById(req.user._id).populate('institucionId', 'nombre codigo');

  res.json({
    id: usuario._id,
    email: usuario.email,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    rol: usuario.rol,
    permisos: usuario.permisos,
    institucion: usuario.institucionId,
    ultimoAcceso: usuario.ultimoAcceso,
    createdAt: usuario.createdAt
  });
});

/**
 * Cambiar password
 * POST /api/auth/change-password
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNuevo } = req.body;

  if (!passwordActual || !passwordNuevo) {
    throw new ValidationError('Password actual y nuevo son requeridos');
  }

  if (passwordNuevo.length < 8) {
    throw new ValidationError('El nuevo password debe tener al menos 8 caracteres');
  }

  // Obtener usuario con password
  const usuario = await Usuario.findById(req.user._id).select('+password');

  // Verificar password actual
  const passwordValido = await usuario.compararPassword(passwordActual);

  if (!passwordValido) {
    throw new AuthenticationError('Password actual incorrecto');
  }

  // Actualizar password
  usuario.password = passwordNuevo;

  // Invalidar todos los refresh tokens (forzar re-login en otros dispositivos)
  usuario.refreshTokens = [];

  await usuario.save();

  logger.info(`Password cambiado: ${usuario.email}`);

  res.json({ message: 'Password actualizado exitosamente' });
});
