import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ title = 'Error', message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          {message && (
            <p className="mt-1 text-sm text-red-700">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
