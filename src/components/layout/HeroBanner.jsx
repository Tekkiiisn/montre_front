import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

const WORDS = ['tendance', 'original', 'livré chez vous']

export default function HeroBanner() {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setWordIndex(i => (i + 1) % WORDS.length)
    }, 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Fond décoratif — cercles flous */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full
          bg-primary-100 opacity-60 blur-3xl" />
        <div className="absolute top-10 -left-10 w-48 h-48 rounded-full
          bg-orange-100 opacity-50 blur-2xl" />
        <div className="absolute bottom-0 right-1/3 w-40 h-40 rounded-full
          bg-primary-50 opacity-70 blur-2xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between
          gap-4 py-8 sm:py-10">

          {/* Texte gauche */}
          <div className="flex-1 text-center sm:text-left">
            {/* Badge pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100
                text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
            >
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              Livraison partout à Dakar
            </motion.div>

            {/* Titre avec mot animé */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-3"
            >
              Style{' '}
              <span className="relative inline-block">
                {/* Texte animé */}
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="text-primary-600"
                >
                  {WORDS[wordIndex]}
                </motion.span>
                {/* Soulignement décoratif */}
                <motion.span
                  layoutId="underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-300 rounded-full"
                />
              </span>
            </motion.h1>

           

            
             

          </div>

          {/* Côté droit — stats minimalistes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden sm:flex flex-col gap-3 shrink-0"
          >
            <StatCard emoji="🚚" value="Livraison" sub="partout au Sénégal" />
            <StatCard emoji="🔒" value="Paiement" sub="100% sécurisé" />
            <StatCard emoji="⚡" value="Rapide" sub="Commande en 2 min" />
          </motion.div>
        </div>

        {/* Barre de séparation discrète */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </section>
  )
}

function PayBadge({ emoji, label, color }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold
      px-2.5 py-1.5 rounded-lg border ${color}`}>
      {emoji} {label}
    </span>
  )
}

function StatCard({ emoji, value, sub }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-100
      rounded-2xl px-4 py-3 min-w-[170px]">
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="font-bold text-gray-800 text-sm leading-tight">{value}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  )
}
