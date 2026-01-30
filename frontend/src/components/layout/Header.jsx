import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <User className="h-4 w-4" />
          <span>{user?.nombre || user?.email}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </header>
  )
}
