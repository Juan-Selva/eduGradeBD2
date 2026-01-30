import client from './client'

export const estudiantesApi = {
  getAll: async (params) => {
    const { data } = await client.get('/estudiantes', { params })
    return data
  },

  getById: async (id) => {
    const { data } = await client.get(`/estudiantes/${id}`)
    return data
  },

  create: async (estudiante) => {
    const { data } = await client.post('/estudiantes', estudiante)
    return data
  },

  update: async (id, estudiante) => {
    const { data } = await client.put(`/estudiantes/${id}`, estudiante)
    return data
  },

  delete: async (id) => {
    const { data } = await client.delete(`/estudiantes/${id}`)
    return data
  },
}
