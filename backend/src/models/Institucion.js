const mongoose = require('mongoose');

/**
 * Modelo Institucion - MongoDB
 * RF1: Registro Academico Oficial
 */
const institucionSchema = new mongoose.Schema({
  // Identificacion
  codigo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nombre: {
    type: String,
    required: true
  },
  nombreCorto: String,

  // Tipo de institucion
  tipo: {
    type: String,
    enum: ['primaria', 'secundaria', 'preparatoria', 'universidad', 'instituto'],
    required: true
  },

  // Sistema educativo
  sistemaEducativo: {
    type: String,
    enum: ['UK', 'US', 'DE', 'AR'],
    required: true
  },

  // Ubicacion
  pais: {
    type: String,
    required: true
  },
  region: String,
  ciudad: String,
  direccion: {
    calle: String,
    codigoPostal: String,
    coordenadas: {
      lat: Number,
      lng: Number
    }
  },

  // Contacto
  telefono: String,
  email: String,
  website: String,

  // Acreditaciones
  acreditaciones: [{
    nombre: String,
    organizacion: String,
    fechaOtorgamiento: Date,
    fechaVencimiento: Date,
    vigente: Boolean
  }],

  // Niveles educativos que ofrece
  nivelesEducativos: [{
    type: String,
    enum: [
      // UK
      'GCSE', 'A-Level', 'AS-Level',
      // US
      'Elementary', 'Middle', 'High School', 'College',
      // DE
      'Grundschule', 'Hauptschule', 'Realschule', 'Gymnasium', 'Abitur',
      // AR
      'Primario', 'Secundario', 'Terciario', 'Universitario'
    ]
  }],

  // Estado
  estado: {
    type: String,
    enum: ['activa', 'inactiva', 'clausurada'],
    default: 'activa'
  },

  // Metadata adicional
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'instituciones'
});

// Indices
institucionSchema.index({ sistemaEducativo: 1, tipo: 1 });
institucionSchema.index({ pais: 1, region: 1 });
institucionSchema.index({ nombre: 'text', nombreCorto: 'text' });

module.exports = mongoose.model('Institucion', institucionSchema);
