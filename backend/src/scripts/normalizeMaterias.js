#!/usr/bin/env node

/**
 * Script para normalizar materias existentes
 * Agrega codigoNormalizado basado en nombreIngles
 *
 * Uso: node src/scripts/normalizeMaterias.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Materia = require('../models/Materia');

// Mapeo de nombreIngles a codigoNormalizado
const normalizacionMap = {
  // Matemáticas
  'mathematics': 'mathematics',
  'algebra': 'mathematics',
  'algebra i': 'mathematics',

  // Lengua (idioma local)
  'english language': 'language',
  'english language arts': 'language',
  'german': 'language',
  'deutsch': 'language',
  'spanish language and literature': 'language',

  // Idioma extranjero
  'french': 'foreign_language',
  'spanish': 'foreign_language',
  'spanish i': 'foreign_language',
  'english': 'foreign_language',
  'englisch': 'foreign_language',

  // Ciencias
  'physics': 'physics',
  'chemistry': 'chemistry',
  'biology': 'biology',
  'combined science': 'science',

  // Humanidades
  'history': 'history',
  'us history': 'history',
  'geography': 'geography',

  // Arte
  'art': 'art',
  'art and design': 'art',

  // Educación Física
  'physical education': 'physical_education',
};

// Función para obtener código normalizado
function getNormalizedCode(nombreIngles) {
  if (!nombreIngles) return null;

  const key = nombreIngles.toLowerCase().trim();

  // Buscar coincidencia exacta
  if (normalizacionMap[key]) {
    return normalizacionMap[key];
  }

  // Buscar coincidencia parcial
  for (const [pattern, code] of Object.entries(normalizacionMap)) {
    if (key.includes(pattern) || pattern.includes(key)) {
      return code;
    }
  }

  // Si no hay coincidencia, usar el nombreIngles normalizado
  return key.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function normalizeMaterias() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:edugrade2024@localhost:27017/edugrade?authSource=admin');
    console.log('Conectado.\n');

    const materias = await Materia.find({});
    console.log(`Encontradas ${materias.length} materias.\n`);

    let actualizadas = 0;

    for (const materia of materias) {
      const codigoNormalizado = getNormalizedCode(materia.nombreIngles);

      if (codigoNormalizado && materia.codigoNormalizado !== codigoNormalizado) {
        console.log(`${materia.nombre} (${materia.sistemaEducativo}) -> ${codigoNormalizado}`);

        await Materia.updateOne(
          { _id: materia._id },
          { $set: { codigoNormalizado } }
        );
        actualizadas++;
      }
    }

    console.log(`\n✓ ${actualizadas} materias actualizadas.`);

    // Mostrar resumen de agrupaciones
    console.log('\n=== Resumen de agrupaciones ===');
    const agrupaciones = await Materia.aggregate([
      { $group: { _id: '$codigoNormalizado', materias: { $push: { nombre: '$nombre', pais: '$sistemaEducativo' } }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    for (const grupo of agrupaciones) {
      console.log(`\n${grupo._id} (${grupo.count} materias):`);
      for (const m of grupo.materias) {
        console.log(`  - ${m.nombre} (${m.pais})`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado.');
  }
}

normalizeMaterias();
