/**
 * Unit Tests: Conversion Service
 *
 * Tests grade conversion between educational systems:
 * UK, US, DE, AR
 */

// Mock Redis before importing the service
jest.mock('../../config/database', () => ({
  getRedisClient: () => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK')
  })
}));

const conversionService = require('../../services/conversion.service');

describe('ConversionService', () => {
  describe('UK to US conversion', () => {
    it('should convert UK A* to US A+ (90-100%)', async () => {
      const result = await conversionService.convertir('UK', 'US', {
        uk: { letra: 'A*' }
      });

      expect(result.sistemaOrigen).toBe('UK');
      expect(result.sistemaDestino).toBe('US');
      expect(result.valorNormalizado).toBeGreaterThanOrEqual(90);
      expect(result.valorConvertido.us).toBeDefined();
      expect(result.valorConvertido.us.gpa).toBeGreaterThanOrEqual(3.7);
    });

    it('should convert UK A to US A', async () => {
      const result = await conversionService.convertir('UK', 'US', {
        uk: { letra: 'A' }
      });

      expect(result.valorNormalizado).toBeGreaterThanOrEqual(80);
      expect(result.valorNormalizado).toBeLessThan(90);
      expect(result.valorConvertido.us.gpa).toBeGreaterThanOrEqual(3.0);
    });

    it('should convert UK B to US B range', async () => {
      const result = await conversionService.convertir('UK', 'US', {
        uk: { letra: 'B' }
      });

      expect(result.valorNormalizado).toBeGreaterThanOrEqual(70);
      expect(result.valorNormalizado).toBeLessThan(80);
    });

    it('should convert UK C to US C range', async () => {
      const result = await conversionService.convertir('UK', 'US', {
        uk: { letra: 'C' }
      });

      expect(result.valorNormalizado).toBeGreaterThanOrEqual(60);
      expect(result.valorNormalizado).toBeLessThan(70);
    });
  });

  describe('US to DE conversion', () => {
    it('should convert US A (4.0 GPA) to DE 1.0-1.3', async () => {
      const result = await conversionService.convertir('US', 'DE', {
        us: { gpa: 4.0 }
      });

      expect(result.valorConvertido.de).toBeDefined();
      expect(result.valorConvertido.de.nota).toBeLessThanOrEqual(1.5);
    });

    it('should convert US B (3.0 GPA) to DE ~2.0', async () => {
      const result = await conversionService.convertir('US', 'DE', {
        us: { gpa: 3.0 }
      });

      expect(result.valorConvertido.de.nota).toBeGreaterThanOrEqual(1.5);
      expect(result.valorConvertido.de.nota).toBeLessThanOrEqual(2.5);
    });

    it('should convert US percentage to DE', async () => {
      const result = await conversionService.convertir('US', 'DE', {
        us: { porcentaje: 85 }
      });

      expect(result.valorNormalizado).toBe(85);
      expect(result.valorConvertido.de.nota).toBeDefined();
    });

    it('should convert US letter grade to DE', async () => {
      const result = await conversionService.convertir('US', 'DE', {
        us: { letra: 'B+' }
      });

      expect(result.valorConvertido.de).toBeDefined();
    });
  });

  describe('DE to AR conversion', () => {
    it('should convert DE 1.0 to AR 10', async () => {
      const result = await conversionService.convertir('DE', 'AR', {
        de: { nota: 1.0 }
      });

      expect(result.valorConvertido.ar).toBeDefined();
      expect(result.valorConvertido.ar.nota).toBe(10);
    });

    it('should convert DE 2.0 to AR 8', async () => {
      const result = await conversionService.convertir('DE', 'AR', {
        de: { nota: 2.0 }
      });

      expect(result.valorConvertido.ar.nota).toBe(8);
    });

    it('should convert DE 4.0 (passing) to AR 5-6', async () => {
      const result = await conversionService.convertir('DE', 'AR', {
        de: { nota: 4.0 }
      });

      expect(result.valorConvertido.ar.nota).toBeGreaterThanOrEqual(4);
      expect(result.valorConvertido.ar.nota).toBeLessThanOrEqual(6);
    });

    it('should mark AR grade as aprobado correctly', async () => {
      const passingResult = await conversionService.convertir('DE', 'AR', {
        de: { nota: 3.0 }
      });
      expect(passingResult.valorConvertido.ar.aprobado).toBe(true);

      const failingResult = await conversionService.convertir('DE', 'AR', {
        de: { nota: 5.5 }
      });
      expect(failingResult.valorConvertido.ar.aprobado).toBe(false);
    });
  });

  describe('AR to UK conversion', () => {
    it('should convert AR 10 to UK A*', async () => {
      const result = await conversionService.convertir('AR', 'UK', {
        ar: { nota: 10 }
      });

      expect(result.valorConvertido.uk).toBeDefined();
      expect(result.valorConvertido.uk.letra).toBe('A*');
    });

    it('should convert AR 9 to UK A*', async () => {
      const result = await conversionService.convertir('AR', 'UK', {
        ar: { nota: 9 }
      });

      // AR 9 = 90 normalized, which maps to A* (90-100)
      expect(result.valorConvertido.uk.letra).toBe('A*');
    });

    it('should convert AR 7 to UK B', async () => {
      const result = await conversionService.convertir('AR', 'UK', {
        ar: { nota: 7 }
      });

      // AR 7 = 70 normalized, which maps to B (70-79)
      expect(result.valorConvertido.uk.letra).toBe('B');
    });

    it('should convert AR 4 (passing) to UK low grade', async () => {
      const result = await conversionService.convertir('AR', 'UK', {
        ar: { nota: 4 }
      });

      expect(['E', 'F']).toContain(result.valorConvertido.uk.letra);
    });
  });

  describe('convertirMultiple()', () => {
    it('should convert to all other systems', async () => {
      const result = await conversionService.convertirMultiple('AR', {
        ar: { nota: 8 }
      });

      expect(result.sistemaOrigen).toBe('AR');
      expect(result.conversiones.UK).toBeDefined();
      expect(result.conversiones.US).toBeDefined();
      expect(result.conversiones.DE).toBeDefined();
      expect(result.conversiones.AR).toBeUndefined(); // Should not include origin
    });

    it('should handle errors for individual conversions', async () => {
      const result = await conversionService.convertirMultiple('AR', {
        ar: { nota: 8 }
      });

      // All conversions should succeed or have error property
      ['UK', 'US', 'DE'].forEach(sistema => {
        expect(
          result.conversiones[sistema].valorConvertido ||
          result.conversiones[sistema].error
        ).toBeDefined();
      });
    });
  });

  describe('getTablaEquivalencias()', () => {
    it('should return UK to US equivalence table', () => {
      const tabla = conversionService.getTablaEquivalencias('UK', 'US');

      expect(tabla.sistemaOrigen).toBe('UK');
      expect(tabla.sistemaDestino).toBe('US');
      expect(tabla.tabla).toBeDefined();
      expect(tabla.tabla.length).toBeGreaterThan(0);

      // Check first entry (A*)
      const firstEntry = tabla.tabla[0];
      expect(firstEntry.origen).toBeDefined();
      expect(firstEntry.normalizado).toBeDefined();
      expect(firstEntry.destino).toBeDefined();
    });

    it('should return US to DE equivalence table', () => {
      const tabla = conversionService.getTablaEquivalencias('US', 'DE');

      expect(tabla.sistemaOrigen).toBe('US');
      expect(tabla.sistemaDestino).toBe('DE');
      expect(tabla.tabla.length).toBeGreaterThan(0);
    });

    it('should return DE to AR equivalence table', () => {
      const tabla = conversionService.getTablaEquivalencias('DE', 'AR');

      expect(tabla.tabla.length).toBeGreaterThan(0);

      // Check DE nota ranges
      const notas = tabla.tabla.map(e => e.origen.nota);
      expect(notas).toContain(1.0);
      expect(notas).toContain(6.0);
    });

    it('should return AR to UK equivalence table', () => {
      const tabla = conversionService.getTablaEquivalencias('AR', 'UK');

      expect(tabla.tabla.length).toBe(10); // 1-10

      // Check AR nota 10 converts to A*
      const nota10 = tabla.tabla.find(e => e.origen.nota === 10);
      expect(nota10.destino.uk.letra).toBe('A*');
    });
  });

  describe('getReglas()', () => {
    it('should return conversion rules metadata', () => {
      const reglas = conversionService.getReglas();

      expect(reglas.version).toBeDefined();
      expect(reglas.sistemas).toContain('UK');
      expect(reglas.sistemas).toContain('US');
      expect(reglas.sistemas).toContain('DE');
      expect(reglas.sistemas).toContain('AR');
      expect(reglas.metodologia).toBeDefined();
      expect(reglas.tablas).toBeDefined();
    });

    it('should include grade scales for each system', () => {
      const reglas = conversionService.getReglas();

      expect(reglas.tablas.UK).toContain('A*');
      expect(reglas.tablas.US).toContain('A+');
      expect(reglas.tablas.DE).toContain(1.0);
      expect(reglas.tablas.AR).toContain(10);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid origin system data', async () => {
      await expect(
        conversionService.convertir('UK', 'US', {})
      ).rejects.toThrow();
    });

    it('should throw error for missing grade value', async () => {
      await expect(
        conversionService.convertir('UK', 'US', {
          us: { porcentaje: 90 } // Wrong system
        })
      ).rejects.toThrow();
    });
  });

  describe('Normalization accuracy', () => {
    it('should normalize UK numeric grade (1-9)', async () => {
      const result = await conversionService.convertir('UK', 'US', {
        uk: { numerico: 9 }
      });

      expect(result.valorNormalizado).toBe(100);
    });

    it('should normalize UK numeric grade 5 to ~55%', async () => {
      const result = await conversionService.convertir('UK', 'AR', {
        uk: { numerico: 5 }
      });

      // 5/9 * 100 = 55.55
      expect(result.valorNormalizado).toBeCloseTo(55.55, 1);
    });
  });

  describe('Cache behavior', () => {
    it('should return consistent results (mocked cache)', async () => {
      const result1 = await conversionService.convertir('AR', 'UK', {
        ar: { nota: 7 }
      });

      const result2 = await conversionService.convertir('AR', 'UK', {
        ar: { nota: 7 }
      });

      expect(result1.valorConvertido.uk.letra).toBe(result2.valorConvertido.uk.letra);
    });
  });
});
