import { api } from '../axios.js'

export const labApi = {
  listOrders: (params) => api.get('/lab/orders', { params }),
  getOrder: (id) => api.get(`/lab/orders/${id}`),
  createOrder: (data) => api.post('/lab/orders', data),
  updateOrderStatus: (id, status) => api.patch(`/lab/orders/${id}/status`, { status }),
  getResults: (orderId) => api.get(`/lab/orders/${orderId}/results`),
  addResult: (orderId, data) => api.post(`/lab/orders/${orderId}/results`, data),
}
