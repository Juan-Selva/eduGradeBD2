const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Modelo Usuario - MongoDB
 * Gestion de autenticacion y autorizacion
 */
const usuarioSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },

  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // No incluir por defecto en queries
  },

  nombre: {
    type: String,
    required: true,
    trim: true
  },

  apellido: {
    type: String,
    required: true,
    trim: true
  },

  // Rol del usuario
  rol: {
    type: String,
    enum: ['admin', 'docente', 'administrativo', 'consulta'],
    default: 'consulta'
  },

  // Permisos granulares
  permisos: [{
    type: String,
    enum: [
      // Estudiantes
      'estudiantes:leer',
      'estudiantes:crear',
      'estudiantes:editar',
      'estudiantes:eliminar',
      // Calificaciones
      'calificaciones:leer',
      'calificaciones:crear',
      'calificaciones:corregir',
      // Instituciones
      'instituciones:leer',
      'instituciones:crear',
      'instituciones:editar',
      // Materias
      'materias:leer',
      'materias:crear',
      'materias:editar',
      // Reportes
      'reportes:leer',
      'reportes:generar',
      // Auditoria
      'auditoria:leer',
      // Usuarios
      'usuarios:leer',
      'usuarios:crear',
      'usuarios:editar',
      'usuarios:eliminar'
    ]
  }],

  // Institucion a la que pertenece (opcional)
  institucionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion'
  },

  // Estado
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'bloqueado'],
    default: 'activo'
  },

  // Tokens de refresh (para invalidacion)
  refreshTokens: [{
    token: String,
    expires: Date,
    createdAt: { type: Date, default: Date.now }
  }],

  // Ultimo acceso
  ultimoAcceso: Date,

  // Intentos fallidos de login
  intentosFallidos: {
    type: Number,
    default: 0
  },
  bloqueadoHasta: Date,

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'usuarios'
});

// ============================================
// INDICES
// ============================================
usuarioSchema.index({ rol: 1, estado: 1 });
usuarioSchema.index({ institucionId: 1 });

// ============================================
// MIDDLEWARE PRE-SAVE: Hash password
// ============================================
usuarioSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================
// METODO: Comparar password
// ============================================
usuarioSchema.methods.compararPassword = async function(passwordIngresado) {
  return bcrypt.compare(passwordIngresado, this.password);
};

// ============================================
// METODO: Tiene permiso
// ============================================
usuarioSchema.methods.tienePermiso = function(permiso) {
  // Admin tiene todos los permisos
  if (this.rol === 'admin') return true;

  return this.permisos.includes(permiso);
};

// ============================================
// METODO: Tiene algun permiso de la lista
// ============================================
usuarioSchema.methods.tieneAlgunPermiso = function(permisos) {
  if (this.rol === 'admin') return true;

  return permisos.some(p => this.permisos.includes(p));
};

// ============================================
// METODO: Verificar si esta bloqueado
// ============================================
usuarioSchema.methods.estaBloqueado = function() {
  if (this.estado === 'bloqueado') return true;
  if (this.bloqueadoHasta && this.bloqueadoHasta > new Date()) return true;
  return false;
};

// ============================================
// METODO: Registrar intento fallido
// ============================================
usuarioSchema.methods.registrarIntentoFallido = async function() {
  this.intentosFallidos += 1;

  // Bloquear despues de 5 intentos fallidos
  if (this.intentosFallidos >= 5) {
    this.bloqueadoHasta = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
  }

  await this.save();
};

// ============================================
// METODO: Resetear intentos fallidos
// ============================================
usuarioSchema.methods.resetearIntentosFallidos = async function() {
  this.intentosFallidos = 0;
  this.bloqueadoHasta = null;
  this.ultimoAcceso = new Date();
  await this.save();
};

// ============================================
// VIRTUAL: Nombre completo
// ============================================
usuarioSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

// ============================================
// METODO ESTATICO: Permisos por rol
// ============================================
usuarioSchema.statics.getPermisosPorRol = function(rol) {
  const permisosPorRol = {
    admin: [], // Admin tiene todos los permisos implicitamente
    docente: [
      'estudiantes:leer',
      'calificaciones:leer',
      'calificaciones:crear',
      'materias:leer',
      'instituciones:leer',
      'reportes:leer'
    ],
    administrativo: [
      'estudiantes:leer',
      'estudiantes:crear',
      'estudiantes:editar',
      'calificaciones:leer',
      'instituciones:leer',
      'materias:leer',
      'reportes:leer',
      'reportes:generar'
    ],
    consulta: [
      'estudiantes:leer',
      'calificaciones:leer',
      'materias:leer',
      'instituciones:leer'
    ]
  };

  return permisosPorRol[rol] || [];
};

module.exports = mongoose.model('Usuario', usuarioSchema);
