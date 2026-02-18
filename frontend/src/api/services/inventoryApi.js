import { api } from '../axios.js'

export const inventoryApi = {
  list: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  getMovements: (id) => api.get(`/inventory/${id}/movements`),
  addMovement: (id, data) => api.post(`/inventory/${id}/movements`, data),
}
