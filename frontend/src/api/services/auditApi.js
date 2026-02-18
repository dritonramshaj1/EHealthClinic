import { api } from '../axios.js'

export const auditApi = {
  getLogs: (params) => api.get('/audit', { params }),
}
