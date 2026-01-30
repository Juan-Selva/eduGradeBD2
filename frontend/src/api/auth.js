import client from './client'

export const authApi = {
  login: async (credentials) => {
    const { data } = await client.post('/auth/login', credentials)
    return data
  },

  register: async (userData) => {
    const { data } = await client.post('/auth/register', userData)
    return data
  },

  getProfile: async () => {
    const { data } = await client.get('/auth/profile')
    return data
  },
}
