const { v4: uuidv4 } = require('uuid');
const Estudiante = require('../models/Estudiante');
const Calificacion = require('../models/Calificacion');
const Institucion = require('../models/Institucion');
const Materia = require('../models/Materia');
const conversionService = require('./conversion.service');
const auditoriaService = require('./auditoria.service');
const { getNeo4jSession, getRedisClient } = require('../config/database');
const logger = require('../utils/logger');
const { transferenciasTotal, safeInc } = require('../middlewares/metrics');

class TransferenciaService {

  /**
   * Simular transferencia (dry-run) - retorna preview sin ejecutar
   */
  async simular(estudianteId, institucionDestinoId) {
    const { estudiante, institucionOrigen, institucionDestino, calificaciones } =
      await this._validarYObtenerDatos(estudianteId, institucionDestinoId);

    const equivalencias = await this._buscarEquivalencias(
      institucionOrigen.sistemaEducativo,
      institucionDestino.sistemaEducativo
    );

    const conversiones = await this._convertirCalificaciones(
      calificaciones, equivalencias,
      institucionOrigen.sistemaEducativo,
      institucionDestino.sistemaEducativo
    );

    return {
      estudiante: {
        id: estudiante._id,
        nombre: estudiante.nombreCompleto,
        sistemaActual: institucionOrigen.sistemaEducativo
      },
      institucionOrigen: {
        id: institucionOrigen._id,
        nombre: institucionOrigen.nombre,
        sistema: institucionOrigen.sistemaEducativo
      },
      institucionDestino: {
        id: institucionDestino._id,
        nombre: institucionDestino.nombre,
        sistema: institucionDestino.sistemaEducativo
      },
      conversiones,
      totalMaterias: conversiones.length,
      materiasConEquivalencia: conversiones.filter(c => c.materiaEquivalente).length,
      materiasSinEquivalencia: conversiones.filter(c => !c.materiaEquivalente).length
    };
  }

  /**
   * Ejecutar transferencia completa
   */
  async ejecutar(estudianteId, institucionDestinoId, usuarioId, ip) {
    const { estudiante, institucionOrigen, institucionDestino, calificaciones } =
      await this._validarYObtenerDatos(estudianteId, institucionDestinoId);

    const sistemaOrigen = institucionOrigen.sistemaEducativo;
    const sistemaDestino = institucionDestino.sistemaEducativo;

    const equivalencias = await this._buscarEquivalencias(sistemaOrigen, sistemaDestino);

    const conversiones = await this._convertirCalificaciones(
      calificaciones, equivalencias, sistemaOrigen, sistemaDestino
    );

    // Crear nuevas calificaciones inmutables con metadata de conversion
    const nuevasCalificaciones = [];
    for (const conv of conversiones) {
      if (!conv.materiaEquivalente || !conv.valorConvertido) continue;

      const nueva = new Calificacion({
        estudianteId: estudiante._id,
        materiaId: conv.materiaEquivalente._id,
        institucionId: institucionDestino._id,
        sistemaOrigen: sistemaDestino,
        cicloLectivo: conv.calificacionOriginal.cicloLectivo,
        valorOriginal: conv.valorConvertido,
        tipoEvaluacion: 'equivalencia',
        fechaEvaluacion: new Date(),
        auditoria: {
          usuarioRegistro: usuarioId || 'system',
          ipRegistro: ip || 'unknown',
          timestampRegistro: new Date()
        },
        metadata: {
          esConversion: true,
          transferenciaId: uuidv4(),
          calificacionOriginalId: conv.calificacionOriginal._id.toString(),
          sistemaOrigen,
          sistemaDestino,
          valorNormalizado: conv.valorNormalizado,
          reglaAplicada: conv.reglaAplicada
        }
      });

      await nueva.save();
      nuevasCalificaciones.push(nueva);
    }

    // Actualizar estudiante
    const sistemaAnterior = estudiante.sistemasEducativos.find(s => s.activo);
    if (sistemaAnterior) sistemaAnterior.activo = false;

    estudiante.sistemasEducativos.push({
      sistema: sistemaDestino,
      fechaInicio: new Date(),
      activo: true
    });

    estudiante.institucionId = institucionDestino._id;

    estudiante.transferencias.push({
      fecha: new Date(),
      institucionOrigenId: institucionOrigen._id,
      institucionDestinoId: institucionDestino._id,
      sistemaOrigen,
      sistemaDestino,
      materiasTransferidas: nuevasCalificaciones.length,
      estado: 'completada'
    });

    await estudiante.save();

    // Actualizar Neo4j
    await this._actualizarGrafo(estudiante._id, institucionDestino._id, conversiones);

    // Auditar en Cassandra
    await auditoriaService.registrarEvento({
      tipoEvento: 'TRANSFERENCIA',
      entidad: 'Estudiante',
      entidadId: estudiante._id.toString(),
      usuarioId: usuarioId || 'system',
      datos: {
        institucionOrigenId: institucionOrigen._id.toString(),
        institucionDestinoId: institucionDestino._id.toString(),
        sistemaOrigen,
        sistemaDestino,
        materiasTransferidas: nuevasCalificaciones.length
      },
      ip
    });

    safeInc(transferenciasTotal, { sistema_origen: sistemaOrigen, sistema_destino: sistemaDestino, status: 'success' });

    // Cache del resultado
    const redis = getRedisClient();
    const cacheKey = `transfer:${estudiante._id}:${Date.now()}`;
    await redis.setex(cacheKey, 86400, JSON.stringify({
      estudianteId: estudiante._id,
      fecha: new Date(),
      materiasTransferidas: nuevasCalificaciones.length
    }));

    return {
      estudiante: {
        id: estudiante._id,
        nombre: estudiante.nombreCompleto,
        nuevaInstitucion: institucionDestino.nombre,
        nuevoSistema: sistemaDestino
      },
      calificacionesCreadas: nuevasCalificaciones.length,
      conversiones: conversiones.map(c => ({
        materiaOrigen: c.materiaOrigen,
        materiaEquivalente: c.materiaEquivalente?.nombre,
        valorOriginal: c.calificacionOriginal.valorOriginal,
        valorConvertido: c.valorConvertido,
        valorNormalizado: c.valorNormalizado
      }))
    };
  }

  /**
   * Obtener historial de transferencias de un estudiante
   */
  async getByEstudiante(estudianteId) {
    const estudiante = await Estudiante.findById(estudianteId)
      .populate('transferencias.institucionOrigenId', 'nombre sistemaEducativo')
      .populate('transferencias.institucionDestinoId', 'nombre sistemaEducativo');

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    return {
      estudiante: {
        id: estudiante._id,
        nombre: estudiante.nombreCompleto,
        sistemaActual: estudiante.getSistemaActivo()
      },
      transferencias: estudiante.transferencias || []
    };
  }

  // ---- Metodos privados ----

  async _validarYObtenerDatos(estudianteId, institucionDestinoId) {
    const estudiante = await Estudiante.findById(estudianteId);
    if (!estudiante) throw new Error('Estudiante no encontrado');
    if (estudiante.estado !== 'activo') throw new Error('El estudiante no esta activo');

    const institucionOrigen = await Institucion.findById(estudiante.institucionId);
    if (!institucionOrigen) throw new Error('Institucion de origen no encontrada');

    const institucionDestino = await Institucion.findById(institucionDestinoId);
    if (!institucionDestino) throw new Error('Institucion de destino no encontrada');

    if (institucionOrigen.sistemaEducativo === institucionDestino.sistemaEducativo) {
      throw new Error('Las instituciones deben tener sistemas educativos diferentes');
    }

    const calificaciones = await Calificacion.find({
      estudianteId,
      estado: 'vigente'
    }).populate('materiaId');

    return { estudiante, institucionOrigen, institucionDestino, calificaciones };
  }

  async _buscarEquivalencias(sistemaOrigen, sistemaDestino) {
    const session = getNeo4jSession();
    try {
      const result = await session.run(
        `MATCH (m1:Materia {sistema: $sistemaOrigen})-[:EQUIVALE]->(m2:Materia {sistema: $sistemaDestino})
         RETURN m1.codigo AS codigoOrigen, m1.nombre AS nombreOrigen,
                m2.codigo AS codigoDestino, m2.nombre AS nombreDestino`,
        { sistemaOrigen, sistemaDestino }
      );
      return result.records.map(r => ({
        codigoOrigen: r.get('codigoOrigen'),
        nombreOrigen: r.get('nombreOrigen'),
        codigoDestino: r.get('codigoDestino'),
        nombreDestino: r.get('nombreDestino')
      }));
    } finally {
      await session.close();
    }
  }

  async _convertirCalificaciones(calificaciones, equivalencias, sistemaOrigen, sistemaDestino) {
    const resultados = [];

    for (const cal of calificaciones) {
      const materia = cal.materiaId;
      if (!materia) continue;

      const equiv = equivalencias.find(e => e.codigoOrigen === materia.codigo);
      let materiaEquivalente = null;

      if (equiv) {
        materiaEquivalente = await Materia.findOne({
          codigo: equiv.codigoDestino,
          sistemaEducativo: sistemaDestino
        });
      }

      let valorConvertido = null;
      let valorNormalizado = null;
      let reglaAplicada = null;

      try {
        const conversion = await conversionService.convertir(sistemaOrigen, sistemaDestino, cal.valorOriginal);
        valorConvertido = conversion.valorConvertido;
        valorNormalizado = conversion.valorNormalizado;
        reglaAplicada = conversion.reglaAplicada;
      } catch (err) {
        logger.warn(`No se pudo convertir calificacion ${cal._id}: ${err.message}`);
      }

      resultados.push({
        calificacionOriginal: cal,
        materiaOrigen: materia.nombre,
        materiaEquivalente,
        valorConvertido,
        valorNormalizado,
        reglaAplicada
      });
    }

    return resultados;
  }

  async _actualizarGrafo(estudianteId, institucionDestinoId, conversiones) {
    const session = getNeo4jSession();
    try {
      // Crear relacion ESTUDIA_EN
      await session.run(
        `MERGE (e:Estudiante {mongoId: $estudianteId})
         MERGE (i:Institucion {mongoId: $institucionId})
         CREATE (e)-[:ESTUDIA_EN {desde: datetime(), activo: true}]->(i)`,
        {
          estudianteId: estudianteId.toString(),
          institucionId: institucionDestinoId.toString()
        }
      );

      // Crear relaciones CURSA para materias equivalentes
      for (const conv of conversiones) {
        if (!conv.materiaEquivalente) continue;
        await session.run(
          `MERGE (e:Estudiante {mongoId: $estudianteId})
           MERGE (m:Materia {codigo: $codigoMateria})
           CREATE (e)-[:CURSA {desde: datetime(), porTransferencia: true}]->(m)`,
          {
            estudianteId: estudianteId.toString(),
            codigoMateria: conv.materiaEquivalente.codigo
          }
        );
      }
    } finally {
      await session.close();
    }
  }
}

module.exports = new TransferenciaService();
