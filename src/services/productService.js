import api from './api.js'

export const productService = {
  getAll: (params) => api.get('/products', { params }).then(r => r.data),
  getById: (id) => api.get(`/products/${id}`).then(r => r.data),
  create: (data) => api.post('/products', data).then(r => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/products/${id}`).then(r => r.data),
  updateStock: (id, stock) => api.patch(`/products/${id}/stock`, { stock }).then(r => r.data),
}