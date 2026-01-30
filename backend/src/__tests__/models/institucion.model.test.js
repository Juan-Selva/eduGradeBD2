/**
 * Unit Tests: Institucion Model
 */
const mongoose = require('mongoose');
const Institucion = require('../../models/Institucion');
const testDb = require('../setup/testDatabase');

describe('Institucion Model', () => {
  beforeAll(async () => {
    await testDb.connect();
  });

  afterEach(async () => {
    await testDb.clearDatabase();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('Creation', () => {
    it('should create a valid institucion', async () => {
      const institucionData = {
        codigo: 'AR-CNBA-001',
        nombre: 'Colegio Nacional de Buenos Aires',
        tipo: 'secundaria',
        sistemaEducativo: 'AR',
        pais: 'Argentina'
      };

      const institucion = await Institucion.create(institucionData);

      expect(institucion._id).toBeDefined();
      expect(institucion.codigo).toBe('AR-CNBA-001');
      expect(institucion.nombre).toBe('Colegio Nacional de Buenos Aires');
      expect(institucion.estado).toBe('activa'); // default
    });

    it('should fail without required fields', async () => {
      const institucionData = {
        nombre: 'Test School'
      };

      await expect(Institucion.create(institucionData))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail with duplicate codigo', async () => {
      const institucionData = {
        codigo: 'DUPLICATE-001',
        nombre: 'School 1',
        tipo: 'secundaria',
        sistemaEducativo: 'AR',
        pais: 'Argentina'
      };

      await Institucion.create(institucionData);

      await expect(Institucion.create({
        ...institucionData,
        nombre: 'School 2'
      })).rejects.toThrow();
    });
  });

  describe('Sistema Educativo validation', () => {
    it('should accept valid sistemas', async () => {
      const sistemas = ['UK', 'US', 'DE', 'AR'];

      for (const sistema of sistemas) {
        const institucion = await Institucion.create({
          codigo: `TEST-${sistema}`,
          nombre: `Test ${sistema} School`,
          tipo: 'secundaria',
          sistemaEducativo: sistema,
          pais: 'Test Country'
        });

        expect(institucion.sistemaEducativo).toBe(sistema);
        await Institucion.deleteOne({ _id: institucion._id });
      }
    });

    it('should reject invalid sistema', async () => {
      await expect(Institucion.create({
        codigo: 'TEST-INVALID',
        nombre: 'Invalid School',
        tipo: 'secundaria',
        sistemaEducativo: 'INVALID',
        pais: 'Test Country'
      })).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Tipo validation', () => {
    it('should accept valid tipos', async () => {
      const tipos = ['primaria', 'secundaria', 'preparatoria', 'universidad', 'instituto'];

      for (const tipo of tipos) {
        const institucion = await Institucion.create({
          codigo: `TEST-${tipo}`,
          nombre: `Test ${tipo}`,
          tipo,
          sistemaEducativo: 'AR',
          pais: 'Argentina'
        });

        expect(institucion.tipo).toBe(tipo);
        await Institucion.deleteOne({ _id: institucion._id });
      }
    });

    it('should reject invalid tipo', async () => {
      await expect(Institucion.create({
        codigo: 'TEST-INVALID',
        nombre: 'Invalid Type School',
        tipo: 'invalid_type',
        sistemaEducativo: 'AR',
        pais: 'Argentina'
      })).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Estado validation', () => {
    it('should accept valid estados', async () => {
      const estados = ['activa', 'inactiva', 'clausurada'];

      for (const estado of estados) {
        const institucion = await Institucion.create({
          codigo: `ESTADO-${estado}`,
          nombre: `Test ${estado}`,
          tipo: 'secundaria',
          sistemaEducativo: 'AR',
          pais: 'Argentina',
          estado
        });

        expect(institucion.estado).toBe(estado);
        await Institucion.deleteOne({ _id: institucion._id });
      }
    });
  });

  describe('Niveles Educativos', () => {
    it('should accept valid UK niveles', async () => {
      const institucion = await Institucion.create({
        codigo: 'UK-001',
        nombre: 'UK School',
        tipo: 'secundaria',
        sistemaEducativo: 'UK',
        pais: 'UK',
        nivelesEducativos: ['GCSE', 'A-Level', 'AS-Level']
      });

      expect(institucion.nivelesEducativos).toContain('GCSE');
      expect(institucion.nivelesEducativos).toContain('A-Level');
    });

    it('should accept valid US niveles', async () => {
      const institucion = await Institucion.create({
        codigo: 'US-001',
        nombre: 'US School',
        tipo: 'secundaria',
        sistemaEducativo: 'US',
        pais: 'USA',
        nivelesEducativos: ['High School', 'Middle']
      });

      expect(institucion.nivelesEducativos).toContain('High School');
    });

    it('should accept valid DE niveles', async () => {
      const institucion = await Institucion.create({
        codigo: 'DE-001',
        nombre: 'DE School',
        tipo: 'secundaria',
        sistemaEducativo: 'DE',
        pais: 'Germany',
        nivelesEducativos: ['Gymnasium', 'Abitur']
      });

      expect(institucion.nivelesEducativos).toContain('Gymnasium');
    });

    it('should accept valid AR niveles', async () => {
      const institucion = await Institucion.create({
        codigo: 'AR-001',
        nombre: 'AR School',
        tipo: 'secundaria',
        sistemaEducativo: 'AR',
        pais: 'Argentina',
        nivelesEducativos: ['Primario', 'Secundario']
      });

      expect(institucion.nivelesEducativos).toContain('Secundario');
    });
  });

  describe('Acreditaciones', () => {
    it('should store acreditacion data', async () => {
      const institucion = await Institucion.create({
        codigo: 'ACRED-001',
        nombre: 'Accredited School',
        tipo: 'secundaria',
        sistemaEducativo: 'UK',
        pais: 'UK',
        acreditaciones: [{
          nombre: 'Ofsted Outstanding',
          organizacion: 'Ofsted',
          fechaOtorgamiento: new Date('2020-01-01'),
          fechaVencimiento: new Date('2025-01-01'),
          vigente: true
        }]
      });

      expect(institucion.acreditaciones).toHaveLength(1);
      expect(institucion.acreditaciones[0].nombre).toBe('Ofsted Outstanding');
      expect(institucion.acreditaciones[0].vigente).toBe(true);
    });
  });

  describe('Direccion', () => {
    it('should store direccion data', async () => {
      const institucion = await Institucion.create({
        codigo: 'DIR-001',
        nombre: 'School with Address',
        tipo: 'secundaria',
        sistemaEducativo: 'AR',
        pais: 'Argentina',
        ciudad: 'Buenos Aires',
        region: 'CABA',
        direccion: {
          calle: 'Bolivar 263',
          codigoPostal: 'C1066AAE',
          coordenadas: {
            lat: -34.6083,
            lng: -58.3712
          }
        }
      });

      expect(institucion.ciudad).toBe('Buenos Aires');
      expect(institucion.direccion.calle).toBe('Bolivar 263');
      expect(institucion.direccion.coordenadas.lat).toBe(-34.6083);
    });
  });

  describe('Timestamps', () => {
    it('should auto-generate createdAt and updatedAt', async () => {
      const institucion = await Institucion.create({
        codigo: 'TIME-001',
        nombre: 'Timestamp School',
        tipo: 'secundaria',
        sistemaEducativo: 'AR',
        pais: 'Argentina'
      });

      expect(institucion.createdAt).toBeDefined();
      expect(institucion.updatedAt).toBeDefined();
    });
  });

  describe('Metadata', () => {
    it('should store arbitrary metadata', async () => {
      const institucion = await Institucion.create({
        codigo: 'META-001',
        nombre: 'Metadata School',
        tipo: 'secundaria',
        sistemaEducativo: 'AR',
        pais: 'Argentina',
        metadata: {
          customField: 'custom value',
          numbers: 42,
          nested: { key: 'value' }
        }
      });

      expect(institucion.metadata.customField).toBe('custom value');
      expect(institucion.metadata.numbers).toBe(42);
      expect(institucion.metadata.nested.key).toBe('value');
    });
  });
});
