/**
 * Seed Data: Calificaciones
 * Genera calificaciones para los estudiantes de seed
 * Distribucion normal de notas por sistema educativo
 */

/**
 * Genera calificaciones para un conjunto de estudiantes y materias
 * @param {Array} estudiantes - IDs de estudiantes con su sistema educativo
 * @param {Array} materias - IDs de materias con su sistema educativo
 * @param {Array} instituciones - IDs de instituciones con su sistema educativo
 * @returns {Array} Array de calificaciones a insertar
 */
const generarCalificaciones = (estudiantes, materias, instituciones) => {
  const calificaciones = [];
  const tiposEvaluacion = {
    UK: ['coursework', 'exam', 'modulo'],
    US: ['quiz', 'midterm', 'assignment', 'final'],
    DE: ['parcial', 'trabajo_practico', 'final'],
    AR: ['parcial', 'trabajo_practico', 'final', 'recuperatorio']
  };

  const generarNotaUK = () => {
    const letras = ['A*', 'A', 'A', 'B', 'B', 'B', 'C', 'C', 'C', 'D', 'E'];
    return {
      uk: {
        letra: letras[Math.floor(Math.random() * letras.length)],
        puntos: Math.floor(Math.random() * 60) + 40
      }
    };
  };

  const generarNotaUS = () => {
    const porcentaje = Math.floor(Math.random() * 40) + 60; // 60-100
    const gpa = Math.round((porcentaje / 100) * 4 * 100) / 100;
    const letras = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];
    let letra;
    if (porcentaje >= 93) letra = 'A';
    else if (porcentaje >= 90) letra = 'A-';
    else if (porcentaje >= 87) letra = 'B+';
    else if (porcentaje >= 83) letra = 'B';
    else if (porcentaje >= 80) letra = 'B-';
    else if (porcentaje >= 77) letra = 'C+';
    else if (porcentaje >= 73) letra = 'C';
    else letra = 'C-';

    return {
      us: {
        letra,
        porcentaje,
        gpa: Math.min(4.0, gpa)
      }
    };
  };

  const generarNotaDE = () => {
    // Distribucion normal centrada en 2.5
    const base = 1.0 + Math.random() * 3.0; // 1.0 - 4.0
    const nota = Math.round(base * 10) / 10;
    return {
      de: {
        nota: Math.max(1.0, Math.min(6.0, nota)),
        puntos: Math.floor((6 - nota) / 5 * 15)
      }
    };
  };

  const generarNotaAR = () => {
    // Distribucion normal centrada en 7
    const base = 4 + Math.floor(Math.random() * 7); // 4-10
    return {
      ar: {
        nota: Math.min(10, base),
        aprobado: base >= 4,
        instancia: 'regular'
      }
    };
  };

  const generadoresNota = {
    UK: generarNotaUK,
    US: generarNotaUS,
    DE: generarNotaDE,
    AR: generarNotaAR
  };

  // Para cada estudiante, generar 5 calificaciones en materias de su sistema
  estudiantes.forEach(estudiante => {
    const materiasDelSistema = materias.filter(m => m.sistema === estudiante.sistema);
    const institucionDelSistema = instituciones.find(i => i.sistema === estudiante.sistema);

    if (!institucionDelSistema || materiasDelSistema.length === 0) return;

    // 5 calificaciones por estudiante
    materiasDelSistema.forEach(materia => {
      const tipos = tiposEvaluacion[estudiante.sistema];
      const tipoEvaluacion = tipos[Math.floor(Math.random() * tipos.length)];

      calificaciones.push({
        estudianteId: estudiante.id,
        materiaId: materia.id,
        institucionId: institucionDelSistema.id,
        sistemaOrigen: estudiante.sistema,
        cicloLectivo: {
          anio: 2024,
          periodo: 'anual'
        },
        valorOriginal: generadoresNota[estudiante.sistema](),
        tipoEvaluacion,
        fechaEvaluacion: new Date(2024, Math.floor(Math.random() * 10), Math.floor(Math.random() * 28) + 1),
        auditoria: {
          usuarioRegistro: 'seed-system',
          ipRegistro: '127.0.0.1',
          timestampRegistro: new Date()
        },
        observaciones: 'Calificación generada por seed',
        estado: 'vigente'
      });
    });
  });

  return calificaciones;
};

/**
 * Datos de calificaciones de ejemplo (estáticos para seed determinista)
 */
const calificacionesEjemplo = {
  UK: [
    { letra: 'A*', puntos: 56, tipo: 'exam' },
    { letra: 'A', puntos: 48, tipo: 'coursework' },
    { letra: 'B', puntos: 40, tipo: 'modulo' },
    { letra: 'A', puntos: 52, tipo: 'exam' },
    { letra: 'B', puntos: 44, tipo: 'coursework' }
  ],
  US: [
    { letra: 'A', porcentaje: 95, gpa: 4.0, tipo: 'final' },
    { letra: 'A-', porcentaje: 91, gpa: 3.7, tipo: 'midterm' },
    { letra: 'B+', porcentaje: 88, gpa: 3.3, tipo: 'quiz' },
    { letra: 'A', porcentaje: 93, gpa: 4.0, tipo: 'assignment' },
    { letra: 'B', porcentaje: 85, gpa: 3.0, tipo: 'final' }
  ],
  DE: [
    { nota: 1.3, puntos: 14, tipo: 'final' },
    { nota: 1.7, puntos: 13, tipo: 'parcial' },
    { nota: 2.0, puntos: 12, tipo: 'trabajo_practico' },
    { nota: 1.0, puntos: 15, tipo: 'final' },
    { nota: 2.3, puntos: 11, tipo: 'parcial' }
  ],
  AR: [
    { nota: 9, aprobado: true, instancia: 'regular', tipo: 'parcial' },
    { nota: 8, aprobado: true, instancia: 'regular', tipo: 'final' },
    { nota: 7, aprobado: true, instancia: 'regular', tipo: 'trabajo_practico' },
    { nota: 10, aprobado: true, instancia: 'regular', tipo: 'final' },
    { nota: 6, aprobado: true, instancia: 'regular', tipo: 'parcial' }
  ]
};

module.exports = {
  generarCalificaciones,
  calificacionesEjemplo
};
