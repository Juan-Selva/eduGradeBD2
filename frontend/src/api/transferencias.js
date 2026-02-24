import client from './client'

export const transferenciasApi = {
  simular: async (data) => {
    const { data: result } = await client.post('/transferencias/simular', data)
    return result
  },

  ejecutar: async (data) => {
    const { data: result } = await client.post('/transferencias', data)
    return result
  },

  getByEstudiante: async (estudianteId) => {
    const { data } = await client.get(`/transferencias/estudiante/${estudianteId}`)
    return data
  },
}
