import client from './client'

export const calificacionesApi = {
  getAll: async (params) => {
    const { data } = await client.get('/calificaciones', { params })
    return data
  },

  getById: async (id) => {
    const { data } = await client.get(`/calificaciones/${id}`)
    return data
  },

  getByEstudiante: async (estudianteId) => {
    const { data } = await client.get(`/calificaciones/estudiante/${estudianteId}`)
    return data
  },

  create: async (calificacion) => {
    const { data } = await client.post('/calificaciones', calificacion)
    return data
  },

  update: async (id, calificacion) => {
    const { data } = await client.put(`/calificaciones/${id}`, calificacion)
    return data
  },

  delete: async (id) => {
    const { data } = await client.delete(`/calificaciones/${id}`)
    return data
  },

  corregir: async (id, correccion) => {
    const { data } = await client.post(`/calificaciones/${id}/corregir`, correccion)
    return data
  },

  verificarIntegridad: async (id) => {
    const { data } = await client.get(`/calificaciones/${id}/verificar`)
    return data
  },

  getHistorial: async (id) => {
    const { data } = await client.get(`/calificaciones/${id}/historial`)
    return data
  },
}
