import client from './client'

export const conversionesApi = {
  convertir: async (data) => {
    const { data: response } = await client.post('/conversiones/convertir', data)
    return response
  },

  convertirMultiple: async (data) => {
    const { data: response } = await client.post('/conversiones/multiple', data)
    return response
  },

  getByCalificacion: async (id, params) => {
    const { data } = await client.get(`/conversiones/calificacion/${id}`, { params })
    return data
  },

  getReglas: async (params) => {
    const { data } = await client.get('/conversiones/reglas', { params })
    return data
  },

  getTablaEquivalencias: async (origen, destino) => {
    const { data } = await client.get(`/conversiones/tabla/${origen}/${destino}`)
    return data
  },
}
