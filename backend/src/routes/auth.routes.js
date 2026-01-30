const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate, authenticateOptional } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const validate = require('../middlewares/validators/validate');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticacion y gestion de usuarios
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nombre
 *               - apellido
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               rol:
 *                 type: string
 *                 enum: [admin, docente, administrativo, consulta]
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Datos invalidos
 *       409:
 *         description: Email ya registrado
 */
router.post('/register',
  authLimiter,
  authenticateOptional, // Para verificar si es admin al asignar roles
  [
    body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password debe tener al menos 8 caracteres'),
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
    body('rol').optional().isIn(['admin', 'docente', 'administrativo', 'consulta']).withMessage('Rol invalido')
  ],
  validate,
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesion
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       401:
 *         description: Credenciales invalidas
 */
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Email invalido').normalizeEmail(),
    body('password').notEmpty().withMessage('Password requerido')
  ],
  validate,
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado
 *       401:
 *         description: Refresh token invalido
 */
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token requerido')
  ],
  validate,
  authController.refresh
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesion
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout exitoso
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Cerrar todas las sesiones
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las sesiones cerradas
 */
router.post('/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/me',
  authenticate,
  authController.me
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Cambiar password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passwordActual
 *               - passwordNuevo
 *             properties:
 *               passwordActual:
 *                 type: string
 *               passwordNuevo:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password actualizado
 *       401:
 *         description: Password actual incorrecto
 */
router.post('/change-password',
  authenticate,
  [
    body('passwordActual').notEmpty().withMessage('Password actual requerido'),
    body('passwordNuevo').isLength({ min: 8 }).withMessage('Nuevo password debe tener al menos 8 caracteres')
  ],
  validate,
  authController.changePassword
);

module.exports = router;
