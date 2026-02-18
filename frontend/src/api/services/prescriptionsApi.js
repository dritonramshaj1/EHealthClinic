import { api } from '../axios.js'

export const prescriptionsApi = {
  list: (params) => api.get('/prescriptions', { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post('/prescriptions', data),
  updateStatus: (id, status) => api.patch(`/prescriptions/${id}/status`, { status }),
  cancel: (id) => api.delete(`/prescriptions/${id}`),
}
