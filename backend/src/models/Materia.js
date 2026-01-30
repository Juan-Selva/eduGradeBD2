const mongoose = require('mongoose');

/**
 * Modelo Materia - MongoDB
 * RF1: Registro Academico Oficial
 */
const materiaSchema = new mongoose.Schema({
  // Identificacion
  codigo: {
    type: String,
    required: true,
    index: true
  },
  nombre: {
    type: String,
    required: true
  },
  nombreIngles: String,

  // Sistema educativo
  sistemaEducativo: {
    type: String,
    enum: ['UK', 'US', 'DE', 'AR'],
    required: true
  },

  // Nivel educativo
  nivel: {
    type: String,
    required: true
  },

  // Area de conocimiento
  area: {
    type: String,
    enum: [
      'matematicas', 'ciencias', 'lengua', 'idiomas',
      'historia', 'geografia', 'arte', 'musica',
      'educacion_fisica', 'tecnologia', 'otra'
    ]
  },

  // Creditos/Horas
  creditos: {
    type: Number,
    default: 0
  },
  horasSemanales: Number,
  horasTotales: Number,

  // Componentes de evaluacion segun sistema
  componentesEvaluacion: {
    // UK: coursework + exams
    uk: {
      coursework: { peso: Number, descripcion: String },
      exams: { peso: Number, descripcion: String },
      modulos: [{ nombre: String, peso: Number }]
    },
    // US: assignments, quizzes, midterm, final
    us: {
      assignments: { peso: Number },
      quizzes: { peso: Number },
      midterm: { peso: Number },
      final: { peso: Number },
      participation: { peso: Number }
    },
    // DE: evaluacion continua + examen
    de: {
      evaluacionContinua: { peso: Number },
      examenFinal: { peso: Number },
      trabajosPracticos: { peso: Number }
    },
    // AR: parciales + final + TPs
    ar: {
      primerParcial: { peso: Number },
      segundoParcial: { peso: Number },
      trabajosPracticos: { peso: Number },
      final: { peso: Number },
      recuperatorios: { habilitado: Boolean }
    }
  },

  // Prerequisitos (referencia a otras materias)
  prerequisitos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia'
  }],

  // Estado
  estado: {
    type: String,
    enum: ['activa', 'inactiva', 'descontinuada'],
    default: 'activa'
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'materias'
});

// Indice compuesto unico por sistema y codigo
materiaSchema.index({ sistemaEducativo: 1, codigo: 1 }, { unique: true });
materiaSchema.index({ area: 1, nivel: 1 });
materiaSchema.index({ nombre: 'text', nombreIngles: 'text' });

module.exports = mongoose.model('Materia', materiaSchema);
