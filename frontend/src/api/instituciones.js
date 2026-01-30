import client from './client'

export const institucionesApi = {
  getAll: async (params) => {
    const { data } = await client.get('/instituciones', { params })
    return data  // Devolver objeto completo {data: [...], pagination: {...}}
  },

  getById: async (id) => {
    const { data } = await client.get(`/instituciones/${id}`)
    return data
  },

  create: async (institucion) => {
    const { data } = await client.post('/instituciones', institucion)
    return data
  },

  update: async (id, institucion) => {
    const { data } = await client.put(`/instituciones/${id}`, institucion)
    return data
  },

  delete: async (id) => {
    const { data } = await client.delete(`/instituciones/${id}`)
    return data
  },
}
