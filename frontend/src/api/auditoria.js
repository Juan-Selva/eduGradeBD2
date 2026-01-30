import client from './client'

// Transformar parámetros frontend -> backend
const transformParams = (params) => {
  const transformed = {}

  if (params.accion) transformed.tipoEvento = params.accion
  if (params.entidad) transformed.entidad = params.entidad
  if (params.fecha_desde) transformed.fechaInicio = params.fecha_desde
  if (params.fecha_hasta) transformed.fechaFin = params.fecha_hasta
  if (params.limit) transformed.limit = params.limit

  return transformed
}

// Transformar respuesta eventos backend -> frontend
const transformEventos = (response, page = 1, limit = 20) => {
  const eventos = response.eventos || []
  const total = response.total || eventos.length

  return {
    data: eventos.map(e => ({
      _id: e.eventoId,
      fecha: e.timestamp,
      accion: e.tipoEvento,
      entidad_tipo: e.entidad,
      entidad_id: e.entidadId,
      usuario_id: e.usuarioId,
      usuario_email: e.usuarioId, // El backend devuelve usuarioId como string
      descripcion: typeof e.datos === 'object' ? JSON.stringify(e.datos) : e.datos,
      ip: e.ip
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Transformar estadísticas backend -> frontend
const transformEstadisticas = (response) => {
  const stats = response.estadisticas || {}
  return {
    total_eventos: stats.total || 0,
    por_accion: {
      CREATE: stats.porTipo?.CREATE || 0,
      UPDATE: stats.porTipo?.UPDATE || 0,
      DELETE: stats.porTipo?.DELETE || 0,
      LOGIN: stats.porTipo?.LOGIN || 0,
      LOGOUT: stats.porTipo?.LOGOUT || 0
    }
  }
}

export const auditoriaApi = {
  getEventos: async (params = {}) => {
    const backendParams = transformParams(params)
    const { data } = await client.get('/auditoria/eventos', { params: backendParams })
    return transformEventos(data, params.page || 1, params.limit || 20)
  },

  getByEntidad: async (tipo, id) => {
    const { data } = await client.get(`/auditoria/entidad/${tipo}/${id}`)
    // Transformar respuesta si tiene el mismo formato
    if (data.eventos) {
      return transformEventos(data)
    }
    return data
  },

  getByUsuario: async (id, params = {}) => {
    const { data } = await client.get(`/auditoria/usuario/${id}`, { params })
    // Transformar respuesta si tiene el mismo formato
    if (data.eventos) {
      return transformEventos(data, params.page || 1, params.limit || 20)
    }
    return data
  },

  getEstadisticas: async () => {
    const { data } = await client.get('/auditoria/estadisticas')
    return transformEstadisticas(data)
  },
}
