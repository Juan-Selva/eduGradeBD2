/**
 * Unit Tests: Auth Middleware
 */
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Import test utilities
const { mockRequest, mockResponse, mockNext } = require('../setup/testServer');
const testDb = require('../setup/testDatabase');

// Import models and middleware
const Usuario = require('../../models/Usuario');
const {
  authenticate,
  authenticateOptional,
  requireRole,
  requirePermission,
  requireOwnerOrAdmin,
  generarAccessToken,
  generarRefreshToken,
  JWT_SECRET
} = require('../../middlewares/auth');

describe('Auth Middleware', () => {
  let testUser;

  beforeAll(async () => {
    await testDb.connect();
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await Usuario.create({
      email: 'test@example.com',
      password: 'SecurePassword123!',
      nombre: 'Test',
      apellido: 'User',
      rol: 'docente',
      permisos: ['estudiantes:leer', 'calificaciones:crear']
    });
  });

  afterEach(async () => {
    await testDb.clearDatabase();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('generarAccessToken()', () => {
    it('should generate a valid JWT token', () => {
      const token = generarAccessToken(testUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.rol).toBe(testUser.rol);
    });

    it('should expire according to JWT_EXPIRATION', () => {
      const token = generarAccessToken(testUser);
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('generarRefreshToken()', () => {
    it('should generate a valid refresh token', () => {
      const token = generarRefreshToken(testUser);

      expect(token).toBeDefined();

      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.id).toBe(testUser._id.toString());
    });
  });

  describe('authenticate()', () => {
    it('should authenticate valid token', async () => {
      const token = generarAccessToken(testUser);
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe(testUser.email);
      expect(req.userId.toString()).toBe(testUser._id.toString());
    });

    it('should reject missing token', async () => {
      const req = mockRequest({ headers: {} });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Token');
    });

    it('should reject invalid token format', async () => {
      const req = mockRequest({
        headers: { authorization: 'InvalidToken' }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject invalid token', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid.token.here' }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('invalido');
    });

    it('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: testUser._id },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const req = mockRequest({
        headers: { authorization: `Bearer ${expiredToken}` }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('expirado');
    });

    it('should reject token for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const token = jwt.sign(
        { id: fakeUserId },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('no encontrado');
    });

    it('should reject token for inactive user', async () => {
      testUser.estado = 'inactivo';
      await testUser.save();

      const token = generarAccessToken(testUser);
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('inactiva');
    });

    it('should reject token for blocked user', async () => {
      testUser.bloqueadoHasta = new Date(Date.now() + 30 * 60 * 1000);
      await testUser.save();

      const token = generarAccessToken(testUser);
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('bloqueada');
    });
  });

  describe('authenticateOptional()', () => {
    it('should continue without token', async () => {
      const req = mockRequest({ headers: {} });
      const res = mockResponse();
      const next = mockNext();

      await authenticateOptional(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(); // No error
      expect(req.user).toBeNull();
    });

    it('should set user with valid token', async () => {
      const token = generarAccessToken(testUser);
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticateOptional(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe(testUser.email);
    });

    it('should continue with invalid token', async () => {
      const req = mockRequest({
        headers: { authorization: 'Bearer invalid.token' }
      });
      const res = mockResponse();
      const next = mockNext();

      await authenticateOptional(req, res, next);

      expect(next).toHaveBeenCalledWith(); // No error
      expect(req.user).toBeFalsy(); // null or undefined - no user set
    });
  });

  describe('requireRole()', () => {
    it('should allow matching role', () => {
      const middleware = requireRole('docente', 'admin');
      const req = mockRequest({ user: testUser });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject non-matching role', () => {
      const middleware = requireRole('admin');
      const req = mockRequest({ user: testUser });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Rol requerido');
    });

    it('should reject without user', () => {
      const middleware = requireRole('admin');
      const req = mockRequest({ user: null });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Autenticacion');
    });
  });

  describe('requirePermission()', () => {
    it('should allow user with permission', () => {
      const middleware = requirePermission('estudiantes:leer');
      const req = mockRequest({ user: testUser });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow admin for any permission', async () => {
      const adminUser = await Usuario.create({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        nombre: 'Admin',
        apellido: 'User',
        rol: 'admin'
      });

      const middleware = requirePermission('usuarios:eliminar');
      const req = mockRequest({ user: adminUser });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject user without permission', () => {
      const middleware = requirePermission('usuarios:eliminar');
      const req = mockRequest({ user: testUser });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('Permiso requerido');
    });

    it('should accept any of multiple permissions', () => {
      const middleware = requirePermission('usuarios:eliminar', 'estudiantes:leer');
      const req = mockRequest({ user: testUser });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireOwnerOrAdmin()', () => {
    it('should allow resource owner', () => {
      const middleware = requireOwnerOrAdmin('id');
      const req = mockRequest({
        user: testUser,
        params: { id: testUser._id.toString() }
      });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow admin for any resource', async () => {
      const adminUser = await Usuario.create({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        nombre: 'Admin',
        apellido: 'User',
        rol: 'admin'
      });

      const middleware = requireOwnerOrAdmin('id');
      const req = mockRequest({
        user: adminUser,
        params: { id: 'any-other-user-id' }
      });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject non-owner non-admin', async () => {
      const otherUser = await Usuario.create({
        email: 'other@example.com',
        password: 'OtherPass123!',
        nombre: 'Other',
        apellido: 'User',
        rol: 'consulta'
      });

      const middleware = requireOwnerOrAdmin('id');
      const req = mockRequest({
        user: otherUser,
        params: { id: testUser._id.toString() }
      });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toContain('No autorizado');
    });
  });
});
