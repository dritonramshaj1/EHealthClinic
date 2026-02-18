import { api } from '../axios.js'

export const directoryApi = {
  getDoctors: (q) => api.get('/directory/doctors', { params: { q } }),
  getPatients: (q) => api.get('/directory/patients', { params: { q } }),
}
