import { api } from '../axios.js'

export const documentsApi = {
  getByPatient: (patientId) => api.get(`/documents/patient/${patientId}`),
  upload: (patientId, formData) => api.post(`/documents/patient/${patientId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`),
}
