/**
 * Integration Tests: Estudiantes API Endpoints
 */
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const testDb = require('../setup/testDatabase');
const Estudiante = require('../../models/Estudiante');
const Usuario = require('../../models/Usuario');
const estudianteRoutes = require('../../routes/estudiante.routes');
const authRoutes = require('../../routes/auth.routes');
const { errorHandler, notFoundHandler } = require('../../middlewares/errorHandler');

// Create test app
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/estudiantes', estudianteRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Estudiantes API Integration Tests', () => {
  let app;
  let testEstudiante;
  let adminToken;

  beforeAll(async () => {
    await testDb.connect();
    app = createApp();
  });

  beforeEach(async () => {
    // Create admin user and get token
    await Usuario.create({
      email: 'admin@test.com',
      password: 'AdminPass123!',
      nombre: 'Admin',
      apellido: 'User',
      rol: 'admin'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123!'
      });
    adminToken = loginResponse.body.accessToken;

    // Create test estudiante
    testEstudiante = await Estudiante.create({
      dni: 'TEST-001',
      nombre: 'Juan',
      apellido: 'Perez',
      fechaNacimiento: new Date('2007-05-15'),
      paisOrigen: 'AR',
      email: 'juan@test.com',
      estado: 'activo'
    });
  });

  afterEach(async () => {
    await testDb.clearDatabase();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('GET /api/estudiantes', () => {
    it('should return paginated list of estudiantes', async () => {
      const response = await request(app)
        .get('/api/estudiantes')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by paisOrigen', async () => {
      // Create estudiante from another system
      await Estudiante.create({
        dni: 'UK-001',
        nombre: 'James',
        apellido: 'Smith',
        fechaNacimiento: new Date('2007-03-10'),
        paisOrigen: 'UK'
      });

      const response = await request(app)
        .get('/api/estudiantes?paisOrigen=AR')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].paisOrigen).toBe('AR');
    });

    it('should paginate results', async () => {
      // Create multiple estudiantes
      for (let i = 0; i < 15; i++) {
        await Estudiante.create({
          dni: `BULK-${i}`,
          nombre: `Student ${i}`,
          apellido: 'Bulk',
          fechaNacimiento: new Date('2007-01-01'),
          paisOrigen: 'AR'
        });
      }

      const response = await request(app)
        .get('/api/estudiantes?page=1&limit=5')
        .expect(200);

      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination.total).toBeGreaterThan(5);
    });

    it('should sort by apellido by default', async () => {
      await Estudiante.create({
        dni: 'AAA-001',
        nombre: 'First',
        apellido: 'Aardvark',
        fechaNacimiento: new Date('2007-01-01'),
        paisOrigen: 'AR'
      });

      const response = await request(app)
        .get('/api/estudiantes')
        .expect(200);

      // First should come before Perez alphabetically
      expect(response.body.data[0].apellido).toBe('Aardvark');
    });
  });

  describe('GET /api/estudiantes/:id', () => {
    it('should return estudiante by valid ID', async () => {
      const response = await request(app)
        .get(`/api/estudiantes/${testEstudiante._id}`)
        .expect(200);

      expect(response.body.dni).toBe('TEST-001');
      expect(response.body.nombre).toBe('Juan');
      expect(response.body.apellido).toBe('Perez');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/estudiantes/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid ID format', async () => {
      await request(app)
        .get('/api/estudiantes/invalid-id')
        .expect(400);
    });
  });

  describe('GET /api/estudiantes/dni/:dni', () => {
    it('should return estudiante by DNI', async () => {
      const response = await request(app)
        .get('/api/estudiantes/dni/TEST-001')
        .expect(200);

      expect(response.body.dni).toBe('TEST-001');
      expect(response.body.nombre).toBe('Juan');
    });

    it('should return 404 for non-existent DNI', async () => {
      await request(app)
        .get('/api/estudiantes/dni/NON-EXISTENT')
        .expect(404);
    });
  });

  describe('POST /api/estudiantes', () => {
    it('should create new estudiante with 201', async () => {
      const newEstudiante = {
        dni: 'NEW-001',
        nombre: 'Maria',
        apellido: 'Garcia',
        fechaNacimiento: '2007-08-20',
        paisOrigen: 'AR',
        email: 'maria@test.com'
      };

      const response = await request(app)
        .post('/api/estudiantes')
        .send(newEstudiante)
        .expect(201);

      expect(response.body.dni).toBe('NEW-001');
      expect(response.body.nombre).toBe('Maria');
      expect(response.body._id).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/estudiantes')
        .send({
          nombre: 'Incomplete'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for duplicate DNI', async () => {
      await request(app)
        .post('/api/estudiantes')
        .send({
          dni: 'TEST-001', // Already exists
          nombre: 'Duplicate',
          apellido: 'User',
          fechaNacimiento: '2007-01-01',
          paisOrigen: 'AR'
        })
        .expect(400);
    });

    it('should return 400 for invalid paisOrigen', async () => {
      await request(app)
        .post('/api/estudiantes')
        .send({
          dni: 'INVALID-001',
          nombre: 'Invalid',
          apellido: 'System',
          fechaNacimiento: '2007-01-01',
          paisOrigen: 'INVALID'
        })
        .expect(400);
    });
  });

  describe('PUT /api/estudiantes/:id', () => {
    it('should update estudiante', async () => {
      const response = await request(app)
        .put(`/api/estudiantes/${testEstudiante._id}`)
        .send({
          nombre: 'Juan Carlos',
          email: 'juancarlos@test.com'
        })
        .expect(200);

      expect(response.body.nombre).toBe('Juan Carlos');
      expect(response.body.email).toBe('juancarlos@test.com');
      expect(response.body.apellido).toBe('Perez'); // Unchanged
    });

    it('should return 404 for non-existent estudiante', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .put(`/api/estudiantes/${fakeId}`)
        .send({
          nombre: 'Updated'
        })
        .expect(404);
    });

    it('should not allow changing DNI to existing value', async () => {
      // Create another estudiante
      await Estudiante.create({
        dni: 'ANOTHER-001',
        nombre: 'Another',
        apellido: 'Student',
        fechaNacimiento: new Date('2007-01-01'),
        paisOrigen: 'AR'
      });

      await request(app)
        .put(`/api/estudiantes/${testEstudiante._id}`)
        .send({
          dni: 'ANOTHER-001'
        })
        .expect(400);
    });
  });

  describe('DELETE /api/estudiantes/:id', () => {
    it('should soft delete estudiante (set estado to inactivo)', async () => {
      const response = await request(app)
        .delete(`/api/estudiantes/${testEstudiante._id}`)
        .expect(200);

      expect(response.body.message).toBeDefined();

      // Verify it's soft deleted
      const deleted = await Estudiante.findById(testEstudiante._id);
      expect(deleted.estado).toBe('inactivo');
    });

    it('should return 404 for non-existent estudiante', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .delete(`/api/estudiantes/${fakeId}`)
        .expect(404);
    });
  });

  describe('Edge cases and data validation', () => {
    it('should accept estudiante with all sistemas educativos', async () => {
      const response = await request(app)
        .post('/api/estudiantes')
        .send({
          dni: 'MULTI-001',
          nombre: 'International',
          apellido: 'Student',
          fechaNacimiento: '2007-05-15',
          paisOrigen: 'AR',
          sistemasEducativos: [
            { sistema: 'AR', fechaInicio: '2018-03-01', activo: false },
            { sistema: 'UK', fechaInicio: '2022-09-01', activo: true }
          ]
        })
        .expect(201);

      expect(response.body.sistemasEducativos.length).toBe(2);
    });

    it('should validate genero enum', async () => {
      const response = await request(app)
        .post('/api/estudiantes')
        .send({
          dni: 'GEN-001',
          nombre: 'Gender',
          apellido: 'Test',
          fechaNacimiento: '2007-01-01',
          paisOrigen: 'AR',
          genero: 'M'
        })
        .expect(201);

      expect(response.body.genero).toBe('M');
    });
  });
});
