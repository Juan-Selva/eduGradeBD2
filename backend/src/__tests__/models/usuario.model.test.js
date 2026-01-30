/**
 * Unit Tests: Usuario Model
 */
const mongoose = require('mongoose');
const Usuario = require('../../models/Usuario');
const testDb = require('../setup/testDatabase');

describe('Usuario Model', () => {
  beforeAll(async () => {
    await testDb.connect();
  });

  afterEach(async () => {
    await testDb.clearDatabase();
  });

  afterAll(async () => {
    await testDb.closeDatabase();
  });

  describe('Creation', () => {
    it('should create a valid usuario', async () => {
      const usuarioData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez',
        rol: 'docente'
      };

      const usuario = await Usuario.create(usuarioData);

      expect(usuario._id).toBeDefined();
      expect(usuario.email).toBe('test@example.com');
      expect(usuario.nombre).toBe('Juan');
      expect(usuario.rol).toBe('docente');
      expect(usuario.estado).toBe('activo'); // default
    });

    it('should fail without required fields', async () => {
      const usuarioData = {
        email: 'test@example.com'
      };

      await expect(Usuario.create(usuarioData))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should fail with duplicate email', async () => {
      const usuarioData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez'
      };

      await Usuario.create(usuarioData);

      await expect(Usuario.create({
        ...usuarioData,
        nombre: 'Pedro'
      })).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const plainPassword = 'SecurePassword123!';
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: plainPassword,
        nombre: 'Juan',
        apellido: 'Perez'
      });

      // Password should not be stored in plain text
      const usuarioWithPassword = await Usuario.findById(usuario._id).select('+password');
      expect(usuarioWithPassword.password).not.toBe(plainPassword);
      expect(usuarioWithPassword.password).toMatch(/^\$2[aby]?\$/); // bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez'
      });

      const usuarioWithPassword = await Usuario.findById(usuario._id).select('+password');
      const originalHash = usuarioWithPassword.password;

      // Update other field
      usuarioWithPassword.nombre = 'Pedro';
      await usuarioWithPassword.save();

      const updatedUsuario = await Usuario.findById(usuario._id).select('+password');
      expect(updatedUsuario.password).toBe(originalHash);
    });
  });

  describe('compararPassword() method', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'SecurePassword123!';
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: plainPassword,
        nombre: 'Juan',
        apellido: 'Perez'
      });

      const usuarioWithPassword = await Usuario.findById(usuario._id).select('+password');
      const isMatch = await usuarioWithPassword.compararPassword(plainPassword);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez'
      });

      const usuarioWithPassword = await Usuario.findById(usuario._id).select('+password');
      const isMatch = await usuarioWithPassword.compararPassword('WrongPassword');

      expect(isMatch).toBe(false);
    });
  });

  describe('tienePermiso() method', () => {
    it('should return true for admin role', async () => {
      const usuario = await Usuario.create({
        email: 'admin@example.com',
        password: 'SecurePassword123!',
        nombre: 'Admin',
        apellido: 'User',
        rol: 'admin'
      });

      expect(usuario.tienePermiso('estudiantes:leer')).toBe(true);
      expect(usuario.tienePermiso('usuarios:eliminar')).toBe(true);
      expect(usuario.tienePermiso('any:permission')).toBe(true);
    });

    it('should check permisos for non-admin users', async () => {
      const usuario = await Usuario.create({
        email: 'docente@example.com',
        password: 'SecurePassword123!',
        nombre: 'Docente',
        apellido: 'User',
        rol: 'docente',
        permisos: ['estudiantes:leer', 'calificaciones:crear']
      });

      expect(usuario.tienePermiso('estudiantes:leer')).toBe(true);
      expect(usuario.tienePermiso('calificaciones:crear')).toBe(true);
      expect(usuario.tienePermiso('usuarios:eliminar')).toBe(false);
    });
  });

  describe('tieneAlgunPermiso() method', () => {
    it('should return true if any permission matches', async () => {
      const usuario = await Usuario.create({
        email: 'docente@example.com',
        password: 'SecurePassword123!',
        nombre: 'Docente',
        apellido: 'User',
        rol: 'docente',
        permisos: ['estudiantes:leer', 'calificaciones:crear']
      });

      expect(usuario.tieneAlgunPermiso(['estudiantes:leer', 'usuarios:crear'])).toBe(true);
    });

    it('should return false if no permission matches', async () => {
      const usuario = await Usuario.create({
        email: 'docente@example.com',
        password: 'SecurePassword123!',
        nombre: 'Docente',
        apellido: 'User',
        rol: 'docente',
        permisos: ['estudiantes:leer']
      });

      expect(usuario.tieneAlgunPermiso(['usuarios:crear', 'usuarios:eliminar'])).toBe(false);
    });
  });

  describe('Bloqueo de cuenta', () => {
    it('should block after 5 failed attempts', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez'
      });

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await usuario.registrarIntentoFallido();
      }

      const updatedUsuario = await Usuario.findById(usuario._id);

      expect(updatedUsuario.intentosFallidos).toBe(5);
      expect(updatedUsuario.bloqueadoHasta).toBeDefined();
      expect(updatedUsuario.estaBloqueado()).toBe(true);
    });

    it('should reset failed attempts on successful login', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez',
        intentosFallidos: 3
      });

      await usuario.resetearIntentosFallidos();

      const updatedUsuario = await Usuario.findById(usuario._id);

      expect(updatedUsuario.intentosFallidos).toBe(0);
      expect(updatedUsuario.bloqueadoHasta).toBeNull();
      expect(updatedUsuario.ultimoAcceso).toBeDefined();
    });
  });

  describe('estaBloqueado() method', () => {
    it('should return true when estado is bloqueado', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez',
        estado: 'bloqueado'
      });

      expect(usuario.estaBloqueado()).toBe(true);
    });

    it('should return true when bloqueadoHasta is in future', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez',
        bloqueadoHasta: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
      });

      expect(usuario.estaBloqueado()).toBe(true);
    });

    it('should return false when bloqueadoHasta is in past', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez',
        bloqueadoHasta: new Date(Date.now() - 1000) // 1 second ago
      });

      expect(usuario.estaBloqueado()).toBe(false);
    });
  });

  describe('getPermisosPorRol() static method', () => {
    it('should return empty array for admin (all implicit)', () => {
      const permisos = Usuario.getPermisosPorRol('admin');
      expect(permisos).toEqual([]);
    });

    it('should return docente permissions', () => {
      const permisos = Usuario.getPermisosPorRol('docente');
      expect(permisos).toContain('estudiantes:leer');
      expect(permisos).toContain('calificaciones:crear');
      expect(permisos).not.toContain('usuarios:crear');
    });

    it('should return consulta permissions', () => {
      const permisos = Usuario.getPermisosPorRol('consulta');
      expect(permisos).toContain('estudiantes:leer');
      expect(permisos).not.toContain('estudiantes:crear');
    });
  });

  describe('Virtual: nombreCompleto', () => {
    it('should return full name', async () => {
      const usuario = await Usuario.create({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez'
      });

      expect(usuario.nombreCompleto).toBe('Juan Perez');
    });
  });

  describe('Email normalization', () => {
    it('should lowercase and trim email', async () => {
      const usuario = await Usuario.create({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'SecurePassword123!',
        nombre: 'Juan',
        apellido: 'Perez'
      });

      expect(usuario.email).toBe('test@example.com');
    });
  });
});
