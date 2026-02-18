import { api } from '../axios.js'

export const analyticsApi = {
  get: () => api.get('/analytics'),
}
