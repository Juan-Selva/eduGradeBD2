import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-black text-white hover:bg-gray-700',
  secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
    </button>
  )
}
