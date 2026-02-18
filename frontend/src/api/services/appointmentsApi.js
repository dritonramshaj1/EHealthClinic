import { api } from '../axios.js'

export const appointmentsApi = {
  list: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
}
