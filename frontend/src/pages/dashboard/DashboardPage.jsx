import { Users, GraduationCap, Building2, BookOpen } from 'lucide-react'
import Card, { CardContent } from '../../components/ui/Card'
import Loading from '../../components/shared/Loading'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useResumen } from '../../hooks/useReportes'

function StatCard({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-gray-100">
          <Icon className="h-6 w-6 text-gray-700" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: resumen, isLoading, error } = useResumen()

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message="Error al cargar el resumen" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Estudiantes"
          value={resumen?.totalEstudiantes || 0}
          icon={Users}
        />
        <StatCard
          title="Calificaciones"
          value={resumen?.totalCalificaciones || 0}
          icon={GraduationCap}
        />
        <StatCard
          title="Instituciones"
          value={resumen?.totalInstituciones || 0}
          icon={Building2}
        />
        <StatCard
          title="Materias"
          value={resumen?.totalMaterias || 0}
          icon={BookOpen}
        />
      </div>

      {resumen?.promedioGeneral !== undefined && (
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Promedio General
            </h2>
            <p className="text-4xl font-bold text-gray-900">
              {resumen.promedioGeneral.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
