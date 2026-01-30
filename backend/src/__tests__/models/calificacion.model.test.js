/**
 * Unit Tests: Calificacion Model
 */
const mongoose = require('mongoose');
const Calificacion = require('../../models/Calificacion');
const Estudiante = require('../../models/Estudiante');
const Materia = require('../../models/Materia');
const Institucion = require('../../models/Institucion');
const testDb = require('../setup/testDatabase');

describe('Calificacion Model', () => {
  let estudiante, materia, institucion;

  beforeAll(async () => {
    await testDb.connect();
  });

  beforeEach(async () => {
    // Create required related documents
    estudiante = await Estudiante.create({
      dni: 'TEST-001',
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
  });

  afterEach(async () => {
    await testDb.clearDatabase();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('Creation', () => {
    it('should create a valid calificacion', async () => {
      const calificacionData = {
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024, periodo: 'anual' },
        valorOriginal: { ar: { nota: 8, aprobado: true } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: {
          usuarioRegistro: 'test-user',
          ipRegistro: '127.0.0.1'
        }
      };

      const calificacion = await Calificacion.create(calificacionData);

      expect(calificacion._id).toBeDefined();
      expect(calificacion.calificacionId).toBeDefined();
      expect(calificacion.sistemaOrigen).toBe('AR');
      expect(calificacion.valorOriginal.ar.nota).toBe(8);
      expect(calificacion.estado).toBe('vigente');
      expect(calificacion.version).toBe(1);
    });
  });

  describe('Hash Integridad', () => {
    it('should auto-generate hashIntegridad on save', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024, periodo: 'anual' },
        valorOriginal: { ar: { nota: 8, aprobado: true } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: {
          usuarioRegistro: 'test-user',
          ipRegistro: '127.0.0.1'
        }
      });

      expect(calificacion.hashIntegridad).toBeDefined();
      expect(calificacion.hashIntegridad).toHaveLength(64); // SHA-256 hex length
    });
  });

  describe('verificarIntegridad() method', () => {
    it('should return true for unmodified calificacion', async () => {
      const calificacion = await Calificacion.create({
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

      // Verify immediately after creation (same object)
      const isValid = calificacion.verificarIntegridad();
      expect(isValid).toBe(true);

      // Also verify hashIntegridad was generated
      expect(calificacion.hashIntegridad).toBeDefined();
      expect(calificacion.hashIntegridad).toHaveLength(64);
    });
  });

  describe('getValorNormalizado() method', () => {
    it('should normalize AR grade to 0-100', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 8 } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.getValorNormalizado()).toBe(80);
    });

    it('should normalize UK letter grade to 0-100', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'UK',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { uk: { letra: 'A' } },
        tipoEvaluacion: 'exam',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.getValorNormalizado()).toBe(85);
    });

    it('should normalize UK A* to 95', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'UK',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { uk: { letra: 'A*' } },
        tipoEvaluacion: 'exam',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.getValorNormalizado()).toBe(95);
    });

    it('should normalize US percentage directly', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'US',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { us: { porcentaje: 92 } },
        tipoEvaluacion: 'midterm',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.getValorNormalizado()).toBe(92);
    });

    it('should normalize US GPA to 0-100', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'US',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { us: { gpa: 3.5 } },
        tipoEvaluacion: 'final',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.getValorNormalizado()).toBe(87.5);
    });

    it('should normalize DE grade (inverted scale)', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'DE',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { de: { nota: 1.0 } }, // Best grade
        tipoEvaluacion: 'final',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.getValorNormalizado()).toBe(100);
    });

    it('should return null for missing value', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: {}, // No AR value
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.getValorNormalizado()).toBeNull();
    });
  });

  describe('Sistema Origen validation', () => {
    it('should accept valid sistemas', async () => {
      const sistemas = ['UK', 'US', 'DE', 'AR'];

      for (const sistema of sistemas) {
        const calificacion = await Calificacion.create({
          estudianteId: estudiante._id,
          materiaId: materia._id,
          institucionId: institucion._id,
          sistemaOrigen: sistema,
          cicloLectivo: { anio: 2024 },
          valorOriginal: { ar: { nota: 7 } },
          tipoEvaluacion: 'parcial',
          fechaEvaluacion: new Date(),
          auditoria: { usuarioRegistro: 'test-user' }
        });

        expect(calificacion.sistemaOrigen).toBe(sistema);
      }
    });

    it('should reject invalid sistema', async () => {
      await expect(Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'INVALID',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 7 } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      })).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Tipo Evaluacion validation', () => {
    it('should accept valid tipos', async () => {
      const tipos = ['parcial', 'final', 'exam', 'quiz', 'midterm'];

      for (const tipo of tipos) {
        const calificacion = await Calificacion.create({
          estudianteId: estudiante._id,
          materiaId: materia._id,
          institucionId: institucion._id,
          sistemaOrigen: 'AR',
          cicloLectivo: { anio: 2024 },
          valorOriginal: { ar: { nota: 7 } },
          tipoEvaluacion: tipo,
          fechaEvaluacion: new Date(),
          auditoria: { usuarioRegistro: 'test-user' }
        });

        expect(calificacion.tipoEvaluacion).toBe(tipo);
      }
    });
  });

  describe('Estado and Version', () => {
    it('should default to vigente estado', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 7 } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.estado).toBe('vigente');
    });

    it('should default to version 1', async () => {
      const calificacion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 7 } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(calificacion.version).toBe(1);
    });

    it('should track correction relationship', async () => {
      const original = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 7 } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      const correccion = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 8 } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' },
        version: 2,
        versionAnteriorId: original.calificacionId,
        esCorreccion: true,
        motivoCorreccion: 'Error de transcripcion'
      });

      expect(correccion.version).toBe(2);
      expect(correccion.versionAnteriorId).toBe(original.calificacionId);
      expect(correccion.esCorreccion).toBe(true);
    });
  });

  describe('Unique calificacionId', () => {
    it('should generate unique UUID', async () => {
      const cal1 = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 7 } },
        tipoEvaluacion: 'parcial',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      const cal2 = await Calificacion.create({
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: 'AR',
        cicloLectivo: { anio: 2024 },
        valorOriginal: { ar: { nota: 8 } },
        tipoEvaluacion: 'final',
        fechaEvaluacion: new Date(),
        auditoria: { usuarioRegistro: 'test-user' }
      });

      expect(cal1.calificacionId).not.toBe(cal2.calificacionId);
    });
  });
});
