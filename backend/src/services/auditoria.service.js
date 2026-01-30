const { getCassandraClient } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Servicio de Auditoria - Cassandra
 * RF5: Auditoria, Trazabilidad y Control Normativo
 *
 * Justificacion Cassandra:
 * - Escritura masiva append-only
 * - Datos inmutables
 * - Consultas por rango de tiempo eficientes
 * - Alta disponibilidad
 */

class AuditoriaService {

  /**
   * Registrar evento de auditoria
   */
  async registrarEvento({ tipoEvento, entidad, entidadId, usuarioId, datos, ip }) {
    try {
      const client = getCassandraClient();
      const eventoId = uuidv4();
      const timestamp = new Date();

      const query = `
        INSERT INTO eventos_auditoria (
          evento_id, tipo_evento, entidad, entidad_id,
          usuario_id, datos, ip, timestamp, anio, mes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        eventoId,
        tipoEvento,
        entidad,
        entidadId,
        usuarioId,
        JSON.stringify(datos || {}),
        ip || 'unknown',
        timestamp,
        timestamp.getFullYear(),
        timestamp.getMonth() + 1
      ];

      await client.execute(query, params, { prepare: true });

      logger.debug(`Evento auditoria registrado: ${eventoId}`);

      return { eventoId, timestamp };
    } catch (error) {
      logger.error('Error registrando evento auditoria:', error);
      // No lanzamos error para no interrumpir operacion principal
      return null;
    }
  }

  /**
   * Obtener eventos de auditoria
   */
  async getEventos({ tipoEvento, entidad, fechaInicio, fechaFin, limit = 100 }) {
    try {
      const client = getCassandraClient();

      let query = 'SELECT * FROM eventos_auditoria';
      const conditions = [];
      const params = [];

      if (tipoEvento) {
        conditions.push('tipo_evento = ?');
        params.push(tipoEvento);
      }

      if (entidad) {
        conditions.push('entidad = ?');
        params.push(entidad);
      }

      if (fechaInicio) {
        conditions.push('timestamp >= ?');
        params.push(new Date(fechaInicio));
      }

      if (fechaFin) {
        conditions.push('timestamp <= ?');
        params.push(new Date(fechaFin));
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
        query += ' ALLOW FILTERING';
      }

      query += ` LIMIT ${limit}`;

      const result = await client.execute(query, params, { prepare: true });

      return result.rows.map(row => ({
        eventoId: row.evento_id,
        tipoEvento: row.tipo_evento,
        entidad: row.entidad,
        entidadId: row.entidad_id,
        usuarioId: row.usuario_id,
        datos: JSON.parse(row.datos || '{}'),
        ip: row.ip,
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error('Error obteniendo eventos:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de una entidad
   */
  async getByEntidad(entidad, entidadId) {
    try {
      const client = getCassandraClient();

      const query = `
        SELECT * FROM eventos_auditoria
        WHERE entidad = ? AND entidad_id = ?
        ALLOW FILTERING
      `;

      const result = await client.execute(query, [entidad, entidadId], { prepare: true });

      return result.rows.map(row => ({
        eventoId: row.evento_id,
        tipoEvento: row.tipo_evento,
        usuarioId: row.usuario_id,
        datos: JSON.parse(row.datos || '{}'),
        ip: row.ip,
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error('Error obteniendo historial entidad:', error);
      throw error;
    }
  }

  /**
   * Obtener acciones de un usuario
   */
  async getByUsuario(usuarioId, limit = 100) {
    try {
      const client = getCassandraClient();

      const query = `
        SELECT * FROM eventos_auditoria
        WHERE usuario_id = ?
        LIMIT ?
        ALLOW FILTERING
      `;

      const result = await client.execute(query, [usuarioId, limit], { prepare: true });

      return result.rows.map(row => ({
        eventoId: row.evento_id,
        tipoEvento: row.tipo_evento,
        entidad: row.entidad,
        entidadId: row.entidad_id,
        datos: JSON.parse(row.datos || '{}'),
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error('Error obteniendo acciones usuario:', error);
      throw error;
    }
  }

  /**
   * Estadisticas de auditoria
   */
  async getEstadisticas(fechaInicio, fechaFin) {
    try {
      const client = getCassandraClient();

      // Cassandra no tiene COUNT(*) eficiente, simulamos
      const eventos = await this.getEventos({
        fechaInicio,
        fechaFin,
        limit: 10000
      });

      const stats = {
        total: eventos.length,
        porTipo: {},
        porEntidad: {},
        porUsuario: {}
      };

      eventos.forEach(e => {
        stats.porTipo[e.tipoEvento] = (stats.porTipo[e.tipoEvento] || 0) + 1;
        stats.porEntidad[e.entidad] = (stats.porEntidad[e.entidad] || 0) + 1;
        stats.porUsuario[e.usuarioId] = (stats.porUsuario[e.usuarioId] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadisticas:', error);
      throw error;
    }
  }
}

module.exports = new AuditoriaService();
