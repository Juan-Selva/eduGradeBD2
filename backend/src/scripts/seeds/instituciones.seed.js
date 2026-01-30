/**
 * Seed Data: Instituciones
 * 8 instituciones (2 por sistema educativo)
 */

const instituciones = [
  // UK - Reino Unido
  {
    codigo: 'UK-OXF-001',
    nombre: 'Oxford High School',
    nombreCorto: 'Oxford High',
    tipo: 'secundaria',
    sistemaEducativo: 'UK',
    pais: 'Reino Unido',
    region: 'Oxfordshire',
    ciudad: 'Oxford',
    direccion: {
      calle: '21 Banbury Road',
      codigoPostal: 'OX2 6PE'
    },
    telefono: '+44 1865 559888',
    email: 'info@oxfordhigh.gdst.net',
    website: 'https://www.oxfordhigh.gdst.net',
    nivelesEducativos: ['GCSE', 'A-Level'],
    acreditaciones: [{
      nombre: 'Independent Schools Inspectorate',
      organizacion: 'ISI',
      fechaOtorgamiento: new Date('2020-01-15'),
      fechaVencimiento: new Date('2025-01-15'),
      vigente: true
    }],
    estado: 'activa'
  },
  {
    codigo: 'UK-CAM-002',
    nombre: 'Cambridge Academy',
    nombreCorto: 'Cambridge Acad',
    tipo: 'secundaria',
    sistemaEducativo: 'UK',
    pais: 'Reino Unido',
    region: 'Cambridgeshire',
    ciudad: 'Cambridge',
    direccion: {
      calle: '15 Hills Road',
      codigoPostal: 'CB2 1PH'
    },
    telefono: '+44 1223 712000',
    email: 'admissions@cambridgeacademy.edu',
    website: 'https://www.cambridgeacademy.edu',
    nivelesEducativos: ['GCSE', 'A-Level', 'AS-Level'],
    acreditaciones: [{
      nombre: 'Ofsted Outstanding',
      organizacion: 'Ofsted',
      fechaOtorgamiento: new Date('2021-06-01'),
      fechaVencimiento: new Date('2026-06-01'),
      vigente: true
    }],
    estado: 'activa'
  },

  // US - Estados Unidos
  {
    codigo: 'US-LHS-001',
    nombre: 'Lincoln High School',
    nombreCorto: 'Lincoln HS',
    tipo: 'secundaria',
    sistemaEducativo: 'US',
    pais: 'Estados Unidos',
    region: 'California',
    ciudad: 'San Francisco',
    direccion: {
      calle: '2162 24th Avenue',
      codigoPostal: '94116'
    },
    telefono: '+1 415-759-2700',
    email: 'lincolnhs@sfusd.edu',
    website: 'https://www.sfusd.edu/lincoln',
    nivelesEducativos: ['High School'],
    acreditaciones: [{
      nombre: 'WASC Accreditation',
      organizacion: 'Western Association of Schools and Colleges',
      fechaOtorgamiento: new Date('2019-03-01'),
      fechaVencimiento: new Date('2025-03-01'),
      vigente: true
    }],
    estado: 'activa'
  },
  {
    codigo: 'US-WES-002',
    nombre: 'Washington Elementary School',
    nombreCorto: 'Washington Elem',
    tipo: 'primaria',
    sistemaEducativo: 'US',
    pais: 'Estados Unidos',
    region: 'New York',
    ciudad: 'New York City',
    direccion: {
      calle: '123 Washington Street',
      codigoPostal: '10014'
    },
    telefono: '+1 212-555-0100',
    email: 'washington.elementary@nycdoe.edu',
    website: 'https://www.schools.nyc.gov/washington',
    nivelesEducativos: ['Elementary'],
    acreditaciones: [{
      nombre: 'NY State Education Department',
      organizacion: 'NYSED',
      fechaOtorgamiento: new Date('2020-09-01'),
      fechaVencimiento: new Date('2025-09-01'),
      vigente: true
    }],
    estado: 'activa'
  },

  // DE - Alemania
  {
    codigo: 'DE-GYM-001',
    nombre: 'Gymnasium Berlin-Mitte',
    nombreCorto: 'Gym Berlin',
    tipo: 'secundaria',
    sistemaEducativo: 'DE',
    pais: 'Alemania',
    region: 'Berlin',
    ciudad: 'Berlin',
    direccion: {
      calle: 'Weinmeisterstraße 15',
      codigoPostal: '10178'
    },
    telefono: '+49 30 24725500',
    email: 'info@gymnasium-berlin-mitte.de',
    website: 'https://www.gymnasium-berlin-mitte.de',
    nivelesEducativos: ['Gymnasium', 'Abitur'],
    acreditaciones: [{
      nombre: 'Senatsverwaltung für Bildung',
      organizacion: 'Berlin Senate',
      fechaOtorgamiento: new Date('2018-01-01'),
      fechaVencimiento: new Date('2028-01-01'),
      vigente: true
    }],
    estado: 'activa'
  },
  {
    codigo: 'DE-RSM-002',
    nombre: 'Realschule München-Pasing',
    nombreCorto: 'RS München',
    tipo: 'secundaria',
    sistemaEducativo: 'DE',
    pais: 'Alemania',
    region: 'Bayern',
    ciudad: 'München',
    direccion: {
      calle: 'Landsberger Straße 428',
      codigoPostal: '81241'
    },
    telefono: '+49 89 82070',
    email: 'sekretariat@rs-muenchen-pasing.de',
    website: 'https://www.rs-muenchen-pasing.de',
    nivelesEducativos: ['Realschule'],
    acreditaciones: [{
      nombre: 'Bayerisches Staatsministerium',
      organizacion: 'Bayern Ministry of Education',
      fechaOtorgamiento: new Date('2019-09-01'),
      fechaVencimiento: new Date('2029-09-01'),
      vigente: true
    }],
    estado: 'activa'
  },

  // AR - Argentina
  {
    codigo: 'AR-CNB-001',
    nombre: 'Colegio Nacional de Buenos Aires',
    nombreCorto: 'CNBA',
    tipo: 'secundaria',
    sistemaEducativo: 'AR',
    pais: 'Argentina',
    region: 'Buenos Aires',
    ciudad: 'Ciudad Autónoma de Buenos Aires',
    direccion: {
      calle: 'Bolívar 263',
      codigoPostal: 'C1066AAE'
    },
    telefono: '+54 11 4331-0133',
    email: 'info@cnba.uba.ar',
    website: 'https://www.cnba.uba.ar',
    nivelesEducativos: ['Secundario'],
    acreditaciones: [{
      nombre: 'Universidad de Buenos Aires',
      organizacion: 'UBA',
      fechaOtorgamiento: new Date('1863-03-14'),
      fechaVencimiento: null,
      vigente: true
    }],
    estado: 'activa'
  },
  {
    codigo: 'AR-ISJ-002',
    nombre: 'Instituto San José',
    nombreCorto: 'San José',
    tipo: 'secundaria',
    sistemaEducativo: 'AR',
    pais: 'Argentina',
    region: 'Buenos Aires',
    ciudad: 'La Plata',
    direccion: {
      calle: 'Calle 48 N° 550',
      codigoPostal: 'B1900'
    },
    telefono: '+54 221 421-5800',
    email: 'info@institutosanjose.edu.ar',
    website: 'https://www.institutosanjose.edu.ar',
    nivelesEducativos: ['Primario', 'Secundario'],
    acreditaciones: [{
      nombre: 'Ministerio de Educación de la Provincia de Buenos Aires',
      organizacion: 'DGCE',
      fechaOtorgamiento: new Date('2015-03-01'),
      fechaVencimiento: new Date('2025-03-01'),
      vigente: true
    }],
    estado: 'activa'
  }
];

module.exports = instituciones;
