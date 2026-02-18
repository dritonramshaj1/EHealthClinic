import { api } from '../axios.js'

export const messagesApi = {
  getInbox: (limit) => api.get('/messages/inbox', { params: { limit } }),
  getSent: (limit) => api.get('/messages/sent', { params: { limit } }),
  getThread: (threadId) => api.get(`/messages/thread/${threadId}`),
  send: (data) => api.post('/messages', data),
  markAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
}
