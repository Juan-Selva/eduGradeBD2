/**
 * Script para crear usuario admin inicial
 * Ejecutar con: node src/scripts/seedAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Usuario } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edugrade';

const adminData = {
  email: 'admin@edugrade.com',
  password: 'Admin123!',
  nombre: 'Administrador',
  apellido: 'Sistema',
  rol: 'admin',
  permisos: [],
  estado: 'activo'
};

const docenteData = {
  email: 'docente@edugrade.com',
  password: 'Docente123!',
  nombre: 'Juan',
  apellido: 'Perez',
  rol: 'docente',
  permisos: Usuario.schema.statics.getPermisosPorRol ?
    ['estudiantes:leer', 'calificaciones:leer', 'calificaciones:crear', 'materias:leer', 'instituciones:leer', 'reportes:leer'] :
    [],
  estado: 'activo'
};

async function seedAdmin() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Crear admin si no existe
    const adminExistente = await Usuario.findOne({ email: adminData.email });
    if (adminExistente) {
      console.log('Usuario admin ya existe:', adminData.email);
    } else {
      const admin = new Usuario(adminData);
      await admin.save();
      console.log('Usuario admin creado:', adminData.email);
    }

    // Crear docente si no existe
    const docenteExistente = await Usuario.findOne({ email: docenteData.email });
    if (docenteExistente) {
      console.log('Usuario docente ya existe:', docenteData.email);
    } else {
      const docente = new Usuario(docenteData);
      await docente.save();
      console.log('Usuario docente creado:', docenteData.email);
    }

    console.log('\n=================================');
    console.log('CREDENCIALES DE ACCESO:');
    console.log('=================================');
    console.log('\nADMIN (todos los permisos):');
    console.log('  Email:', adminData.email);
    console.log('  Password:', adminData.password);
    console.log('\nDOCENTE (permisos limitados):');
    console.log('  Email:', docenteData.email);
    console.log('  Password:', docenteData.password);
    console.log('=================================\n');

    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

seedAdmin();
