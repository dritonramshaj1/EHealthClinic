import { api } from '../axios.js'

export const hrApi = {
  getShifts: (params) => api.get('/hr/shifts', { params }),
  createShift: (data) => api.post('/hr/shifts', data),
  updateShiftStatus: (id, status) => api.patch(`/hr/shifts/${id}/status`, { status }),
  getLeaveRequests: (params) => api.get('/hr/leave', { params }),
  createLeaveRequest: (data) => api.post('/hr/leave', data),
  reviewLeaveRequest: (id, data) => api.patch(`/hr/leave/${id}/review`, data),
}
