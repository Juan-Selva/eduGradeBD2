/**
 * Integration Tests: Calificaciones API Endpoints
 */
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const testDb = require('../setup/testDatabase');
const Estudiante = require('../../models/Estudiante');
const Materia = require('../../models/Materia');
const Institucion = require('../../models/Institucion');
const Calificacion = require('../../models/Calificacion');
const calificacionRoutes = require('../../routes/calificacion.routes');
const { errorHandler, notFoundHandler } = require('../../middlewares/errorHandler');

// Create test app
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/calificaciones', calificacionRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Calificaciones API Integration Tests', () => {
  let app;
  let estudiante, materia, institucion;
  let testCalificacion;

  beforeAll(async () => {
    await testDb.connect();
    app = createApp();
  });

  beforeEach(async () => {
    // Create required entities
    estudiante = await Estudiante.create({
      dni: 'EST-001',
      nombre: 'Juan',
      apellido: 'Perez',
      fechaNacimiento: new Date('2007-05-15'),
      paisOrigen: 'AR'
    });

    materia = await Materia.create({
      codigo: 'MAT-001',
      nombre: 'Matematica',
      sistemaEducativo: 'AR',
      nivel: 'Secundario'
    });

    institucion = await Institucion.create({
      codigo: 'INST-001',
      nombre: 'Test School',
      tipo: 'secundaria',
      sistemaEducativo: 'AR',
      pais: 'Argentina'
    });

    // Create test calificacion
    testCalificacion = await Calificacion.create({
      estudianteId: estudiante._id,
      materiaId: materia._id,
      institucionId: institucion._id,
      sistemaOrigen: 'AR',
      cicloLectivo: { anio: 2024, periodo: 'anual' },
      valorOriginal: { ar: { nota: 8, aprobado: true } },
      tipoEvaluacion: 'parcial',
      fechaEvaluacion: new Date('2024-05-15'),
      auditoria: {
        usuarioRegistro: 'test-user',
        ipRegistro: '127.0.0.1'
      }
    });
  });

  afterEach(async () => {
    await testDb.clearDatabase();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('POST /api/calificaciones', () => {
    it('should create immutable calificacion with 201', async () => {
      const newCalificacion = {
        estudianteId: estudiante._id.toString(),
        materiaId: materia._id.toString(),
        institucionId: institucion._id.toString(),
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024, periodo: 'semestre1' },
        valorOriginal: { ar: { nota: 9, aprobado: true } },
        tipoEvaluacion: 'final',
        fechaEvaluacion: '2024-06-20'
      };

      const response = await request(app)
        .post('/api/calificaciones')
        .send(newCalificacion)
        .expect(201);

      expect(response.body.calificacion.calificacionId).toBeDefined();
      expect(response.body.hashIntegridad).toBeDefined();
      expect(response.body.calificacion.valorOriginal.ar.nota).toBe(9);
      expect(response.body.calificacion.estado).toBe('vigente');
      expect(response.body.calificacion.version).toBe(1);
    });

    it('should auto-generate hash integridad', async () => {
      const response = await request(app)
        .post('/api/calificaciones')
        .send({
          estudianteId: estudiante._id.toString(),
          materiaId: materia._id.toString(),
          institucionId: institucion._id.toString(),
          sistemaOrigen: 'AR',
          cicloLectivo: { anio: 2024 },
          valorOriginal: { ar: { nota: 7 } },
          tipoEvaluacion: 'parcial',
          fechaEvaluacion: '2024-05-10'
        })
        .expect(201);

      expect(response.body.hashIntegridad).toBeDefined();
      expect(response.body.hashIntegridad).toHaveLength(64); // SHA-256
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/calificaciones')
        .send({
          estudianteId: estudiante._id.toString()
        })
        .expect(400);
    });

    it('should return 400 for invalid sistemaOrigen', async () => {
      await request(app)
        .post('/api/calificaciones')
        .send({
          estudianteId: estudiante._id.toString(),
          materiaId: materia._id.toString(),
          institucionId: institucion._id.toString(),
          sistemaOrigen: 'INVALID',
          valorOriginal: { ar: { nota: 8 } },
          tipoEvaluacion: 'parcial',
          fechaEvaluacion: '2024-05-15'
        })
        .expect(400);
    });

    it('should accept UK grade format', async () => {
      const response = await request(app)
        .post('/api/calificaciones')
        .send({
          estudianteId: estudiante._id.toString(),
          materiaId: materia._id.toString(),
          institucionId: institucion._id.toString(),
          sistemaOrigen: 'UK',
          cicloLectivo: { anio: 2024 },
          valorOriginal: { uk: { letra: 'A', puntos: 48 } },
          tipoEvaluacion: 'exam',
          fechaEvaluacion: '2024-05-15'
        })
        .expect(201);

      expect(response.body.calificacion.valorOriginal.uk.letra).toBe('A');
    });

    it('should accept US grade format with GPA', async () => {
      const response = await request(app)
        .post('/api/calificaciones')
        .send({
          estudianteId: estudiante._id.toString(),
          materiaId: materia._id.toString(),
          institucionId: institucion._id.toString(),
          sistemaOrigen: 'US',
          cicloLectivo: { anio: 2024 },
          valorOriginal: { us: { letra: 'B+', porcentaje: 87, gpa: 3.3 } },
          tipoEvaluacion: 'midterm',
          fechaEvaluacion: '2024-05-15'
        })
        .expect(201);

      expect(response.body.calificacion.valorOriginal.us.gpa).toBe(3.3);
    });

    it('should accept DE grade format', async () => {
      const response = await request(app)
        .post('/api/calificaciones')
        .send({
          estudianteId: estudiante._id.toString(),
          materiaId: materia._id.toString(),
          institucionId: institucion._id.toString(),
          sistemaOrigen: 'DE',
          cicloLectivo: { anio: 2024 },
          valorOriginal: { de: { nota: 1.7, puntos: 13 } },
          tipoEvaluacion: 'final',
          fechaEvaluacion: '2024-05-15'
        })
        .expect(201);

      expect(response.body.calificacion.valorOriginal.de.nota).toBe(1.7);
    });
  });

  describe('GET /api/calificaciones/estudiante/:estudianteId', () => {
    it('should return all calificaciones for estudiante', async () => {
      // Create additional calificaciones
      await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 7 } },
        tipoEvaluacion: 'final',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test' }
      });

      const response = await request(app)
        .get(`/api/calificaciones/estudiante/${estudiante._id}`)
        .expect(200);

      expect(response.body.calificaciones).toBeDefined();
      expect(Array.isArray(response.body.calificaciones)).toBe(true);
      expect(response.body.calificaciones.length).toBe(2);
    });

    it('should return empty array for estudiante without calificaciones', async () => {
      const otroEstudiante = await Estudiante.create({
        dni: 'SIN-CAL',
        nombre: 'Sin',
        apellido: 'Notas',
        fechaNacimiento: new Date('2007-01-01'),
        paisOrigen: 'AR'
      });

      const response = await request(app)
        .get(`/api/calificaciones/estudiante/${otroEstudiante._id}`)
        .expect(200);

      expect(response.body.calificaciones).toEqual([]);
    });

    it('should return 400 for invalid estudianteId', async () => {
      await request(app)
        .get('/api/calificaciones/estudiante/invalid-id')
        .expect(400);
    });
  });

  describe('GET /api/calificaciones/:id', () => {
    it('should return calificacion by ID', async () => {
      const response = await request(app)
        .get(`/api/calificaciones/${testCalificacion._id}`)
        .expect(200);

      expect(response.body.calificacionId).toBe(testCalificacion.calificacionId);
      expect(response.body.valorOriginal.ar.nota).toBe(8);
    });

    it('should return 404 for non-existent calificacion', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/calificaciones/${fakeId}`)
        .expect(404);
    });
  });

  describe('POST /api/calificaciones/:id/corregir', () => {
    it('should create correction (new version) instead of update', async () => {
      const response = await request(app)
        .post(`/api/calificaciones/${testCalificacion._id}/corregir`)
        .send({
          valorOriginal: { ar: { nota: 9, aprobado: true } },
          motivoCorreccion: 'Error de transcripcion'
        })
        .expect(201);

      // Response contains nuevaVersion object
      expect(response.body.nuevaVersion).toBeDefined();
      expect(response.body.nuevaVersion.version).toBe(2);
      expect(response.body.nuevaVersion.esCorreccion).toBe(true);
      expect(response.body.versionAnterior).toBe(testCalificacion.calificacionId);

      // Verify original is marked as corrected
      const original = await Calificacion.findById(testCalificacion._id);
      expect(original.estado).toBe('corregida');
    });

    it('should return 400 without motivoCorreccion', async () => {
      await request(app)
        .post(`/api/calificaciones/${testCalificacion._id}/corregir`)
        .send({
          valorOriginal: { ar: { nota: 9 } }
        })
        .expect(400);
    });

    it('should return 404 for non-existent calificacion', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/calificaciones/${fakeId}/corregir`)
        .send({
          valorOriginal: { ar: { nota: 9 } },
          motivoCorreccion: 'Test'
        });

      // Could be 404 or 400 depending on validation order
      expect([400, 404]).toContain(response.status);
    });
  });

  describe('GET /api/calificaciones/:id/verificar', () => {
    it('should return verification response with correct structure', async () => {
      const response = await request(app)
        .get(`/api/calificaciones/${testCalificacion._id}/verificar`)
        .expect(200);

      // Response contains expected fields
      expect(response.body).toHaveProperty('integridadValida');
      expect(typeof response.body.integridadValida).toBe('boolean');
      expect(response.body.hashRegistrado).toBeDefined();
      expect(response.body.calificacionId).toBe(testCalificacion.calificacionId);
      expect(response.body.mensaje).toBeDefined();
    });
  });

  describe('GET /api/calificaciones/:id/historial', () => {
    it('should return version history', async () => {
      // Create correction
      await request(app)
        .post(`/api/calificaciones/${testCalificacion._id}/corregir`)
        .send({
          valorOriginal: { ar: { nota: 9 } },
          motivoCorreccion: 'Correccion 1'
        });

      const response = await request(app)
        .get(`/api/calificaciones/${testCalificacion._id}/historial`)
        .expect(200);

      expect(response.body.versiones).toBeDefined();
      expect(Array.isArray(response.body.versiones)).toBe(true);
      expect(response.body.versiones.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/calificaciones (with filters)', () => {
    beforeEach(async () => {
      // Create calificaciones from different systems
      await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'UK',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { uk: { letra: 'A' } },
        tipoEvaluacion: 'exam',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test' }
      });
    });

    it('should filter by sistemaOrigen', async () => {
      const response = await request(app)
        .get('/api/calificaciones?sistemaOrigen=AR')
        .expect(200);

      expect(response.body.data.every(c => c.sistemaOrigen === 'AR')).toBe(true);
    });

    it('should filter by estudianteId', async () => {
      const response = await request(app)
        .get(`/api/calificaciones?estudianteId=${estudiante._id}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by anio', async () => {
      const response = await request(app)
        .get('/api/calificaciones?anio=2024')
        .expect(200);

      expect(response.body.data.every(c => c.cicloLectivo.anio === 2024)).toBe(true);
    });
  });

  describe('Immutability enforcement', () => {
    it('should not allow direct PUT update (immutable design)', async () => {
      // If PUT endpoint exists, it should reject or the route shouldn't exist
      const response = await request(app)
        .put(`/api/calificaciones/${testCalificacion._id}`)
        .send({
          valorOriginal: { ar: { nota: 10 } }
        });

      // Either 404 (route not found) or 405 (method not allowed) or 400 (business rule)
      expect([400, 404, 405]).toContain(response.status);
    });
  });
});
