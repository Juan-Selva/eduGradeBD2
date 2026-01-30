const { getRedisClient } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Servicio de Conversion de Calificaciones
 * Cache: Redis
 *
 * Tablas de equivalencia entre sistemas educativos:
 * - UK: A*, A, B, C, D, E, F (o 9-1 GCSE)
 * - US: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F (GPA 0-4)
 * - DE: 1.0-6.0 (1 es mejor)
 * - AR: 1-10 (10 es mejor)
 */

// Tablas de conversion (valores normalizados 0-100)
const TABLAS_CONVERSION = {
  UK_LETRAS: {
    'A*': { min: 90, max: 100, gpa: 4.0, de: 1.0, ar: 10 },
    'A': { min: 80, max: 89, gpa: 4.0, de: 1.3, ar: 9 },
    'B': { min: 70, max: 79, gpa: 3.0, de: 2.0, ar: 8 },
    'C': { min: 60, max: 69, gpa: 2.0, de: 3.0, ar: 7 },
    'D': { min: 50, max: 59, gpa: 1.0, de: 4.0, ar: 6 },
    'E': { min: 40, max: 49, gpa: 0.5, de: 5.0, ar: 5 },
    'F': { min: 0, max: 39, gpa: 0.0, de: 6.0, ar: 4 },
    'U': { min: 0, max: 0, gpa: 0.0, de: 6.0, ar: 1 }
  },

  US_GPA: {
    4.0: { uk: 'A*', de: 1.0, ar: 10, porcentaje: 95 },
    3.7: { uk: 'A', de: 1.3, ar: 9, porcentaje: 90 },
    3.3: { uk: 'A', de: 1.7, ar: 9, porcentaje: 87 },
    3.0: { uk: 'B', de: 2.0, ar: 8, porcentaje: 83 },
    2.7: { uk: 'B', de: 2.3, ar: 8, porcentaje: 80 },
    2.3: { uk: 'B', de: 2.7, ar: 7, porcentaje: 77 },
    2.0: { uk: 'C', de: 3.0, ar: 7, porcentaje: 73 },
    1.7: { uk: 'C', de: 3.3, ar: 6, porcentaje: 70 },
    1.3: { uk: 'C', de: 3.7, ar: 6, porcentaje: 67 },
    1.0: { uk: 'D', de: 4.0, ar: 5, porcentaje: 63 },
    0.0: { uk: 'F', de: 6.0, ar: 1, porcentaje: 0 }
  },

  US_LETRAS: {
    'A+': { gpa: 4.0, porcentaje: 97 },
    'A': { gpa: 4.0, porcentaje: 93 },
    'A-': { gpa: 3.7, porcentaje: 90 },
    'B+': { gpa: 3.3, porcentaje: 87 },
    'B': { gpa: 3.0, porcentaje: 83 },
    'B-': { gpa: 2.7, porcentaje: 80 },
    'C+': { gpa: 2.3, porcentaje: 77 },
    'C': { gpa: 2.0, porcentaje: 73 },
    'C-': { gpa: 1.7, porcentaje: 70 },
    'D+': { gpa: 1.3, porcentaje: 67 },
    'D': { gpa: 1.0, porcentaje: 63 },
    'D-': { gpa: 0.7, porcentaje: 60 },
    'F': { gpa: 0.0, porcentaje: 0 }
  },

  // Alemania: 1.0-6.0 (1 es excelente, 4 es aprobado, >4 es desaprobado)
  DE_RANGOS: [
    { nota: 1.0, uk: 'A*', gpa: 4.0, ar: 10, descripcion: 'Sehr gut (Excelente)' },
    { nota: 1.3, uk: 'A', gpa: 4.0, ar: 10, descripcion: 'Sehr gut' },
    { nota: 1.7, uk: 'A', gpa: 3.7, ar: 9, descripcion: 'Gut (Bueno)' },
    { nota: 2.0, uk: 'B', gpa: 3.3, ar: 8, descripcion: 'Gut' },
    { nota: 2.3, uk: 'B', gpa: 3.0, ar: 8, descripcion: 'Gut' },
    { nota: 2.7, uk: 'B', gpa: 2.7, ar: 7, descripcion: 'Befriedigend (Satisfactorio)' },
    { nota: 3.0, uk: 'C', gpa: 2.3, ar: 7, descripcion: 'Befriedigend' },
    { nota: 3.3, uk: 'C', gpa: 2.0, ar: 6, descripcion: 'Befriedigend' },
    { nota: 3.7, uk: 'C', gpa: 1.7, ar: 6, descripcion: 'Ausreichend (Suficiente)' },
    { nota: 4.0, uk: 'D', gpa: 1.0, ar: 5, descripcion: 'Ausreichend' },
    { nota: 5.0, uk: 'E', gpa: 0.0, ar: 3, descripcion: 'Mangelhaft (Deficiente)' },
    { nota: 6.0, uk: 'F', gpa: 0.0, ar: 1, descripcion: 'Ungenugend (Insuficiente)' }
  ]
};

/**
 * Convertir valor a normalizado (0-100)
 */
const normalizarValor = (sistemaOrigen, valorOriginal) => {
  switch (sistemaOrigen) {
    case 'UK':
      if (valorOriginal.uk?.letra) {
        const conv = TABLAS_CONVERSION.UK_LETRAS[valorOriginal.uk.letra];
        return conv ? (conv.min + conv.max) / 2 : null;
      }
      if (valorOriginal.uk?.numerico) {
        return (valorOriginal.uk.numerico / 9) * 100;
      }
      break;

    case 'US':
      if (valorOriginal.us?.porcentaje) {
        return valorOriginal.us.porcentaje;
      }
      if (valorOriginal.us?.gpa) {
        return (valorOriginal.us.gpa / 4) * 100;
      }
      if (valorOriginal.us?.letra) {
        const conv = TABLAS_CONVERSION.US_LETRAS[valorOriginal.us.letra];
        return conv ? conv.porcentaje : null;
      }
      break;

    case 'DE':
      if (valorOriginal.de?.nota) {
        // Formula: (6 - nota) / 5 * 100
        return ((6 - valorOriginal.de.nota) / 5) * 100;
      }
      break;

    case 'AR':
      if (valorOriginal.ar?.nota) {
        return valorOriginal.ar.nota * 10;
      }
      break;
  }
  return null;
};

/**
 * Convertir de valor normalizado a sistema destino
 */
const desnormalizarValor = (normalizado, sistemaDestino) => {
  switch (sistemaDestino) {
    case 'UK':
      // Encontrar letra correspondiente
      for (const [letra, rango] of Object.entries(TABLAS_CONVERSION.UK_LETRAS)) {
        if (normalizado >= rango.min && normalizado <= rango.max) {
          return {
            uk: {
              letra,
              descripcion: `Equivalente a ${letra}`
            }
          };
        }
      }
      return { uk: { letra: 'U', descripcion: 'No clasificado' } };

    case 'US':
      const gpa = (normalizado / 100) * 4;
      let letraUS = 'F';
      for (const [letra, datos] of Object.entries(TABLAS_CONVERSION.US_LETRAS)) {
        if (normalizado >= datos.porcentaje - 3) {
          letraUS = letra;
          break;
        }
      }
      return {
        us: {
          gpa: Math.round(gpa * 100) / 100,
          letra: letraUS,
          porcentaje: Math.round(normalizado)
        }
      };

    case 'DE':
      // Formula inversa: nota = 6 - (normalizado / 100 * 5)
      const notaDE = 6 - (normalizado / 100) * 5;
      const notaRedondeada = Math.round(notaDE * 10) / 10;
      const rangoDE = TABLAS_CONVERSION.DE_RANGOS.find(r => r.nota >= notaRedondeada) ||
        TABLAS_CONVERSION.DE_RANGOS[TABLAS_CONVERSION.DE_RANGOS.length - 1];
      return {
        de: {
          nota: Math.max(1.0, Math.min(6.0, notaRedondeada)),
          descripcion: rangoDE.descripcion
        }
      };

    case 'AR':
      const notaAR = Math.round(normalizado / 10);
      return {
        ar: {
          nota: Math.max(1, Math.min(10, notaAR)),
          aprobado: notaAR >= 4
        }
      };
  }
  return null;
};

/**
 * Servicio principal de conversion
 */
class ConversionService {

  /**
   * Convertir calificacion entre sistemas
   */
  async convertir(sistemaOrigen, sistemaDestino, valorOriginal) {
    try {
      // Verificar cache
      const cacheKey = `conv:${sistemaOrigen}:${sistemaDestino}:${JSON.stringify(valorOriginal)}`;
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);

      if (cached) {
        logger.debug('Conversion obtenida de cache');
        return JSON.parse(cached);
      }

      // Normalizar valor
      const normalizado = normalizarValor(sistemaOrigen, valorOriginal);

      if (normalizado === null) {
        throw new Error(`No se puede normalizar el valor del sistema ${sistemaOrigen}`);
      }

      // Desnormalizar a destino
      const valorConvertido = desnormalizarValor(normalizado, sistemaDestino);

      if (!valorConvertido) {
        throw new Error(`No se puede convertir al sistema ${sistemaDestino}`);
      }

      const resultado = {
        sistemaOrigen,
        sistemaDestino,
        valorOriginal,
        valorNormalizado: Math.round(normalizado * 100) / 100,
        valorConvertido,
        reglaAplicada: `Normalizacion via escala 0-100`,
        versionRegla: '1.0',
        fecha: new Date().toISOString()
      };

      // Guardar en cache (1 hora)
      await redis.setex(cacheKey, 3600, JSON.stringify(resultado));

      return resultado;
    } catch (error) {
      logger.error('Error en conversion:', error);
      throw error;
    }
  }

  /**
   * Convertir a todos los sistemas
   */
  async convertirMultiple(sistemaOrigen, valorOriginal) {
    const sistemas = ['UK', 'US', 'DE', 'AR'].filter(s => s !== sistemaOrigen);
    const conversiones = {};

    for (const destino of sistemas) {
      try {
        conversiones[destino] = await this.convertir(sistemaOrigen, destino, valorOriginal);
      } catch (error) {
        conversiones[destino] = { error: error.message };
      }
    }

    return {
      sistemaOrigen,
      valorOriginal,
      conversiones
    };
  }

  /**
   * Obtener tabla de equivalencias
   */
  getTablaEquivalencias(sistemaOrigen, sistemaDestino) {
    const tabla = [];

    if (sistemaOrigen === 'UK') {
      for (const [letra, datos] of Object.entries(TABLAS_CONVERSION.UK_LETRAS)) {
        const normalizado = (datos.min + datos.max) / 2;
        const convertido = desnormalizarValor(normalizado, sistemaDestino);
        tabla.push({
          origen: { letra },
          normalizado,
          destino: convertido
        });
      }
    } else if (sistemaOrigen === 'US') {
      for (const [letra, datos] of Object.entries(TABLAS_CONVERSION.US_LETRAS)) {
        const convertido = desnormalizarValor(datos.porcentaje, sistemaDestino);
        tabla.push({
          origen: { letra, gpa: datos.gpa },
          normalizado: datos.porcentaje,
          destino: convertido
        });
      }
    } else if (sistemaOrigen === 'DE') {
      for (const rango of TABLAS_CONVERSION.DE_RANGOS) {
        const normalizado = ((6 - rango.nota) / 5) * 100;
        const convertido = desnormalizarValor(normalizado, sistemaDestino);
        tabla.push({
          origen: { nota: rango.nota, descripcion: rango.descripcion },
          normalizado: Math.round(normalizado),
          destino: convertido
        });
      }
    } else if (sistemaOrigen === 'AR') {
      for (let nota = 10; nota >= 1; nota--) {
        const normalizado = nota * 10;
        const convertido = desnormalizarValor(normalizado, sistemaDestino);
        tabla.push({
          origen: { nota, aprobado: nota >= 4 },
          normalizado,
          destino: convertido
        });
      }
    }

    return {
      sistemaOrigen,
      sistemaDestino,
      tabla
    };
  }

  /**
   * Obtener reglas de conversion
   */
  getReglas() {
    return {
      version: '1.0',
      fechaVigencia: '2024-01-01',
      sistemas: ['UK', 'US', 'DE', 'AR'],
      metodologia: 'Normalizacion via escala 0-100',
      tablas: {
        UK: Object.keys(TABLAS_CONVERSION.UK_LETRAS),
        US: Object.keys(TABLAS_CONVERSION.US_LETRAS),
        DE: TABLAS_CONVERSION.DE_RANGOS.map(r => r.nota),
        AR: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      }
    };
  }
}

module.exports = new ConversionService();
