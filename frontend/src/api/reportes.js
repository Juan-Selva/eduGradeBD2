import client from './client'

export const reportesApi = {
  getResumen: async () => {
    const { data } = await client.get('/reportes/resumen')
    return data
  },

  getEstadisticas: async (params) => {
    const { data } = await client.get('/reportes/estadisticas', { params })
    return data
  },

  getPromediosPorMateria: async (params = {}) => {
    const { data } = await client.get('/reportes/promedios-materia', { params })
    return {
      data: data.data || [],
      pagination: data.pagination || null
    }
  },

  getPromediosPorInstitucion: async (params = {}) => {
    const { data } = await client.get('/reportes/promedios-institucion', { params })
    return {
      data: data.data || [],
      pagination: data.pagination || null
    }
  },
}
