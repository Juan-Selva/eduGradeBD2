#!/usr/bin/env node

/**
 * Script para asignar instituciones a estudiantes existentes
 *
 * Asigna una institucion del mismo sistema educativo a cada estudiante
 * usando distribucion round-robin para balancear la carga
 *
 * Uso: node src/scripts/assignInstitutions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');

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

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';
  log.info(`Conectando a MongoDB: ${uri.split('@').pop() || uri}`);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });

  log.success('MongoDB conectado');
}

async function assignInstitutions() {
  log.step('Obteniendo instituciones por sistema educativo...');

  // Obtener todas las instituciones agrupadas por sistema
  const instituciones = await Institucion.find({ estado: 'activa' });
  const institucionesPorSistema = {};

  for (const inst of instituciones) {
    if (!institucionesPorSistema[inst.sistemaEducativo]) {
      institucionesPorSistema[inst.sistemaEducativo] = [];
    }
    institucionesPorSistema[inst.sistemaEducativo].push(inst);
  }

  // Mostrar distribucion
  for (const [sistema, insts] of Object.entries(institucionesPorSistema)) {
    log.info(`  ${sistema}: ${insts.length} instituciones`);
  }

  log.step('Asignando instituciones a estudiantes...');

  const sistemas = ['UK', 'US', 'DE', 'AR'];
  let totalActualizados = 0;

  for (const sistema of sistemas) {
    const instituciones = institucionesPorSistema[sistema] || [];

    if (instituciones.length === 0) {
      log.warn(`  ${sistema}: No hay instituciones disponibles`);
      continue;
    }

    // Obtener estudiantes de este sistema sin institucion asignada
    const estudiantes = await Estudiante.find({
      paisOrigen: sistema,
      $or: [
        { institucionId: { $exists: false } },
        { institucionId: null }
      ]
    });

    if (estudiantes.length === 0) {
      log.info(`  ${sistema}: Todos los estudiantes ya tienen institucion`);
      continue;
    }

    log.info(`  ${sistema}: Asignando institucion a ${estudiantes.length} estudiantes...`);

    // Asignar usando round-robin
    const bulkOps = estudiantes.map((est, index) => {
      const institucion = instituciones[index % instituciones.length];
      return {
        updateOne: {
          filter: { _id: est._id },
          update: { $set: { institucionId: institucion._id } }
        }
      };
    });

    // Ejecutar en batches de 1000
    const batchSize = 1000;
    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const batch = bulkOps.slice(i, i + batchSize);
      const result = await Estudiante.bulkWrite(batch);
      totalActualizados += result.modifiedCount;

      if (bulkOps.length > batchSize) {
        log.info(`    Progreso: ${Math.min(i + batchSize, bulkOps.length)}/${bulkOps.length}`);
      }
    }

    log.success(`  ${sistema}: ${estudiantes.length} estudiantes actualizados`);
  }

  return totalActualizados;
}

async function verificarAsignaciones() {
  log.step('Verificando asignaciones...');

  const sistemas = ['UK', 'US', 'DE', 'AR'];

  for (const sistema of sistemas) {
    const total = await Estudiante.countDocuments({ paisOrigen: sistema });
    const conInstitucion = await Estudiante.countDocuments({
      paisOrigen: sistema,
      institucionId: { $exists: true, $ne: null }
    });
    const sinInstitucion = total - conInstitucion;

    if (sinInstitucion === 0) {
      log.success(`  ${sistema}: ${conInstitucion}/${total} estudiantes con institucion`);
    } else {
      log.warn(`  ${sistema}: ${sinInstitucion} estudiantes sin institucion`);
    }
  }

  // Mostrar distribucion de estudiantes por institucion (top 5 por sistema)
  console.log('\nDistribucion de estudiantes por institucion:');

  for (const sistema of sistemas) {
    const distribucion = await Estudiante.aggregate([
      { $match: { paisOrigen: sistema, institucionId: { $exists: true } } },
      { $group: { _id: '$institucionId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'institucions',
          localField: '_id',
          foreignField: '_id',
          as: 'institucion'
        }
      },
      { $unwind: '$institucion' },
      { $project: { nombre: '$institucion.nombreCorto', count: 1 } }
    ]);

    if (distribucion.length > 0) {
      const resumen = distribucion.map(d => `${d.nombre}: ${d.count}`).join(', ');
      log.info(`  ${sistema}: ${resumen}...`);
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  ASIGNAR INSTITUCIONES A ESTUDIANTES');
  console.log('='.repeat(50) + '\n');

  const startTime = Date.now();

  try {
    await connectDB();

    const actualizados = await assignInstitutions();

    console.log('\n');
    await verificarAsignaciones();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(50));
    log.success(`Completado: ${actualizados} estudiantes actualizados en ${duration}s`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    log.error(`Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log.info('Conexion cerrada');
  }
}

main();
