import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'
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
import ConversionesPage from './pages/conversiones/ConversionesPage'
import TrayectoriasPage from './pages/trayectorias/TrayectoriasPage'
import AuditoriaPage from './pages/auditoria/AuditoriaPage'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/estudiantes" element={<EstudiantesPage />} />
          <Route path="/estudiantes/nuevo" element={<EstudianteForm />} />
          <Route path="/estudiantes/:id" element={<EstudianteDetalle />} />
          <Route path="/estudiantes/:id/editar" element={<EstudianteForm />} />
          <Route path="/calificaciones" element={<CalificacionesPage />} />
          <Route path="/calificaciones/nueva" element={<CalificacionForm />} />
          <Route path="/calificaciones/:id/editar" element={<CalificacionForm />} />
          <Route path="/instituciones" element={<InstitucionesPage />} />
          <Route path="/materias" element={<MateriasPage />} />
          <Route path="/conversiones" element={<ConversionesPage />} />
          <Route path="/trayectorias" element={<TrayectoriasPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/auditoria" element={<AuditoriaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
