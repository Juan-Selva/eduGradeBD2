import { AlertCircle } from 'lucide-react'

export default function Input({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors ${
          error ? 'border-red-500' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  )
}
