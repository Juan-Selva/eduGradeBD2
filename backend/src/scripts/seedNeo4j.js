#!/usr/bin/env node

/**
 * Script de Seed para Neo4j
 * Sincroniza datos de MongoDB a Neo4j y crea equivalencias de prueba
 *
 * Uso: npm run seed:neo4j
 */

require('dotenv').config();
const mongoose = require('mongoose');
const neo4j = require('neo4j-driver');
const logger = require('../utils/logger');

// Modelos MongoDB
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');
const Materia = require('../models/Materia');
const Calificacion = require('../models/Calificacion');

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

let neo4jDriver;

/**
 * Conectar a MongoDB
 */
async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';
  log.info(`Conectando a MongoDB: ${uri.split('@').pop() || uri}`);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });

  log.success('MongoDB conectado');
}

/**
 * Conectar a Neo4j
 */
function connectNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  log.info(`Conectando a Neo4j: ${uri}`);

  neo4jDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  log.success('Neo4j driver creado');
}

/**
 * Limpiar Neo4j
 */
async function limpiarNeo4j() {
  log.step('Limpiando Neo4j...');

  const session = neo4jDriver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    log.success('Todos los nodos y relaciones eliminados');
  } finally {
    await session.close();
  }
}

/**
 * Crear nodos de Instituciones
 */
async function crearNodosInstituciones() {
  log.step('Creando nodos de Instituciones...');

  const instituciones = await Institucion.find({});
  const session = neo4jDriver.session();

  try {
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
    log.success(`${instituciones.length} instituciones creadas en Neo4j`);
  } finally {
    await session.close();
  }

  return instituciones;
}

/**
 * Crear nodos de Materias
 */
async function crearNodosMaterias() {
  log.step('Creando nodos de Materias...');

  const materias = await Materia.find({});
  const session = neo4jDriver.session();

  try {
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
    log.success(`${materias.length} materias creadas en Neo4j`);
  } finally {
    await session.close();
  }

  return materias;
}

/**
 * Crear nodos de Estudiantes
 */
async function crearNodosEstudiantes() {
  log.step('Creando nodos de Estudiantes...');

  const estudiantes = await Estudiante.find({});
  const session = neo4jDriver.session();

  try {
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
    }
    log.success(`${estudiantes.length} estudiantes creados en Neo4j`);
  } finally {
    await session.close();
  }

  return estudiantes;
}

/**
 * Crear relaciones ASISTIO (Estudiante -> Institucion)
 */
async function crearRelacionesAsistio() {
  log.step('Creando relaciones ASISTIO...');

  const calificaciones = await Calificacion.find({}).distinct('estudianteId');
  const session = neo4jDriver.session();
  let count = 0;

  try {
    for (const estId of calificaciones) {
      // Obtener instituciones unicas del estudiante
      const instituciones = await Calificacion.find({ estudianteId: estId }).distinct('institucionId');

      for (const instId of instituciones) {
        const result = await session.run(`
          MATCH (e:Estudiante {mongoId: $estId})
          MATCH (i:Institucion {mongoId: $instId})
          MERGE (e)-[r:ASISTIO]->(i)
          RETURN r
        `, {
          estId: estId.toString(),
          instId: instId.toString()
        });

        if (result.records.length > 0) count++;
      }
    }
    log.success(`${count} relaciones ASISTIO creadas`);
  } finally {
    await session.close();
  }
}

/**
 * Crear relaciones CURSO (Estudiante -> Materia)
 */
async function crearRelacionesCurso() {
  log.step('Creando relaciones CURSO...');

  const calificaciones = await Calificacion.find({})
    .populate('materiaId')
    .limit(500); // Limitar para evitar sobrecarga

  const session = neo4jDriver.session();
  let count = 0;

  try {
    // Agrupar por estudiante-materia para evitar duplicados
    const cursosUnicos = new Set();

    for (const cal of calificaciones) {
      const key = `${cal.estudianteId}-${cal.materiaId?._id}`;
      if (cursosUnicos.has(key)) continue;
      cursosUnicos.add(key);

      const result = await session.run(`
        MATCH (e:Estudiante {mongoId: $estId})
        MATCH (m:Materia {mongoId: $matId})
        MERGE (e)-[r:CURSO {
          calificacion: $nota,
          sistema: $sistema,
          anio: $anio
        }]->(m)
        RETURN r
      `, {
        estId: cal.estudianteId.toString(),
        matId: cal.materiaId?._id?.toString() || '',
        nota: cal.valorOriginal?.ar?.nota || cal.valorOriginal?.us?.gpa || cal.valorOriginal?.de?.nota || cal.valorOriginal?.uk?.numerico || 0,
        sistema: cal.sistemaOrigen,
        anio: cal.cicloLectivo?.anio || 2024
      });

      if (result.records.length > 0) count++;
    }
    log.success(`${count} relaciones CURSO creadas`);
  } finally {
    await session.close();
  }
}

/**
 * Crear equivalencias de ejemplo entre materias de diferentes sistemas
 */
async function crearEquivalenciasEjemplo() {
  log.step('Creando equivalencias de ejemplo...');

  const session = neo4jDriver.session();

  // Definir equivalencias por area/nombre similar
  const equivalenciasBase = [
    // Matematicas
    { nombreOrigen: 'Mathematics', nombreDestino: 'Matematica I', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Mathematics', nombreDestino: 'Mathematik', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Calculus', nombreDestino: 'Matematica II', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Calculus', nombreDestino: 'Analisis Matematico', tipo: 'total', porcentaje: 100 },

    // Ciencias
    { nombreOrigen: 'Physics', nombreDestino: 'Fisica I', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Physics', nombreDestino: 'Physik', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Chemistry', nombreDestino: 'Quimica General', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Chemistry', nombreDestino: 'Chemie', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Biology', nombreDestino: 'Biologia', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Biology', nombreDestino: 'Biologie', tipo: 'total', porcentaje: 100 },

    // Idiomas
    { nombreOrigen: 'English Language', nombreDestino: 'Ingles I', tipo: 'parcial', porcentaje: 80 },
    { nombreOrigen: 'English Literature', nombreDestino: 'Literatura', tipo: 'parcial', porcentaje: 70 },

    // Historia
    { nombreOrigen: 'History', nombreDestino: 'Historia', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'History', nombreDestino: 'Geschichte', tipo: 'total', porcentaje: 100 },

    // Economia
    { nombreOrigen: 'Economics', nombreDestino: 'Economia', tipo: 'total', porcentaje: 100 },
    { nombreOrigen: 'Economics', nombreDestino: 'Wirtschaft', tipo: 'total', porcentaje: 100 },

    // Informatica
    { nombreOrigen: 'Computer Science', nombreDestino: 'Programacion I', tipo: 'parcial', porcentaje: 75 },
    { nombreOrigen: 'Computer Science', nombreDestino: 'Informatik', tipo: 'total', porcentaje: 100 },
  ];

  let count = 0;

  try {
    for (const eq of equivalenciasBase) {
      // Intentar crear la equivalencia si ambas materias existen
      const result = await session.run(`
        MATCH (m1:Materia)
        MATCH (m2:Materia)
        WHERE m1.nombre CONTAINS $nombreOrigen AND m2.nombre CONTAINS $nombreDestino
        AND m1.sistema <> m2.sistema
        MERGE (m1)-[eq:EQUIVALE {tipo: $tipo, porcentaje: $porcentaje}]->(m2)
        RETURN eq
      `, {
        nombreOrigen: eq.nombreOrigen,
        nombreDestino: eq.nombreDestino,
        tipo: eq.tipo,
        porcentaje: eq.porcentaje
      });

      count += result.records.length;
    }

    // Tambien crear equivalencias bidireccionales entre sistemas similares
    await session.run(`
      MATCH (m1:Materia)-[eq:EQUIVALE]->(m2:Materia)
      WHERE NOT EXISTS((m2)-[:EQUIVALE]->(m1))
      CREATE (m2)-[:EQUIVALE {tipo: eq.tipo, porcentaje: eq.porcentaje}]->(m1)
    `);

    const totalResult = await session.run(`
      MATCH ()-[eq:EQUIVALE]->()
      RETURN count(eq) as total
    `);

    const total = totalResult.records[0]?.get('total')?.toNumber() || 0;
    log.success(`${total} equivalencias creadas en Neo4j`);
  } finally {
    await session.close();
  }
}

/**
 * Crear indices para mejor rendimiento
 */
async function crearIndices() {
  log.step('Creando indices...');

  const session = neo4jDriver.session();

  try {
    await session.run('CREATE INDEX IF NOT EXISTS FOR (e:Estudiante) ON (e.mongoId)');
    await session.run('CREATE INDEX IF NOT EXISTS FOR (i:Institucion) ON (i.mongoId)');
    await session.run('CREATE INDEX IF NOT EXISTS FOR (m:Materia) ON (m.mongoId)');
    await session.run('CREATE INDEX IF NOT EXISTS FOR (m:Materia) ON (m.sistema)');
    log.success('Indices creados');
  } finally {
    await session.close();
  }
}

/**
 * Mostrar estadisticas
 */
async function mostrarEstadisticas() {
  const session = neo4jDriver.session();

  try {
    console.log('\n' + '='.repeat(50));
    log.success('SEED NEO4J COMPLETADO');
    console.log('='.repeat(50) + '\n');

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
      console.log('Estadisticas Neo4j:');
      console.log(`  Estudiantes:   ${record.get('estudiantes')}`);
      console.log(`  Instituciones: ${record.get('instituciones')}`);
      console.log(`  Materias:      ${record.get('materias')}`);
      console.log(`  Rel CURSO:     ${record.get('cursos')}`);
      console.log(`  Rel ASISTIO:   ${record.get('asistencias')}`);
      console.log(`  Rel EQUIVALE:  ${record.get('equivalencias')}`);
    }

    console.log('\n');
  } finally {
    await session.close();
  }
}

/**
 * Funcion principal
 */
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('  EDUGRADE GLOBAL - SEED NEO4J');
  console.log('='.repeat(50) + '\n');

  const startTime = Date.now();

  try {
    // Conectar a las bases de datos
    await connectMongoDB();
    connectNeo4j();

    // Limpiar Neo4j
    await limpiarNeo4j();

    // Crear indices
    await crearIndices();

    // Crear nodos
    await crearNodosInstituciones();
    await crearNodosMaterias();
    await crearNodosEstudiantes();

    // Crear relaciones
    await crearRelacionesAsistio();
    await crearRelacionesCurso();
    await crearEquivalenciasEjemplo();

    // Mostrar estadisticas
    await mostrarEstadisticas();

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

// Ejecutar
main();
