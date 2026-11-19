import api from './api.js'

export const paymentService = {
  // Créer une invoice PayDunya et récupérer l'URL de paiement
  createPaydunya: (orderId) =>
    api.post('/payments/paydunya/create', { order_id: orderId }).then(r => r.data),

  // Vérifier le statut d'un paiement via token paydunya
  checkStatus: (token) =>
    api.get(`/payments/paydunya/status/${token}`).then(r => r.data),
}
