import { api } from '../axios.js'

export const insuranceApi = {
  list: (params) => api.get('/insurance', { params }),
  getById: (id) => api.get(`/insurance/${id}`),
  create: (data) => api.post('/insurance', data),
  updateStatus: (id, data) => api.patch(`/insurance/${id}/status`, data),
}
