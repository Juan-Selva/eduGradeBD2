import client from './client'

export const trayectoriasApi = {
  getByEstudiante: async (id) => {
    const { data } = await client.get(`/trayectorias/estudiante/${id}`)
    return data
  },

  getEquivalencias: async (params) => {
    const { data } = await client.get('/trayectorias/equivalencias', { params })
    return data
  },

  crearEquivalencia: async (data) => {
    const { data: response } = await client.post('/trayectorias/equivalencias', data)
    return response
  },

  getCaminoAcademico: async (id) => {
    const { data } = await client.get(`/trayectorias/camino/${id}`)
    return data
  },
}
