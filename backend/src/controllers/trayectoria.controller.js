const { getNeo4jSession } = require('../config/database');
const { Calificacion, Estudiante } = require('../models');
const conversionService = require('../services/conversion.service');
const logger = require('../utils/logger');
const neo4j = require('neo4j-driver');

// Helper para convertir Integer de Neo4j a numero JavaScript
function toJsNumber(value) {
  if (value === null || value === undefined) return null;
  if (neo4j.isInt(value)) return value.toNumber();
  return value;
}

/**
 * Controller de Trayectorias Academicas
 * Base de datos: Neo4j (grafos)
 * RF3: Relaciones Academicas Complejas
 */

// Obtener trayectoria completa de un estudiante
exports.getByEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.params;
    const { incluirConversiones = 'true' } = req.query;

    // Obtener estudiante
    const estudiante = await Estudiante.findById(estudianteId);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Obtener calificaciones
    const calificaciones = await Calificacion.find({
      estudianteId,
      estado: 'vigente'
    })
      .populate('materiaId', 'nombre codigo sistemaEducativo area')
      .populate('institucionId', 'nombre codigo sistemaEducativo')
      .sort({ fechaEvaluacion: -1 });

    // Obtener relaciones desde Neo4j (opcional - funciona sin Neo4j)
    let grafo = null;

    try {
      const session = getNeo4jSession();
      try {
        const result = await session.run(`
          MATCH (e:Estudiante {mongoId: $estudianteId})
          OPTIONAL MATCH (e)-[r:CURSO]->(m:Materia)
          OPTIONAL MATCH (e)-[a:ASISTIO]->(i:Institucion)
          OPTIONAL MATCH (m)-[eq:EQUIVALE]->(m2:Materia)
          RETURN e, collect(DISTINCT {
            materia: m,
            relacion: r,
            equivalencias: collect(DISTINCT {materia: m2, tipo: eq.tipo})
          }) as materias,
          collect(DISTINCT {institucion: i, desde: a.desde, hasta: a.hasta}) as instituciones
        `, { estudianteId });

        if (result.records.length > 0) {
          const record = result.records[0];
          grafo = {
            materias: record.get('materias'),
            instituciones: record.get('instituciones')
          };
        }
      } finally {
        await session.close();
      }
    } catch (neo4jError) {
      logger.warn('Neo4j no disponible para trayectoria, continuando sin grafo:', neo4jError.message);
      // Continua sin datos de grafo - MongoDB funciona independientemente
    }

    // Agregar conversiones si se solicitan
    let calificacionesConConversiones = calificaciones;
    if (incluirConversiones === 'true') {
      calificacionesConConversiones = await Promise.all(
        calificaciones.map(async (cal) => {
          const conversiones = await conversionService.convertirMultiple(
            cal.sistemaOrigen,
            cal.valorOriginal
          );
          return {
            ...cal.toObject(),
            conversiones: conversiones.conversiones
          };
        })
      );
    }

    res.json({
      estudiante: {
        id: estudiante._id,
        nombre: estudiante.nombreCompleto,
        paisOrigen: estudiante.paisOrigen,
        sistemasEducativos: estudiante.sistemasEducativos
      },
      resumen: {
        totalCalificaciones: calificaciones.length,
        sistemasUsados: [...new Set(calificaciones.map(c => c.sistemaOrigen))],
        instituciones: [...new Set(calificaciones.map(c => c.institucionId?.nombre).filter(Boolean))]
      },
      grafo,
      calificaciones: calificacionesConConversiones
    });
  } catch (error) {
    logger.error('Error obteniendo trayectoria:', error);
    res.status(500).json({ error: 'Error obteniendo trayectoria' });
  }
};

// Obtener equivalencias entre materias
exports.getEquivalencias = async (req, res) => {
  try {
    const { materiaId, sistemaOrigen, sistemaDestino } = req.query;

    const session = getNeo4jSession();

    try {
      let query = `
        MATCH (m1:Materia)-[eq:EQUIVALE]->(m2:Materia)
        WHERE 1=1
      `;
      const params = {};

      if (materiaId) {
        query += ' AND m1.mongoId = $materiaId';
        params.materiaId = materiaId;
      }
      if (sistemaOrigen) {
        query += ' AND m1.sistema = $sistemaOrigen';
        params.sistemaOrigen = sistemaOrigen;
      }
      if (sistemaDestino) {
        query += ' AND m2.sistema = $sistemaDestino';
        params.sistemaDestino = sistemaDestino;
      }

      query += `
        RETURN m1, eq, m2
        LIMIT 100
      `;

      const result = await session.run(query, params);

      const equivalencias = result.records.map(record => ({
        materiaOrigen: record.get('m1').properties,
        materiaDestino: record.get('m2').properties,
        tipoEquivalencia: record.get('eq').properties.tipo,
        porcentaje: toJsNumber(record.get('eq').properties.porcentaje)
      }));

      res.json(equivalencias);
    } finally {
      await session.close();
    }
  } catch (error) {
    logger.error('Error obteniendo equivalencias:', error);
    res.status(500).json({ error: 'Error obteniendo equivalencias' });
  }
};

// Crear equivalencia entre materias
exports.crearEquivalencia = async (req, res) => {
  try {
    const { materiaOrigenId, materiaDestinoId, tipoEquivalencia, porcentajeEquivalencia } = req.body;

    const session = getNeo4jSession();

    try {
      const result = await session.run(`
        MATCH (m1:Materia {mongoId: $materiaOrigenId})
        MATCH (m2:Materia {mongoId: $materiaDestinoId})
        MERGE (m1)-[eq:EQUIVALE {tipo: $tipo, porcentaje: $porcentaje}]->(m2)
        RETURN m1, eq, m2
      `, {
        materiaOrigenId,
        materiaDestinoId,
        tipo: tipoEquivalencia || 'total',
        porcentaje: porcentajeEquivalencia || 100
      });

      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Materias no encontradas en el grafo' });
      }

      res.status(201).json({
        message: 'Equivalencia creada',
        materiaOrigen: result.records[0].get('m1').properties,
        materiaDestino: result.records[0].get('m2').properties
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    logger.error('Error creando equivalencia:', error);
    res.status(500).json({ error: 'Error creando equivalencia' });
  }
};

// Obtener camino academico (grafo estructurado del estudiante)
exports.getCaminoAcademico = async (req, res) => {
  try {
    const { estudianteId } = req.params;

    const session = getNeo4jSession();

    try {
      // Query estructurada: obtener instituciones, materias y equivalencias del estudiante
      const result = await session.run(`
        MATCH (e:Estudiante {mongoId: $estudianteId})

        // Instituciones donde asistio
        OPTIONAL MATCH (e)-[asistio:ASISTIO]->(i:Institucion)

        // Materias que curso
        OPTIONAL MATCH (e)-[curso:CURSO]->(m:Materia)

        // Equivalencias de las materias que curso
        OPTIONAL MATCH (m)-[equiv:EQUIVALE]->(m2:Materia)
        WHERE m2.sistema <> m.sistema

        RETURN e,
          collect(DISTINCT {
            institucion: i.nombre,
            sistema: i.sistema,
            pais: i.pais
          }) as instituciones,
          collect(DISTINCT {
            materia: m.nombre,
            codigo: m.codigo,
            sistema: m.sistema,
            calificacion: curso.calificacion,
            anio: curso.anio
          }) as materiasCursadas,
          collect(DISTINCT {
            materiaOrigen: m.nombre,
            sistemaOrigen: m.sistema,
            materiaDestino: m2.nombre,
            sistemaDestino: m2.sistema,
            tipoEquivalencia: equiv.tipo,
            porcentaje: equiv.porcentaje
          }) as equivalencias
      `, { estudianteId });

      if (result.records.length === 0) {
        return res.json({
          estudiante: null,
          instituciones: [],
          materiasCursadas: [],
          equivalencias: []
        });
      }

      const record = result.records[0];
      const estudianteNode = record.get('e');

      // Filtrar nulls y convertir Integer de Neo4j a numeros JavaScript
      const instituciones = record.get('instituciones')
        .filter(i => i.institucion)
        .map(i => ({
          institucion: i.institucion,
          sistema: i.sistema,
          pais: i.pais
        }));

      const materiasCursadas = record.get('materiasCursadas')
        .filter(m => m.materia)
        .map(m => ({
          materia: m.materia,
          codigo: m.codigo,
          sistema: m.sistema,
          calificacion: toJsNumber(m.calificacion),
          anio: toJsNumber(m.anio)
        }));

      const equivalencias = record.get('equivalencias')
        .filter(eq => eq.materiaOrigen && eq.materiaDestino)
        .map(eq => ({
          materiaOrigen: eq.materiaOrigen,
          sistemaOrigen: eq.sistemaOrigen,
          materiaDestino: eq.materiaDestino,
          sistemaDestino: eq.sistemaDestino,
          tipoEquivalencia: eq.tipoEquivalencia,
          porcentaje: toJsNumber(eq.porcentaje)
        }));

      res.json({
        estudiante: estudianteNode ? {
          nombre: estudianteNode.properties.nombre,
          paisOrigen: estudianteNode.properties.paisOrigen
        } : null,
        instituciones,
        materiasCursadas,
        equivalencias
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    logger.error('Error obteniendo camino academico:', error);
    res.status(500).json({ error: 'Error obteniendo camino academico' });
  }
};
