const mongoose = require('mongoose');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Modelo Calificacion - MongoDB
 * RF1: Registro Academico Oficial
 * RF5: Auditoria y Trazabilidad
 *
 * IMPORTANTE: Este modelo es INMUTABLE (append-only)
 * Las correcciones generan nuevas versiones, no actualizaciones
 */
const calificacionSchema = new mongoose.Schema({
  // ID inmutable
  calificacionId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    index: true
  },

  // Referencias
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudiante',
    required: true,
    index: true
  },
  materiaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true,
    index: true
  },
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },

  // Sistema educativo origen
  sistemaOrigen: {
    type: String,
    enum: ['UK', 'US', 'DE', 'AR'],
    required: true,
    index: true
  },

  // Ciclo lectivo
  cicloLectivo: {
    anio: { type: Number, required: true },
    periodo: { type: String, enum: ['anual', 'semestre1', 'semestre2', 'trimestre1', 'trimestre2', 'trimestre3'] }
  },

  // ============================================
  // VALOR ORIGINAL - NO MODIFICABLE
  // Estructura flexible segun sistema educativo
  // ============================================
  valorOriginal: {
    // UK: A*, A, B, C, D, E, F o numerico 1-9 (GCSE nuevo)
    uk: {
      letra: { type: String, enum: ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U'] },
      numerico: { type: Number, min: 1, max: 9 },
      puntos: Number, // UCAS points
      coursework: Number,
      examScore: Number,
      moduloNotas: [{
        modulo: String,
        nota: mongoose.Schema.Types.Mixed
      }]
    },
    // US: Letter grade + GPA + porcentaje
    us: {
      letra: { type: String, enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'] },
      porcentaje: { type: Number, min: 0, max: 100 },
      gpa: { type: Number, min: 0, max: 4 },
      creditos: Number,
      weighted: Boolean // AP/Honors
    },
    // DE: Escala 1.0-6.0 (1 es mejor)
    de: {
      nota: { type: Number, min: 1, max: 6 },
      puntos: { type: Number, min: 0, max: 15 }, // Sistema de puntos Abitur
      tendencia: { type: String, enum: ['+', '-', ''] }
    },
    // AR: Escala 1-10
    ar: {
      nota: { type: Number, min: 1, max: 10 },
      aprobado: Boolean,
      instancia: { type: String, enum: ['regular', 'diciembre', 'febrero', 'libre'] },
      notaParcial1: Number,
      notaParcial2: Number,
      notaTP: Number,
      notaFinal: Number
    }
  },

  // Tipo de evaluacion
  tipoEvaluacion: {
    type: String,
    enum: [
      'parcial', 'final', 'recuperatorio',
      'coursework', 'exam', 'modulo',
      'quiz', 'midterm', 'assignment',
      'trabajo_practico', 'oral', 'escrito'
    ],
    required: true
  },

  // Fechas
  fechaEvaluacion: {
    type: Date,
    required: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
    immutable: true
  },

  // ============================================
  // AUDITORIA
  // ============================================
  auditoria: {
    usuarioRegistro: {
      type: String,
      required: true
    },
    ipRegistro: String,
    timestampRegistro: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },

  // Hash de integridad (SHA-256)
  hashIntegridad: {
    type: String,
    index: true
  },

  // Version (para correcciones)
  version: {
    type: Number,
    default: 1
  },
  versionAnteriorId: {
    type: String,
    ref: 'Calificacion'
  },
  esCorreccion: {
    type: Boolean,
    default: false
  },
  motivoCorreccion: String,

  // Estado
  estado: {
    type: String,
    enum: ['vigente', 'corregida', 'anulada'],
    default: 'vigente'
  },

  // Observaciones
  observaciones: String,

  // Metadata adicional
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'calificaciones'
});

// ============================================
// INDICES
// ============================================
calificacionSchema.index({ estudianteId: 1, materiaId: 1, cicloLectivo: 1 });
calificacionSchema.index({ sistemaOrigen: 1, 'cicloLectivo.anio': 1 });
calificacionSchema.index({ fechaEvaluacion: -1 });
calificacionSchema.index({ estado: 1, version: -1 });

// Índice para reportes por materia (optimización de agregaciones)
calificacionSchema.index({
  estado: 1,
  sistemaOrigen: 1,
  'cicloLectivo.anio': 1,
  materiaId: 1
});

// Índice para reportes por institución (optimización de agregaciones)
calificacionSchema.index({
  estado: 1,
  'cicloLectivo.anio': 1,
  institucionId: 1
});

// ============================================
// MIDDLEWARE PRE-SAVE: Generar hash de integridad
// ============================================
calificacionSchema.pre('save', function(next) {
  if (this.isNew) {
    // Crear hash de integridad
    const dataToHash = JSON.stringify({
      calificacionId: this.calificacionId,
      estudianteId: this.estudianteId.toString(),
      materiaId: this.materiaId.toString(),
      valorOriginal: this.valorOriginal,
      fechaEvaluacion: this.fechaEvaluacion,
      timestampRegistro: this.auditoria.timestampRegistro
    });

    this.hashIntegridad = crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');
  }
  next();
});

// ============================================
// METODO: Verificar integridad
// ============================================
calificacionSchema.methods.verificarIntegridad = function() {
  const dataToHash = JSON.stringify({
    calificacionId: this.calificacionId,
    estudianteId: this.estudianteId.toString(),
    materiaId: this.materiaId.toString(),
    valorOriginal: this.valorOriginal,
    fechaEvaluacion: this.fechaEvaluacion,
    timestampRegistro: this.auditoria.timestampRegistro
  });

  const hashCalculado = crypto
    .createHash('sha256')
    .update(dataToHash)
    .digest('hex');

  return hashCalculado === this.hashIntegridad;
};

// ============================================
// METODO: Obtener valor normalizado (0-100)
// ============================================
calificacionSchema.methods.getValorNormalizado = function() {
  const val = this.valorOriginal;

  switch (this.sistemaOrigen) {
    case 'UK':
      if (val.uk?.letra) {
        const ukMap = { 'A*': 95, 'A': 85, 'B': 75, 'C': 65, 'D': 55, 'E': 45, 'F': 35, 'U': 0 };
        return ukMap[val.uk.letra] || 0;
      }
      if (val.uk?.numerico) return (val.uk.numerico / 9) * 100;
      break;

    case 'US':
      if (val.us?.porcentaje) return val.us.porcentaje;
      if (val.us?.gpa) return (val.us.gpa / 4) * 100;
      break;

    case 'DE':
      if (val.de?.nota) return ((6 - val.de.nota) / 5) * 100;
      break;

    case 'AR':
      if (val.ar?.nota) return val.ar.nota * 10;
      break;
  }

  return null;
};

module.exports = mongoose.model('Calificacion', calificacionSchema);
