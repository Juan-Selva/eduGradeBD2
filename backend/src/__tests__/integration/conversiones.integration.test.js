/**
 * Integration Tests: Conversiones API Endpoints
 */
const request = require('supertest');
const express = require('express');

const testDb = require('../setup/testDatabase');
const conversionRoutes = require('../../routes/conversion.routes');
const { errorHandler, notFoundHandler } = require('../../middlewares/errorHandler');

// Mock Redis for conversion service
jest.mock('../../config/database', () => ({
  getRedisClient: () => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK')
  }),
  getCassandraClient: () => ({
    execute: jest.fn().mockResolvedValue({ rows: [] })
  })
}));

// Create test app
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/conversiones', conversionRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('Conversiones API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    await testDb.connect();
    app = createApp();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('POST /api/conversiones/convertir', () => {
    it('should convert UK A* to US', async () => {
      const response = await request(app)
        .post('/api/conversiones/convertir')
        .send({
          sistemaOrigen: 'UK',
          sistemaDestino: 'US',
          valorOriginal: { uk: { letra: 'A*' } }
        })
        .expect(200);

      expect(response.body.sistemaOrigen).toBe('UK');
      expect(response.body.sistemaDestino).toBe('US');
      expect(response.body.valorConvertido.us).toBeDefined();
      expect(response.body.valorConvertido.us.gpa).toBeGreaterThanOrEqual(3.7);
      expect(response.body.valorNormalizado).toBeGreaterThanOrEqual(90);
    });

    it('should convert US GPA to DE', async () => {
      const response = await request(app)
        .post('/api/conversiones/convertir')
        .send({
          sistemaOrigen: 'US',
          sistemaDestino: 'DE',
          valorOriginal: { us: { gpa: 4.0 } }
        })
        .expect(200);

      expect(response.body.valorConvertido.de).toBeDefined();
      expect(response.body.valorConvertido.de.nota).toBeLessThanOrEqual(1.5);
    });

    it('should convert DE to AR', async () => {
      const response = await request(app)
        .post('/api/conversiones/convertir')
        .send({
          sistemaOrigen: 'DE',
          sistemaDestino: 'AR',
          valorOriginal: { de: { nota: 2.0 } }
        })
        .expect(200);

      expect(response.body.valorConvertido.ar).toBeDefined();
      expect(response.body.valorConvertido.ar.nota).toBeGreaterThanOrEqual(7);
      expect(response.body.valorConvertido.ar.aprobado).toBe(true);
    });

    it('should convert AR to UK', async () => {
      const response = await request(app)
        .post('/api/conversiones/convertir')
        .send({
          sistemaOrigen: 'AR',
          sistemaDestino: 'UK',
          valorOriginal: { ar: { nota: 10 } }
        })
        .expect(200);

      expect(response.body.valorConvertido.uk).toBeDefined();
      expect(response.body.valorConvertido.uk.letra).toBe('A*');
    });

    it('should return 400 for missing sistemaOrigen', async () => {
      await request(app)
        .post('/api/conversiones/convertir')
        .send({
          sistemaDestino: 'US',
          valorOriginal: { uk: { letra: 'A' } }
        })
        .expect(400);
    });

    it('should return 400 for invalid valorOriginal', async () => {
      await request(app)
        .post('/api/conversiones/convertir')
        .send({
          sistemaOrigen: 'UK',
          sistemaDestino: 'US',
          valorOriginal: {} // Empty value
        })
        .expect(400);
    });

    it('should include reglaAplicada and fecha in response', async () => {
      const response = await request(app)
        .post('/api/conversiones/convertir')
        .send({
          sistemaOrigen: 'AR',
          sistemaDestino: 'UK',
          valorOriginal: { ar: { nota: 8 } }
        })
        .expect(200);

      expect(response.body.reglaAplicada).toBeDefined();
      expect(response.body.fecha).toBeDefined();
    });
  });

  describe('POST /api/conversiones/multiple', () => {
    it('should convert to all other systems', async () => {
      const response = await request(app)
        .post('/api/conversiones/multiple')
        .send({
          sistemaOrigen: 'AR',
          valorOriginal: { ar: { nota: 8 } }
        })
        .expect(200);

      expect(response.body.sistemaOrigen).toBe('AR');
      expect(response.body.conversiones.UK).toBeDefined();
      expect(response.body.conversiones.US).toBeDefined();
      expect(response.body.conversiones.DE).toBeDefined();
      expect(response.body.conversiones.AR).toBeUndefined(); // Should not include origin
    });

    it('should return all 3 conversions from UK', async () => {
      const response = await request(app)
        .post('/api/conversiones/multiple')
        .send({
          sistemaOrigen: 'UK',
          valorOriginal: { uk: { letra: 'B' } }
        })
        .expect(200);

      expect(response.body.conversiones.US).toBeDefined();
      expect(response.body.conversiones.DE).toBeDefined();
      expect(response.body.conversiones.AR).toBeDefined();
    });

    it('should return 400 for missing sistemaOrigen', async () => {
      await request(app)
        .post('/api/conversiones/multiple')
        .send({
          valorOriginal: { ar: { nota: 8 } }
        })
        .expect(400);
    });
  });

  describe('GET /api/conversiones/tabla/:sistemaOrigen/:sistemaDestino', () => {
    it('should return UK to US equivalence table', async () => {
      const response = await request(app)
        .get('/api/conversiones/tabla/UK/US')
        .expect(200);

      expect(response.body.sistemaOrigen).toBe('UK');
      expect(response.body.sistemaDestino).toBe('US');
      expect(response.body.tabla).toBeDefined();
      expect(Array.isArray(response.body.tabla)).toBe(true);
      expect(response.body.tabla.length).toBeGreaterThan(0);
    });

    it('should return AR to DE equivalence table', async () => {
      const response = await request(app)
        .get('/api/conversiones/tabla/AR/DE')
        .expect(200);

      expect(response.body.tabla.length).toBe(10); // AR has 10 grades

      // Check each entry has required fields
      response.body.tabla.forEach(entry => {
        expect(entry.origen).toBeDefined();
        expect(entry.normalizado).toBeDefined();
        expect(entry.destino).toBeDefined();
      });
    });

    it('should return DE to UK equivalence table', async () => {
      const response = await request(app)
        .get('/api/conversiones/tabla/DE/UK')
        .expect(200);

      expect(response.body.tabla.length).toBeGreaterThan(0);

      // Check DE nota 1.0 maps to A*
      const best = response.body.tabla.find(e => e.origen.nota === 1.0);
      expect(best.destino.uk.letra).toBe('A*');
    });

    it('should return US to AR equivalence table', async () => {
      const response = await request(app)
        .get('/api/conversiones/tabla/US/AR')
        .expect(200);

      expect(response.body.tabla.length).toBeGreaterThan(0);

      // Check entries have US letter grades
      const hasLetterGrades = response.body.tabla.some(e => e.origen.letra);
      expect(hasLetterGrades).toBe(true);
    });
  });

  describe('GET /api/conversiones/reglas', () => {
    it('should return conversion rules metadata', async () => {
      const response = await request(app)
        .get('/api/conversiones/reglas')
        .expect(200);

      expect(response.body.version).toBeDefined();
      expect(response.body.sistemas).toBeDefined();
      expect(response.body.sistemas).toContain('UK');
      expect(response.body.sistemas).toContain('US');
      expect(response.body.sistemas).toContain('DE');
      expect(response.body.sistemas).toContain('AR');
      expect(response.body.metodologia).toBeDefined();
    });

    it('should include grade scales for each system', async () => {
      const response = await request(app)
        .get('/api/conversiones/reglas')
        .expect(200);

      expect(response.body.tablas.UK).toContain('A*');
      expect(response.body.tablas.US).toContain('A+');
      expect(response.body.tablas.DE).toContain(1.0);
      expect(response.body.tablas.AR).toContain(10);
    });
  });

  describe('Conversion accuracy tests', () => {
    describe('UK grades', () => {
      const ukGrades = ['A*', 'A', 'B', 'C', 'D', 'E', 'F'];

      it.each(ukGrades)('should convert UK %s to US', async (letra) => {
        const response = await request(app)
          .post('/api/conversiones/convertir')
          .send({
            sistemaOrigen: 'UK',
            sistemaDestino: 'US',
            valorOriginal: { uk: { letra } }
          })
          .expect(200);

        expect(response.body.valorConvertido.us).toBeDefined();
        expect(response.body.valorConvertido.us.gpa).toBeGreaterThanOrEqual(0);
        expect(response.body.valorConvertido.us.gpa).toBeLessThanOrEqual(4);
      });
    });

    describe('US grades to DE', () => {
      it('should convert US 4.0 GPA to DE ~1.0', async () => {
        const response = await request(app)
          .post('/api/conversiones/convertir')
          .send({
            sistemaOrigen: 'US',
            sistemaDestino: 'DE',
            valorOriginal: { us: { gpa: 4.0 } }
          });

        expect(response.body.valorConvertido.de.nota).toBeLessThanOrEqual(1.5);
      });

      it('should convert US 2.0 GPA to DE ~3.0', async () => {
        const response = await request(app)
          .post('/api/conversiones/convertir')
          .send({
            sistemaOrigen: 'US',
            sistemaDestino: 'DE',
            valorOriginal: { us: { gpa: 2.0 } }
          });

        expect(response.body.valorConvertido.de.nota).toBeGreaterThan(2);
        expect(response.body.valorConvertido.de.nota).toBeLessThanOrEqual(4);
      });
    });

    describe('AR grades', () => {
      it('should convert AR 4 (passing) to UK E or F', async () => {
        const response = await request(app)
          .post('/api/conversiones/convertir')
          .send({
            sistemaOrigen: 'AR',
            sistemaDestino: 'UK',
            valorOriginal: { ar: { nota: 4 } }
          });

        expect(['E', 'F']).toContain(response.body.valorConvertido.uk.letra);
      });

      it('should convert AR 10 to UK A*', async () => {
        const response = await request(app)
          .post('/api/conversiones/convertir')
          .send({
            sistemaOrigen: 'AR',
            sistemaDestino: 'UK',
            valorOriginal: { ar: { nota: 10 } }
          });

        expect(response.body.valorConvertido.uk.letra).toBe('A*');
      });
    });
  });
});
