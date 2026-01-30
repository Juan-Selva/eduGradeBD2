/**
 * Integration Tests: Auth API Endpoints
 */
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const testDb = require('../setup/testDatabase');
const Usuario = require('../../models/Usuario');
const authRoutes = require('../../routes/auth.routes');
const { errorHandler, notFoundHandler } = require('../../middlewares/errorHandler');

// Create test app
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Auth API Integration Tests', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    await testDb.connect();
    app = createApp();
  });

  beforeEach(async () => {
    // Create a test user
    testUser = await Usuario.create({
      email: 'existing@test.com',
      password: 'ExistingPass123!',
      nombre: 'Existing',
      apellido: 'User',
      rol: 'docente'
    });
  });

  afterEach(async () => {
    await testDb.clearDatabase();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with 201', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'NewPassword123!',
        nombre: 'New',
        apellido: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.usuario).toBeDefined();
      expect(response.body.usuario.email).toBe('newuser@test.com');
      expect(response.body.usuario.nombre).toBe('New');
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          nombre: 'Test',
          apellido: 'User'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'short',
          nombre: 'Test',
          apellido: 'User'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'Password123!',
          nombre: 'Another',
          apellido: 'User'
        })
        .expect(409);

      expect(response.body.error).toBeDefined();
    });

    it('should default to consulta role for new users', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'default@test.com',
          password: 'Password123!',
          nombre: 'Default',
          apellido: 'Role'
        })
        .expect(201);

      expect(response.body.usuario.rol).toBe('consulta');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return JWT', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'ExistingPass123!'
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.usuario).toBeDefined();
      expect(response.body.usuario.email).toBe('existing@test.com');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'WrongPassword!'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should increment failed attempts on wrong password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'WrongPassword!'
        })
        .expect(401);

      const user = await Usuario.findById(testUser._id);
      expect(user.intentosFallidos).toBe(1);
    });

    it('should reset failed attempts on successful login', async () => {
      // First, add some failed attempts
      testUser.intentosFallidos = 3;
      await testUser.save();

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'ExistingPass123!'
        })
        .expect(200);

      const user = await Usuario.findById(testUser._id);
      expect(user.intentosFallidos).toBe(0);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      // First login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'ExistingPass123!'
        })
        .expect(200);

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      // Login first
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'ExistingPass123!'
        })
        .expect(200);

      const token = loginResponse.body.accessToken;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe('existing@test.com');
      expect(response.body.nombre).toBe('Existing');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let token;

    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'ExistingPass123!'
        });
      token = loginResponse.body.accessToken;
    });

    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordActual: 'ExistingPass123!',
          passwordNuevo: 'NewSecurePass456!'
        })
        .expect(200);

      expect(response.body.message).toBeDefined();

      // Verify new password works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'NewSecurePass456!'
        })
        .expect(200);
    });

    it('should return 401 for wrong current password', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordActual: 'WrongPassword!',
          passwordNuevo: 'NewSecurePass456!'
        })
        .expect(401);
    });

    it('should return 400 for short new password', async () => {
      await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          passwordActual: 'ExistingPass123!',
          passwordNuevo: 'short'
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with token', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@test.com',
          password: 'ExistingPass123!'
        });

      const token = loginResponse.body.accessToken;
      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.message).toBeDefined();
    });

    it('should return 401 without token', async () => {
      await request(app)
        .post('/api/auth/logout')
        .expect(401);
    });
  });
});
