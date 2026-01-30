import { ChevronDown, AlertCircle } from 'lucide-react'

export default function Select({
  label,
  error,
  options = [],
  placeholder = 'Seleccionar...',
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
      <div className="relative">
        <select
          className={`w-full px-3 py-2 pr-10 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors ${
            error ? 'border-red-500' : 'border-gray-200'
          } ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      </div>
      {error && (
        <p className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  )
}
