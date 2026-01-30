#!/usr/bin/env node

/**
 * Script de Seed Masivo - EduGrade Global (TPO)
 * =============================================
 *
 * Genera datos a escala para demostrar el sistema con volumen realista.
 *
 * Distribucion:
 * - 50,000 estudiantes (12,500 por pais: UK, US, DE, AR)
 * - 40 instituciones (10 por pais)
 * - 40 materias (10 por pais, mismas areas)
 * - 500,000 calificaciones (10 por estudiante)
 *
 * Sincroniza con:
 * - MongoDB (principal)
 * - Neo4j (grafos: ASISTIO, CURSO, EQUIVALE)
 * - Cassandra (auditoria)
 * - Redis (cache de reglas)
 *
 * Uso: npm run seed:massive
 */

require('dotenv').config();
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Modelos MongoDB
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');
const Materia = require('../models/Materia');
const Calificacion = require('../models/Calificacion');

// Datos de seed masivo
const institucionesMassive = require('./seeds/instituciones-massive.seed');
const materiasMassive = require('./seeds/materias-massive.seed');

// Colores para consola
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

// Configuracion
const CONFIG = {
  estudiantesPorPais: 12500,  // 50,000 total (12,500 x 4 paises)
  sistemas: ['UK', 'US', 'DE', 'AR'],
  calificacionesPorEstudiante: 10, // Una por cada materia
  batchSize: 1000  // Aumentado para mejor rendimiento
};

// Driver Neo4j
let neo4jDriver;

// ============================================
// Nombres por pais para estudiantes
// ============================================
const nombresUK = {
  nombres: ['James', 'Oliver', 'Harry', 'George', 'William', 'Thomas', 'Jack', 'Charlie', 'Jacob', 'Alfie',
            'Emma', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Emily', 'Grace', 'Lily', 'Ella', 'Mia'],
  apellidos: ['Smith', 'Johnson', 'Williams', 'Brown', 'Taylor', 'Davies', 'Wilson', 'Evans', 'Thomas', 'Roberts',
              'Walker', 'Wright', 'Thompson', 'White', 'Hall', 'Green', 'Wood', 'Harris', 'Martin', 'Jackson']
};

const nombresUS = {
  nombres: ['Michael', 'Christopher', 'Joshua', 'Matthew', 'Daniel', 'David', 'Andrew', 'Joseph', 'Ryan', 'Nicholas',
            'Emily', 'Madison', 'Ashley', 'Samantha', 'Taylor', 'Hannah', 'Jessica', 'Sarah', 'Abigail', 'Olivia'],
  apellidos: ['Anderson', 'Martinez', 'Garcia', 'Rodriguez', 'Wilson', 'Lopez', 'Lee', 'Gonzalez', 'Harris', 'Clark',
              'Lewis', 'Young', 'Allen', 'King', 'Scott', 'Hill', 'Adams', 'Baker', 'Nelson', 'Carter']
};

const nombresDE = {
  nombres: ['Maximilian', 'Alexander', 'Paul', 'Felix', 'Leon', 'Lukas', 'Tim', 'Jonas', 'Ben', 'Niklas',
            'Sophie', 'Marie', 'Emma', 'Hannah', 'Mia', 'Anna', 'Lena', 'Lea', 'Laura', 'Julia'],
  apellidos: ['Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz',
              'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Braun', 'Hofmann', 'Zimmermann', 'Krause']
};

const nombresAR = {
  nombres: ['Santiago', 'Mateo', 'Benjamin', 'Thiago', 'Joaquin', 'Agustin', 'Lucas', 'Nicolas', 'Bruno', 'Lautaro',
            'Valentina', 'Camila', 'Martina', 'Sofia', 'Emma', 'Isabella', 'Mia', 'Catalina', 'Lucia', 'Emilia'],
  apellidos: ['Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Garcia', 'Perez', 'Sanchez', 'Ramirez', 'Diaz',
              'Torres', 'Ruiz', 'Alvarez', 'Romero', 'Gomez', 'Flores', 'Castro', 'Moreno', 'Acosta', 'Vargas']
};

const nombresPorPais = { UK: nombresUK, US: nombresUS, DE: nombresDE, AR: nombresAR };

// ============================================
// Generadores de notas por sistema
// ============================================
function generarNotaUK() {
  const letras = ['A*', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'D', 'E'];
  const idx = Math.floor(Math.random() * letras.length);
  const letra = letras[idx];
  const puntosUCAS = { 'A*': 56, 'A': 48, 'B': 40, 'C': 32, 'D': 24, 'E': 16 };
  return {
    uk: {
      letra,
      puntos: puntosUCAS[letra],
      numerico: Math.max(9 - idx, 4)
    }
  };
}

function generarNotaUS() {
  const porcentaje = Math.floor(Math.random() * 41) + 60;
  let letra, gpa;
  if (porcentaje >= 93) { letra = 'A'; gpa = 4.0; }
  else if (porcentaje >= 90) { letra = 'A-'; gpa = 3.7; }
  else if (porcentaje >= 87) { letra = 'B+'; gpa = 3.3; }
  else if (porcentaje >= 83) { letra = 'B'; gpa = 3.0; }
  else if (porcentaje >= 80) { letra = 'B-'; gpa = 2.7; }
  else if (porcentaje >= 77) { letra = 'C+'; gpa = 2.3; }
  else if (porcentaje >= 73) { letra = 'C'; gpa = 2.0; }
  else if (porcentaje >= 70) { letra = 'C-'; gpa = 1.7; }
  else if (porcentaje >= 67) { letra = 'D+'; gpa = 1.3; }
  else if (porcentaje >= 63) { letra = 'D'; gpa = 1.0; }
  else { letra = 'F'; gpa = 0.0; }
  return { us: { letra, porcentaje, gpa } };
}

function generarNotaDE() {
  const nota = parseFloat((Math.random() * 3 + 1).toFixed(1));
  const puntos = Math.round((6 - nota) * 2.5);
  const tendencias = ['+', '', '-'];
  const tendencia = tendencias[Math.floor(Math.random() * tendencias.length)];
  return { de: { nota, puntos: Math.max(0, Math.min(15, puntos)), tendencia } };
}

function generarNotaAR() {
  const nota = Math.floor(Math.random() * 7) + 4;
  const instancias = ['regular', 'diciembre', 'febrero', 'libre'];
  const instancia = instancias[Math.floor(Math.random() * instancias.length)];
  return { ar: { nota, aprobado: nota >= 4, instancia } };
}

const generadoresNota = { UK: generarNotaUK, US: generarNotaUS, DE: generarNotaDE, AR: generarNotaAR };

const tiposEvaluacion = {
  UK: ['coursework', 'exam', 'modulo'],
  US: ['quiz', 'midterm', 'assignment', 'final'],
  DE: ['parcial', 'trabajo_practico', 'final'],
  AR: ['parcial', 'trabajo_practico', 'final', 'recuperatorio']
};

// ============================================
// Conexiones a bases de datos
// ============================================
async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';
  log.info(`Conectando a MongoDB: ${uri.split('@').pop() || uri}`);
  await mongoose.connect(uri, { maxPoolSize: 20, serverSelectionTimeoutMS: 10000 });
  log.success('MongoDB conectado');
}

function connectNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';
  log.info(`Conectando a Neo4j: ${uri}`);
  neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  log.success('Neo4j driver creado');
}

// ============================================
// Limpieza de colecciones
// ============================================
async function limpiarColecciones() {
  log.step('Limpiando colecciones MongoDB...');

  const colecciones = [
    { model: Calificacion, nombre: 'calificaciones' },
    { model: Estudiante, nombre: 'estudiantes' },
    { model: Materia, nombre: 'materias' },
    { model: Institucion, nombre: 'instituciones' }
  ];

  for (const { model, nombre } of colecciones) {
    const count = await model.countDocuments();
    if (count > 0) {
      await model.deleteMany({});
      log.warn(`  ${nombre}: ${count} documentos eliminados`);
    }
  }

  log.success('MongoDB limpiado');
}

async function limpiarNeo4j() {
  log.step('Limpiando Neo4j...');
  const session = neo4jDriver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    log.success('Neo4j limpiado');
  } finally {
    await session.close();
  }
}

// ============================================
// Seed de instituciones
// ============================================
async function seedInstituciones() {
  log.step('Insertando 40 instituciones...');
  const instituciones = await Institucion.insertMany(institucionesMassive);
  log.success(`  ${instituciones.length} instituciones insertadas`);

  const mapa = {};
  for (const inst of instituciones) {
    if (!mapa[inst.sistemaEducativo]) mapa[inst.sistemaEducativo] = [];
    mapa[inst.sistemaEducativo].push(inst);
  }

  for (const [sistema, insts] of Object.entries(mapa)) {
    log.info(`    ${sistema}: ${insts.length} instituciones`);
  }

  return mapa;
}

// ============================================
// Seed de materias
// ============================================
async function seedMaterias() {
  log.step('Insertando 40 materias...');
  const materias = await Materia.insertMany(materiasMassive);
  log.success(`  ${materias.length} materias insertadas`);

  const mapa = {};
  for (const mat of materias) {
    if (!mapa[mat.sistemaEducativo]) mapa[mat.sistemaEducativo] = [];
    mapa[mat.sistemaEducativo].push(mat);
  }

  for (const [sistema, mats] of Object.entries(mapa)) {
    log.info(`    ${sistema}: ${mats.length} materias`);
  }

  return mapa;
}

// ============================================
// Generacion de estudiantes
// ============================================
function generarEstudiante(sistema, index) {
  const nombres = nombresPorPais[sistema];
  const nombre = nombres.nombres[Math.floor(Math.random() * nombres.nombres.length)];
  const apellido = nombres.apellidos[Math.floor(Math.random() * nombres.apellidos.length)];
  const genero = index % 2 === 0 ? 'M' : 'F';
  const anioNac = 2005 + Math.floor(Math.random() * 4);
  const mesNac = Math.floor(Math.random() * 12) + 1;
  const diaNac = Math.floor(Math.random() * 28) + 1;

  // DNI segun pais
  let dni;
  if (sistema === 'AR') {
    dni = (40000000 + index).toString();
  } else {
    dni = `${sistema}-${anioNac}-${index.toString().padStart(4, '0')}`;
  }

  return {
    dni,
    nombre,
    apellido,
    fechaNacimiento: new Date(anioNac, mesNac - 1, diaNac),
    genero,
    email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${index}@student.${sistema.toLowerCase()}`,
    paisOrigen: sistema,
    sistemasEducativos: [{ sistema, fechaInicio: new Date('2020-09-01'), activo: true }],
    estado: 'activo'
  };
}

async function seedEstudiantes() {
  log.step(`Generando ${CONFIG.estudiantesPorPais * 4} estudiantes...`);

  const mapa = {};
  let totalInserted = 0;

  for (const sistema of CONFIG.sistemas) {
    const estudiantes = [];
    for (let i = 0; i < CONFIG.estudiantesPorPais; i++) {
      estudiantes.push(generarEstudiante(sistema, totalInserted + i));
    }

    // Insertar en batches
    for (let i = 0; i < estudiantes.length; i += CONFIG.batchSize) {
      const batch = estudiantes.slice(i, i + CONFIG.batchSize);
      await Estudiante.insertMany(batch, { ordered: false });
    }

    // Recuperar los insertados
    const insertados = await Estudiante.find({ paisOrigen: sistema });
    mapa[sistema] = insertados;
    totalInserted += insertados.length;
    log.info(`    ${sistema}: ${insertados.length} estudiantes`);
  }

  log.success(`  ${totalInserted} estudiantes insertados`);
  return mapa;
}

// ============================================
// Generacion de calificaciones
// ============================================
async function seedCalificaciones(estudiantesMap, materiasMap, institucionesMap) {
  log.step('Generando calificaciones...');

  let totalCalificaciones = 0;
  const startTime = Date.now();

  for (const sistema of CONFIG.sistemas) {
    const estudiantes = estudiantesMap[sistema] || [];
    const materias = materiasMap[sistema] || [];
    const instituciones = institucionesMap[sistema] || [];

    if (estudiantes.length === 0 || materias.length === 0 || instituciones.length === 0) {
      log.warn(`  ${sistema}: Sin datos suficientes`);
      continue;
    }

    const calificaciones = [];

    for (let i = 0; i < estudiantes.length; i++) {
      const estudiante = estudiantes[i];
      const institucion = instituciones[i % instituciones.length];

      // Crear una calificacion por cada materia
      for (const materia of materias) {
        const tipos = tiposEvaluacion[sistema];
        const tipoEvaluacion = tipos[Math.floor(Math.random() * tipos.length)];
        const valorOriginal = generadoresNota[sistema]();
        const calificacionId = uuidv4();
        const fechaEvaluacion = new Date(2024, Math.floor(Math.random() * 10) + 2, Math.floor(Math.random() * 28) + 1);
        const timestampRegistro = new Date();

        const dataToHash = JSON.stringify({
          calificacionId,
          estudianteId: estudiante._id.toString(),
          materiaId: materia._id.toString(),
          valorOriginal,
          fechaEvaluacion,
          timestampRegistro
        });
        const hashIntegridad = crypto.createHash('sha256').update(dataToHash).digest('hex');

        calificaciones.push({
          calificacionId,
          estudianteId: estudiante._id,
          materiaId: materia._id,
          institucionId: institucion._id,
          sistemaOrigen: sistema,
          cicloLectivo: { anio: 2024, periodo: 'anual' },
          valorOriginal,
          tipoEvaluacion,
          fechaEvaluacion,
          auditoria: {
            usuarioRegistro: 'seed-massive',
            ipRegistro: '127.0.0.1',
            timestampRegistro
          },
          hashIntegridad,
          observaciones: `Seed masivo - ${materia.nombre}`,
          estado: 'vigente'
        });

        // Insertar en batches
        if (calificaciones.length >= CONFIG.batchSize) {
          await Calificacion.insertMany(calificaciones, { ordered: false });
          totalCalificaciones += calificaciones.length;
          calificaciones.length = 0;

          // Mostrar progreso cada 5000
          if (totalCalificaciones % 5000 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const speed = Math.round(totalCalificaciones / parseFloat(elapsed));
            process.stdout.write(`\r  Progreso: ${totalCalificaciones.toLocaleString()} calificaciones (${speed}/s)    `);
          }
        }
      }
    }

    // Insertar restantes
    if (calificaciones.length > 0) {
      await Calificacion.insertMany(calificaciones, { ordered: false });
      totalCalificaciones += calificaciones.length;
    }
  }

  console.log(''); // Nueva linea despues del progreso
  log.success(`  ${totalCalificaciones.toLocaleString()} calificaciones insertadas`);

  // Mostrar resumen por sistema
  for (const sistema of CONFIG.sistemas) {
    const count = await Calificacion.countDocuments({ sistemaOrigen: sistema });
    log.info(`    ${sistema}: ${count.toLocaleString()} calificaciones`);
  }
}

// ============================================
// Sincronizacion con Neo4j
// ============================================
async function sincronizarNeo4j(estudiantesMap, materiasMap, institucionesMap) {
  log.step('Sincronizando con Neo4j...');

  const session = neo4jDriver.session();

  try {
    // Crear indices
    log.info('  Creando indices...');
    await session.run('CREATE INDEX IF NOT EXISTS FOR (e:Estudiante) ON (e.mongoId)');
    await session.run('CREATE INDEX IF NOT EXISTS FOR (i:Institucion) ON (i.mongoId)');
    await session.run('CREATE INDEX IF NOT EXISTS FOR (m:Materia) ON (m.mongoId)');
    await session.run('CREATE INDEX IF NOT EXISTS FOR (m:Materia) ON (m.area)');

    // Crear nodos de instituciones
    log.info('  Creando nodos de instituciones...');
    const instituciones = await Institucion.find({});
    for (const inst of instituciones) {
      await session.run(`
        CREATE (i:Institucion {
          mongoId: $mongoId,
          nombre: $nombre,
          sistema: $sistema,
          pais: $pais
        })
      `, {
        mongoId: inst._id.toString(),
        nombre: inst.nombre,
        sistema: inst.sistemaEducativo,
        pais: inst.pais
      });
    }
    log.success(`    ${instituciones.length} instituciones`);

    // Crear nodos de materias
    log.info('  Creando nodos de materias...');
    const materias = await Materia.find({});
    for (const mat of materias) {
      await session.run(`
        CREATE (m:Materia {
          mongoId: $mongoId,
          nombre: $nombre,
          codigo: $codigo,
          sistema: $sistema,
          area: $area
        })
      `, {
        mongoId: mat._id.toString(),
        nombre: mat.nombre,
        codigo: mat.codigo,
        sistema: mat.sistemaEducativo,
        area: mat.area || 'General'
      });
    }
    log.success(`    ${materias.length} materias`);

    // Crear nodos de estudiantes (en batches)
    log.info('  Creando nodos de estudiantes...');
    const estudiantes = await Estudiante.find({});
    let estCount = 0;

    for (const est of estudiantes) {
      await session.run(`
        CREATE (e:Estudiante {
          mongoId: $mongoId,
          nombre: $nombre,
          paisOrigen: $paisOrigen
        })
      `, {
        mongoId: est._id.toString(),
        nombre: est.nombreCompleto,
        paisOrigen: est.paisOrigen
      });
      estCount++;

      if (estCount % 1000 === 0) {
        process.stdout.write(`\r    Estudiantes creados: ${estCount.toLocaleString()}    `);
      }
    }
    console.log('');
    log.success(`    ${estCount} estudiantes`);

    // Crear relaciones ASISTIO
    log.info('  Creando relaciones ASISTIO...');
    const asistioResult = await session.run(`
      MATCH (e:Estudiante)
      MATCH (i:Institucion)
      WHERE e.paisOrigen = i.sistema
      WITH e, i, rand() as r
      ORDER BY r
      WITH e, collect(i)[0] as inst
      CREATE (e)-[:ASISTIO]->(inst)
      RETURN count(*) as total
    `);
    const asistioCount = asistioResult.records[0]?.get('total')?.toNumber() || 0;
    log.success(`    ${asistioCount} relaciones ASISTIO`);

    // Crear relaciones CURSO (simplificado: cada estudiante curso todas las materias de su sistema)
    log.info('  Creando relaciones CURSO...');
    const cursoResult = await session.run(`
      MATCH (e:Estudiante)
      MATCH (m:Materia)
      WHERE e.paisOrigen = m.sistema
      CREATE (e)-[:CURSO {anio: 2024}]->(m)
      RETURN count(*) as total
    `);
    const cursoCount = cursoResult.records[0]?.get('total')?.toNumber() || 0;
    log.success(`    ${cursoCount} relaciones CURSO`);

    // Crear equivalencias entre materias del mismo area en diferentes sistemas
    log.info('  Creando equivalencias entre materias...');
    const equivalenciasResult = await session.run(`
      MATCH (m1:Materia)
      MATCH (m2:Materia)
      WHERE m1.area = m2.area
        AND m1.sistema <> m2.sistema
        AND id(m1) < id(m2)
      CREATE (m1)-[:EQUIVALE {tipo: 'total', porcentaje: 100}]->(m2)
      CREATE (m2)-[:EQUIVALE {tipo: 'total', porcentaje: 100}]->(m1)
      RETURN count(*) as total
    `);
    const equivalenciasCount = equivalenciasResult.records[0]?.get('total')?.toNumber() || 0;
    log.success(`    ${equivalenciasCount} relaciones EQUIVALE`);

  } finally {
    await session.close();
  }
}

// ============================================
// Resumen final
// ============================================
async function mostrarResumen() {
  console.log('\n' + '='.repeat(60));
  log.success('SEED MASIVO COMPLETADO');
  console.log('='.repeat(60) + '\n');

  // MongoDB stats
  console.log('MongoDB:');
  const mongoStats = {
    instituciones: await Institucion.countDocuments(),
    materias: await Materia.countDocuments(),
    estudiantes: await Estudiante.countDocuments(),
    calificaciones: await Calificacion.countDocuments()
  };
  console.log(`  Instituciones:   ${mongoStats.instituciones}`);
  console.log(`  Materias:        ${mongoStats.materias}`);
  console.log(`  Estudiantes:     ${mongoStats.estudiantes.toLocaleString()}`);
  console.log(`  Calificaciones:  ${mongoStats.calificaciones.toLocaleString()}`);

  // Distribucion por sistema
  console.log('\nDistribucion por sistema:');
  for (const sistema of CONFIG.sistemas) {
    const inst = await Institucion.countDocuments({ sistemaEducativo: sistema });
    const mat = await Materia.countDocuments({ sistemaEducativo: sistema });
    const est = await Estudiante.countDocuments({ paisOrigen: sistema });
    const cal = await Calificacion.countDocuments({ sistemaOrigen: sistema });
    console.log(`  ${sistema}: ${inst} inst, ${mat} mat, ${est.toLocaleString()} est, ${cal.toLocaleString()} cal`);
  }

  // Neo4j stats
  if (neo4jDriver) {
    const session = neo4jDriver.session();
    try {
      const stats = await session.run(`
        MATCH (e:Estudiante) WITH count(e) as estudiantes
        MATCH (i:Institucion) WITH estudiantes, count(i) as instituciones
        MATCH (m:Materia) WITH estudiantes, instituciones, count(m) as materias
        MATCH ()-[c:CURSO]->() WITH estudiantes, instituciones, materias, count(c) as cursos
        MATCH ()-[a:ASISTIO]->() WITH estudiantes, instituciones, materias, cursos, count(a) as asistencias
        MATCH ()-[eq:EQUIVALE]->() WITH estudiantes, instituciones, materias, cursos, asistencias, count(eq) as equivalencias
        RETURN estudiantes, instituciones, materias, cursos, asistencias, equivalencias
      `);

      if (stats.records.length > 0) {
        const record = stats.records[0];
        console.log('\nNeo4j:');
        console.log(`  Estudiantes:   ${record.get('estudiantes')}`);
        console.log(`  Instituciones: ${record.get('instituciones')}`);
        console.log(`  Materias:      ${record.get('materias')}`);
        console.log(`  Rel CURSO:     ${record.get('cursos')}`);
        console.log(`  Rel ASISTIO:   ${record.get('asistencias')}`);
        console.log(`  Rel EQUIVALE:  ${record.get('equivalencias')}`);
      }
    } finally {
      await session.close();
    }
  }

  console.log('\n');
}

// ============================================
// Funcion principal
// ============================================
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  EDUGRADE GLOBAL - SEED MASIVO (TPO)');
  console.log('  50,000 estudiantes | 40 instituciones | 40 materias');
  console.log('  500,000 calificaciones | Neo4j sync');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();

  try {
    // Conectar a bases de datos
    await connectMongoDB();
    connectNeo4j();

    // Limpiar datos existentes
    await limpiarColecciones();
    await limpiarNeo4j();

    // Insertar datos en orden (respetando dependencias)
    const institucionesMap = await seedInstituciones();
    const materiasMap = await seedMaterias();
    const estudiantesMap = await seedEstudiantes();
    await seedCalificaciones(estudiantesMap, materiasMap, institucionesMap);

    // Sincronizar con Neo4j
    await sincronizarNeo4j(estudiantesMap, materiasMap, institucionesMap);

    // Mostrar resumen
    await mostrarResumen();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`Tiempo total: ${duration}s`);

  } catch (error) {
    log.error(`Error durante el seed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await neo4jDriver?.close();
    log.info('Conexiones cerradas');
  }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n');
  log.warn('Proceso interrumpido por el usuario');
  try {
    await mongoose.disconnect();
    await neo4jDriver?.close();
  } catch (e) {
    // Ignore
  }
  process.exit(0);
});

// Ejecutar
main();
