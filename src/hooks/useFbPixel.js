import { useCallback, useRef } from 'react'

/**
 * Hook Pixel Facebook.
 * Prérequis : le snippet fbq('init', 'VOTRE_PIXEL_ID') + fbq('track','PageView')
 * doit être dans index.html (une seule fois).
 *
 * Événements envoyés :
 *  - viewContent(product)            → à l'ouverture de la fiche produit
 *  - addToCart(product, qty)         → clic sur « Commander »
 *  - initiateCheckout(product, qty)  → ouverture du formulaire de commande
 *  - purchase({ product, qty, orderId, value, phone, name }) → commande confirmée
 *
 * Chaque événement porte un eventID : indispensable pour que Facebook
 * déduplique avec l'API de conversions (CAPI) si vous l'ajoutez côté serveur.
 */

const CURRENCY = 'XOF' // FCFA

const canTrack = () => typeof window !== 'undefined' && typeof window.fbq === 'function'

const send = (event, params, eventID) => {
  if (!canTrack()) return
  try {
    window.fbq('track', event, params, eventID ? { eventID } : undefined)
  } catch {
    /* ne jamais casser la page à cause du pixel */
  }
}

const buildParams = (product, qty = 1) => {
  const price = Number(product.price) || 0
  return {
    content_type: 'product',
    content_ids: [String(product.id)],
    content_name: product.name,
    content_category: product.categories?.name,
    contents: [{ id: String(product.id), quantity: qty, item_price: price }],
    num_items: qty,
    value: price * qty,
    currency: CURRENCY,
  }
}

const newId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

// Cookies _fbp / _fbc : à envoyer à votre backend pour l'API de conversions
export const getFbCookies = () => {
  if (typeof document === 'undefined') return {}
  const read = (n) => document.cookie.split('; ').find((c) => c.startsWith(n + '='))?.split('=')[1]
  return { fbp: read('_fbp'), fbc: read('_fbc') }
}

export function useFbPixel() {
  const viewedRef = useRef(null)

  const viewContent = useCallback((product) => {
    if (!product?.id) return
    if (viewedRef.current === product.id) return // évite le double envoi (StrictMode, re-render)
    viewedRef.current = product.id
    send('ViewContent', buildParams(product, 1), newId('vc'))
  }, [])

  const addToCart = useCallback((product, qty = 1) => {
    if (!product?.id) return
    send('AddToCart', buildParams(product, qty), newId('atc'))
  }, [])

  const initiateCheckout = useCallback((productOrItems, qtyOrTotal = 1) => {
    // Ancienne signature (items[], total) : conservée pour vos autres pages
    if (Array.isArray(productOrItems)) {
      send('InitiateCheckout', {
        content_type: 'product',
        content_ids: productOrItems.map((i) => String(i.product_id || i.id)),
        num_items: productOrItems.length,
        value: Number(qtyOrTotal) || 0,
        currency: CURRENCY,
      }, newId('ic'))
      return
    }
    if (!productOrItems?.id) return
    send('InitiateCheckout', buildParams(productOrItems, qtyOrTotal), newId('ic'))
  }, [])

  /**
   * À appeler UNE fois, quand le serveur a confirmé la commande.
   * orderId = identifiant de commande renvoyé par votre API.
   * Le même eventID `purchase_<orderId>` doit être utilisé côté serveur (CAPI).
   */
  const purchase = useCallback((arg1, items, total) => {
    if (!canTrack()) return

    let orderId
    let params

    if (arg1 && typeof arg1 === 'object') {
      // Nouvelle signature : purchase({ product, qty, orderId, value })
      const { product, qty = 1, value } = arg1
      orderId = arg1.orderId
      if (!product?.id || !orderId) return
      params = buildParams(product, qty)
      if (value != null) params.value = Number(value)
    } else {
      // Ancienne signature : purchase(orderId, items, total)
      orderId = arg1
      if (!orderId || !Array.isArray(items)) return
      params = {
        content_type: 'product',
        content_ids: items.map((i) => String(i.product_id || i.id)),
        contents: items.map((i) => ({
          id: String(i.product_id || i.id),
          quantity: i.quantity || 1,
          item_price: Number(i.unit_price || i.price) || 0,
        })),
        num_items: items.reduce((n, i) => n + (i.quantity || 1), 0),
        value: Number(total) || 0,
        currency: CURRENCY,
      }
    }

    // Anti-doublon (rafraîchissement, double clic, retour arrière)
    const key = `fb_purchase_${orderId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch { /* sessionStorage indisponible : on continue */ }

    send('Purchase', params, `purchase_${orderId}`)
  }, [])

  return { viewContent, addToCart, initiateCheckout, purchase }
}

export default useFbPixel
