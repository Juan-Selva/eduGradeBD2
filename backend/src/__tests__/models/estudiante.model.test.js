/**
 * Unit Tests: Estudiante Model
 */
const mongoose = require('mongoose');
const Estudiante = require('../../models/Estudiante');
const testDb = require('../setup/testDatabase');

describe('Estudiante Model', () => {
  // Connect to test database before all tests
  beforeAll(async () => {
    await testDb.connect();
  });

  // Clear database after each test
  afterEach(async () => {
    await testDb.clearDatabase();
  });

  // Close database after all tests
  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('Creation', () => {
    it('should create a valid estudiante', async () => {
      const estudianteData = {
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
        fechaNacimiento: new Date('2007-05-15'),
        paisOrigen: 'AR',
        email: 'juan.perez@test.com'
      };

      const estudiante = await Estudiante.create(estudianteData);

      expect(estudiante._id).toBeDefined();
      expect(estudiante.dni).toBe('12345678');
      expect(estudiante.nombre).toBe('Juan');
      expect(estudiante.apellido).toBe('Perez');
      expect(estudiante.paisOrigen).toBe('AR');
      expect(estudiante.estado).toBe('activo'); // default value
    });

    it('should fail without required fields', async () => {
      const estudianteData = {
        nombre: 'Juan'
      };

      await expect(Estudiante.create(estudianteData))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail with duplicate DNI', async () => {
      const estudianteData = {
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
        fechaNacimiento: new Date('2007-05-15'),
        paisOrigen: 'AR'
      };

      await Estudiante.create(estudianteData);

      await expect(Estudiante.create({
        ...estudianteData,
        nombre: 'Pedro'
      })).rejects.toThrow();
    });
  });

  describe('Sistema Educativo Validation', () => {
    it('should accept valid sistema educativo values', async () => {
      const sistemas = ['UK', 'US', 'DE', 'AR'];

      for (const sistema of sistemas) {
        const estudiante = await Estudiante.create({
          dni: `TEST-${sistema}`,
          nombre: 'Test',
          apellido: 'Student',
          fechaNacimiento: new Date('2007-01-01'),
          paisOrigen: sistema
        });

        expect(estudiante.paisOrigen).toBe(sistema);
        await Estudiante.deleteOne({ _id: estudiante._id });
      }
    });

    it('should reject invalid sistema educativo', async () => {
      const estudianteData = {
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
        fechaNacimiento: new Date('2007-05-15'),
        paisOrigen: 'INVALID'
      };

      await expect(Estudiante.create(estudianteData))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('getSistemaActivo() method', () => {
    it('should return paisOrigen when no active sistema', async () => {
      const estudiante = await Estudiante.create({
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
        fechaNacimiento: new Date('2007-05-15'),
        paisOrigen: 'AR',
        sistemasEducativos: []
      });

      expect(estudiante.getSistemaActivo()).toBe('AR');
    });

    it('should return active sistema when present', async () => {
      const estudiante = await Estudiante.create({
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
        fechaNacimiento: new Date('2007-05-15'),
        paisOrigen: 'AR',
        sistemasEducativos: [
          { sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: false },
          { sistema: 'UK', fechaInicio: new Date('2022-09-01'), activo: true }
        ]
      });

      expect(estudiante.getSistemaActivo()).toBe('UK');
    });
  });

  describe('Virtual: nombreCompleto', () => {
    it('should return full name', async () => {
      const estudiante = await Estudiante.create({
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
        fechaNacimiento: new Date('2007-05-15'),
        paisOrigen: 'AR'
      });

      expect(estudiante.nombreCompleto).toBe('Juan Perez');
    });
  });

  describe('Estado validation', () => {
    it('should accept valid estados', async () => {
      const estados = ['activo', 'inactivo', 'graduado', 'transferido'];

      for (const estado of estados) {
        const estudiante = await Estudiante.create({
          dni: `ESTADO-${estado}`,
          nombre: 'Test',
          apellido: 'Student',
          fechaNacimiento: new Date('2007-01-01'),
          paisOrigen: 'AR',
          estado
        });

        expect(estudiante.estado).toBe(estado);
        await Estudiante.deleteOne({ _id: estudiante._id });
      }
    });
  });

  describe('Genero validation', () => {
    it('should accept valid genero values', async () => {
      const generos = ['M', 'F', 'O'];

      for (const genero of generos) {
        const estudiante = await Estudiante.create({
          dni: `GEN-${genero}`,
          nombre: 'Test',
          apellido: 'Student',
          fechaNacimiento: new Date('2007-01-01'),
          paisOrigen: 'AR',
          genero
        });

        expect(estudiante.genero).toBe(genero);
        await Estudiante.deleteOne({ _id: estudiante._id });
      }
    });
  });

  describe('Timestamps', () => {
    it('should auto-generate createdAt and updatedAt', async () => {
      const estudiante = await Estudiante.create({
        dni: '12345678',
        nombre: 'Juan',
        apellido: 'Perez',
        fechaNacimiento: new Date('2007-05-15'),
        paisOrigen: 'AR'
      });

      expect(estudiante.createdAt).toBeDefined();
      expect(estudiante.updatedAt).toBeDefined();
      expect(estudiante.createdAt instanceof Date).toBe(true);
    });
  });
});
