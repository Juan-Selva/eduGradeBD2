#!/usr/bin/env node

/**
 * Script de Seed Principal - Mejorado
 * Carga datos iniciales para desarrollo y demo
 *
 * Genera datos coherentes donde:
 * - Cada estudiante se asigna a una institucion de su mismo pais/sistema educativo
 * - Las materias se vinculan segun el sistema educativo de la institucion
 * - Las calificaciones se generan con el formato correcto de cada pais
 *
 * Uso: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Modelos
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');
const Materia = require('../models/Materia');
const Calificacion = require('../models/Calificacion');

// Datos de seed
const institucionesData = require('./seeds/instituciones.seed');
const materiasData = require('./seeds/materias.seed');
const estudiantesData = require('./seeds/estudiantes.seed');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}[STEP]${colors.reset} ${msg}`)
};

// ============================================
// Funciones de generacion de notas por pais
// ============================================

/**
 * UK: A*, A, B, C, D, E, F con puntos UCAS
 */
function generarNotaUK() {
  const letras = ['A*', 'A', 'B', 'C', 'D', 'E'];
  const idx = Math.floor(Math.random() * letras.length);
  const letra = letras[idx];
  const puntosUCAS = { 'A*': 56, 'A': 48, 'B': 40, 'C': 32, 'D': 24, 'E': 16 };
  return {
    uk: {
      letra,
      puntos: puntosUCAS[letra],
      numerico: 9 - idx // A*=9, A=8, B=7, etc.
    }
  };
}

/**
 * US: A-F con GPA y porcentaje
 */
function generarNotaUS() {
  const porcentaje = Math.floor(Math.random() * 41) + 60; // 60-100
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

  return {
    us: {
      letra,
      porcentaje,
      gpa
    }
  };
}

/**
 * DE: 1.0-6.0 (1=mejor, 4=aprueba)
 */
function generarNotaDE() {
  // Generar nota entre 1.0 y 4.0 (mayoria aprobados)
  const nota = parseFloat((Math.random() * 3 + 1).toFixed(1));
  // Puntos alemanes (0-15 escala Oberstufe)
  const puntos = Math.round((6 - nota) * 2.5);
  // Tendencia: + (mejor), '' (sin tendencia), - (peor) - segun el enum del modelo
  const tendencias = ['+', '', '-'];
  const tendencia = tendencias[Math.floor(Math.random() * tendencias.length)];

  return {
    de: {
      nota,
      puntos: Math.max(0, Math.min(15, puntos)),
      tendencia
    }
  };
}

/**
 * AR: 1-10 (4=aprueba)
 */
function generarNotaAR() {
  // Generar nota entre 4 y 10 (mayoria aprobados)
  const nota = Math.floor(Math.random() * 7) + 4; // 4-10
  // Instancias segun el enum del modelo: 'regular', 'diciembre', 'febrero', 'libre'
  const instancias = ['regular', 'diciembre', 'febrero', 'libre'];
  const instancia = instancias[Math.floor(Math.random() * instancias.length)];

  return {
    ar: {
      nota,
      aprobado: nota >= 4,
      instancia
    }
  };
}

const generadoresNota = {
  UK: generarNotaUK,
  US: generarNotaUS,
  DE: generarNotaDE,
  AR: generarNotaAR
};

const tiposEvaluacion = {
  UK: ['coursework', 'exam', 'modulo'],
  US: ['quiz', 'midterm', 'assignment', 'final'],
  DE: ['parcial', 'trabajo_practico', 'final'],
  AR: ['parcial', 'trabajo_practico', 'final', 'recuperatorio']
};

/**
 * Conectar a MongoDB
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';
  log.info(`Conectando a MongoDB: ${uri.split('@').pop() || uri}`);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });

  log.success('MongoDB conectado');
}

/**
 * Limpiar colecciones existentes
 */
async function limpiarColecciones() {
  log.step('Limpiando colecciones existentes...');

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

  log.success('Colecciones limpiadas');
}

/**
 * Insertar instituciones y retornar mapa por sistema
 */
async function seedInstituciones() {
  log.step('Insertando instituciones...');

  const instituciones = await Institucion.insertMany(institucionesData);

  log.success(`  ${instituciones.length} instituciones insertadas`);

  // Crear mapa: {UK: [inst1, inst2], US: [...], DE: [...], AR: [...]}
  const mapa = {};
  for (const inst of instituciones) {
    if (!mapa[inst.sistemaEducativo]) mapa[inst.sistemaEducativo] = [];
    mapa[inst.sistemaEducativo].push(inst);
  }

  // Mostrar distribucion
  for (const [sistema, insts] of Object.entries(mapa)) {
    log.info(`    ${sistema}: ${insts.map(i => i.nombreCorto).join(', ')}`);
  }

  return mapa;
}

/**
 * Insertar materias y retornar mapa por sistema
 */
async function seedMaterias() {
  log.step('Insertando materias...');

  const materias = await Materia.insertMany(materiasData);

  log.success(`  ${materias.length} materias insertadas`);

  // Crear mapa: {UK: [mat1...mat5], US: [...], DE: [...], AR: [...]}
  const mapa = {};
  for (const mat of materias) {
    if (!mapa[mat.sistemaEducativo]) mapa[mat.sistemaEducativo] = [];
    mapa[mat.sistemaEducativo].push(mat);
  }

  // Mostrar distribucion
  for (const [sistema, mats] of Object.entries(mapa)) {
    log.info(`    ${sistema}: ${mats.length} materias`);
  }

  return mapa;
}

/**
 * Insertar estudiantes y retornar mapa por sistema
 */
async function seedEstudiantes() {
  log.step('Insertando estudiantes...');

  const estudiantes = await Estudiante.insertMany(estudiantesData);

  log.success(`  ${estudiantes.length} estudiantes insertados`);

  // Crear mapa: {UK: [est1...est10], US: [...], DE: [...], AR: [...]}
  const mapa = {};
  for (const est of estudiantes) {
    if (!mapa[est.paisOrigen]) mapa[est.paisOrigen] = [];
    mapa[est.paisOrigen].push(est);
  }

  // Mostrar distribucion
  for (const [sistema, ests] of Object.entries(mapa)) {
    log.info(`    ${sistema}: ${ests.length} estudiantes`);
  }

  return mapa;
}

/**
 * Generar calificaciones con logica mejorada
 * - Cada estudiante se asigna a UNA institucion de su sistema (round-robin)
 * - Se generan calificaciones para todas las materias del sistema
 * - Las notas tienen el formato correcto del pais
 */
async function seedCalificaciones(estudiantesMap, materiasMap, institucionesMap) {
  log.step('Generando calificaciones...');

  const sistemas = ['UK', 'US', 'DE', 'AR'];
  const calificaciones = [];
  const asignacionEstudiantes = {}; // Para tracking de asignaciones

  for (const sistema of sistemas) {
    const estudiantes = estudiantesMap[sistema] || [];
    const materias = materiasMap[sistema] || [];
    const instituciones = institucionesMap[sistema] || [];

    if (estudiantes.length === 0 || materias.length === 0 || instituciones.length === 0) {
      log.warn(`  ${sistema}: Sin datos suficientes para generar calificaciones`);
      continue;
    }

    asignacionEstudiantes[sistema] = {};

    // Para cada estudiante del sistema
    for (let i = 0; i < estudiantes.length; i++) {
      const estudiante = estudiantes[i];

      // Asignar institucion usando round-robin
      const institucion = instituciones[i % instituciones.length];
      asignacionEstudiantes[sistema][estudiante._id.toString()] = institucion.nombreCorto;

      // Crear calificaciones para cada materia del sistema
      for (let j = 0; j < materias.length; j++) {
        const materia = materias[j];
        const tipos = tiposEvaluacion[sistema];
        const tipoEvaluacion = tipos[Math.floor(Math.random() * tipos.length)];

        // Generar nota con formato correcto del pais
        const valorOriginal = generadoresNota[sistema]();
        const calificacionId = uuidv4();
        const fechaEvaluacion = new Date(2024, j + 2, 15);
        const timestampRegistro = new Date();

        // Generar hash de integridad (mismo algoritmo que el modelo)
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
          cicloLectivo: {
            anio: 2024,
            periodo: 'anual'
          },
          valorOriginal,
          tipoEvaluacion,
          fechaEvaluacion,
          auditoria: {
            usuarioRegistro: 'seed-system',
            ipRegistro: '127.0.0.1',
            timestampRegistro
          },
          hashIntegridad,
          observaciones: `Calificacion de seed - ${materia.nombre}`,
          estado: 'vigente'
        });
      }
    }
  }

  // Insertar por batches para mejor rendimiento
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < calificaciones.length; i += batchSize) {
    const batch = calificaciones.slice(i, i + batchSize);
    await Calificacion.insertMany(batch);
    inserted += batch.length;
  }

  log.success(`  ${inserted} calificaciones insertadas`);

  // Mostrar resumen por sistema
  const resumen = {};
  calificaciones.forEach(c => {
    resumen[c.sistemaOrigen] = (resumen[c.sistemaOrigen] || 0) + 1;
  });

  for (const [sistema, count] of Object.entries(resumen)) {
    log.info(`    ${sistema}: ${count} calificaciones`);
  }

  // Mostrar distribucion estudiante-institucion
  console.log('\n  Asignacion estudiantes a instituciones:');
  for (const [sistema, asignaciones] of Object.entries(asignacionEstudiantes)) {
    const conteo = {};
    for (const institucion of Object.values(asignaciones)) {
      conteo[institucion] = (conteo[institucion] || 0) + 1;
    }
    const distribucion = Object.entries(conteo).map(([inst, n]) => `${inst}: ${n}`).join(', ');
    log.info(`    ${sistema}: ${distribucion}`);
  }
}

/**
 * Mostrar resumen final
 */
async function mostrarResumen() {
  console.log('\n' + '='.repeat(50));
  log.success('SEED COMPLETADO');
  console.log('='.repeat(50) + '\n');

  const stats = {
    instituciones: await Institucion.countDocuments(),
    materias: await Materia.countDocuments(),
    estudiantes: await Estudiante.countDocuments(),
    calificaciones: await Calificacion.countDocuments()
  };

  console.log('Resumen de datos:');
  console.log(`  Instituciones:   ${stats.instituciones}`);
  console.log(`  Materias:        ${stats.materias}`);
  console.log(`  Estudiantes:     ${stats.estudiantes}`);
  console.log(`  Calificaciones:  ${stats.calificaciones}`);
  console.log('\n');

  // Distribucion por sistema educativo
  console.log('Distribucion por sistema educativo:');
  const sistemas = ['UK', 'US', 'DE', 'AR'];

  for (const sistema of sistemas) {
    const inst = await Institucion.countDocuments({ sistemaEducativo: sistema });
    const mat = await Materia.countDocuments({ sistemaEducativo: sistema });
    const est = await Estudiante.countDocuments({ paisOrigen: sistema });
    const cal = await Calificacion.countDocuments({ sistemaOrigen: sistema });

    console.log(`  ${sistema}: ${inst} inst, ${mat} mat, ${est} est, ${cal} cal`);
  }

  console.log('\n');

  // Verificacion de coherencia
  console.log('Verificacion de coherencia:');
  for (const sistema of sistemas) {
    // Verificar que todas las calificaciones de un sistema tengan institucion del mismo sistema
    const calConInstIncorrecta = await Calificacion.aggregate([
      { $match: { sistemaOrigen: sistema } },
      { $lookup: {
          from: 'institucions',
          localField: 'institucionId',
          foreignField: '_id',
          as: 'institucion'
      }},
      { $unwind: '$institucion' },
      { $match: { 'institucion.sistemaEducativo': { $ne: sistema } } },
      { $count: 'total' }
    ]);

    const incorrectas = calConInstIncorrecta[0]?.total || 0;
    if (incorrectas === 0) {
      log.success(`  ${sistema}: Todas las calificaciones vinculadas correctamente`);
    } else {
      log.error(`  ${sistema}: ${incorrectas} calificaciones con institucion incorrecta`);
    }
  }

  console.log('\n');
}

/**
 * Funcion principal
 */
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  EDUGRADE GLOBAL - SEED DATA (MEJORADO)');
  console.log('='.repeat(50) + '\n');

  const startTime = Date.now();

  try {
    // Conectar a base de datos
    await connectDB();

    // Limpiar datos existentes
    await limpiarColecciones();

    // Insertar datos en orden (respetando dependencias)
    const institucionesMap = await seedInstituciones();
    const materiasMap = await seedMaterias();
    const estudiantesMap = await seedEstudiantes();
    await seedCalificaciones(estudiantesMap, materiasMap, institucionesMap);

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
    log.info('Conexion cerrada');
  }
}

// Ejecutar
main();
