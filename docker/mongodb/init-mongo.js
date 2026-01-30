// Script de inicializacion de MongoDB
// Se ejecuta automaticamente al crear el contenedor

// Crear usuario de la aplicacion
db = db.getSiblingDB('edugrade');

db.createUser({
  user: 'edugrade_app',
  pwd: 'edugrade_app_2024',
  roles: [
    { role: 'readWrite', db: 'edugrade' }
  ]
});

// Crear colecciones con validacion
db.createCollection('estudiantes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['dni', 'nombre', 'apellido', 'paisOrigen'],
      properties: {
        dni: { bsonType: 'string' },
        nombre: { bsonType: 'string' },
        apellido: { bsonType: 'string' },
        paisOrigen: { enum: ['UK', 'US', 'DE', 'AR'] }
      }
    }
  }
});

db.createCollection('instituciones');
db.createCollection('materias');
db.createCollection('calificaciones');

// Crear indices
db.estudiantes.createIndex({ dni: 1 }, { unique: true });
db.estudiantes.createIndex({ paisOrigen: 1, estado: 1 });
db.estudiantes.createIndex({ apellido: 1, nombre: 1 });

db.instituciones.createIndex({ codigo: 1 }, { unique: true });
db.instituciones.createIndex({ sistemaEducativo: 1, tipo: 1 });

db.materias.createIndex({ sistemaEducativo: 1, codigo: 1 }, { unique: true });
db.materias.createIndex({ area: 1, nivel: 1 });

db.calificaciones.createIndex({ calificacionId: 1 }, { unique: true });
db.calificaciones.createIndex({ estudianteId: 1, materiaId: 1 });
db.calificaciones.createIndex({ sistemaOrigen: 1, 'cicloLectivo.anio': 1 });
db.calificaciones.createIndex({ estado: 1, fechaEvaluacion: -1 });
db.calificaciones.createIndex({ hashIntegridad: 1 });

print('MongoDB inicializado correctamente');
