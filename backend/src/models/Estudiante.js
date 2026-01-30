const mongoose = require('mongoose');

/**
 * Modelo Estudiante - MongoDB
 * RF1: Registro Academico Oficial
 *
 * Justificacion: MongoDB permite esquema flexible para manejar
 * diferentes estructuras de datos segun el pais de origen
 */
const estudianteSchema = new mongoose.Schema({
  // Identificacion
  dni: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  pasaporte: {
    type: String,
    sparse: true
  },

  // Datos personales
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  fechaNacimiento: {
    type: Date,
    required: true
  },
  genero: {
    type: String,
    enum: ['M', 'F', 'O']
  },

  // Contacto
  email: {
    type: String,
    lowercase: true
  },
  telefono: String,
  direccion: {
    calle: String,
    ciudad: String,
    provincia: String,
    codigoPostal: String,
    pais: String
  },

  // Sistema educativo principal
  paisOrigen: {
    type: String,
    enum: ['UK', 'US', 'DE', 'AR'],
    required: true
  },

  // Institucion actual
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    index: true
  },

  // Historial de sistemas educativos
  sistemasEducativos: [{
    sistema: {
      type: String,
      enum: ['UK', 'US', 'DE', 'AR']
    },
    fechaInicio: Date,
    fechaFin: Date,
    activo: Boolean
  }],

  // Estado
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'graduado', 'transferido'],
    default: 'activo'
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'estudiantes'
});

// Indices compuestos para busquedas frecuentes
estudianteSchema.index({ apellido: 1, nombre: 1 });
estudianteSchema.index({ paisOrigen: 1, estado: 1 });
estudianteSchema.index({ createdAt: -1 });

// Virtual para nombre completo
estudianteSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

// Metodo para obtener sistema educativo activo
estudianteSchema.methods.getSistemaActivo = function() {
  const activo = this.sistemasEducativos.find(s => s.activo);
  return activo ? activo.sistema : this.paisOrigen;
};

module.exports = mongoose.model('Estudiante', estudianteSchema);
