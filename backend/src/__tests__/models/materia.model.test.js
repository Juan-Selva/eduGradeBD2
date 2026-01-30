/**
 * Unit Tests: Materia Model
 */
const mongoose = require('mongoose');
const Materia = require('../../models/Materia');
const testDb = require('../setup/testDatabase');

describe('Materia Model', () => {
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
    it('should create a valid materia', async () => {
      const materiaData = {
        codigo: 'MAT-001',
        nombre: 'Matematica',
        sistemaEducativo: 'AR',
        nivel: 'Secundario',
        area: 'matematicas'
      };

      const materia = await Materia.create(materiaData);

      expect(materia._id).toBeDefined();
      expect(materia.codigo).toBe('MAT-001');
      expect(materia.nombre).toBe('Matematica');
      expect(materia.estado).toBe('activa'); // default
    });

    it('should fail without required fields', async () => {
      const materiaData = {
        nombre: 'Test Materia'
      };

      await expect(Materia.create(materiaData))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail with duplicate codigo in same sistema', async () => {
      await Materia.create({
        codigo: 'DUP-001',
        nombre: 'Materia 1',
        sistemaEducativo: 'AR',
        nivel: 'Secundario'
      });

      await expect(Materia.create({
        codigo: 'DUP-001',
        nombre: 'Materia 2',
        sistemaEducativo: 'AR',
        nivel: 'Secundario'
      })).rejects.toThrow();
    });

    it('should allow same codigo in different sistema', async () => {
      const materia1 = await Materia.create({
        codigo: 'MATH-001',
        nombre: 'Matematica AR',
        sistemaEducativo: 'AR',
        nivel: 'Secundario'
      });

      const materia2 = await Materia.create({
        codigo: 'MATH-001',
        nombre: 'Mathematics UK',
        sistemaEducativo: 'UK',
        nivel: 'GCSE'
      });

      expect(materia1.codigo).toBe('MATH-001');
      expect(materia2.codigo).toBe('MATH-001');
      expect(materia1.sistemaEducativo).not.toBe(materia2.sistemaEducativo);
    });
  });

  describe('Sistema Educativo validation', () => {
    it('should accept valid sistemas', async () => {
      const sistemas = ['UK', 'US', 'DE', 'AR'];

      for (const sistema of sistemas) {
        const materia = await Materia.create({
          codigo: `TEST-${sistema}`,
          nombre: `Test ${sistema}`,
          sistemaEducativo: sistema,
          nivel: 'Test Level'
        });

        expect(materia.sistemaEducativo).toBe(sistema);
        await Materia.deleteOne({ _id: materia._id });
      }
    });

    it('should reject invalid sistema', async () => {
      await expect(Materia.create({
        codigo: 'TEST-INVALID',
        nombre: 'Invalid Sistema',
        sistemaEducativo: 'INVALID',
        nivel: 'Test'
      })).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Area validation', () => {
    it('should accept valid areas', async () => {
      const areas = [
        'matematicas', 'ciencias', 'lengua', 'idiomas',
        'historia', 'geografia', 'arte', 'musica',
        'educacion_fisica', 'tecnologia', 'otra'
      ];

      for (const area of areas) {
        const materia = await Materia.create({
          codigo: `AREA-${area}`,
          nombre: `Test ${area}`,
          sistemaEducativo: 'AR',
          nivel: 'Secundario',
          area
        });

        expect(materia.area).toBe(area);
        await Materia.deleteOne({ _id: materia._id });
      }
    });
  });

  describe('Componentes Evaluacion - UK', () => {
    it('should store UK evaluation components', async () => {
      const materia = await Materia.create({
        codigo: 'UK-MATH',
        nombre: 'Mathematics',
        sistemaEducativo: 'UK',
        nivel: 'GCSE',
        componentesEvaluacion: {
          uk: {
            coursework: { peso: 30, descripcion: 'Practical work' },
            exams: { peso: 70, descripcion: 'Written exams' },
            modulos: [
              { nombre: 'Algebra', peso: 40 },
              { nombre: 'Geometry', peso: 60 }
            ]
          }
        }
      });

      expect(materia.componentesEvaluacion.uk.coursework.peso).toBe(30);
      expect(materia.componentesEvaluacion.uk.exams.peso).toBe(70);
      expect(materia.componentesEvaluacion.uk.modulos).toHaveLength(2);
    });
  });

  describe('Componentes Evaluacion - US', () => {
    it('should store US evaluation components', async () => {
      const materia = await Materia.create({
        codigo: 'US-MATH',
        nombre: 'Algebra I',
        sistemaEducativo: 'US',
        nivel: 'High School',
        componentesEvaluacion: {
          us: {
            assignments: { peso: 30 },
            quizzes: { peso: 15 },
            midterm: { peso: 20 },
            final: { peso: 30 },
            participation: { peso: 5 }
          }
        }
      });

      const total = materia.componentesEvaluacion.us.assignments.peso +
                   materia.componentesEvaluacion.us.quizzes.peso +
                   materia.componentesEvaluacion.us.midterm.peso +
                   materia.componentesEvaluacion.us.final.peso +
                   materia.componentesEvaluacion.us.participation.peso;

      expect(total).toBe(100);
    });
  });

  describe('Componentes Evaluacion - DE', () => {
    it('should store DE evaluation components', async () => {
      const materia = await Materia.create({
        codigo: 'DE-MATH',
        nombre: 'Mathematik',
        sistemaEducativo: 'DE',
        nivel: 'Gymnasium',
        componentesEvaluacion: {
          de: {
            evaluacionContinua: { peso: 50 },
            examenFinal: { peso: 40 },
            trabajosPracticos: { peso: 10 }
          }
        }
      });

      expect(materia.componentesEvaluacion.de.evaluacionContinua.peso).toBe(50);
    });
  });

  describe('Componentes Evaluacion - AR', () => {
    it('should store AR evaluation components', async () => {
      const materia = await Materia.create({
        codigo: 'AR-MAT',
        nombre: 'Matematica',
        sistemaEducativo: 'AR',
        nivel: 'Secundario',
        componentesEvaluacion: {
          ar: {
            primerParcial: { peso: 25 },
            segundoParcial: { peso: 25 },
            trabajosPracticos: { peso: 20 },
            final: { peso: 30 },
            recuperatorios: { habilitado: true }
          }
        }
      });

      expect(materia.componentesEvaluacion.ar.recuperatorios.habilitado).toBe(true);
    });
  });

  describe('Estado validation', () => {
    it('should accept valid estados', async () => {
      const estados = ['activa', 'inactiva', 'descontinuada'];

      for (const estado of estados) {
        const materia = await Materia.create({
          codigo: `ESTADO-${estado}`,
          nombre: `Test ${estado}`,
          sistemaEducativo: 'AR',
          nivel: 'Secundario',
          estado
        });

        expect(materia.estado).toBe(estado);
        await Materia.deleteOne({ _id: materia._id });
      }
    });
  });

  describe('Creditos and Hours', () => {
    it('should store credit information', async () => {
      const materia = await Materia.create({
        codigo: 'CRED-001',
        nombre: 'Test Creditos',
        sistemaEducativo: 'US',
        nivel: 'High School',
        creditos: 4,
        horasSemanales: 5,
        horasTotales: 180
      });

      expect(materia.creditos).toBe(4);
      expect(materia.horasSemanales).toBe(5);
      expect(materia.horasTotales).toBe(180);
    });
  });

  describe('Prerequisitos', () => {
    it('should link to prerequisite materias', async () => {
      const prereq = await Materia.create({
        codigo: 'PRE-001',
        nombre: 'Prerequisite',
        sistemaEducativo: 'AR',
        nivel: 'Secundario'
      });

      const materia = await Materia.create({
        codigo: 'MAT-002',
        nombre: 'Advanced',
        sistemaEducativo: 'AR',
        nivel: 'Secundario',
        prerequisitos: [prereq._id]
      });

      expect(materia.prerequisitos).toHaveLength(1);
      expect(materia.prerequisitos[0].toString()).toBe(prereq._id.toString());
    });
  });

  describe('NombreIngles', () => {
    it('should store English name', async () => {
      const materia = await Materia.create({
        codigo: 'ESP-001',
        nombre: 'Matematica',
        nombreIngles: 'Mathematics',
        sistemaEducativo: 'AR',
        nivel: 'Secundario'
      });

      expect(materia.nombre).toBe('Matematica');
      expect(materia.nombreIngles).toBe('Mathematics');
    });
  });

  describe('Timestamps', () => {
    it('should auto-generate timestamps', async () => {
      const materia = await Materia.create({
        codigo: 'TIME-001',
        nombre: 'Timestamp Test',
        sistemaEducativo: 'AR',
        nivel: 'Secundario'
      });

      expect(materia.createdAt).toBeDefined();
      expect(materia.updatedAt).toBeDefined();
    });
  });
});
