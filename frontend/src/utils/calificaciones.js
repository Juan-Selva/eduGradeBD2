export const TIPOS_EVALUACION = {
  AR: ['parcial', 'final', 'recuperatorio', 'trabajo_practico', 'oral', 'escrito'],
  US: ['quiz', 'midterm', 'assignment', 'exam'],
  UK: ['coursework', 'exam', 'modulo'],
  DE: ['escrito', 'oral'],
}

export const PERIODOS = ['anual', 'semestre1', 'semestre2', 'trimestre1', 'trimestre2', 'trimestre3']
export const UK_LETRAS = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U']

export function buildValorOriginal(sistema, nota, instancia) {
  const s = sistema?.toUpperCase()
  switch (s) {
    case 'AR': {
      const n = parseInt(nota, 10)
      return { ar: { nota: n, aprobado: n >= 4, instancia: instancia || 'regular' } }
    }
    case 'US': {
      const p = parseInt(nota, 10)
      let letra = 'F'
      if (p >= 93) letra = 'A'
      else if (p >= 90) letra = 'A-'
      else if (p >= 87) letra = 'B+'
      else if (p >= 83) letra = 'B'
      else if (p >= 80) letra = 'B-'
      else if (p >= 77) letra = 'C+'
      else if (p >= 73) letra = 'C'
      else if (p >= 70) letra = 'C-'
      else if (p >= 60) letra = 'D'
      return { us: { porcentaje: p, letra, aprobado: p >= 60 } }
    }
    case 'UK':
      return { uk: { letra: nota, aprobado: !['F', 'U'].includes(nota) } }
    case 'DE': {
      const n = parseFloat(nota)
      return { de: { nota: n, aprobado: n <= 4.0 } }
    }
    default:
      return {}
  }
}
