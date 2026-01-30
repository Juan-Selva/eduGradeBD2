import client from './client'

export const materiasApi = {
  getAll: async (params) => {
    const { data } = await client.get('/materias', { params })
    return data  // Devolver objeto completo {data: [...], pagination: {...}}
  },

  getById: async (id) => {
    const { data } = await client.get(`/materias/${id}`)
    return data
  },

  create: async (materia) => {
    const { data } = await client.post('/materias', materia)
    return data
  },

  update: async (id, materia) => {
    const { data } = await client.put(`/materias/${id}`, materia)
    return data
  },

  delete: async (id) => {
    const { data } = await client.delete(`/materias/${id}`)
    return data
  },
}
