import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  BarChart3,
  ArrowRightLeft,
  Route,
  Shield,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Estudiantes', href: '/estudiantes', icon: Users },
  { name: 'Calificaciones', href: '/calificaciones', icon: GraduationCap },
  { name: 'Instituciones', href: '/instituciones', icon: Building2 },
  { name: 'Materias', href: '/materias', icon: BookOpen },
  { name: 'Conversiones', href: '/conversiones', icon: ArrowRightLeft },
  { name: 'Trayectorias', href: '/trayectorias', icon: Route },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Auditoria', href: '/auditoria', icon: Shield },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">EduGrade</h1>
      </div>

      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
