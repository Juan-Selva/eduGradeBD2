#!/usr/bin/env node

/**
 * Load Million Script - EduGrade Global
 * =====================================
 *
 * Generates and loads 1 million calificaciones with realistic data
 * to demonstrate system scalability (TPO requirement).
 *
 * Distribution:
 * - 10,000 estudiantes (2,500 per system: UK, US, DE, AR)
 * - 500 instituciones (125 per system)
 * - 200 materias (50 per system)
 * - 1,000,000 calificaciones distributed across systems
 *
 * Features:
 * - Batch inserts for efficiency (5000 docs/batch)
 * - Real-time progress with speed metrics
 * - Coherent data (same pattern as seed.js)
 * - Performance metrics and validation
 * - Graceful Ctrl+C handling
 *
 * Usage: npm run load:million
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const cliProgress = require('cli-progress');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Models
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');
const Materia = require('../models/Materia');
const Calificacion = require('../models/Calificacion');

// Configuration
const CONFIG = {
  estudiantes: 10000,
  instituciones: 500,
  materias: 100,  // 25 per system (5 areas × 5 unique names = no duplicates)
  calificaciones: 1000000,
  batchSize: 5000, // Optimized for balance between memory and speed
  sistemas: ['UK', 'US', 'DE', 'AR']
};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}[STEP]${colors.reset} ${msg}`),
  stat: (msg) => console.log(`${colors.magenta}[STAT]${colors.reset} ${msg}`)
};

// ============================================
// DATA GENERATORS
// ============================================

/**
 * Generate estudiante data for a specific system
 */
function generateEstudiante(sistema, index) {
  const paisConfig = {
    UK: { locale: 'en_GB', pais: 'Reino Unido' },
    US: { locale: 'en_US', pais: 'Estados Unidos' },
    DE: { locale: 'de', pais: 'Alemania' },
    AR: { locale: 'es', pais: 'Argentina' }
  };

  const config = paisConfig[sistema];

  return {
    dni: `${sistema}-${Date.now()}-${index}`,
    nombre: faker.person.firstName(),
    apellido: faker.person.lastName(),
    fechaNacimiento: faker.date.between({
      from: new Date('2005-01-01'),
      to: new Date('2010-12-31')
    }),
    genero: faker.helpers.arrayElement(['M', 'F', 'O']),
    email: `student${index}@${sistema.toLowerCase()}.test`,
    paisOrigen: sistema,
    sistemasEducativos: [{
      sistema,
      fechaInicio: faker.date.past({ years: 3 }),
      activo: true
    }],
    estado: 'activo',
    direccion: {
      ciudad: faker.location.city(),
      pais: config.pais
    }
  };
}

/**
 * Generate institucion data for a specific system
 */
function generateInstitucion(sistema, index) {
  const tiposPorSistema = {
    UK: ['secundaria'],
    US: ['primaria', 'secundaria', 'preparatoria'],
    DE: ['secundaria'],
    AR: ['primaria', 'secundaria']
  };

  const nivelesPorSistema = {
    UK: ['GCSE', 'A-Level'],
    US: ['Elementary', 'Middle', 'High School'],
    DE: ['Gymnasium', 'Realschule'],
    AR: ['Primario', 'Secundario']
  };

  return {
    codigo: `${sistema}-INST-${index.toString().padStart(4, '0')}`,
    nombre: `${faker.company.name()} School ${index}`,
    nombreCorto: `School-${sistema}-${index}`,
    tipo: faker.helpers.arrayElement(tiposPorSistema[sistema]),
    sistemaEducativo: sistema,
    pais: { UK: 'Reino Unido', US: 'Estados Unidos', DE: 'Alemania', AR: 'Argentina' }[sistema],
    region: faker.location.state(),
    ciudad: faker.location.city(),
    nivelesEducativos: nivelesPorSistema[sistema],
    estado: 'activa'
  };
}

/**
 * Generate materia data for a specific system
 */
function generateMateria(sistema, index) {
  const areas = ['matematicas', 'ciencias', 'lengua', 'idiomas', 'historia'];
  const area = areas[index % areas.length];

  const nombresPorArea = {
    matematicas: ['Matematica', 'Algebra', 'Geometria', 'Calculo', 'Estadistica'],
    ciencias: ['Fisica', 'Quimica', 'Biologia', 'Ciencias Naturales', 'Geologia'],
    lengua: ['Literatura', 'Lengua', 'Comunicacion', 'Redaccion', 'Expresion'],
    idiomas: ['Ingles', 'Frances', 'Aleman', 'Italiano', 'Portugues'],
    historia: ['Historia', 'Geografia', 'Civica', 'Economia', 'Filosofia']
  };

  const nombreIndex = Math.floor(index / 5) % 5;  // Deterministic: each area gets 5 unique names
  const nombre = nombresPorArea[area][nombreIndex];

  return {
    codigo: `${sistema}-${area.toUpperCase().substring(0, 3)}-${index.toString().padStart(3, '0')}`,
    nombre: `${nombre} ${sistema}`,
    nombreIngles: `${area} ${index}`,
    sistemaEducativo: sistema,
    nivel: { UK: 'GCSE', US: 'High School', DE: 'Gymnasium', AR: 'Secundario' }[sistema],
    area,
    creditos: faker.number.int({ min: 2, max: 6 }),
    horasSemanales: faker.number.int({ min: 2, max: 6 }),
    estado: 'activa'
  };
}

/**
 * Generate calificacion value based on system
 */
function generateValorOriginal(sistema) {
  switch (sistema) {
    case 'UK':
      return {
        uk: {
          letra: faker.helpers.arrayElement(['A*', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'D', 'E']),
          puntos: faker.number.int({ min: 30, max: 56 })
        }
      };

    case 'US':
      const porcentaje = faker.number.int({ min: 50, max: 100 });
      const gpa = Math.min(4.0, Math.round((porcentaje / 100) * 4 * 10) / 10);
      return {
        us: {
          letra: porcentaje >= 90 ? 'A' : porcentaje >= 80 ? 'B' : porcentaje >= 70 ? 'C' : porcentaje >= 60 ? 'D' : 'F',
          porcentaje,
          gpa
        }
      };

    case 'DE':
      return {
        de: {
          nota: faker.number.float({ min: 1.0, max: 4.0, fractionDigits: 1 }),
          puntos: faker.number.int({ min: 5, max: 15 })
        }
      };

    case 'AR':
      const nota = faker.number.int({ min: 1, max: 10 });
      return {
        ar: {
          nota,
          aprobado: nota >= 4,
          instancia: 'regular'
        }
      };
  }
}

/**
 * Generate calificacion document
 */
function generateCalificacion(estudianteId, materiaId, institucionId, sistema) {
  const tiposEvaluacion = {
    UK: ['exam', 'coursework', 'modulo'],
    US: ['quiz', 'midterm', 'final', 'assignment'],
    DE: ['parcial', 'final', 'trabajo_practico'],
    AR: ['parcial', 'final', 'trabajo_practico', 'recuperatorio']
  };

  const valorOriginal = generateValorOriginal(sistema);
  const calificacionId = uuidv4();
  const fechaEvaluacion = faker.date.between({
    from: new Date('2024-01-01'),
    to: new Date('2024-12-31')
  });
  const timestampRegistro = new Date();

  // Generate hash
  const dataToHash = JSON.stringify({
    calificacionId,
    estudianteId: estudianteId.toString(),
    materiaId: materiaId.toString(),
    valorOriginal,
    fechaEvaluacion,
    timestampRegistro
  });

  const hashIntegridad = crypto.createHash('sha256').update(dataToHash).digest('hex');

  return {
    calificacionId,
    estudianteId,
    materiaId,
    institucionId,
    sistemaOrigen: sistema,
    cicloLectivo: {
      anio: 2024,
      periodo: faker.helpers.arrayElement(['anual', 'semestre1', 'semestre2'])
    },
    valorOriginal,
    tipoEvaluacion: faker.helpers.arrayElement(tiposEvaluacion[sistema]),
    fechaEvaluacion,
    auditoria: {
      usuarioRegistro: 'load-million-script',
      ipRegistro: '127.0.0.1',
      timestampRegistro
    },
    hashIntegridad,
    version: 1,
    estado: 'vigente'
  };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';
  log.info(`Conectando a MongoDB: ${uri.split('@').pop() || uri}`);

  await mongoose.connect(uri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000
  });

  log.success('MongoDB conectado');
}

async function clearExistingData() {
  log.step('Limpiando TODOS los datos existentes...');

  // Borrar TODO para evitar problemas de integridad referencial
  const calCount = await Calificacion.countDocuments();
  if (calCount > 0) {
    log.warn(`  Eliminando ${calCount.toLocaleString()} calificaciones...`);
    await Calificacion.deleteMany({});
  }

  const estCount = await Estudiante.countDocuments();
  if (estCount > 0) {
    log.warn(`  Eliminando ${estCount.toLocaleString()} estudiantes...`);
    await Estudiante.deleteMany({});
  }

  const instCount = await Institucion.countDocuments();
  if (instCount > 0) {
    log.warn(`  Eliminando ${instCount.toLocaleString()} instituciones...`);
    await Institucion.deleteMany({});
  }

  const matCount = await Materia.countDocuments();
  if (matCount > 0) {
    log.warn(`  Eliminando ${matCount.toLocaleString()} materias...`);
    await Materia.deleteMany({});
  }

  log.success('Base de datos limpiada');
}

async function insertBatch(model, documents, progressBar) {
  try {
    await model.insertMany(documents, { ordered: false });
    progressBar.increment(documents.length);
  } catch (error) {
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      progressBar.increment(documents.length);
    } else {
      throw error;
    }
  }
}

// ============================================
// MAIN LOAD FUNCTIONS
// ============================================

async function loadInstituciones() {
  log.step(`Generando ${CONFIG.instituciones} instituciones...`);

  const progressBar = new cliProgress.SingleBar({
    format: '  Instituciones |{bar}| {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
  }, cliProgress.Presets.shades_classic);

  progressBar.start(CONFIG.instituciones, 0);

  const instituciones = [];
  const perSistema = CONFIG.instituciones / CONFIG.sistemas.length;

  for (const sistema of CONFIG.sistemas) {
    for (let i = 0; i < perSistema; i++) {
      instituciones.push(generateInstitucion(sistema, instituciones.length));
    }
  }

  // Insert in batches
  for (let i = 0; i < instituciones.length; i += CONFIG.batchSize) {
    const batch = instituciones.slice(i, i + CONFIG.batchSize);
    await insertBatch(Institucion, batch, progressBar);
  }

  progressBar.stop();
  log.success(`  ${instituciones.length} instituciones creadas`);

  return Institucion.find({}).lean();
}

async function loadMaterias() {
  log.step(`Generando ${CONFIG.materias} materias...`);

  const progressBar = new cliProgress.SingleBar({
    format: '  Materias      |{bar}| {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
  }, cliProgress.Presets.shades_classic);

  progressBar.start(CONFIG.materias, 0);

  const materias = [];
  const perSistema = CONFIG.materias / CONFIG.sistemas.length;

  for (const sistema of CONFIG.sistemas) {
    for (let i = 0; i < perSistema; i++) {
      materias.push(generateMateria(sistema, materias.length));
    }
  }

  for (let i = 0; i < materias.length; i += CONFIG.batchSize) {
    const batch = materias.slice(i, i + CONFIG.batchSize);
    await insertBatch(Materia, batch, progressBar);
  }

  progressBar.stop();
  log.success(`  ${materias.length} materias creadas`);

  return Materia.find({}).lean();
}

async function loadEstudiantes() {
  log.step(`Generando ${CONFIG.estudiantes} estudiantes...`);

  const progressBar = new cliProgress.SingleBar({
    format: '  Estudiantes   |{bar}| {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
  }, cliProgress.Presets.shades_classic);

  progressBar.start(CONFIG.estudiantes, 0);

  const estudiantes = [];
  const perSistema = CONFIG.estudiantes / CONFIG.sistemas.length;

  for (const sistema of CONFIG.sistemas) {
    for (let i = 0; i < perSistema; i++) {
      estudiantes.push(generateEstudiante(sistema, estudiantes.length));
    }
  }

  for (let i = 0; i < estudiantes.length; i += CONFIG.batchSize) {
    const batch = estudiantes.slice(i, i + CONFIG.batchSize);
    await insertBatch(Estudiante, batch, progressBar);
  }

  progressBar.stop();
  log.success(`  ${estudiantes.length} estudiantes creados`);

  return Estudiante.find({ dni: { $regex: /^(UK|US|DE|AR)-\d+-\d+$/ } }).lean();
}

async function loadCalificaciones(estudiantes, materias, instituciones) {
  log.step(`Generando ${CONFIG.calificaciones.toLocaleString()} calificaciones...`);

  // Group by system
  const estudiantesPorSistema = {};
  const materiasPorSistema = {};
  const institucionesPorSistema = {};

  CONFIG.sistemas.forEach(sistema => {
    estudiantesPorSistema[sistema] = estudiantes.filter(e => e.paisOrigen === sistema);
    materiasPorSistema[sistema] = materias.filter(m => m.sistemaEducativo === sistema);
    institucionesPorSistema[sistema] = instituciones.filter(i => i.sistemaEducativo === sistema);
  });

  const progressBar = new cliProgress.SingleBar({
    format: '  Calificaciones|{bar}| {percentage}% | {value}/{total} | {speed} cal/s | ETA: {eta}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591'
  }, cliProgress.Presets.shades_classic);

  progressBar.start(CONFIG.calificaciones, 0, { speed: 0 });

  const calificacionesPorSistema = CONFIG.calificaciones / CONFIG.sistemas.length;
  let totalInserted = 0;
  const startTime = Date.now();
  let lastLogTime = startTime;
  let lastLogCount = 0;

  for (const sistema of CONFIG.sistemas) {
    const estList = estudiantesPorSistema[sistema];
    const matList = materiasPorSistema[sistema];
    const instList = institucionesPorSistema[sistema];

    if (!estList.length || !matList.length || !instList.length) {
      log.warn(`  Sin datos para sistema ${sistema}`);
      continue;
    }

    let batch = [];
    let systemInserted = 0;

    // Use cyclic indexing for coherent distribution
    while (systemInserted < calificacionesPorSistema) {
      // Coherent assignment: each student gets grades from their assigned institution
      const estudianteIdx = systemInserted % estList.length;
      const estudiante = estList[estudianteIdx];
      const materia = matList[systemInserted % matList.length];
      // Student assigned to institution via round-robin
      const institucion = instList[estudianteIdx % instList.length];

      batch.push(generateCalificacion(
        estudiante._id,
        materia._id,
        institucion._id,
        sistema
      ));

      systemInserted++;

      if (batch.length >= CONFIG.batchSize) {
        await Calificacion.insertMany(batch, { ordered: false });
        totalInserted += batch.length;

        // Calculate speed
        const now = Date.now();
        const elapsedSinceLastLog = (now - lastLogTime) / 1000;
        if (elapsedSinceLastLog >= 0.5) {
          const speed = Math.round((totalInserted - lastLogCount) / elapsedSinceLastLog);
          progressBar.update(totalInserted, { speed });
          lastLogTime = now;
          lastLogCount = totalInserted;
        } else {
          progressBar.update(totalInserted);
        }

        batch = [];
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      await Calificacion.insertMany(batch, { ordered: false });
      totalInserted += batch.length;
      progressBar.update(totalInserted);
    }
  }

  progressBar.stop();

  const totalTime = (Date.now() - startTime) / 1000;
  const avgSpeed = Math.round(totalInserted / totalTime);
  log.success(`  ${totalInserted.toLocaleString()} calificaciones creadas`);
  log.stat(`  Velocidad promedio: ${avgSpeed.toLocaleString()} cal/s`);
}

// ============================================
// VALIDATION
// ============================================

async function validateData() {
  log.step('Validando datos cargados...');

  const stats = {
    estudiantes: await Estudiante.countDocuments(),
    instituciones: await Institucion.countDocuments(),
    materias: await Materia.countDocuments(),
    calificaciones: await Calificacion.countDocuments()
  };

  console.log('\n' + '='.repeat(50));
  log.stat('RESUMEN DE DATOS');
  console.log('='.repeat(50));
  console.log(`  Estudiantes:     ${stats.estudiantes.toLocaleString()}`);
  console.log(`  Instituciones:   ${stats.instituciones.toLocaleString()}`);
  console.log(`  Materias:        ${stats.materias.toLocaleString()}`);
  console.log(`  Calificaciones:  ${stats.calificaciones.toLocaleString()}`);

  // Distribution by system
  console.log('\nDistribucion por sistema:');
  for (const sistema of CONFIG.sistemas) {
    const est = await Estudiante.countDocuments({ paisOrigen: sistema });
    const cal = await Calificacion.countDocuments({ sistemaOrigen: sistema });
    console.log(`  ${sistema}: ${est.toLocaleString()} estudiantes, ${cal.toLocaleString()} calificaciones`);
  }

  // Verify integrity of sample
  log.step('Verificando integridad de muestra...');
  const sample = await Calificacion.find({}).limit(100);
  let validCount = 0;

  for (const cal of sample) {
    if (cal.verificarIntegridad()) {
      validCount++;
    }
  }

  console.log(`  Integridad verificada: ${validCount}/100 (${validCount}%)`);

  return stats;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  EDUGRADE GLOBAL - LOAD MILLION CALIFICACIONES');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();

  try {
    await connectDB();
    await clearExistingData();

    // Load in order (dependencies)
    const instituciones = await loadInstituciones();
    const materias = await loadMaterias();
    const estudiantes = await loadEstudiantes();

    // Load calificaciones (bulk)
    await loadCalificaciones(estudiantes, materias, instituciones);

    // Validate
    await validateData();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const durationMin = (duration / 60).toFixed(1);

    console.log('\n' + '='.repeat(50));
    log.success(`CARGA COMPLETADA EN ${durationMin} minutos (${duration}s)`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    log.error(`Error durante la carga: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info('Conexion cerrada');
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n');
  log.warn('Proceso interrumpido por el usuario');
  try {
    await mongoose.disconnect();
  } catch (e) {
    // Ignore disconnect errors on interrupt
  }
  process.exit(0);
});

// Execute
main();
