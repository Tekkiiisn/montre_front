import api from './api.js'

export const orderService = {
  create: (data) => api.post('/orders', data).then(r => r.data),
  getAll: (params) => api.get('/orders', { params }).then(r => r.data),
  getById: (id) => api.get(`/orders/${id}`).then(r => r.data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }).then(r => r.data),
}