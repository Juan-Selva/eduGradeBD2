/**
 * Seed Data: Estudiantes
 * 40 estudiantes (10 por sistema educativo)
 */

const estudiantes = [
  // ============================================
  // UK - Reino Unido (10 estudiantes)
  // ============================================
  {
    dni: 'UK-2010-001',
    pasaporte: 'GB123456789',
    nombre: 'James',
    apellido: 'Smith',
    fechaNacimiento: new Date('2007-03-15'),
    genero: 'M',
    email: 'james.smith@student.uk',
    telefono: '+44 7700 900001',
    direccion: { calle: '10 Downing Street', ciudad: 'London', codigoPostal: 'SW1A 2AA', pais: 'Reino Unido' },
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-002',
    nombre: 'Emma',
    apellido: 'Johnson',
    fechaNacimiento: new Date('2007-07-22'),
    genero: 'F',
    email: 'emma.johnson@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-003',
    nombre: 'Oliver',
    apellido: 'Williams',
    fechaNacimiento: new Date('2007-01-10'),
    genero: 'M',
    email: 'oliver.williams@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-004',
    nombre: 'Sophia',
    apellido: 'Brown',
    fechaNacimiento: new Date('2007-11-05'),
    genero: 'F',
    email: 'sophia.brown@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-005',
    nombre: 'Harry',
    apellido: 'Taylor',
    fechaNacimiento: new Date('2007-05-18'),
    genero: 'M',
    email: 'harry.taylor@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-006',
    nombre: 'Isabella',
    apellido: 'Davies',
    fechaNacimiento: new Date('2007-09-30'),
    genero: 'F',
    email: 'isabella.davies@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-007',
    nombre: 'George',
    apellido: 'Wilson',
    fechaNacimiento: new Date('2007-12-25'),
    genero: 'M',
    email: 'george.wilson@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-008',
    nombre: 'Charlotte',
    apellido: 'Evans',
    fechaNacimiento: new Date('2007-04-12'),
    genero: 'F',
    email: 'charlotte.evans@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-009',
    nombre: 'William',
    apellido: 'Thomas',
    fechaNacimiento: new Date('2007-06-08'),
    genero: 'M',
    email: 'william.thomas@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'UK-2010-010',
    nombre: 'Amelia',
    apellido: 'Roberts',
    fechaNacimiento: new Date('2007-08-20'),
    genero: 'F',
    email: 'amelia.roberts@student.uk',
    paisOrigen: 'UK',
    sistemasEducativos: [{ sistema: 'UK', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },

  // ============================================
  // US - Estados Unidos (10 estudiantes)
  // ============================================
  {
    dni: 'US-2010-001',
    nombre: 'Michael',
    apellido: 'Anderson',
    fechaNacimiento: new Date('2007-02-14'),
    genero: 'M',
    email: 'michael.anderson@student.us',
    telefono: '+1 555-0100',
    direccion: { calle: '456 Main Street', ciudad: 'San Francisco', codigoPostal: '94102', pais: 'Estados Unidos' },
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-002',
    nombre: 'Emily',
    apellido: 'Martinez',
    fechaNacimiento: new Date('2007-04-25'),
    genero: 'F',
    email: 'emily.martinez@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-003',
    nombre: 'Daniel',
    apellido: 'Garcia',
    fechaNacimiento: new Date('2007-08-03'),
    genero: 'M',
    email: 'daniel.garcia@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-004',
    nombre: 'Madison',
    apellido: 'Rodriguez',
    fechaNacimiento: new Date('2007-11-17'),
    genero: 'F',
    email: 'madison.rodriguez@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-005',
    nombre: 'Christopher',
    apellido: 'Wilson',
    fechaNacimiento: new Date('2007-01-28'),
    genero: 'M',
    email: 'christopher.wilson@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-006',
    nombre: 'Ashley',
    apellido: 'Lopez',
    fechaNacimiento: new Date('2007-06-12'),
    genero: 'F',
    email: 'ashley.lopez@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-007',
    nombre: 'Joshua',
    apellido: 'Lee',
    fechaNacimiento: new Date('2007-09-07'),
    genero: 'M',
    email: 'joshua.lee@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-008',
    nombre: 'Samantha',
    apellido: 'Gonzalez',
    fechaNacimiento: new Date('2007-03-21'),
    genero: 'F',
    email: 'samantha.gonzalez@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-009',
    nombre: 'Andrew',
    apellido: 'Harris',
    fechaNacimiento: new Date('2007-12-09'),
    genero: 'M',
    email: 'andrew.harris@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'US-2010-010',
    nombre: 'Taylor',
    apellido: 'Clark',
    fechaNacimiento: new Date('2007-07-04'),
    genero: 'F',
    email: 'taylor.clark@student.us',
    paisOrigen: 'US',
    sistemasEducativos: [{ sistema: 'US', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },

  // ============================================
  // DE - Alemania (10 estudiantes)
  // ============================================
  {
    dni: 'DE-2010-001',
    nombre: 'Maximilian',
    apellido: 'Müller',
    fechaNacimiento: new Date('2007-05-02'),
    genero: 'M',
    email: 'maximilian.mueller@student.de',
    telefono: '+49 170 1234567',
    direccion: { calle: 'Hauptstraße 1', ciudad: 'Berlin', codigoPostal: '10115', pais: 'Alemania' },
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-002',
    nombre: 'Sophie',
    apellido: 'Schmidt',
    fechaNacimiento: new Date('2007-10-15'),
    genero: 'F',
    email: 'sophie.schmidt@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-003',
    nombre: 'Alexander',
    apellido: 'Schneider',
    fechaNacimiento: new Date('2007-02-28'),
    genero: 'M',
    email: 'alexander.schneider@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-004',
    nombre: 'Marie',
    apellido: 'Fischer',
    fechaNacimiento: new Date('2007-07-19'),
    genero: 'F',
    email: 'marie.fischer@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-005',
    nombre: 'Paul',
    apellido: 'Weber',
    fechaNacimiento: new Date('2007-04-07'),
    genero: 'M',
    email: 'paul.weber@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-006',
    nombre: 'Emma',
    apellido: 'Meyer',
    fechaNacimiento: new Date('2007-11-23'),
    genero: 'F',
    email: 'emma.meyer@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-007',
    nombre: 'Felix',
    apellido: 'Wagner',
    fechaNacimiento: new Date('2007-08-11'),
    genero: 'M',
    email: 'felix.wagner@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-008',
    nombre: 'Hannah',
    apellido: 'Becker',
    fechaNacimiento: new Date('2007-01-14'),
    genero: 'F',
    email: 'hannah.becker@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-009',
    nombre: 'Leon',
    apellido: 'Hoffmann',
    fechaNacimiento: new Date('2007-06-30'),
    genero: 'M',
    email: 'leon.hoffmann@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: 'DE-2010-010',
    nombre: 'Mia',
    apellido: 'Schulz',
    fechaNacimiento: new Date('2007-09-05'),
    genero: 'F',
    email: 'mia.schulz@student.de',
    paisOrigen: 'DE',
    sistemasEducativos: [{ sistema: 'DE', fechaInicio: new Date('2018-09-01'), activo: true }],
    estado: 'activo'
  },

  // ============================================
  // AR - Argentina (10 estudiantes)
  // ============================================
  {
    dni: '45123456',
    nombre: 'Santiago',
    apellido: 'González',
    fechaNacimiento: new Date('2007-03-08'),
    genero: 'M',
    email: 'santiago.gonzalez@student.ar',
    telefono: '+54 11 1234-5678',
    direccion: { calle: 'Av. Corrientes 1234', ciudad: 'Buenos Aires', codigoPostal: 'C1043AAZ', pais: 'Argentina' },
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123457',
    nombre: 'Valentina',
    apellido: 'Rodríguez',
    fechaNacimiento: new Date('2007-08-24'),
    genero: 'F',
    email: 'valentina.rodriguez@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123458',
    nombre: 'Mateo',
    apellido: 'Fernández',
    fechaNacimiento: new Date('2007-12-01'),
    genero: 'M',
    email: 'mateo.fernandez@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123459',
    nombre: 'Camila',
    apellido: 'López',
    fechaNacimiento: new Date('2007-05-16'),
    genero: 'F',
    email: 'camila.lopez@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123460',
    nombre: 'Benjamín',
    apellido: 'Martínez',
    fechaNacimiento: new Date('2007-09-29'),
    genero: 'M',
    email: 'benjamin.martinez@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123461',
    nombre: 'Martina',
    apellido: 'García',
    fechaNacimiento: new Date('2007-02-11'),
    genero: 'F',
    email: 'martina.garcia@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123462',
    nombre: 'Thiago',
    apellido: 'Pérez',
    fechaNacimiento: new Date('2007-07-03'),
    genero: 'M',
    email: 'thiago.perez@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123463',
    nombre: 'Sofía',
    apellido: 'Sánchez',
    fechaNacimiento: new Date('2007-10-20'),
    genero: 'F',
    email: 'sofia.sanchez@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123464',
    nombre: 'Joaquín',
    apellido: 'Ramírez',
    fechaNacimiento: new Date('2007-04-27'),
    genero: 'M',
    email: 'joaquin.ramirez@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  },
  {
    dni: '45123465',
    nombre: 'Emma',
    apellido: 'Díaz',
    fechaNacimiento: new Date('2007-06-15'),
    genero: 'F',
    email: 'emma.diaz@student.ar',
    paisOrigen: 'AR',
    sistemasEducativos: [{ sistema: 'AR', fechaInicio: new Date('2018-03-01'), activo: true }],
    estado: 'activo'
  }
];

module.exports = estudiantes;
