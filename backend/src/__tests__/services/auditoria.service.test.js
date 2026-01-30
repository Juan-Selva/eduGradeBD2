/**
 * Unit Tests: Auditoria Service
 *
 * Tests audit logging functionality using mocked Cassandra
 */

// Mock Cassandra client
const mockExecute = jest.fn();
const mockCassandraClient = {
  execute: mockExecute
};

jest.mock('../../config/database', () => ({
  getCassandraClient: () => mockCassandraClient
}));

// Mock logger to prevent console output
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const auditoriaService = require('../../services/auditoria.service');

describe('AuditoriaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarEvento()', () => {
    it('should register an audit event', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const evento = {
        tipoEvento: 'CREACION',
        entidad: 'estudiante',
        entidadId: '12345',
        usuarioId: 'user-001',
        datos: { nombre: 'Juan' },
        ip: '192.168.1.1'
      };

      const result = await auditoriaService.registrarEvento(evento);

      expect(result).toBeDefined();
      expect(result.eventoId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(mockExecute).toHaveBeenCalledTimes(1);

      // Check query structure
      const [query, params] = mockExecute.mock.calls[0];
      expect(query).toContain('INSERT INTO eventos_auditoria');
      expect(params).toContain('CREACION');
      expect(params).toContain('estudiante');
      expect(params).toContain('12345');
    });

    it('should handle missing IP', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const evento = {
        tipoEvento: 'MODIFICACION',
        entidad: 'calificacion',
        entidadId: '67890',
        usuarioId: 'user-002'
      };

      const result = await auditoriaService.registrarEvento(evento);

      expect(result).toBeDefined();

      // Check that 'unknown' is used for missing IP
      const [, params] = mockExecute.mock.calls[0];
      expect(params).toContain('unknown');
    });

    it('should handle empty datos', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const evento = {
        tipoEvento: 'CONSULTA',
        entidad: 'reporte',
        entidadId: 'report-001',
        usuarioId: 'user-003',
        ip: '10.0.0.1'
      };

      const result = await auditoriaService.registrarEvento(evento);

      expect(result).toBeDefined();

      // Check that empty object is stringified
      const [, params] = mockExecute.mock.calls[0];
      const datosIndex = 5; // position in params array
      expect(params[datosIndex]).toBe('{}');
    });

    it('should return null on error without throwing', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Cassandra error'));

      const evento = {
        tipoEvento: 'ERROR',
        entidad: 'test',
        entidadId: 'test-001',
        usuarioId: 'user-error'
      };

      const result = await auditoriaService.registrarEvento(evento);

      expect(result).toBeNull();
    });

    it('should include year and month for partitioning', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const evento = {
        tipoEvento: 'CREACION',
        entidad: 'estudiante',
        entidadId: 'est-001',
        usuarioId: 'user-001'
      };

      await auditoriaService.registrarEvento(evento);

      const [, params] = mockExecute.mock.calls[0];
      const year = params[8];
      const month = params[9];

      expect(typeof year).toBe('number');
      expect(typeof month).toBe('number');
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
    });
  });

  describe('getEventos()', () => {
    const mockRows = [
      {
        evento_id: 'evt-001',
        tipo_evento: 'CREACION',
        entidad: 'estudiante',
        entidad_id: 'est-001',
        usuario_id: 'user-001',
        datos: '{"nombre":"Juan"}',
        ip: '192.168.1.1',
        timestamp: new Date()
      },
      {
        evento_id: 'evt-002',
        tipo_evento: 'MODIFICACION',
        entidad: 'estudiante',
        entidad_id: 'est-001',
        usuario_id: 'user-002',
        datos: '{"campo":"apellido"}',
        ip: '192.168.1.2',
        timestamp: new Date()
      }
    ];

    it('should return all events without filters', async () => {
      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      const result = await auditoriaService.getEventos({});

      expect(result).toHaveLength(2);
      expect(result[0].eventoId).toBe('evt-001');
      expect(result[0].tipoEvento).toBe('CREACION');
    });

    it('should filter by tipoEvento', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [mockRows[0]] });

      const result = await auditoriaService.getEventos({
        tipoEvento: 'CREACION'
      });

      expect(mockExecute).toHaveBeenCalled();
      const [query, params] = mockExecute.mock.calls[0];
      expect(query).toContain('tipo_evento = ?');
      expect(params).toContain('CREACION');
    });

    it('should filter by entidad', async () => {
      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      await auditoriaService.getEventos({
        entidad: 'estudiante'
      });

      const [query, params] = mockExecute.mock.calls[0];
      expect(query).toContain('entidad = ?');
      expect(params).toContain('estudiante');
    });

    it('should filter by date range', async () => {
      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      const fechaInicio = '2024-01-01';
      const fechaFin = '2024-12-31';

      await auditoriaService.getEventos({
        fechaInicio,
        fechaFin
      });

      const [query, params] = mockExecute.mock.calls[0];
      expect(query).toContain('timestamp >= ?');
      expect(query).toContain('timestamp <= ?');
    });

    it('should apply limit', async () => {
      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      await auditoriaService.getEventos({ limit: 50 });

      const [query] = mockExecute.mock.calls[0];
      expect(query).toContain('LIMIT 50');
    });

    it('should use default limit of 100', async () => {
      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      await auditoriaService.getEventos({});

      const [query] = mockExecute.mock.calls[0];
      expect(query).toContain('LIMIT 100');
    });

    it('should parse datos JSON correctly', async () => {
      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      const result = await auditoriaService.getEventos({});

      expect(result[0].datos).toEqual({ nombre: 'Juan' });
      expect(result[1].datos).toEqual({ campo: 'apellido' });
    });

    it('should handle null datos', async () => {
      mockExecute.mockResolvedValueOnce({
        rows: [{ ...mockRows[0], datos: null }]
      });

      const result = await auditoriaService.getEventos({});

      expect(result[0].datos).toEqual({});
    });

    it('should throw on error', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Query failed'));

      await expect(
        auditoriaService.getEventos({})
      ).rejects.toThrow('Query failed');
    });
  });

  describe('getByEntidad()', () => {
    it('should return events for specific entity', async () => {
      const mockRows = [{
        evento_id: 'evt-001',
        tipo_evento: 'CREACION',
        usuario_id: 'user-001',
        datos: '{}',
        ip: '127.0.0.1',
        timestamp: new Date()
      }];

      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      const result = await auditoriaService.getByEntidad('estudiante', 'est-001');

      expect(result).toHaveLength(1);

      const [query, params] = mockExecute.mock.calls[0];
      expect(query).toContain('entidad = ?');
      expect(query).toContain('entidad_id = ?');
      expect(params).toContain('estudiante');
      expect(params).toContain('est-001');
    });

    it('should return empty array for entity without events', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const result = await auditoriaService.getByEntidad('institucion', 'inst-999');

      expect(result).toEqual([]);
    });
  });

  describe('getByUsuario()', () => {
    it('should return events for specific user', async () => {
      const mockRows = [{
        evento_id: 'evt-001',
        tipo_evento: 'CREACION',
        entidad: 'estudiante',
        entidad_id: 'est-001',
        datos: '{"accion":"crear"}',
        timestamp: new Date()
      }];

      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      const result = await auditoriaService.getByUsuario('user-001');

      expect(result).toHaveLength(1);
      expect(result[0].tipoEvento).toBe('CREACION');

      const [query, params] = mockExecute.mock.calls[0];
      expect(query).toContain('usuario_id = ?');
      expect(params).toContain('user-001');
    });

    it('should apply custom limit', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      await auditoriaService.getByUsuario('user-001', 50);

      const [query, params] = mockExecute.mock.calls[0];
      expect(query).toContain('LIMIT ?');
      expect(params).toContain(50);
    });
  });

  describe('getEstadisticas()', () => {
    it('should return statistics for date range', async () => {
      const mockRows = [
        { evento_id: 'e1', tipo_evento: 'CREACION', entidad: 'estudiante', usuario_id: 'u1', datos: '{}', timestamp: new Date() },
        { evento_id: 'e2', tipo_evento: 'CREACION', entidad: 'estudiante', usuario_id: 'u1', datos: '{}', timestamp: new Date() },
        { evento_id: 'e3', tipo_evento: 'MODIFICACION', entidad: 'calificacion', usuario_id: 'u2', datos: '{}', timestamp: new Date() }
      ];

      mockExecute.mockResolvedValueOnce({ rows: mockRows });

      const result = await auditoriaService.getEstadisticas('2024-01-01', '2024-12-31');

      expect(result.total).toBe(3);
      expect(result.porTipo.CREACION).toBe(2);
      expect(result.porTipo.MODIFICACION).toBe(1);
      expect(result.porEntidad.estudiante).toBe(2);
      expect(result.porEntidad.calificacion).toBe(1);
      expect(result.porUsuario.u1).toBe(2);
      expect(result.porUsuario.u2).toBe(1);
    });

    it('should handle empty result', async () => {
      mockExecute.mockResolvedValueOnce({ rows: [] });

      const result = await auditoriaService.getEstadisticas('2024-01-01', '2024-01-02');

      expect(result.total).toBe(0);
      expect(result.porTipo).toEqual({});
      expect(result.porEntidad).toEqual({});
      expect(result.porUsuario).toEqual({});
    });
  });
});
