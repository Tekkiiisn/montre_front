import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService.js'
import ReviewsSection from '@/components/reviews/Reviewssection.jsx'
import QuickBuyModal from '@/components/product/QuickBuyModal.jsx'
import api from '@/services/api.js'
import { useFbPixel } from '@/hooks/useFbPixel.js'

import { Helmet } from 'react-helmet-async'
import Spinner from '@/components/common/Spinner.jsx'
import {
  ShoppingCart, Plus, Minus, Play, Zap, ShieldCheck, Truck, RotateCcw,
  Pause, Headphones, ChevronLeft, ChevronRight, X, ChevronDown, Gift,
  MessageCircle, ArrowRight,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'

/* ════════════════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════════════════ */
const ik = (url, w = 800) => {
  if (!url || !url.includes('ik.imagekit.io')) return url
  return `${url}${url.includes('?') ? '&' : '?'}tr=w-${w},q-80,f-auto`
}

const getUrl = (v) => {
  if (!v) return null
  if (typeof v === 'string') {
    if (v.startsWith('http')) return v
    try { return JSON.parse(v)?.url || null } catch { return null }
  }
  return v.url || null
}

const toArray = (v) => {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch { return [] } }
  return []
}

const VOICE_URL = import.meta.env.VITE_PRODUCT_VOICE_URL
  || 'https://ik.imagekit.io/fzviw5sky/boutique/audios/explicatttion-edited.mp3'

const FAQ = [
  { q: "Comment se passe la livraison ?", a: "La livraison est gratuite partout à Dakar. Après votre commande, nous vous contactons pour confirmer l'adresse et le créneau." },
  { q: "Comment j'obtiens la montre offerte ?", a: "Pour chaque lunette commandée, une montre vous est offerte. Rien à ajouter au panier : elle est incluse dans votre commande." },
  { q: "Puis-je échanger ou retourner ma lunette ?", a: "Oui. Si le modèle ne vous convient pas, contactez-nous et nous organisons le retour ou l'échange." },
  { q: "Le paiement est-il sécurisé ?", a: "Oui. Vous validez votre commande sur un formulaire sécurisé et vous recevez une confirmation." },
]

/* ════════════════════════════════════════════════════════════════
   Message vocal
   ════════════════════════════════════════════════════════════════ */
const RATES = [1, 1.5, 2]
const BARS = [10,18,12,26,16,30,14,22,32,18,12,28,20,34,16,24,12,30,18,26,14,22,32,16,20,28,12,24,18,14]

const fmt = (t) => {
  if (!Number.isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const sec = Math.floor(t % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function useVoice(src) {
  const audioRef = useRef(null)
  const [playing, setPlaying]     = useState(false)
  const [current, setCurrent]     = useState(0)
  const [duration, setDuration]   = useState(0)
  const [rate, setRate]           = useState(1)
  const [error, setError]         = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    if (!src) return
    const a = new Audio()
    a.preload = 'metadata'
    a.src = src
    audioRef.current = a

    const onTime  = () => setCurrent(a.currentTime)
    const onMeta  = () => setDuration(a.duration || 0)
    const onPlay  = () => { setPlaying(true); setHasPlayed(true) }
    const onPause = () => setPlaying(false)
    const onEnd   = () => { setPlaying(false); setCurrent(0) }
    const onErr   = () => setError(true)
    const onHide  = () => { if (document.hidden) a.pause() }

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnd)
    a.addEventListener('error', onErr)
    document.addEventListener('visibilitychange', onHide)

    return () => {
      a.pause()
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('error', onErr)
      document.removeEventListener('visibilitychange', onHide)
      audioRef.current = null
    }
  }, [src])

  const play = useCallback(() => {
    const a = audioRef.current
    if (a && a.paused) a.play().catch(() => setError(true))
  }, [])

  const pause = useCallback(() => { audioRef.current?.pause() }, [])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play().catch(() => setError(true))
    else a.pause()
  }, [])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.pause()
    a.currentTime = 0
    setCurrent(0)
  }, [])

  const seek = useCallback((ratio) => {
    const a = audioRef.current
    if (a && a.duration) { a.currentTime = ratio * a.duration; setCurrent(a.currentTime) }
  }, [])

  const cycleRate = useCallback(() => {
    const a = audioRef.current
    setRate(r => {
      const next = RATES[(RATES.indexOf(r) + 1) % RATES.length]
      if (a) a.playbackRate = next
      return next
    })
  }, [])

  return { available: !!src, playing, current, duration, rate, error, hasPlayed, play, pause, toggle, stop, seek, cycleRate }
}

function VoiceSection({ voice, sectionRef }) {
  const progress = voice.duration ? voice.current / voice.duration : 0
  if (voice.error) return null

  return (
    <section ref={sectionRef} className="mt-10 scroll-mt-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Headphones size={20} className="text-green-700" />
          <h2 className="text-lg sm:text-xl font-black text-gray-800">Écoutez ce message avant de commander</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Un court message vocal pour vous expliquer l'essentiel. Appuyez sur le bouton de lecture.
        </p>
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <button onClick={voice.toggle}
            aria-label={voice.playing ? 'Mettre en pause' : 'Écouter'}
            className="relative shrink-0 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center active:scale-95 transition">
            {!voice.hasPlayed && (
              <span className="motion-safe:animate-ping absolute inset-0 rounded-full bg-green-500/50" aria-hidden="true" />
            )}
            <span className="relative">
              {voice.playing
                ? <Pause size={22} fill="currentColor" />
                : <Play size={22} fill="currentColor" className="ml-0.5" />}
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="relative h-9 flex items-center gap-[3px]">
              {BARS.map((h, i) => (
                <span key={i} style={{ height: h }}
                  className={`flex-1 rounded-full ${i / BARS.length < progress ? 'bg-green-600' : 'bg-gray-300'}`} />
              ))}
              <input type="range" min="0" max="1000" step="1"
                value={Math.round(progress * 1000)}
                onChange={(e) => voice.seek(Number(e.target.value) / 1000)}
                aria-label="Position dans le message vocal"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1 tabular-nums">
              <span>{fmt(voice.current)}</span>
              <span>{voice.duration ? fmt(voice.duration) : '--:--'}</span>
            </div>
          </div>
          <button onClick={voice.cycleRate} aria-label="Changer la vitesse"
            className="shrink-0 w-11 h-8 rounded-full bg-gray-100 text-xs font-bold text-gray-700 tabular-nums">
            {voice.rate}x
          </button>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════
   Galerie — flèches + compteur + miniatures visibles partout
   ════════════════════════════════════════════════════════════════ */
function Gallery({ images, name, badge }) {
  const trackRef = useRef(null)
  const thumbsRef = useRef(null)
  const [idx, setIdx] = useState(0)

  const goTo = (i) => {
    const el = trackRef.current
    if (!el) return
    const next = Math.max(0, Math.min(images.length - 1, i))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    const next = Math.round(el.scrollLeft / el.clientWidth)
    setIdx(prev => (prev === next ? prev : next))
  }

  // Garde la miniature active visible dans la bande
  useEffect(() => {
    const strip = thumbsRef.current
    const thumb = strip?.children?.[idx]
    if (strip && thumb) {
      strip.scrollTo({
        left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2,
        behavior: 'smooth',
      })
    }
  }, [idx])

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
        <ShoppingCart size={60} className="text-gray-200" />
      </div>
    )
  }

  const multiple = images.length > 1

  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
        {badge && (
          <span className={`absolute top-3 left-3 z-10 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm
            ${badge === 'nouveau' ? 'bg-green-500 text-white'
              : badge === 'promo' ? 'bg-red-500 text-white'
              : 'bg-gray-700 text-white'}`}>
            {badge === 'nouveau' ? 'Nouveau' : badge === 'promo' ? 'Promo' : 'Rupture'}
          </span>
        )}

        {multiple && (
          <span className="absolute top-3 right-3 z-10 text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 text-white tabular-nums">
            {idx + 1} / {images.length}
          </span>
        )}

        <div ref={trackRef} onScroll={onScroll}
          className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <div key={i} className="snap-center shrink-0 w-full aspect-square">
              <img
                src={ik(img.url, 900)}
                alt={i === 0 ? name : `${name} — vue ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {multiple && (
          <>
            <button onClick={() => goTo(idx - 1)} aria-label="Image précédente" disabled={idx === 0}
              className="flex absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 shadow-md items-center justify-center active:scale-95 transition disabled:opacity-0 disabled:pointer-events-none">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => goTo(idx + 1)} aria-label="Image suivante" disabled={idx === images.length - 1}
              className="flex absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 shadow-md items-center justify-center active:scale-95 transition disabled:opacity-0 disabled:pointer-events-none">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {multiple && (
        <div ref={thumbsRef}
          className="flex gap-2 mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Voir l'image ${i + 1}`}
              aria-current={idx === i}
              className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition
                ${idx === i ? 'border-primary-500' : 'border-transparent opacity-70 hover:opacity-100'}`}>
              <img src={ik(img.url, 160)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   Vidéo
   ════════════════════════════════════════════════════════════════ */
function VideoSection({ video, poster, onPlay }) {
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  const start = () => {
    setStarted(true)
    onPlay?.()
    requestAnimationFrame(() => ref.current?.play().catch(() => {}))
  }

  return (
    <section className="mt-14">
      <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-1">Voyez-la en vidéo</h2>
      <p className="text-sm text-gray-500 mb-5">La finition, la monture et le rendu, comme si vous l'aviez en main.</p>
      <div className="relative mx-auto max-w-3xl aspect-[4/5] sm:aspect-video rounded-2xl overflow-hidden bg-black shadow-sm">
        {started ? (
          <video ref={ref} src={video.url} controls playsInline preload="auto"
            className="w-full h-full object-contain" />
        ) : (
          <button onClick={start} aria-label="Lire la vidéo" className="group absolute inset-0 w-full h-full">
            {poster && <img src={ik(poster, 900)} alt="" loading="lazy" className="w-full h-full object-cover opacity-80" />}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-20 h-20 rounded-full bg-white/95 shadow-xl flex items-center justify-center transition group-active:scale-95">
                <Play size={32} className="text-primary-600 ml-1" fill="currentColor" />
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════
   WhatsApp proof
   ════════════════════════════════════════════════════════════════ */
function WhatsappProof({ shots }) {
  const [open, setOpen] = useState(null)

  useEffect(() => {
    if (open === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen(i => Math.min(shots.length - 1, i + 1))
      if (e.key === 'ArrowLeft')  setOpen(i => Math.max(0, i - 1))
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [open, shots.length])

  return (
    <section className="mt-14">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={22} className="text-green-600" />
        <h2 className="text-xl sm:text-2xl font-black text-gray-800">Ils nous ont écrit sur WhatsApp</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">Messages réels de clients, non modifiés. Touchez une capture pour l'agrandir.</p>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shots.map((url, i) => (
          <button key={i} onClick={() => setOpen(i)} aria-label={`Agrandir l'avis client ${i + 1}`}
            className="snap-start shrink-0 w-56 sm:w-64 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
            <img src={ik(url, 500)} alt={`Avis client WhatsApp ${i + 1}`} loading="lazy" decoding="async"
              className="w-full h-auto block" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {open !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setOpen(null)}>
            <button onClick={() => setOpen(null)} aria-label="Fermer"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
              <X size={22} />
            </button>
            {open > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setOpen(open - 1) }} aria-label="Précédente"
                className="absolute left-3 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                <ChevronLeft size={22} />
              </button>
            )}
            {open < shots.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setOpen(open + 1) }} aria-label="Suivante"
                className="absolute right-3 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                <ChevronRight size={22} />
              </button>
            )}
            <img src={ik(shots[open], 1200)} alt={`Avis client WhatsApp ${open + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-full rounded-xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════
   Petits blocs
   ════════════════════════════════════════════════════════════════ */
function PromoMarquee() {
  const message = '🎁 Chaque lunette achetée = une montre OFFERTE  •  🚚 Livraison GRATUITE partout à Dakar'
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-500 text-white py-2.5 mb-5 rounded-xl shadow-sm">
      <style>{`
        @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-track { animation: marquee-scroll 18s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>
      <div className="flex whitespace-nowrap marquee-track">
        {[...Array(2)].map((_, i) => (
          <span key={i} className="flex items-center gap-8 px-4 text-sm sm:text-base font-bold shrink-0">
            <span>{message}</span><span>{message}</span><span>{message}</span><span>{message}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function ReassuranceItem({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center bg-gray-50 rounded-xl py-3 px-2">
      <Icon size={18} className="text-primary-500" />
      <span className="text-[11px] text-gray-500 font-medium leading-tight">{text}</span>
    </div>
  )
}

function Steps() {
  const steps = [
    { t: "Choisissez votre modèle", d: "Sélectionnez la quantité puis touchez « Commander »." },
    { t: "Renseignez vos informations", d: "Nom, téléphone et adresse à Dakar. Cela prend moins d'une minute." },
    { t: "Recevez votre lunette et votre montre", d: "Livraison gratuite à Dakar, la montre offerte est dans le colis." },
  ]
  return (
    <section className="mt-14">
      <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-5">Commander en 3 étapes</h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={i} className="flex sm:flex-col gap-3 rounded-2xl bg-gray-50 p-4">
            <span className="shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white font-black flex items-center justify-center text-sm">{i + 1}</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">{s.t}</p>
              <p className="text-sm text-gray-500 mt-0.5">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="mt-14 max-w-3xl">
      <h2 className="text-xl sm:text-2xl font-black text-gray-800 mb-5">Questions fréquentes</h2>
      <div className="divide-y border rounded-2xl">
        {FAQ.map((item, i) => (
          <div key={i}>
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}
              className="w-full flex items-center justify-between gap-4 text-left px-4 py-4 font-semibold text-gray-800 text-sm sm:text-base">
              {item.q}
              <ChevronDown size={18} className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }} className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Bouton catalogue ───────────────────────────────────────── */
function CatalogueCTA() {
  return (
    <section className="mt-14">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-800 mb-1">Découvrez toute notre collection</h2>
          <p className="text-sm text-gray-500">Des dizaines de modèles disponibles, pour homme et femme.</p>
        </div>
        <a
          href="https://sunulunettes.shop"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm
            bg-primary-600 text-white hover:bg-primary-700 transition active:scale-[0.98]">
          Voir le catalogue
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════
   Page principale
   ════════════════════════════════════════════════════════════════ */
export default function ProductDetailPage() {
  const { id } = useParams()

  const [qty, setQty]                   = useState(1)
  const [showQuickBuy, setShowQuickBuy] = useState(false)

  // Pixel Facebook : ViewContent / AddToCart / InitiateCheckout / Purchase
  const { viewContent, addToCart, initiateCheckout } = useFbPixel()

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn:  () => productService.getById(id),
  })

  // ViewContent : une seule fois par produit (le hook gère le dédoublonnage)
  useEffect(() => { if (data) viewContent(data) }, [data, viewContent])
  useEffect(() => { setQty(1) }, [id])

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn:  () => api.get(`/reviews/product/${id}`).then(r => r.data),
    enabled:  !!id,
  })
  const hasReviews = (reviewsData?.total || 0) > 0

  const voice    = useVoice(VOICE_URL || null)
  const voiceRef = useRef(null)
  useEffect(() => { voice.stop() }, [id])

  const listenToVoice = () => {
    voiceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    voice.play()
  }

  if (isLoading) return <Spinner className="py-20" />
  if (!data)     return <p className="text-center py-20 text-gray-400">Produit introuvable</p>

  const product    = data
  const images     = toArray(product.imagekit_images)
  const videoUrl   = getUrl(product.imagekit_video)
  const waShots    = toArray(product.whatsapp_reviews).map(getUrl).filter(Boolean)
  const outOfStock = product.stock === 0
  const discount   = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0

  const handleQuickBuy = () => {
    if (qty > product.stock) { toast.error('Stock insuffisant'); return }
    // Événements envoyés seulement quand l'intention est confirmée
    addToCart(product, qty)
    initiateCheckout(product, qty)
    setShowQuickBuy(true)
  }

  return (
    <>
      <Helmet>
        <title>{product.name} — Sunulunettes</title>
        <meta name="description" content={product.description || product.name} />
        {images[0]?.url && <meta property="og:image" content={images[0].url} />}
        {images[0]?.url && <link rel="preload" as="image" href={ik(images[0].url, 900)} />}
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-32 sm:pb-10">

        <PromoMarquee />

        {/* ── Galerie + infos ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          <div className="md:sticky md:top-6 md:self-start">
            <Gallery images={images} name={product.name} badge={product.badge} />
            <div className="hidden sm:grid grid-cols-3 gap-2 mt-5">
              <ReassuranceItem icon={Truck}       text="Livraison rapide" />
              <ReassuranceItem icon={ShieldCheck} text="Paiement sécurisé" />
              <ReassuranceItem icon={RotateCcw}   text="Retour facile" />
            </div>
          </div>

          <div className="flex flex-col">
            {product.categories && (
              <p className="text-sm text-primary-600 font-semibold mb-2">{product.categories.name}</p>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-3 leading-tight">{product.name}</h1>

            {hasReviews && (
              <p className="text-sm text-gray-500 mb-3">{reviewsData.total} avis clients</p>
            )}

            <div className="flex flex-wrap items-baseline gap-3 mb-4">
              <span className="text-3xl font-black text-primary-700">
                {Number(product.price).toLocaleString()} FCFA
              </span>
              {product.compare_price && (
                <>
                  <span className="text-lg text-gray-300 line-through">
                    {Number(product.compare_price).toLocaleString()} FCFA
                  </span>
                  <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">-{discount}%</span>
                </>
              )}
            </div>

            {/* Cadeau offert */}
            {product.cadeau_image?.url ? (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-5">
                <img src={product.cadeau_image.url} alt="cadeau offert"
                  className="w-14 h-14 object-cover rounded-xl border-2 border-amber-300 shrink-0" />
                <div className="text-sm">
                  <p className="font-black text-amber-700">🎁 Cadeau offert avec votre commande !</p>
                  <p className="text-amber-600/80 text-xs mt-0.5">Livraison gratuite partout à Dakar.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4 mb-5">
                <Gift size={22} className="text-primary-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-primary-800">Une montre offerte avec cette lunette</p>
                  <p className="text-primary-700/80">Livraison gratuite partout à Dakar.</p>
                </div>
              </div>
            )}

            {voice.available && !voice.error && (
              <button onClick={listenToVoice}
                className="flex items-center gap-2 w-fit mb-5 rounded-full border border-green-300 bg-green-50 px-4 py-2 text-sm font-bold text-green-800 active:scale-[0.98] transition">
                <Headphones size={17} />
                Écoutez notre message vocal
              </button>
            )}

            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-5 whitespace-pre-line">{product.description}</p>
            )}

            <p className={`inline-flex w-fit items-center gap-1.5 text-sm font-semibold mb-5 px-3 py-1.5 rounded-full
              ${outOfStock ? 'bg-red-50 text-red-500'
                : product.stock <= 5 ? 'bg-yellow-50 text-yellow-700'
                : 'bg-green-50 text-green-700'}`}>
              {outOfStock ? '❌ Rupture de stock'
                : product.stock <= 5 ? `⚠️ Plus que ${product.stock} en stock`
                : '✅ En stock'}
            </p>

            {!outOfStock && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-sm text-gray-500 font-medium">Quantité</span>
                  <div className="flex items-center gap-3 border rounded-xl px-1">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Moins"
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition">
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center font-black">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} aria-label="Plus"
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition">
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col gap-2.5">
                  <button onClick={handleQuickBuy}
                    className="w-full py-4 text-base rounded-xl font-black flex items-center justify-center gap-2
                      bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-200
                      hover:shadow-xl hover:shadow-primary-300 transition-all active:scale-[0.98]">
                    <Zap size={20} fill="currentColor" />
                    Commander — {(Number(product.price) * qty).toLocaleString()} FCFA
                  </button>
                </div>
              </>
            )}

            <div className="sm:hidden grid grid-cols-3 gap-2 mt-6">
              <ReassuranceItem icon={Truck}       text="Livraison rapide" />
              <ReassuranceItem icon={ShieldCheck} text="Paiement sécurisé" />
              <ReassuranceItem icon={RotateCcw}   text="Retour facile" />
            </div>
          </div>
        </div>

        {/* ── Sections de conviction ── */}
        {voice.available && <VoiceSection voice={voice} sectionRef={voiceRef} />}

        {videoUrl && (
          <VideoSection video={{ url: videoUrl }} poster={images[0]?.url} onPlay={voice.pause} />
        )}

        {waShots.length > 0 && <WhatsappProof shots={waShots} />}

        <Steps />

        {/* ── Avis clients (sans dates) ── */}
        {hasReviews && <ReviewsSection productId={product.id} />}

        <Faq />

        {/* ── Dernier CTA ── */}
        {!outOfStock && (
          <section className="mt-14 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-500 text-white p-6 sm:p-10 text-center">
            <h2 className="text-xl sm:text-2xl font-black mb-2">Votre {product.name} vous attend</h2>
            <p className="text-white/90 text-sm sm:text-base mb-5">Une montre offerte et la livraison gratuite à Dakar.</p>
            <button onClick={handleQuickBuy}
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-black rounded-xl px-8 py-3.5 active:scale-[0.98] transition">
              <Zap size={18} fill="currentColor" />
              Commander maintenant
            </button>
          </section>
        )}

        {/* ── Bouton catalogue ── */}
        <CatalogueCTA />

      </div>

      {/* Barre mobile */}
      {!outOfStock && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t px-4 py-3 z-40
          shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button onClick={handleQuickBuy}
            className="w-full py-3.5 rounded-xl font-black flex items-center justify-center gap-2
              bg-gradient-to-r from-primary-600 to-primary-500 text-white active:scale-[0.98] transition-transform">
            <Zap size={18} fill="currentColor" />
            Commander — {(Number(product.price) * qty).toLocaleString()} FCFA
          </button>
        </div>
      )}

      {showQuickBuy && (
        <QuickBuyModal
          product={product}
          quantity={qty}
          onClose={() => setShowQuickBuy(false)}
        />
      )}
    </>
  )
}
