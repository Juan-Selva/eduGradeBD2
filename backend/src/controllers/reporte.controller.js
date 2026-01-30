const { Calificacion, Estudiante, Institucion, Materia } = require('../models');
const { getCassandraClient, getRedisClient } = require('../config/database');
const logger = require('../utils/logger');

// TTL para caché de reportes (5 minutos)
const CACHE_TTL_REPORTES = 300;

/**
 * Controller de Reportes Analiticos
 * Base de datos: Cassandra (datos historicos) + MongoDB (agregaciones)
 * RF4: Analisis y Reportes Oficiales
 */

// Promedio por pais
exports.getPromedioPorPais = async (req, res) => {
  try {
    const { anio, pais } = req.query;

    const match = { estado: 'vigente' };
    if (anio) match['cicloLectivo.anio'] = parseInt(anio);
    if (pais) match.sistemaOrigen = pais;

    const resultado = await Calificacion.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'estudiantes',
          localField: 'estudianteId',
          foreignField: '_id',
          as: 'estudiante'
        }
      },
      { $unwind: '$estudiante' },
      {
        $group: {
          _id: '$sistemaOrigen',
          totalCalificaciones: { $sum: 1 },
          promedioNormalizado: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$sistemaOrigen', 'AR'] }, then: { $multiply: ['$valorOriginal.ar.nota', 10] } },
                  { case: { $eq: ['$sistemaOrigen', 'US'] }, then: { $ifNull: ['$valorOriginal.us.porcentaje', { $multiply: ['$valorOriginal.us.gpa', 25] }] } },
                  { case: { $eq: ['$sistemaOrigen', 'DE'] }, then: { $multiply: [{ $subtract: [6, '$valorOriginal.de.nota'] }, 20] } }
                ],
                default: 75
              }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      filtros: { anio, pais },
      datos: resultado.map(r => ({
        pais: r._id,
        totalCalificaciones: r.totalCalificaciones,
        promedioNormalizado: Math.round(r.promedioNormalizado * 100) / 100
      }))
    });
  } catch (error) {
    logger.error('Error en reporte por pais:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// Promedio por institucion
exports.getPromedioPorInstitucion = async (req, res) => {
  try {
    const { institucionId, anio } = req.query;

    const match = { estado: 'vigente' };
    if (anio) match['cicloLectivo.anio'] = parseInt(anio);

    const resultado = await Calificacion.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'instituciones',
          localField: 'institucionId',
          foreignField: '_id',
          as: 'institucion'
        }
      },
      { $unwind: '$institucion' },
      {
        $group: {
          _id: { id: '$institucionId', nombre: '$institucion.nombre', sistema: '$institucion.sistemaEducativo' },
          totalCalificaciones: { $sum: 1 },
          totalEstudiantes: { $addToSet: '$estudianteId' }
        }
      },
      {
        $project: {
          institucion: '$_id',
          totalCalificaciones: 1,
          totalEstudiantes: { $size: '$totalEstudiantes' }
        }
      },
      { $sort: { totalCalificaciones: -1 } },
      { $limit: 20 }
    ]);

    res.json({ filtros: { institucionId, anio }, datos: resultado });
  } catch (error) {
    logger.error('Error en reporte por institucion:', error);
    res.status(500).json({ error: 'Error generando reporte' });
  }
};

// Distribucion de calificaciones
exports.getDistribucion = async (req, res) => {
  try {
    const { sistemaEducativo, anio } = req.query;

    const match = { estado: 'vigente' };
    if (anio) match['cicloLectivo.anio'] = parseInt(anio);
    if (sistemaEducativo) match.sistemaOrigen = sistemaEducativo;

    // Distribucion por rangos
    const resultado = await Calificacion.aggregate([
      { $match: match },
      {
        $addFields: {
          rango: {
            $switch: {
              branches: [
                { case: { $eq: ['$sistemaOrigen', 'AR'] }, then: {
                  $switch: {
                    branches: [
                      { case: { $gte: ['$valorOriginal.ar.nota', 9] }, then: 'Excelente (9-10)' },
                      { case: { $gte: ['$valorOriginal.ar.nota', 7] }, then: 'Bueno (7-8)' },
                      { case: { $gte: ['$valorOriginal.ar.nota', 4] }, then: 'Aprobado (4-6)' }
                    ],
                    default: 'Desaprobado (1-3)'
                  }
                }},
                { case: { $eq: ['$sistemaOrigen', 'US'] }, then: {
                  $switch: {
                    branches: [
                      { case: { $gte: ['$valorOriginal.us.gpa', 3.5] }, then: 'Excelente (A)' },
                      { case: { $gte: ['$valorOriginal.us.gpa', 2.5] }, then: 'Bueno (B)' },
                      { case: { $gte: ['$valorOriginal.us.gpa', 1.5] }, then: 'Aprobado (C-D)' }
                    ],
                    default: 'Desaprobado (F)'
                  }
                }}
              ],
              default: 'Otro'
            }
          }
        }
      },
      {
        $group: {
          _id: { sistema: '$sistemaOrigen', rango: '$rango' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { '_id.sistema': 1, '_id.rango': 1 } }
    ]);

    res.json({ filtros: { sistemaEducativo, anio }, distribucion: resultado });
  } catch (error) {
    logger.error('Error en distribucion:', error);
    res.status(500).json({ error: 'Error generando distribucion' });
  }
};

// Tasa de aprobacion
exports.getTasaAprobacion = async (req, res) => {
  try {
    const { pais, nivel, anio } = req.query;

    const match = { estado: 'vigente' };
    if (anio) match['cicloLectivo.anio'] = parseInt(anio);
    if (pais) match.sistemaOrigen = pais;

    const resultado = await Calificacion.aggregate([
      { $match: match },
      {
        $addFields: {
          aprobado: {
            $switch: {
              branches: [
                { case: { $eq: ['$sistemaOrigen', 'AR'] }, then: { $gte: ['$valorOriginal.ar.nota', 4] } },
                { case: { $eq: ['$sistemaOrigen', 'US'] }, then: { $gte: ['$valorOriginal.us.gpa', 1.0] } },
                { case: { $eq: ['$sistemaOrigen', 'DE'] }, then: { $lte: ['$valorOriginal.de.nota', 4.0] } },
                { case: { $eq: ['$sistemaOrigen', 'UK'] }, then: { $ne: ['$valorOriginal.uk.letra', 'U'] } }
              ],
              default: true
            }
          }
        }
      },
      {
        $group: {
          _id: '$sistemaOrigen',
          total: { $sum: 1 },
          aprobados: { $sum: { $cond: ['$aprobado', 1, 0] } }
        }
      },
      {
        $project: {
          sistema: '$_id',
          total: 1,
          aprobados: 1,
          tasaAprobacion: { $multiply: [{ $divide: ['$aprobados', '$total'] }, 100] }
        }
      }
    ]);

    res.json({ filtros: { pais, nivel, anio }, tasas: resultado });
  } catch (error) {
    logger.error('Error en tasa aprobacion:', error);
    res.status(500).json({ error: 'Error generando tasa' });
  }
};

// Comparacion historica
exports.getComparacionHistorica = async (req, res) => {
  try {
    const { anioInicio = 2020, anioFin = 2024 } = req.query;

    const resultado = await Calificacion.aggregate([
      {
        $match: {
          estado: 'vigente',
          'cicloLectivo.anio': { $gte: parseInt(anioInicio), $lte: parseInt(anioFin) }
        }
      },
      {
        $group: {
          _id: { anio: '$cicloLectivo.anio', sistema: '$sistemaOrigen' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { '_id.anio': 1, '_id.sistema': 1 } }
    ]);

    res.json({ periodo: { inicio: anioInicio, fin: anioFin }, datos: resultado });
  } catch (error) {
    logger.error('Error en comparacion historica:', error);
    res.status(500).json({ error: 'Error generando comparacion' });
  }
};

// Dashboard resumen - RF4
exports.getResumen = async (req, res) => {
  try {
    const [totalEstudiantes, totalInstituciones, totalMaterias, totalCalificaciones, promedioResult] = await Promise.all([
      Estudiante.countDocuments(),
      Institucion.countDocuments(),
      Materia.countDocuments(),
      Calificacion.countDocuments({ estado: 'vigente' }),
      Calificacion.aggregate([
        { $match: { estado: 'vigente' } },
        {
          $group: {
            _id: null,
            promedioGeneral: {
              $avg: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$sistemaOrigen', 'AR'] }, then: { $multiply: ['$valorOriginal.ar.nota', 10] } },
                    { case: { $eq: ['$sistemaOrigen', 'US'] }, then: { $ifNull: ['$valorOriginal.us.porcentaje', { $multiply: ['$valorOriginal.us.gpa', 25] }] } },
                    { case: { $eq: ['$sistemaOrigen', 'DE'] }, then: { $multiply: [{ $subtract: [6, '$valorOriginal.de.nota'] }, 20] } },
                    { case: { $eq: ['$sistemaOrigen', 'UK'] }, then: { $ifNull: ['$valorOriginal.uk.puntos', 50] } }
                  ],
                  default: 50
                }
              }
            }
          }
        }
      ])
    ]);

    const promedioGeneral = promedioResult[0]?.promedioGeneral || 0;

    res.json({
      totalEstudiantes,
      totalInstituciones,
      totalMaterias,
      totalCalificaciones,
      promedioGeneral: Math.round(promedioGeneral * 100) / 100
    });
  } catch (error) {
    logger.error('Error en resumen dashboard:', error);
    res.status(500).json({ error: 'Error generando resumen' });
  }
};

// Promedios por materia - para frontend
exports.getPromediosPorMateria = async (req, res) => {
  try {
    const { anio, pais, orden = 'desc', page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Verificar caché Redis
    const cacheKey = `reportes:promedios-materia:${anio || 'all'}:${pais || 'all'}:${orden}:${pageNum}:${limitNum}`;
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);

    if (cached) {
      logger.debug('Promedios por materia obtenidos de cache');
      return res.json(JSON.parse(cached));
    }

    const match = { estado: 'vigente' };
    if (anio) match['cicloLectivo.anio'] = parseInt(anio);
    if (pais) match.sistemaOrigen = pais;

    const sortOrder = orden === 'asc' ? 1 : -1;

    // Pipeline base para agrupar
    const basePipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'materias',
          localField: 'materiaId',
          foreignField: '_id',
          as: 'materia'
        }
      },
      { $unwind: '$materia' },
      {
        $group: {
          _id: { id: '$materiaId', nombre: '$materia.nombre', area: '$materia.area' },
          totalCalificaciones: { $sum: 1 },
          totalEstudiantes: { $addToSet: '$estudianteId' },
          promedioNormalizado: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$sistemaOrigen', 'AR'] }, then: { $multiply: ['$valorOriginal.ar.nota', 10] } },
                  { case: { $eq: ['$sistemaOrigen', 'US'] }, then: { $ifNull: ['$valorOriginal.us.porcentaje', { $multiply: ['$valorOriginal.us.gpa', 25] }] } },
                  { case: { $eq: ['$sistemaOrigen', 'DE'] }, then: { $multiply: [{ $subtract: [6, '$valorOriginal.de.nota'] }, 20] } },
                  { case: { $eq: ['$sistemaOrigen', 'UK'] }, then: { $ifNull: ['$valorOriginal.uk.puntos', 50] } }
                ],
                default: 50
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          materiaId: '$_id.id',
          nombre: '$_id.nombre',
          area: '$_id.area',
          totalCalificaciones: 1,
          totalEstudiantes: { $size: '$totalEstudiantes' },
          promedio: { $round: ['$promedioNormalizado', 2] }
        }
      },
      { $sort: { promedio: sortOrder } }
    ];

    // Contar total
    const countResult = await Calificacion.aggregate([...basePipeline, { $count: 'total' }]);
    const total = countResult[0]?.total || 0;

    // Obtener datos paginados
    const resultado = await Calificacion.aggregate([
      ...basePipeline,
      { $skip: skip },
      { $limit: limitNum }
    ]);

    const response = {
      data: resultado,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };

    // Guardar en caché Redis
    await redis.setex(cacheKey, CACHE_TTL_REPORTES, JSON.stringify(response));
    logger.debug('Promedios por materia guardados en cache');

    res.json(response);
  } catch (error) {
    logger.error('Error en promedios por materia:', error);
    res.status(500).json({ error: 'Error generando promedios por materia' });
  }
};

// Promedios por institucion - para frontend
exports.getPromediosPorInstitucion = async (req, res) => {
  try {
    const { anio, pais, orden = 'desc', page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Verificar caché Redis
    const cacheKey = `reportes:promedios-institucion:${anio || 'all'}:${pais || 'all'}:${orden}:${pageNum}:${limitNum}`;
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);

    if (cached) {
      logger.debug('Promedios por institucion obtenidos de cache');
      return res.json(JSON.parse(cached));
    }

    const match = { estado: 'vigente' };
    if (anio) match['cicloLectivo.anio'] = parseInt(anio);

    const sortOrder = orden === 'asc' ? 1 : -1;

    // Pipeline base
    const basePipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'instituciones',
          localField: 'institucionId',
          foreignField: '_id',
          as: 'institucion'
        }
      },
      { $unwind: '$institucion' },
    ];

    // Filtro por pais (usando sistemaEducativo que tiene los codigos AR, UK, US, DE)
    if (pais) {
      basePipeline.push({ $match: { 'institucion.sistemaEducativo': pais } });
    }

    // Group y project
    basePipeline.push(
      {
        $group: {
          _id: { id: '$institucionId', nombre: '$institucion.nombre', pais: '$institucion.pais' },
          totalCalificaciones: { $sum: 1 },
          totalEstudiantes: { $addToSet: '$estudianteId' },
          promedioNormalizado: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$sistemaOrigen', 'AR'] }, then: { $multiply: ['$valorOriginal.ar.nota', 10] } },
                  { case: { $eq: ['$sistemaOrigen', 'US'] }, then: { $ifNull: ['$valorOriginal.us.porcentaje', { $multiply: ['$valorOriginal.us.gpa', 25] }] } },
                  { case: { $eq: ['$sistemaOrigen', 'DE'] }, then: { $multiply: [{ $subtract: [6, '$valorOriginal.de.nota'] }, 20] } },
                  { case: { $eq: ['$sistemaOrigen', 'UK'] }, then: { $ifNull: ['$valorOriginal.uk.puntos', 50] } }
                ],
                default: 50
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          institucionId: '$_id.id',
          nombre: '$_id.nombre',
          pais: '$_id.pais',
          totalCalificaciones: 1,
          totalEstudiantes: { $size: '$totalEstudiantes' },
          promedio: { $round: ['$promedioNormalizado', 2] }
        }
      },
      { $sort: { promedio: sortOrder } }
    );

    // Contar total
    const countResult = await Calificacion.aggregate([...basePipeline, { $count: 'total' }]);
    const total = countResult[0]?.total || 0;

    // Obtener datos paginados
    const resultado = await Calificacion.aggregate([
      ...basePipeline,
      { $skip: skip },
      { $limit: limitNum }
    ]);

    const response = {
      data: resultado,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };

    // Guardar en caché Redis
    await redis.setex(cacheKey, CACHE_TTL_REPORTES, JSON.stringify(response));
    logger.debug('Promedios por institucion guardados en cache');

    res.json(response);
  } catch (error) {
    logger.error('Error en promedios por institucion:', error);
    res.status(500).json({ error: 'Error generando promedios por institucion' });
  }
};

// Top materias
exports.getTopMaterias = async (req, res) => {
  try {
    const { criterio = 'promedio', anio } = req.query;

    const match = { estado: 'vigente' };
    if (anio) match['cicloLectivo.anio'] = parseInt(anio);

    const resultado = await Calificacion.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'materias',
          localField: 'materiaId',
          foreignField: '_id',
          as: 'materia'
        }
      },
      { $unwind: '$materia' },
      {
        $group: {
          _id: { id: '$materiaId', nombre: '$materia.nombre', area: '$materia.area' },
          cantidad: { $sum: 1 },
          totalEstudiantes: { $addToSet: '$estudianteId' }
        }
      },
      {
        $project: {
          materia: '$_id',
          cantidad: 1,
          totalEstudiantes: { $size: '$totalEstudiantes' }
        }
      },
      { $sort: { cantidad: -1 } },
      { $limit: 10 }
    ]);

    res.json({ criterio, anio, top10: resultado });
  } catch (error) {
    logger.error('Error en top materias:', error);
    res.status(500).json({ error: 'Error generando top' });
  }
};
