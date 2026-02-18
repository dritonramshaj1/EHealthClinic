import { api } from '../axios.js'

export const invoicesApi = {
  list: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  markPaid: (id) => api.post(`/invoices/${id}/pay`),
  addItem: (id, data) => api.post(`/invoices/${id}/items`, data),
}
