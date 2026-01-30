/**
 * Seed Data: Materias
 * 20 materias (5 por sistema educativo)
 */

const materias = [
  // ============================================
  // UK - Reino Unido
  // ============================================
  {
    codigo: 'UK-MATH-001',
    nombre: 'Mathematics',
    nombreIngles: 'Mathematics',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'matematicas',
    creditos: 2,
    horasSemanales: 5,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 20, descripcion: 'Practical assessments' },
        exams: { peso: 80, descripcion: 'Written examinations' },
        modulos: [
          { nombre: 'Algebra', peso: 30 },
          { nombre: 'Geometry', peso: 30 },
          { nombre: 'Statistics', peso: 40 }
        ]
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-ENG-001',
    nombre: 'English Language',
    nombreIngles: 'English Language',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'lengua',
    creditos: 2,
    horasSemanales: 4,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 40, descripcion: 'Speaking and writing assessments' },
        exams: { peso: 60, descripcion: 'Written examinations' },
        modulos: [
          { nombre: 'Reading', peso: 40 },
          { nombre: 'Writing', peso: 40 },
          { nombre: 'Speaking', peso: 20 }
        ]
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-SCI-001',
    nombre: 'Combined Science',
    nombreIngles: 'Combined Science',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'ciencias',
    creditos: 4,
    horasSemanales: 6,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 15, descripcion: 'Practical endorsement' },
        exams: { peso: 85, descripcion: 'Written papers' },
        modulos: [
          { nombre: 'Biology', peso: 33 },
          { nombre: 'Chemistry', peso: 33 },
          { nombre: 'Physics', peso: 34 }
        ]
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-HIS-001',
    nombre: 'History',
    nombreIngles: 'History',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'historia',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 25, descripcion: 'Historical investigation' },
        exams: { peso: 75, descripcion: 'Written examinations' },
        modulos: [
          { nombre: 'British History', peso: 50 },
          { nombre: 'World History', peso: 50 }
        ]
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-FRE-001',
    nombre: 'French',
    nombreIngles: 'French',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'idiomas',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 30, descripcion: 'Speaking assessment' },
        exams: { peso: 70, descripcion: 'Listening, reading, writing' },
        modulos: [
          { nombre: 'Listening', peso: 25 },
          { nombre: 'Speaking', peso: 25 },
          { nombre: 'Reading', peso: 25 },
          { nombre: 'Writing', peso: 25 }
        ]
      }
    },
    estado: 'activa'
  },

  // ============================================
  // US - Estados Unidos
  // ============================================
  {
    codigo: 'US-ALG-001',
    nombre: 'Algebra I',
    nombreIngles: 'Algebra I',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'matematicas',
    creditos: 4,
    horasSemanales: 5,
    componentesEvaluacion: {
      us: {
        assignments: { peso: 30 },
        quizzes: { peso: 15 },
        midterm: { peso: 20 },
        final: { peso: 30 },
        participation: { peso: 5 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'US-ELA-001',
    nombre: 'English Language Arts',
    nombreIngles: 'English Language Arts',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'lengua',
    creditos: 4,
    horasSemanales: 5,
    componentesEvaluacion: {
      us: {
        assignments: { peso: 35 },
        quizzes: { peso: 10 },
        midterm: { peso: 20 },
        final: { peso: 25 },
        participation: { peso: 10 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'US-BIO-001',
    nombre: 'Biology',
    nombreIngles: 'Biology',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'ciencias',
    creditos: 4,
    horasSemanales: 5,
    componentesEvaluacion: {
      us: {
        assignments: { peso: 25 },
        quizzes: { peso: 15 },
        midterm: { peso: 20 },
        final: { peso: 30 },
        participation: { peso: 10 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'US-USH-001',
    nombre: 'US History',
    nombreIngles: 'US History',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'historia',
    creditos: 4,
    horasSemanales: 5,
    componentesEvaluacion: {
      us: {
        assignments: { peso: 30 },
        quizzes: { peso: 15 },
        midterm: { peso: 20 },
        final: { peso: 25 },
        participation: { peso: 10 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'US-SPA-001',
    nombre: 'Spanish I',
    nombreIngles: 'Spanish I',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'idiomas',
    creditos: 4,
    horasSemanales: 5,
    componentesEvaluacion: {
      us: {
        assignments: { peso: 25 },
        quizzes: { peso: 20 },
        midterm: { peso: 20 },
        final: { peso: 25 },
        participation: { peso: 10 }
      }
    },
    estado: 'activa'
  },

  // ============================================
  // DE - Alemania
  // ============================================
  {
    codigo: 'DE-MAT-001',
    nombre: 'Mathematik',
    nombreIngles: 'Mathematics',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'matematicas',
    creditos: 5,
    horasSemanales: 5,
    componentesEvaluacion: {
      de: {
        evaluacionContinua: { peso: 50 },
        examenFinal: { peso: 40 },
        trabajosPracticos: { peso: 10 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'DE-DEU-001',
    nombre: 'Deutsch',
    nombreIngles: 'German',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'lengua',
    creditos: 5,
    horasSemanales: 5,
    componentesEvaluacion: {
      de: {
        evaluacionContinua: { peso: 50 },
        examenFinal: { peso: 40 },
        trabajosPracticos: { peso: 10 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'DE-PHY-001',
    nombre: 'Physik',
    nombreIngles: 'Physics',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'ciencias',
    creditos: 4,
    horasSemanales: 4,
    componentesEvaluacion: {
      de: {
        evaluacionContinua: { peso: 45 },
        examenFinal: { peso: 40 },
        trabajosPracticos: { peso: 15 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'DE-GES-001',
    nombre: 'Geschichte',
    nombreIngles: 'History',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'historia',
    creditos: 3,
    horasSemanales: 3,
    componentesEvaluacion: {
      de: {
        evaluacionContinua: { peso: 50 },
        examenFinal: { peso: 40 },
        trabajosPracticos: { peso: 10 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'DE-ENG-001',
    nombre: 'Englisch',
    nombreIngles: 'English',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'idiomas',
    creditos: 4,
    horasSemanales: 4,
    componentesEvaluacion: {
      de: {
        evaluacionContinua: { peso: 50 },
        examenFinal: { peso: 35 },
        trabajosPracticos: { peso: 15 }
      }
    },
    estado: 'activa'
  },

  // ============================================
  // AR - Argentina
  // ============================================
  {
    codigo: 'AR-MAT-001',
    nombre: 'Matemática',
    nombreIngles: 'Mathematics',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'matematicas',
    creditos: 5,
    horasSemanales: 5,
    componentesEvaluacion: {
      ar: {
        primerParcial: { peso: 25 },
        segundoParcial: { peso: 25 },
        trabajosPracticos: { peso: 20 },
        final: { peso: 30 },
        recuperatorios: { habilitado: true }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'AR-LEN-001',
    nombre: 'Lengua y Literatura',
    nombreIngles: 'Spanish Language and Literature',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'lengua',
    creditos: 5,
    horasSemanales: 5,
    componentesEvaluacion: {
      ar: {
        primerParcial: { peso: 25 },
        segundoParcial: { peso: 25 },
        trabajosPracticos: { peso: 25 },
        final: { peso: 25 },
        recuperatorios: { habilitado: true }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'AR-BIO-001',
    nombre: 'Biología',
    nombreIngles: 'Biology',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'ciencias',
    creditos: 4,
    horasSemanales: 4,
    componentesEvaluacion: {
      ar: {
        primerParcial: { peso: 25 },
        segundoParcial: { peso: 25 },
        trabajosPracticos: { peso: 20 },
        final: { peso: 30 },
        recuperatorios: { habilitado: true }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'AR-HIS-001',
    nombre: 'Historia',
    nombreIngles: 'History',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'historia',
    creditos: 4,
    horasSemanales: 4,
    componentesEvaluacion: {
      ar: {
        primerParcial: { peso: 25 },
        segundoParcial: { peso: 25 },
        trabajosPracticos: { peso: 25 },
        final: { peso: 25 },
        recuperatorios: { habilitado: true }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'AR-ING-001',
    nombre: 'Inglés',
    nombreIngles: 'English',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'idiomas',
    creditos: 3,
    horasSemanales: 3,
    componentesEvaluacion: {
      ar: {
        primerParcial: { peso: 25 },
        segundoParcial: { peso: 25 },
        trabajosPracticos: { peso: 20 },
        final: { peso: 30 },
        recuperatorios: { habilitado: true }
      }
    },
    estado: 'activa'
  }
];

module.exports = materias;
