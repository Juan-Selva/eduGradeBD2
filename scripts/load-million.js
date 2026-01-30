/**
 * Script de carga masiva - 1 Millon de Calificaciones
 * EduGrade Global
 *
 * Uso: node scripts/load-million.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Configuracion
const TOTAL_CALIFICACIONES = 1000000;
const BATCH_SIZE = 5000;
const TOTAL_ESTUDIANTES = 50000;
const TOTAL_MATERIAS = 200;
const TOTAL_INSTITUCIONES = 100;

// Datos de ejemplo
const SISTEMAS = ['UK', 'US', 'DE', 'AR'];
const TIPOS_EVALUACION = ['parcial', 'final', 'recuperatorio', 'trabajo_practico'];
const NOMBRES = ['Juan', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Laura', 'Diego', 'Sofia', 'Martin', 'Lucia'];
const APELLIDOS = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Romero', 'Torres', 'Diaz'];
const MATERIAS_BASE = ['Matematica', 'Fisica', 'Quimica', 'Historia', 'Literatura', 'Ingles', 'Biologia', 'Geografia', 'Arte', 'Musica'];

// Esquemas simplificados para carga masiva
const estudianteSchema = new mongoose.Schema({
  dni: { type: String, unique: true },
  nombre: String,
  apellido: String,
  fechaNacimiento: Date,
  paisOrigen: String,
  estado: { type: String, default: 'activo' }
}, { timestamps: true });

const institucionSchema = new mongoose.Schema({
  codigo: { type: String, unique: true },
  nombre: String,
  tipo: String,
  sistemaEducativo: String,
  pais: String,
  estado: { type: String, default: 'activa' }
}, { timestamps: true });

const materiaSchema = new mongoose.Schema({
  codigo: String,
  nombre: String,
  sistemaEducativo: String,
  nivel: String,
  area: String,
  estado: { type: String, default: 'activa' }
}, { timestamps: true });

const calificacionSchema = new mongoose.Schema({
  calificacionId: { type: String, default: () => uuidv4() },
  estudianteId: mongoose.Schema.Types.ObjectId,
  materiaId: mongoose.Schema.Types.ObjectId,
  institucionId: mongoose.Schema.Types.ObjectId,
  sistemaOrigen: String,
  cicloLectivo: { anio: Number, periodo: String },
  valorOriginal: mongoose.Schema.Types.Mixed,
  tipoEvaluacion: String,
  fechaEvaluacion: Date,
  fechaRegistro: { type: Date, default: Date.now },
  auditoria: {
    usuarioRegistro: String,
    timestampRegistro: { type: Date, default: Date.now }
  },
  hashIntegridad: String,
  version: { type: Number, default: 1 },
  estado: { type: String, default: 'vigente' }
}, { timestamps: true });

const Estudiante = mongoose.model('Estudiante', estudianteSchema);
const Institucion = mongoose.model('Institucion', institucionSchema);
const Materia = mongoose.model('Materia', materiaSchema);
const Calificacion = mongoose.model('Calificacion', calificacionSchema);

// Funciones auxiliares
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generar valor de calificacion segun sistema
function generarValorOriginal(sistema) {
  switch (sistema) {
    case 'UK':
      const letrasUK = ['A*', 'A', 'B', 'C', 'D', 'E', 'F'];
      return { uk: { letra: randomElement(letrasUK), puntos: randomInt(0, 56) } };

    case 'US':
      const letrasUS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
      const gpa = Math.round((Math.random() * 4) * 100) / 100;
      return { us: { letra: randomElement(letrasUS), gpa, porcentaje: randomInt(0, 100) } };

    case 'DE':
      const nota = Math.round((1 + Math.random() * 5) * 10) / 10;
      return { de: { nota: Math.min(6, Math.max(1, nota)) } };

    case 'AR':
      const notaAR = randomInt(1, 10);
      return { ar: { nota: notaAR, aprobado: notaAR >= 4 } };

    default:
      return {};
  }
}

// Generar hash de integridad
function generarHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Crear estudiantes
async function crearEstudiantes() {
  console.log(`Creando ${TOTAL_ESTUDIANTES} estudiantes...`);
  const estudiantes = [];

  for (let i = 0; i < TOTAL_ESTUDIANTES; i++) {
    estudiantes.push({
      dni: `${randomInt(10000000, 99999999)}`,
      nombre: randomElement(NOMBRES),
      apellido: randomElement(APELLIDOS),
      fechaNacimiento: randomDate(new Date(1990, 0, 1), new Date(2010, 0, 1)),
      paisOrigen: randomElement(SISTEMAS)
    });
  }

  // Insertar en batches
  for (let i = 0; i < estudiantes.length; i += BATCH_SIZE) {
    const batch = estudiantes.slice(i, i + BATCH_SIZE);
    try {
      await Estudiante.insertMany(batch, { ordered: false });
    } catch (e) {
      // Ignorar duplicados
    }
    process.stdout.write(`\rEstudiantes: ${Math.min(i + BATCH_SIZE, estudiantes.length)}/${estudiantes.length}`);
  }
  console.log('\nEstudiantes creados.');

  return await Estudiante.find().select('_id paisOrigen').lean();
}

// Crear instituciones
async function crearInstituciones() {
  console.log(`Creando ${TOTAL_INSTITUCIONES} instituciones...`);
  const instituciones = [];
  const tipos = ['primaria', 'secundaria', 'universidad'];

  for (let i = 0; i < TOTAL_INSTITUCIONES; i++) {
    const sistema = randomElement(SISTEMAS);
    instituciones.push({
      codigo: `INST-${sistema}-${String(i).padStart(4, '0')}`,
      nombre: `Institucion ${sistema} ${i}`,
      tipo: randomElement(tipos),
      sistemaEducativo: sistema,
      pais: sistema
    });
  }

  await Institucion.insertMany(instituciones, { ordered: false });
  console.log('Instituciones creadas.');

  return await Institucion.find().select('_id sistemaEducativo').lean();
}

// Crear materias
async function crearMaterias() {
  console.log(`Creando ${TOTAL_MATERIAS} materias...`);
  const materias = [];
  const niveles = ['basico', 'intermedio', 'avanzado'];

  for (const sistema of SISTEMAS) {
    for (let i = 0; i < TOTAL_MATERIAS / SISTEMAS.length; i++) {
      materias.push({
        codigo: `MAT-${sistema}-${String(i).padStart(3, '0')}`,
        nombre: `${randomElement(MATERIAS_BASE)} ${i}`,
        sistemaEducativo: sistema,
        nivel: randomElement(niveles),
        area: 'ciencias'
      });
    }
  }

  await Materia.insertMany(materias, { ordered: false });
  console.log('Materias creadas.');

  return await Materia.find().select('_id sistemaEducativo').lean();
}

// Crear calificaciones
async function crearCalificaciones(estudiantes, materias, instituciones) {
  console.log(`\nCreando ${TOTAL_CALIFICACIONES.toLocaleString()} calificaciones...`);
  console.log('Esto puede tardar varios minutos...\n');

  const startTime = Date.now();
  let totalCreadas = 0;

  // Agrupar por sistema para asignar coherentemente
  const estudiantesPorSistema = {};
  const materiasPorSistema = {};
  const institucionesPorSistema = {};

  SISTEMAS.forEach(s => {
    estudiantesPorSistema[s] = estudiantes.filter(e => e.paisOrigen === s);
    materiasPorSistema[s] = materias.filter(m => m.sistemaEducativo === s);
    institucionesPorSistema[s] = instituciones.filter(i => i.sistemaEducativo === s);
  });

  while (totalCreadas < TOTAL_CALIFICACIONES) {
    const batch = [];
    const batchTarget = Math.min(BATCH_SIZE, TOTAL_CALIFICACIONES - totalCreadas);

    for (let i = 0; i < batchTarget; i++) {
      const sistema = randomElement(SISTEMAS);
      const estudiante = randomElement(estudiantesPorSistema[sistema] || estudiantes);
      const materia = randomElement(materiasPorSistema[sistema] || materias);
      const institucion = randomElement(institucionesPorSistema[sistema] || instituciones);

      const valorOriginal = generarValorOriginal(sistema);
      const fechaEvaluacion = randomDate(new Date(2020, 0, 1), new Date(2024, 11, 31));
      const calificacionId = uuidv4();

      const calificacion = {
        calificacionId,
        estudianteId: estudiante._id,
        materiaId: materia._id,
        institucionId: institucion._id,
        sistemaOrigen: sistema,
        cicloLectivo: {
          anio: fechaEvaluacion.getFullYear(),
          periodo: randomElement(['anual', 'semestre1', 'semestre2'])
        },
        valorOriginal,
        tipoEvaluacion: randomElement(TIPOS_EVALUACION),
        fechaEvaluacion,
        auditoria: {
          usuarioRegistro: 'carga_masiva',
          timestampRegistro: new Date()
        },
        hashIntegridad: generarHash({ calificacionId, valorOriginal, fechaEvaluacion })
      };

      batch.push(calificacion);
    }

    try {
      await Calificacion.insertMany(batch, { ordered: false });
      totalCreadas += batch.length;
    } catch (e) {
      totalCreadas += batch.length; // Contar aunque haya algunos duplicados
    }

    // Mostrar progreso
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = totalCreadas / elapsed;
    const remaining = (TOTAL_CALIFICACIONES - totalCreadas) / rate;

    process.stdout.write(
      `\rProgreso: ${totalCreadas.toLocaleString()}/${TOTAL_CALIFICACIONES.toLocaleString()} ` +
      `(${((totalCreadas / TOTAL_CALIFICACIONES) * 100).toFixed(1)}%) ` +
      `| Velocidad: ${Math.round(rate)}/seg ` +
      `| Tiempo restante: ${Math.round(remaining)}seg`
    );
  }

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`\n\nCarga completada en ${totalTime.toFixed(1)} segundos`);
  console.log(`Velocidad promedio: ${Math.round(totalCreadas / totalTime)} registros/segundo`);
}

// Funcion principal
async function main() {
  console.log('='.repeat(60));
  console.log('EduGrade Global - Carga Masiva de Datos');
  console.log('='.repeat(60));
  console.log(`\nObjetivo: ${TOTAL_CALIFICACIONES.toLocaleString()} calificaciones\n`);

  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:edugrade2024@localhost:27017/edugrade?authSource=admin';
    console.log('Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Conectado.\n');

    // Crear datos base
    const estudiantes = await crearEstudiantes();
    const instituciones = await crearInstituciones();
    const materias = await crearMaterias();

    // Crear calificaciones
    await crearCalificaciones(estudiantes, materias, instituciones);

    // Estadisticas finales
    console.log('\n' + '='.repeat(60));
    console.log('Estadisticas finales:');
    console.log('='.repeat(60));

    const stats = {
      estudiantes: await Estudiante.countDocuments(),
      instituciones: await Institucion.countDocuments(),
      materias: await Materia.countDocuments(),
      calificaciones: await Calificacion.countDocuments()
    };

    console.log(`Estudiantes:    ${stats.estudiantes.toLocaleString()}`);
    console.log(`Instituciones:  ${stats.instituciones.toLocaleString()}`);
    console.log(`Materias:       ${stats.materias.toLocaleString()}`);
    console.log(`Calificaciones: ${stats.calificaciones.toLocaleString()}`);

    // Verificar distribucion
    const distribucion = await Calificacion.aggregate([
      { $group: { _id: '$sistemaOrigen', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nDistribucion por sistema:');
    distribucion.forEach(d => {
      console.log(`  ${d._id}: ${d.count.toLocaleString()} (${((d.count / stats.calificaciones) * 100).toFixed(1)}%)`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConexion cerrada.');
  }
}

main();
