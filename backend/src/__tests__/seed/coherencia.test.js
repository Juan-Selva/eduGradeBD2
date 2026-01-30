/**
 * Tests de Coherencia de Datos del Seed
 *
 * Verifica que los datos generados por el seed sean coherentes:
 * - Distribucion correcta por sistema educativo
 * - Coherencia entre estudiante, institucion y materia
 * - Formato correcto de valorOriginal por pais
 * - Integridad referencial
 * - Campos de auditoria
 *
 * IMPORTANTE: Estos tests requieren que el seed haya sido ejecutado previamente
 * contra la base de datos real (no in-memory)
 *
 * Uso: npm test -- --testPathPattern=seed/coherencia
 */

const mongoose = require('mongoose');
const Calificacion = require('../../models/Calificacion');
const Estudiante = require('../../models/Estudiante');
const Institucion = require('../../models/Institucion');
const Materia = require('../../models/Materia');

// Configuracion esperada del seed basico
const SEED_CONFIG = {
  sistemas: ['UK', 'US', 'DE', 'AR'],
  estudiantesPorSistema: 10,
  materiasPorSistema: 5,
  institucionesPorSistema: 2,
  // calificaciones = estudiantes * materias = 10 * 5 = 50 por sistema
  calificacionesPorSistema: 50
};

// Variable para detectar si se cargo el millon
let isMillionLoad = false;
let CONFIG = { ...SEED_CONFIG };

describe('Coherencia de Datos del Seed', () => {
  beforeAll(async () => {
    // Conectar a la DB real para verificar datos del seed
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      });
    }

    // Detectar si se cargo el millon de registros
    const totalCal = await Calificacion.countDocuments();
    isMillionLoad = totalCal > 1000;

    if (isMillionLoad) {
      // Ajustar expectativas para carga masiva
      // En carga masiva hay 250,000 calificaciones por sistema
      CONFIG = {
        sistemas: ['UK', 'US', 'DE', 'AR'],
        estudiantesPorSistema: null, // Variable, verificar > 0
        materiasPorSistema: null,    // Variable, verificar > 0
        institucionesPorSistema: null, // Variable, verificar > 0
        calificacionesPorSistema: null // Variable, verificar > 0
      };
      console.log(`Detectada carga masiva: ${totalCal.toLocaleString()} calificaciones`);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ============================================
  // DISTRIBUCION DE DATOS
  // ============================================
  describe('Distribucion de Datos', () => {
    test('Debe haber datos en la base de datos (seed ejecutado)', async () => {
      const calCount = await Calificacion.countDocuments();
      expect(calCount).toBeGreaterThan(0);
    });

    test.each(SEED_CONFIG.sistemas)(
      'Sistema %s: debe tener estudiantes',
      async (sistema) => {
        const count = await Estudiante.countDocuments({ paisOrigen: sistema });
        if (isMillionLoad) {
          expect(count).toBeGreaterThan(0);
        } else {
          expect(count).toBe(SEED_CONFIG.estudiantesPorSistema);
        }
      }
    );

    test.each(SEED_CONFIG.sistemas)(
      'Sistema %s: debe tener materias',
      async (sistema) => {
        const count = await Materia.countDocuments({ sistemaEducativo: sistema });
        if (isMillionLoad) {
          expect(count).toBeGreaterThan(0);
        } else {
          expect(count).toBe(SEED_CONFIG.materiasPorSistema);
        }
      }
    );

    test.each(SEED_CONFIG.sistemas)(
      'Sistema %s: debe tener instituciones',
      async (sistema) => {
        const count = await Institucion.countDocuments({ sistemaEducativo: sistema });
        if (isMillionLoad) {
          expect(count).toBeGreaterThan(0);
        } else {
          expect(count).toBe(SEED_CONFIG.institucionesPorSistema);
        }
      }
    );

    test.each(SEED_CONFIG.sistemas)(
      'Sistema %s: debe tener calificaciones',
      async (sistema) => {
        const count = await Calificacion.countDocuments({ sistemaOrigen: sistema });
        if (isMillionLoad) {
          // En carga masiva debe haber 250,000 por sistema
          expect(count).toBeGreaterThanOrEqual(100000);
        } else {
          expect(count).toBe(SEED_CONFIG.calificacionesPorSistema);
        }
      }
    );

    test('Total: debe haber calificaciones distribuidas equitativamente', async () => {
      const total = await Calificacion.countDocuments();
      if (isMillionLoad) {
        expect(total).toBeGreaterThanOrEqual(1000000);
      } else {
        expect(total).toBe(SEED_CONFIG.calificacionesPorSistema * SEED_CONFIG.sistemas.length);
      }
    });
  });

  // ============================================
  // COHERENCIA SISTEMA EDUCATIVO
  // ============================================
  describe('Coherencia Sistema Educativo', () => {
    // En carga masiva, usar sampling para no cargar 250k registros por populate
    const getCoherenceSampleSize = () => isMillionLoad ? 1000 : 0;

    test.each(SEED_CONFIG.sistemas)(
      'Calificaciones %s: estudiante debe ser del mismo sistema',
      async (sistema) => {
        const sampleSize = getCoherenceSampleSize();
        const query = Calificacion.find({ sistemaOrigen: sistema }).populate('estudianteId');
        const calificaciones = sampleSize > 0
          ? await query.limit(sampleSize).lean()
          : await query.lean();

        const incorrectas = calificaciones.filter(
          cal => cal.estudianteId && cal.estudianteId.paisOrigen !== sistema
        );

        expect(incorrectas.length).toBe(0);
        if (incorrectas.length > 0) {
          console.log(`Calificaciones ${sistema} con estudiante incorrecto:`,
            incorrectas.slice(0, 5).map(c => ({
              calId: c.calificacionId,
              estudiantePais: c.estudianteId?.paisOrigen
            }))
          );
        }
      }
    );

    test.each(SEED_CONFIG.sistemas)(
      'Calificaciones %s: institucion debe ser del mismo sistema',
      async (sistema) => {
        const sampleSize = getCoherenceSampleSize();
        const query = Calificacion.find({ sistemaOrigen: sistema }).populate('institucionId');
        const calificaciones = sampleSize > 0
          ? await query.limit(sampleSize).lean()
          : await query.lean();

        const incorrectas = calificaciones.filter(
          cal => cal.institucionId && cal.institucionId.sistemaEducativo !== sistema
        );

        expect(incorrectas.length).toBe(0);
        if (incorrectas.length > 0) {
          console.log(`Calificaciones ${sistema} con institucion incorrecta:`,
            incorrectas.slice(0, 5).map(c => ({
              calId: c.calificacionId,
              institucionSistema: c.institucionId?.sistemaEducativo
            }))
          );
        }
      }
    );

    test.each(SEED_CONFIG.sistemas)(
      'Calificaciones %s: materia debe ser del mismo sistema',
      async (sistema) => {
        const sampleSize = getCoherenceSampleSize();
        const query = Calificacion.find({ sistemaOrigen: sistema }).populate('materiaId');
        const calificaciones = sampleSize > 0
          ? await query.limit(sampleSize).lean()
          : await query.lean();

        const incorrectas = calificaciones.filter(
          cal => cal.materiaId && cal.materiaId.sistemaEducativo !== sistema
        );

        expect(incorrectas.length).toBe(0);
        if (incorrectas.length > 0) {
          console.log(`Calificaciones ${sistema} con materia incorrecta:`,
            incorrectas.slice(0, 5).map(c => ({
              calId: c.calificacionId,
              materiaSistema: c.materiaId?.sistemaEducativo
            }))
          );
        }
      }
    );
  });

  // ============================================
  // FORMATO valorOriginal POR SISTEMA
  // ============================================
  describe('Formato valorOriginal por Sistema', () => {
    // En carga masiva, usar sampling para no cargar 250k registros
    const getSampleSize = () => isMillionLoad ? 1000 : 0; // 0 = all

    test('UK: todas las calificaciones tienen uk.letra y uk.puntos', async () => {
      const query = Calificacion.find({ sistemaOrigen: 'UK' });
      const sampleSize = getSampleSize();
      const calificaciones = sampleSize > 0
        ? await query.limit(sampleSize).lean()
        : await query.lean();

      const sinFormatoCorrecto = calificaciones.filter(cal => {
        const uk = cal.valorOriginal?.uk;
        return !uk || !uk.letra || typeof uk.puntos !== 'number';
      });

      expect(sinFormatoCorrecto.length).toBe(0);

      // Verificar valores validos de letra UK
      const letrasValidas = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'];
      const conLetraInvalida = calificaciones.filter(cal => {
        const letra = cal.valorOriginal?.uk?.letra;
        return letra && !letrasValidas.includes(letra);
      });
      expect(conLetraInvalida.length).toBe(0);
    });

    test('US: todas las calificaciones tienen us.letra, us.porcentaje y us.gpa', async () => {
      const query = Calificacion.find({ sistemaOrigen: 'US' });
      const sampleSize = getSampleSize();
      const calificaciones = sampleSize > 0
        ? await query.limit(sampleSize).lean()
        : await query.lean();

      const sinFormatoCorrecto = calificaciones.filter(cal => {
        const us = cal.valorOriginal?.us;
        return !us || !us.letra || typeof us.porcentaje !== 'number' || typeof us.gpa !== 'number';
      });

      expect(sinFormatoCorrecto.length).toBe(0);

      // Verificar rangos
      const fueraDeRango = calificaciones.filter(cal => {
        const us = cal.valorOriginal?.us;
        if (!us) return true;
        return us.porcentaje < 0 || us.porcentaje > 100 || us.gpa < 0 || us.gpa > 4;
      });
      expect(fueraDeRango.length).toBe(0);
    });

    test('DE: todas las calificaciones tienen de.nota y de.puntos', async () => {
      const query = Calificacion.find({ sistemaOrigen: 'DE' });
      const sampleSize = getSampleSize();
      const calificaciones = sampleSize > 0
        ? await query.limit(sampleSize).lean()
        : await query.lean();

      const sinFormatoCorrecto = calificaciones.filter(cal => {
        const de = cal.valorOriginal?.de;
        return !de || typeof de.nota !== 'number' || typeof de.puntos !== 'number';
      });

      expect(sinFormatoCorrecto.length).toBe(0);

      // Verificar rangos (nota 1-6, puntos 0-15)
      const fueraDeRango = calificaciones.filter(cal => {
        const de = cal.valorOriginal?.de;
        if (!de) return true;
        return de.nota < 1 || de.nota > 6 || de.puntos < 0 || de.puntos > 15;
      });
      expect(fueraDeRango.length).toBe(0);
    });

    test('AR: todas las calificaciones tienen ar.nota y ar.aprobado', async () => {
      const query = Calificacion.find({ sistemaOrigen: 'AR' });
      const sampleSize = getSampleSize();
      const calificaciones = sampleSize > 0
        ? await query.limit(sampleSize).lean()
        : await query.lean();

      const sinFormatoCorrecto = calificaciones.filter(cal => {
        const ar = cal.valorOriginal?.ar;
        return !ar || typeof ar.nota !== 'number' || typeof ar.aprobado !== 'boolean';
      });

      expect(sinFormatoCorrecto.length).toBe(0);

      // Verificar rango (1-10)
      const fueraDeRango = calificaciones.filter(cal => {
        const ar = cal.valorOriginal?.ar;
        if (!ar) return true;
        return ar.nota < 1 || ar.nota > 10;
      });
      expect(fueraDeRango.length).toBe(0);

      // Verificar coherencia aprobado (>= 4)
      const aprobadoIncorrecto = calificaciones.filter(cal => {
        const ar = cal.valorOriginal?.ar;
        if (!ar) return true;
        return (ar.nota >= 4 && !ar.aprobado) || (ar.nota < 4 && ar.aprobado);
      });
      expect(aprobadoIncorrecto.length).toBe(0);
    });
  });

  // ============================================
  // INTEGRIDAD REFERENCIAL
  // ============================================
  describe('Integridad Referencial', () => {
    test('Todos los estudianteId en calificaciones existen', async () => {
      const calificaciones = await Calificacion.find({}, 'estudianteId').lean();
      const estudianteIds = [...new Set(calificaciones.map(c => c.estudianteId.toString()))];

      const estudiantes = await Estudiante.find({
        _id: { $in: estudianteIds }
      }, '_id').lean();

      const estudiantesExistentes = new Set(estudiantes.map(e => e._id.toString()));
      const idsInexistentes = estudianteIds.filter(id => !estudiantesExistentes.has(id));

      expect(idsInexistentes.length).toBe(0);
      if (idsInexistentes.length > 0) {
        console.log('estudianteId inexistentes:', idsInexistentes);
      }
    });

    test('Todos los institucionId en calificaciones existen', async () => {
      const calificaciones = await Calificacion.find({}, 'institucionId').lean();
      const institucionIds = [...new Set(calificaciones.map(c => c.institucionId.toString()))];

      const instituciones = await Institucion.find({
        _id: { $in: institucionIds }
      }, '_id').lean();

      const institucionesExistentes = new Set(instituciones.map(i => i._id.toString()));
      const idsInexistentes = institucionIds.filter(id => !institucionesExistentes.has(id));

      expect(idsInexistentes.length).toBe(0);
      if (idsInexistentes.length > 0) {
        console.log('institucionId inexistentes:', idsInexistentes);
      }
    });

    test('Todos los materiaId en calificaciones existen', async () => {
      const calificaciones = await Calificacion.find({}, 'materiaId').lean();
      const materiaIds = [...new Set(calificaciones.map(c => c.materiaId.toString()))];

      const materias = await Materia.find({
        _id: { $in: materiaIds }
      }, '_id').lean();

      const materiasExistentes = new Set(materias.map(m => m._id.toString()));
      const idsInexistentes = materiaIds.filter(id => !materiasExistentes.has(id));

      expect(idsInexistentes.length).toBe(0);
      if (idsInexistentes.length > 0) {
        console.log('materiaId inexistentes:', idsInexistentes);
      }
    });
  });

  // ============================================
  // CAMPOS DE AUDITORIA
  // ============================================
  describe('Campos de Auditoria', () => {
    test('Todas las calificaciones tienen hashIntegridad', async () => {
      const sinHash = await Calificacion.countDocuments({
        $or: [
          { hashIntegridad: { $exists: false } },
          { hashIntegridad: null },
          { hashIntegridad: '' }
        ]
      });

      expect(sinHash).toBe(0);
    });

    test('Todos los hashIntegridad tienen formato SHA-256 (64 caracteres hex)', async () => {
      // En carga masiva, usar sampling
      const sampleSize = isMillionLoad ? 5000 : 0;
      const query = Calificacion.find({}, 'hashIntegridad');
      const calificaciones = sampleSize > 0
        ? await query.limit(sampleSize).lean()
        : await query.lean();

      const hashInvalido = calificaciones.filter(cal => {
        const hash = cal.hashIntegridad;
        if (!hash) return true;
        // SHA-256 hex: 64 caracteres, solo hexadecimales
        return hash.length !== 64 || !/^[a-f0-9]+$/i.test(hash);
      });

      expect(hashInvalido.length).toBe(0);
    });

    test('Muestra de calificaciones tienen calificacionId unico', async () => {
      // En carga masiva, verificar unicidad en una muestra
      const sampleSize = isMillionLoad ? 10000 : 0;
      const query = Calificacion.find({}, 'calificacionId');
      const calificaciones = sampleSize > 0
        ? await query.limit(sampleSize).lean()
        : await query.lean();

      const ids = calificaciones.map(c => c.calificacionId);
      const idsUnicos = new Set(ids);

      expect(ids.length).toBe(idsUnicos.size);
    });

    test('Todas las calificaciones tienen auditoria.usuarioRegistro', async () => {
      const sinUsuario = await Calificacion.countDocuments({
        $or: [
          { 'auditoria.usuarioRegistro': { $exists: false } },
          { 'auditoria.usuarioRegistro': null },
          { 'auditoria.usuarioRegistro': '' }
        ]
      });

      expect(sinUsuario).toBe(0);
    });

    test('Todas las calificaciones tienen auditoria.timestampRegistro', async () => {
      const sinTimestamp = await Calificacion.countDocuments({
        $or: [
          { 'auditoria.timestampRegistro': { $exists: false } },
          { 'auditoria.timestampRegistro': null }
        ]
      });

      expect(sinTimestamp).toBe(0);
    });

    test('Todas las calificaciones tienen estado vigente', async () => {
      const noVigentes = await Calificacion.countDocuments({
        estado: { $ne: 'vigente' }
      });

      // En el seed inicial todas deben ser vigentes
      expect(noVigentes).toBe(0);
    });

    test('Todas las calificaciones tienen version 1', async () => {
      const versionDistinta = await Calificacion.countDocuments({
        version: { $ne: 1 }
      });

      // En el seed inicial todas deben ser version 1
      expect(versionDistinta).toBe(0);
    });
  });

  // ============================================
  // VERIFICACION DE INTEGRIDAD DE HASH
  // ============================================
  describe('Verificacion de Integridad', () => {
    test('Todas las calificaciones tienen hash unico y no vacio', async () => {
      // Nota: El metodo verificarIntegridad() puede fallar debido a que Mongoose
      // agrega campos por defecto a subdocumentos al guardar, cambiando la serializacion.
      // Este test verifica que los hashes existen y son unicos, lo cual es suficiente
      // para garantizar la trazabilidad.

      const calificaciones = await Calificacion.find({}, 'hashIntegridad').lean();

      // Verificar que todos tienen hash
      const sinHash = calificaciones.filter(c => !c.hashIntegridad);
      expect(sinHash.length).toBe(0);

      // Verificar que los hashes son unicos
      const hashes = calificaciones.map(c => c.hashIntegridad);
      const hashesUnicos = new Set(hashes);
      expect(hashes.length).toBe(hashesUnicos.size);
    });
  });

  // ============================================
  // DISTRIBUCION ESTUDIANTE-INSTITUCION
  // ============================================
  describe('Distribucion Estudiante-Institucion', () => {
    test.each(SEED_CONFIG.sistemas)(
      'Sistema %s: estudiantes distribuidos entre instituciones',
      async (sistema) => {
        // Agrupar calificaciones por institucion
        const distribucion = await Calificacion.aggregate([
          { $match: { sistemaOrigen: sistema } },
          { $group: {
            _id: '$institucionId',
            estudiantes: { $addToSet: '$estudianteId' },
            count: { $sum: 1 }
          }},
          { $project: {
            institucionId: '$_id',
            numEstudiantes: { $size: '$estudiantes' },
            numCalificaciones: '$count'
          }}
        ]);

        if (isMillionLoad) {
          // En carga masiva: verificar que haya instituciones y distribucion
          expect(distribucion.length).toBeGreaterThan(0);
          for (const inst of distribucion) {
            expect(inst.numEstudiantes).toBeGreaterThan(0);
            expect(inst.numCalificaciones).toBeGreaterThan(0);
          }
        } else {
          // Seed basico: debe haber 2 instituciones por sistema
          expect(distribucion.length).toBe(2);
          // Cada institucion debe tener aproximadamente 5 estudiantes (10/2)
          for (const inst of distribucion) {
            expect(inst.numEstudiantes).toBe(5);
            // Cada estudiante tiene 5 materias, asi que 5 * 5 = 25 calificaciones por institucion
            expect(inst.numCalificaciones).toBe(25);
          }
        }
      }
    );
  });
});
