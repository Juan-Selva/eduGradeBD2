/**
 * Seed Data: Materias Masivas
 * 40 materias (10 por sistema educativo)
 * Mismas areas en todos los paises para permitir equivalencias
 *
 * Areas: Matematicas, Lengua, Idioma Extranjero, Ciencias (Fisica, Quimica, Biologia),
 *        Historia, Geografia, Arte, Educacion Fisica, Tecnologia, Economia
 */

const materias = [
  // ============================================
  // UK - Reino Unido (10 materias)
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
        exams: { peso: 60, descripcion: 'Written examinations' }
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
        exams: { peso: 70, descripcion: 'Listening, reading, writing' }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-PHY-001',
    nombre: 'Physics',
    nombreIngles: 'Physics',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'ciencias',
    creditos: 2,
    horasSemanales: 4,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 15, descripcion: 'Practical endorsement' },
        exams: { peso: 85, descripcion: 'Written papers' }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-CHE-001',
    nombre: 'Chemistry',
    nombreIngles: 'Chemistry',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'ciencias',
    creditos: 2,
    horasSemanales: 4,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 15, descripcion: 'Practical endorsement' },
        exams: { peso: 85, descripcion: 'Written papers' }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-BIO-001',
    nombre: 'Biology',
    nombreIngles: 'Biology',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'ciencias',
    creditos: 2,
    horasSemanales: 4,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 15, descripcion: 'Practical endorsement' },
        exams: { peso: 85, descripcion: 'Written papers' }
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
        exams: { peso: 75, descripcion: 'Written examinations' }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-GEO-001',
    nombre: 'Geography',
    nombreIngles: 'Geography',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'geografia',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 25, descripcion: 'Fieldwork assessment' },
        exams: { peso: 75, descripcion: 'Written examinations' }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-ART-001',
    nombre: 'Art and Design',
    nombreIngles: 'Art and Design',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'arte',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 60, descripcion: 'Portfolio assessment' },
        exams: { peso: 40, descripcion: 'Externally set assignment' }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'UK-PE-001',
    nombre: 'Physical Education',
    nombreIngles: 'Physical Education',
    sistemaEducativo: 'UK',
    nivel: 'GCSE',
    area: 'educacion_fisica',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      uk: {
        coursework: { peso: 40, descripcion: 'Practical performance' },
        exams: { peso: 60, descripcion: 'Theory examination' }
      }
    },
    estado: 'activa'
  },

  // ============================================
  // US - Estados Unidos (10 materias)
  // ============================================
  {
    codigo: 'US-ALG-001',
    nombre: 'Algebra',
    nombreIngles: 'Algebra',
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
    codigo: 'US-SPA-001',
    nombre: 'Spanish',
    nombreIngles: 'Spanish',
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
  {
    codigo: 'US-PHY-001',
    nombre: 'Physics',
    nombreIngles: 'Physics',
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
    codigo: 'US-CHE-001',
    nombre: 'Chemistry',
    nombreIngles: 'Chemistry',
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
    codigo: 'US-GEO-001',
    nombre: 'Geography',
    nombreIngles: 'Geography',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'geografia',
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
    codigo: 'US-ART-001',
    nombre: 'Art',
    nombreIngles: 'Art',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'arte',
    creditos: 4,
    horasSemanales: 5,
    componentesEvaluacion: {
      us: {
        assignments: { peso: 40 },
        quizzes: { peso: 10 },
        midterm: { peso: 20 },
        final: { peso: 20 },
        participation: { peso: 10 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'US-PE-001',
    nombre: 'Physical Education',
    nombreIngles: 'Physical Education',
    sistemaEducativo: 'US',
    nivel: 'High School',
    area: 'educacion_fisica',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      us: {
        assignments: { peso: 20 },
        quizzes: { peso: 10 },
        midterm: { peso: 20 },
        final: { peso: 30 },
        participation: { peso: 20 }
      }
    },
    estado: 'activa'
  },

  // ============================================
  // DE - Alemania (10 materias)
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
    codigo: 'DE-CHE-001',
    nombre: 'Chemie',
    nombreIngles: 'Chemistry',
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
    codigo: 'DE-BIO-001',
    nombre: 'Biologie',
    nombreIngles: 'Biology',
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
    codigo: 'DE-GEO-001',
    nombre: 'Geographie',
    nombreIngles: 'Geography',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'geografia',
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
    codigo: 'DE-KUN-001',
    nombre: 'Kunst',
    nombreIngles: 'Art',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'arte',
    creditos: 2,
    horasSemanales: 2,
    componentesEvaluacion: {
      de: {
        evaluacionContinua: { peso: 60 },
        examenFinal: { peso: 20 },
        trabajosPracticos: { peso: 20 }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'DE-SPO-001',
    nombre: 'Sport',
    nombreIngles: 'Physical Education',
    sistemaEducativo: 'DE',
    nivel: 'Gymnasium',
    area: 'educacion_fisica',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      de: {
        evaluacionContinua: { peso: 70 },
        examenFinal: { peso: 20 },
        trabajosPracticos: { peso: 10 }
      }
    },
    estado: 'activa'
  },

  // ============================================
  // AR - Argentina (10 materias)
  // ============================================
  {
    codigo: 'AR-MAT-001',
    nombre: 'Matematica',
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
    codigo: 'AR-ING-001',
    nombre: 'Ingles',
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
  },
  {
    codigo: 'AR-FIS-001',
    nombre: 'Fisica',
    nombreIngles: 'Physics',
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
    codigo: 'AR-QUI-001',
    nombre: 'Quimica',
    nombreIngles: 'Chemistry',
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
    codigo: 'AR-BIO-001',
    nombre: 'Biologia',
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
    codigo: 'AR-GEO-001',
    nombre: 'Geografia',
    nombreIngles: 'Geography',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'geografia',
    creditos: 3,
    horasSemanales: 3,
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
    codigo: 'AR-ART-001',
    nombre: 'Arte',
    nombreIngles: 'Art',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'arte',
    creditos: 2,
    horasSemanales: 2,
    componentesEvaluacion: {
      ar: {
        primerParcial: { peso: 20 },
        segundoParcial: { peso: 20 },
        trabajosPracticos: { peso: 40 },
        final: { peso: 20 },
        recuperatorios: { habilitado: true }
      }
    },
    estado: 'activa'
  },
  {
    codigo: 'AR-EDF-001',
    nombre: 'Educacion Fisica',
    nombreIngles: 'Physical Education',
    sistemaEducativo: 'AR',
    nivel: 'Secundario',
    area: 'educacion_fisica',
    creditos: 2,
    horasSemanales: 3,
    componentesEvaluacion: {
      ar: {
        primerParcial: { peso: 20 },
        segundoParcial: { peso: 20 },
        trabajosPracticos: { peso: 30 },
        final: { peso: 30 },
        recuperatorios: { habilitado: true }
      }
    },
    estado: 'activa'
  }
];

module.exports = materias;
