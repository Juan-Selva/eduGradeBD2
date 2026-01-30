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

  getPromedioPorPais: async (params = {}) => {
    const { data } = await client.get('/reportes/promedio/pais', { params })
    return data
  },

  getPromedioPorInstitucion: async (params = {}) => {
    const { data } = await client.get('/reportes/promedio/institucion', { params })
    return data
  },

  getDistribucion: async (params = {}) => {
    const { data } = await client.get('/reportes/distribucion', { params })
    return data
  },

  getTasaAprobacion: async (params = {}) => {
    const { data } = await client.get('/reportes/aprobacion', { params })
    return data
  },

  getComparacionHistorica: async (params = {}) => {
    const { data } = await client.get('/reportes/historico', { params })
    return data
  },

  getTopMaterias: async (params = {}) => {
    const { data } = await client.get('/reportes/top-materias', { params })
    return data
  },
}
