# EduGrade Global - Frontend

## Indice

1. [Stack del Frontend](#stack-del-frontend)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Componentes Principales](#componentes-principales)
4. [Flujo de Autenticacion](#flujo-de-autenticacion)
5. [Comunicacion con Backend](#comunicacion-con-backend)
6. [Paginas de la Aplicacion](#paginas-de-la-aplicacion)
7. [Componentes UI Reutilizables](#componentes-ui-reutilizables)
8. [Enrutamiento](#enrutamiento)

---

## Stack del Frontend

### Tecnologias Principales

| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| **React** | 18+ | Libreria UI basada en componentes |
| **Vite** | 5.x | Build tool y servidor de desarrollo |
| **React Router** | 6.x | Enrutamiento SPA (Single Page Application) |
| **Axios** | 1.x | Cliente HTTP para llamadas a la API |
| **Tailwind CSS** | 3.x | Framework CSS utility-first |
| **React Query** | 5.x | Cache y manejo de estado del servidor |

### Diagrama de Arquitectura Frontend

```
+------------------------------------------------------------------+
|                       BROWSER                                     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        React App                                  |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |                    React Router                             |  |
|  |  /login -> LoginPage                                        |  |
|  |  / -> DashboardPage                                         |  |
|  |  /estudiantes -> EstudiantesPage                            |  |
|  |  /calificaciones -> CalificacionesPage                      |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|  +------------------------------------------------------------+  |
|  |                    Context Providers                        |  |
|  |  AuthContext (usuario, login, logout)                       |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|  +------------------------------------------------------------+  |
|  |                    Componentes                              |  |
|  |  +----------+  +----------+  +----------+  +----------+    |  |
|  |  |  Layout  |  |   Pages  |  |    UI    |  |  Shared  |    |  |
|  |  | (Header  |  | (Dashboard|  | (Button  |  | (Loading |    |  |
|  |  | Sidebar) |  |  Estud.) |  |  Input)  |  |  Error)  |    |  |
|  |  +----------+  +----------+  +----------+  +----------+    |  |
|  +------------------------------------------------------------+  |
|                              |                                    |
|  +------------------------------------------------------------+  |
|  |                    API Client                               |  |
|  |  Axios + Interceptors (token, errores)                      |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    Backend API                                    |
|                 http://localhost:3000/api                         |
+------------------------------------------------------------------+
```

---

## Estructura de Carpetas

```
frontend/
+-- src/
|   +-- api/                      # Clientes HTTP
|   |   +-- client.js             # Configuracion Axios
|   |   +-- auth.js               # Endpoints de autenticacion
|   |   +-- estudiantes.js        # Endpoints de estudiantes
|   |   +-- calificaciones.js     # Endpoints de calificaciones
|   |   +-- instituciones.js      # Endpoints de instituciones
|   |   +-- materias.js           # Endpoints de materias
|   |   +-- reportes.js           # Endpoints de reportes
|   |
|   +-- components/
|   |   +-- layout/               # Componentes de estructura
|   |   |   +-- Layout.jsx        # Layout principal
|   |   |   +-- Header.jsx        # Barra superior
|   |   |   +-- Sidebar.jsx       # Menu lateral
|   |   |   +-- ProtectedRoute.jsx# Rutas protegidas
|   |   |
|   |   +-- ui/                   # Componentes UI reutilizables
|   |   |   +-- Button.jsx
|   |   |   +-- Input.jsx
|   |   |   +-- Select.jsx
|   |   |   +-- Table.jsx
|   |   |   +-- Card.jsx
|   |   |   +-- Badge.jsx
|   |   |   +-- Modal.jsx
|   |   |
|   |   +-- shared/               # Componentes compartidos
|   |       +-- Loading.jsx
|   |       +-- EmptyState.jsx
|   |       +-- ErrorMessage.jsx
|   |
|   +-- context/
|   |   +-- AuthContext.jsx       # Estado de autenticacion
|   |
|   +-- hooks/
|   |   +-- useAuth.js            # Hook para AuthContext
|   |
|   +-- pages/
|   |   +-- auth/
|   |   |   +-- LoginPage.jsx
|   |   |
|   |   +-- dashboard/
|   |   |   +-- DashboardPage.jsx
|   |   |
|   |   +-- estudiantes/
|   |   |   +-- EstudiantesPage.jsx
|   |   |   +-- EstudianteForm.jsx
|   |   |   +-- EstudianteDetalle.jsx
|   |   |
|   |   +-- calificaciones/
|   |   |   +-- CalificacionesPage.jsx
|   |   |   +-- CalificacionForm.jsx
|   |   |
|   |   +-- instituciones/
|   |   |   +-- InstitucionesPage.jsx
|   |   |
|   |   +-- materias/
|   |   |   +-- MateriasPage.jsx
|   |   |
|   |   +-- reportes/
|   |       +-- ReportesPage.jsx
|   |
|   +-- App.jsx                   # Componente raiz
|   +-- main.jsx                  # Entry point
|
+-- public/                       # Assets estaticos
+-- index.html
+-- vite.config.js
+-- tailwind.config.js
+-- package.json
+-- Dockerfile
```

---

## Componentes Principales

### Layout Principal

```
+------------------------------------------------------------------+
|                          HEADER                                   |
|  +--------------------+                      +------------------+ |
|  |  EduGrade Global   |                      | Usuario | Logout | |
|  +--------------------+                      +------------------+ |
+------------------------------------------------------------------+
|        |                                                          |
| SIDEBAR|                    CONTENIDO                             |
|        |                                                          |
| +------+                                                          |
| |      |    +------------------------------------------------+   |
| | Home |    |                                                |   |
| |      |    |           Pagina Actual                        |   |
| | Estud|    |           (Dashboard, Estudiantes, etc.)       |   |
| |      |    |                                                |   |
| | Calif|    |                                                |   |
| |      |    +------------------------------------------------+   |
| | Inst |                                                          |
| |      |                                                          |
| | Mater|                                                          |
| |      |                                                          |
| | Repor|                                                          |
| +------+                                                          |
+------------------------------------------------------------------+
```

### Layout.jsx

```jsx
// frontend/src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />  {/* Renderiza la pagina actual */}
        </main>
      </div>
    </div>
  )
}
```

### Header.jsx

```jsx
// frontend/src/components/layout/Header.jsx
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">
          EduGrade Global
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {user?.nombre} {user?.apellido}
          </span>
          <button
            onClick={logout}
            className="text-red-600 hover:text-red-700"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </header>
  )
}
```

### Sidebar.jsx

```jsx
// frontend/src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: 'HomeIcon' },
  { path: '/estudiantes', label: 'Estudiantes', icon: 'UsersIcon' },
  { path: '/calificaciones', label: 'Calificaciones', icon: 'AcademicCapIcon' },
  { path: '/instituciones', label: 'Instituciones', icon: 'BuildingIcon' },
  { path: '/materias', label: 'Materias', icon: 'BookOpenIcon' },
  { path: '/reportes', label: 'Reportes', icon: 'ChartBarIcon' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen">
      <nav className="p-4">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-1
               ${isActive
                 ? 'bg-blue-50 text-blue-700'
                 : 'text-gray-600 hover:bg-gray-50'
               }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

### ProtectedRoute.jsx

```jsx
// frontend/src/components/layout/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  // Mostrar loading mientras verifica autenticacion
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Redirigir a login si no esta autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Renderizar la ruta protegida
  return <Outlet />
}
```

---

## Flujo de Autenticacion

### Diagrama de Flujo

```
+-------------------+
|   Usuario abre    |
|   la aplicacion   |
+--------+----------+
         |
         v
+--------+----------+
| Verificar token   |
| en localStorage   |
+--------+----------+
         |
    +----+----+
    |         |
    v         v
 HAY TOKEN   NO HAY TOKEN
    |             |
    v             v
+--------+  +----------+
| Cargar |  | Redirect |
| usuario|  | a Login  |
+--------+  +----------+
    |             |
    v             v
+--------+  +----------+
| Mostrar|  | Mostrar  |
| App    |  | LoginPage|
+--------+  +----------+
                  |
                  | (usuario ingresa credenciales)
                  v
            +----------+
            | POST     |
            | /login   |
            +----+-----+
                 |
            +----+----+
            |         |
            v         v
         EXITO     ERROR
            |         |
            v         v
      +----------+ +----------+
      | Guardar  | | Mostrar  |
      | tokens   | | error    |
      | Redirect | +----------+
      | a Home   |
      +----------+
```

### AuthContext.jsx

```jsx
// frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar token al cargar la app
  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Funcion de login
  const login = async (credentials) => {
    const data = await authApi.login(credentials)

    // Guardar tokens y usuario
    localStorage.setItem('token', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.usuario))

    setUser(data.usuario)
    return data
  }

  // Funcion de logout
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

### useAuth Hook

```jsx
// frontend/src/hooks/useAuth.js
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
```

---

## Comunicacion con Backend

### Cliente Axios

```jsx
// frontend/src/api/client.js
import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a cada request
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores de respuesta
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si recibimos 401, el token expiro o es invalido
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
```

### API de Autenticacion

```jsx
// frontend/src/api/auth.js
import client from './client'

export const authApi = {
  login: async (credentials) => {
    const { data } = await client.post('/auth/login', credentials)
    return data
  },

  register: async (userData) => {
    const { data } = await client.post('/auth/register', userData)
    return data
  },

  me: async () => {
    const { data } = await client.get('/auth/me')
    return data
  },

  refresh: async (refreshToken) => {
    const { data } = await client.post('/auth/refresh', { refreshToken })
    return data
  },

  logout: async () => {
    await client.post('/auth/logout')
  }
}
```

### API de Estudiantes

```jsx
// frontend/src/api/estudiantes.js
import client from './client'

export const estudiantesApi = {
  getAll: async (params = {}) => {
    const { data } = await client.get('/estudiantes', { params })
    return data
  },

  getById: async (id) => {
    const { data } = await client.get(`/estudiantes/${id}`)
    return data
  },

  getByDni: async (dni) => {
    const { data } = await client.get(`/estudiantes/dni/${dni}`)
    return data
  },

  create: async (estudiante) => {
    const { data } = await client.post('/estudiantes', estudiante)
    return data
  },

  update: async (id, estudiante) => {
    const { data } = await client.put(`/estudiantes/${id}`, estudiante)
    return data
  },

  delete: async (id) => {
    await client.delete(`/estudiantes/${id}`)
  }
}
```

### API de Reportes

```jsx
// frontend/src/api/reportes.js
import client from './client'

export const reportesApi = {
  getResumen: async () => {
    const { data } = await client.get('/reportes/resumen')
    return data
  },

  getPromediosPorMateria: async (params = {}) => {
    const { data } = await client.get('/reportes/promedios-materia', { params })
    return data
  },

  getPromediosPorInstitucion: async (params = {}) => {
    const { data } = await client.get('/reportes/promedios-institucion', { params })
    return data
  },

  getDistribucion: async (params = {}) => {
    const { data } = await client.get('/reportes/distribucion', { params })
    return data
  },

  getTasaAprobacion: async (params = {}) => {
    const { data } = await client.get('/reportes/aprobacion', { params })
    return data
  }
}
```

---

## Paginas de la Aplicacion

### LoginPage

```jsx
// frontend/src/pages/auth/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">
          EduGrade Global
        </h1>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg
                       hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Iniciando...' : 'Iniciar Sesion'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### DashboardPage

```jsx
// frontend/src/pages/dashboard/DashboardPage.jsx
import { useEffect, useState } from 'react'
import { reportesApi } from '../../api/reportes'
import Card from '../../components/ui/Card'
import Loading from '../../components/shared/Loading'

export default function DashboardPage() {
  const [resumen, setResumen] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const data = await reportesApi.getResumen()
        setResumen(data)
      } catch (error) {
        console.error('Error cargando resumen:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResumen()
  }, [])

  if (isLoading) return <Loading />

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-gray-500 text-sm">Total Estudiantes</div>
          <div className="text-3xl font-bold">{resumen?.totales?.estudiantes}</div>
        </Card>

        <Card>
          <div className="text-gray-500 text-sm">Instituciones</div>
          <div className="text-3xl font-bold">{resumen?.totales?.instituciones}</div>
        </Card>

        <Card>
          <div className="text-gray-500 text-sm">Materias</div>
          <div className="text-3xl font-bold">{resumen?.totales?.materias}</div>
        </Card>

        <Card>
          <div className="text-gray-500 text-sm">Calificaciones</div>
          <div className="text-3xl font-bold">{resumen?.totales?.calificaciones}</div>
        </Card>
      </div>

      {/* Estadisticas por sistema */}
      <h2 className="text-xl font-bold mt-8 mb-4">Por Sistema Educativo</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(resumen?.porSistema || {}).map(([sistema, datos]) => (
          <Card key={sistema}>
            <div className="text-lg font-semibold">{sistema}</div>
            <div className="text-gray-600">
              {datos.estudiantes} estudiantes
            </div>
            <div className="text-gray-600">
              {datos.calificaciones} calificaciones
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### EstudiantesPage

```jsx
// frontend/src/pages/estudiantes/EstudiantesPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, ChevronRight, ChevronLeft, Building2, Globe } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useEstudiantes } from '../../hooks/useEstudiantes'
import { useInstituciones } from '../../hooks/useInstituciones'

export default function EstudiantesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [paisFilter, setPaisFilter] = useState('')
  const [institucionFilter, setInstitucionFilter] = useState('')
  const limit = 20

  const { data, isLoading, error } = useEstudiantes({
    page,
    limit,
    paisOrigen: paisFilter || undefined,
    institucionId: institucionFilter || undefined
  })
  const estudiantes = data?.data || []
  const pagination = data?.pagination || { total: 0, pages: 1 }

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message="Error al cargar los estudiantes" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-gray-500">
            {pagination.total.toLocaleString()} estudiantes en total
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/estudiantes/nuevo')}>
          Nuevo Estudiante
        </Button>
      </div>

      <Card>
        {/* Filtros y busqueda */}
        <div className="p-4 border-b border-gray-200">
          {/* ... filtros de pais e institucion ... */}
        </div>

        {/* Tabla sin columna de acciones */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Pais</TableHead>
              <TableHead>Institucion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estudiantes.map((estudiante) => (
              <TableRow key={estudiante._id}>
                <TableCell className="font-medium">
                  {estudiante.nombre} {estudiante.apellido}
                </TableCell>
                <TableCell>{estudiante.email || '-'}</TableCell>
                <TableCell>{estudiante.dni}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {estudiante.paisOrigen}
                  </span>
                </TableCell>
                <TableCell>
                  {estudiante.institucionId?.nombreCorto || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Paginacion */}
      </Card>
    </div>
  )
}
```

> **Nota:** Las paginas de listado (Estudiantes, Calificaciones, Materias, Instituciones) solo permiten crear nuevos registros. No hay botones de editar/eliminar inline en las tablas.

---

## Componentes UI Reutilizables

### Button

```jsx
// frontend/src/components/ui/Button.jsx
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = ''
}) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  )
}
```

### Input

```jsx
// frontend/src/components/ui/Input.jsx
export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = ''
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-700 font-medium mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`
          w-full border rounded-lg px-4 py-2
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
```

### Select

```jsx
// frontend/src/components/ui/Select.jsx
export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  error,
  required = false,
  disabled = false
}) {
  return (
    <div>
      {label && (
        <label className="block text-gray-700 font-medium mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full border rounded-lg px-4 py-2
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}
```

### Table

```jsx
// frontend/src/components/ui/Table.jsx
import Loading from '../shared/Loading'
import EmptyState from '../shared/EmptyState'

export default function Table({ columns, data, isLoading }) {
  if (isLoading) return <Loading />
  if (!data || data.length === 0) return <EmptyState />

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium
                           text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={row._id || idx} className="hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Badge

```jsx
// frontend/src/components/ui/Badge.jsx
export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span className={`
      ${variants[variant]}
      px-2 py-1 rounded-full text-xs font-medium
    `}>
      {children}
    </span>
  )
}
```

### Card

```jsx
// frontend/src/components/ui/Card.jsx
export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  )
}
```

---

## Enrutamiento

### App.jsx - Configuracion de Rutas

```jsx
// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Pages
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import EstudiantesPage from './pages/estudiantes/EstudiantesPage'
import EstudianteForm from './pages/estudiantes/EstudianteForm'
import EstudianteDetalle from './pages/estudiantes/EstudianteDetalle'
import CalificacionesPage from './pages/calificaciones/CalificacionesPage'
import CalificacionForm from './pages/calificaciones/CalificacionForm'
import InstitucionesPage from './pages/instituciones/InstitucionesPage'
import MateriasPage from './pages/materias/MateriasPage'
import ReportesPage from './pages/reportes/ReportesPage'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Ruta publica */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />

          {/* Estudiantes */}
          <Route path="/estudiantes" element={<EstudiantesPage />} />
          <Route path="/estudiantes/nuevo" element={<EstudianteForm />} />
          <Route path="/estudiantes/:id" element={<EstudianteDetalle />} />
          <Route path="/estudiantes/:id/editar" element={<EstudianteForm />} />

          {/* Calificaciones */}
          <Route path="/calificaciones" element={<CalificacionesPage />} />
          <Route path="/calificaciones/nueva" element={<CalificacionForm />} />
          <Route path="/calificaciones/:id/editar" element={<CalificacionForm />} />

          {/* Otras entidades */}
          <Route path="/instituciones" element={<InstitucionesPage />} />
          <Route path="/materias" element={<MateriasPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Route>
      </Route>

      {/* Ruta 404 - redirige a home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
```

### Estructura de Rutas

| Ruta | Componente | Descripcion |
|------|------------|-------------|
| /login | LoginPage | Inicio de sesion |
| / | DashboardPage | Dashboard principal |
| /estudiantes | EstudiantesPage | Lista de estudiantes |
| /estudiantes/nuevo | EstudianteForm | Crear estudiante |
| /estudiantes/:id | EstudianteDetalle | Ver detalle |
| /estudiantes/:id/editar | EstudianteForm | Editar estudiante |
| /calificaciones | CalificacionesPage | Lista de calificaciones |
| /calificaciones/nueva | CalificacionForm | Nueva calificacion |
| /instituciones | InstitucionesPage | Lista de instituciones |
| /materias | MateriasPage | Lista de materias |
| /reportes | ReportesPage | Reportes y estadisticas |

---

## Proximos Documentos

- **06-GUIA-INSTALACION.md**: Como ejecutar el proyecto
