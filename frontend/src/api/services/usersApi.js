import { api } from '../axios.js'

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  getRoles: () => api.get('/users/roles'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  disable: (id) => api.delete(`/users/${id}`),
  enable: (id) => api.patch(`/users/${id}/enable`),
  deletePermanently: (id) => api.delete(`/users/${id}/permanently`),
}
