import api from './api.js'

export const clientAuthService = {
  register: (data) => api.post('/client/register', data).then(r => r.data),
  login:    (data) => api.post('/client/login', data).then(r => r.data),
  me:       ()     => api.get('/client/me').then(r => r.data),
  orders:   ()     => api.get('/client/orders').then(r => r.data),
}
