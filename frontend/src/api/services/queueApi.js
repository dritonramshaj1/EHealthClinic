import { api } from '../axios.js'

export const queueApi = {
  getQueue: (branchId, status) => api.get('/queue', { params: { branchId, status } }),
  getStats: (branchId) => api.get('/queue/stats', { params: { branchId } }),
  add: (data) => api.post('/queue', data),
  updateStatus: (id, status) => api.patch(`/queue/${id}/status`, { status }),
  call: (id) => api.post(`/queue/${id}/call`),
}
