import { clsx } from 'clsx'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  wave: 'btn-wave',
  orange: 'btn-orange',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition-all',
  ghost: 'text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all',
}

export default function Button({ children, variant = 'primary', className, loading, ...props }) {
  return (
    <button
      className={clsx(variants[variant], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Chargement...
        </span>
      ) : children}
    </button>
  )
}