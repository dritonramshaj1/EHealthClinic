import { api } from '../axios.js'

// List uses directory (backend DirectoryController); getById when backend adds GET /patients/:id
export const patientsApi = {
  list: (params) => api.get('/directory/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}
