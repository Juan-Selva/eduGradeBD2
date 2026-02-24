const { Materia } = require('../models');
const auditoriaService = require('../services/auditoria.service');
const logger = require('../utils/logger');
const { getNeo4jSession } = require('../config/database');

const DEFAULTS_POR_PAIS = {
  UK: { nivel: 'GCSE', creditos: 2, horasSemanales: 4, prefijo: 'UK-' },
  US: { nivel: 'High School', creditos: 4, horasSemanales: 5, prefijo: 'US-' },
  DE: { nivel: 'Gymnasium', creditos: 4, horasSemanales: 4, prefijo: 'DE-' },
  AR: { nivel: 'Secundario', creditos: 4, horasSemanales: 4, prefijo: 'AR-' },
};

const AREA_ABREV = {
  matematicas: 'MAT', ciencias: 'SCI', lengua: 'LEN', idiomas: 'IDI',
  historia: 'HIS', geografia: 'GEO', arte: 'ART', musica: 'MUS',
  educacion_fisica: 'EDF', tecnologia: 'TEC', otra: 'OTR',
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, sistemaEducativo, area, nivel, search } = req.query;
    const query = {};
    if (search) query.nombre = { $regex: search, $options: 'i' };
    if (sistemaEducativo) query.sistemaEducativo = sistemaEducativo;
    if (area) query.area = area;
    if (nivel) query.nivel = nivel;

    const materias = await Materia.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ nombre: 1 });

    const total = await Materia.countDocuments(query);
    const pages = Math.ceil(total / limit);
    res.json({ data: materias, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages } });
  } catch (error) {
    logger.error('Error obteniendo materias:', error);
    res.status(500).json({ error: 'Error obteniendo materias' });
  }
};

exports.getById = async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id).populate('prerequisitos');
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json(materia);
  } catch (error) {
    logger.error('Error obteniendo materia:', error);
    res.status(500).json({ error: 'Error obteniendo materia' });
  }
};

exports.getBySistema = async (req, res) => {
  try {
    const materias = await Materia.find({ sistemaEducativo: req.params.sistema }).sort({ nombre: 1 });
    res.json(materias);
  } catch (error) {
    logger.error('Error obteniendo materias por sistema:', error);
    res.status(500).json({ error: 'Error obteniendo materias' });
  }
};

exports.create = async (req, res) => {
  try {
    const materia = new Materia(req.body);
    await materia.save();

    // Registrar evento de auditoría
    await auditoriaService.registrarEvento({
      tipoEvento: 'CREATE',
      entidad: 'materia',
      entidadId: materia._id.toString(),
      usuarioId: req.user?.id || 'sistema',
      datos: { nombre: materia.nombre, codigo: materia.codigo },
      ip: req.ip
    });

    res.status(201).json(materia);
  } catch (error) {
    logger.error('Error creando materia:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.createReplicated = async (req, res) => {
  try {
    const { nombre, area } = req.body;
    if (!nombre || !area) {
      return res.status(400).json({ error: 'nombre y area son requeridos' });
    }

    const abrev = AREA_ABREV[area] || 'OTR';
    const seq = String(Date.now()).slice(-4);
    const codigoNormalizado = `${abrev}-${seq}`;
    const sistemas = ['UK', 'US', 'DE', 'AR'];

    const materias = await Promise.all(
      sistemas.map(async (sistema) => {
        const def = DEFAULTS_POR_PAIS[sistema];
        const materia = new Materia({
          codigo: `${def.prefijo}${abrev}-${seq}`,
          nombre,
          sistemaEducativo: sistema,
          area,
          codigoNormalizado,
          nivel: def.nivel,
          creditos: def.creditos,
          horasSemanales: def.horasSemanales,
        });
        await materia.save();
        return materia;
      })
    );

    // Registrar auditoría
    await auditoriaService.registrarEvento({
      tipoEvento: 'CREATE',
      entidad: 'materia',
      entidadId: materias.map((m) => m._id.toString()).join(','),
      usuarioId: req.user?.id || 'sistema',
      datos: { nombre, area, replicada: true, sistemas },
      ip: req.ip,
    });

    // Crear relaciones EQUIVALE en Neo4j
    try {
      const session = getNeo4jSession();
      try {
        for (const m of materias) {
          await session.run(
            `MERGE (m:Materia {mongoId: $id})
             SET m.nombre = $nombre, m.codigo = $codigo, m.sistema = $sistema, m.area = $area`,
            { id: m._id.toString(), nombre: m.nombre, codigo: m.codigo, sistema: m.sistemaEducativo, area: m.area }
          );
        }
        // Crear equivalencias bidireccionales
        for (let i = 0; i < materias.length; i++) {
          for (let j = i + 1; j < materias.length; j++) {
            await session.run(
              `MATCH (m1:Materia {mongoId: $id1}), (m2:Materia {mongoId: $id2})
               CREATE (m1)-[:EQUIVALE {tipo: 'total', porcentaje: 100}]->(m2)
               CREATE (m2)-[:EQUIVALE {tipo: 'total', porcentaje: 100}]->(m1)`,
              { id1: materias[i]._id.toString(), id2: materias[j]._id.toString() }
            );
          }
        }
      } finally {
        await session.close();
      }
    } catch (neo4jError) {
      logger.warn('No se pudieron crear equivalencias en Neo4j:', neo4jError.message);
    }

    res.status(201).json(materias);
  } catch (error) {
    logger.error('Error creando materias replicadas:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    // Registrar evento de auditoría
    await auditoriaService.registrarEvento({
      tipoEvento: 'UPDATE',
      entidad: 'materia',
      entidadId: req.params.id,
      usuarioId: req.user?.id || 'sistema',
      datos: { cambios: Object.keys(req.body) },
      ip: req.ip
    });

    res.json(materia);
  } catch (error) {
    logger.error('Error actualizando materia:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, { estado: 'inactiva' }, { new: true });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    // Registrar evento de auditoría
    await auditoriaService.registrarEvento({
      tipoEvento: 'DELETE',
      entidad: 'materia',
      entidadId: req.params.id,
      usuarioId: req.user?.id || 'sistema',
      datos: {},
      ip: req.ip
    });

    res.json({ message: 'Materia eliminada', materia });
  } catch (error) {
    logger.error('Error eliminando materia:', error);
    res.status(500).json({ error: 'Error eliminando materia' });
  }
};
