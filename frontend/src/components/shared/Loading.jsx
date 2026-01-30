import { Loader2 } from 'lucide-react'

export default function Loading({ text = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="mt-2 text-sm text-gray-500">{text}</p>
    </div>
  )
}
