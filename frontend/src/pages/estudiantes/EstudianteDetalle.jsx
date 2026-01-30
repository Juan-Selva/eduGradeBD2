import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, GraduationCap } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useEstudiante } from '../../hooks/useEstudiantes'
import { useCalificacionesByEstudiante } from '../../hooks/useCalificaciones'

function getBadgeVariant(nota) {
  if (nota >= 90) return 'success'
  if (nota >= 70) return 'info'
  if (nota >= 60) return 'warning'
  return 'error'
}

export default function EstudianteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: estudiante, isLoading, error } = useEstudiante(id)
  const { data: calificacionesData } = useCalificacionesByEstudiante(id)

  const calificaciones = calificacionesData?.calificaciones || calificacionesData || []

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message="Error al cargar el estudiante" />
  if (!estudiante) return <ErrorMessage message="Estudiante no encontrado" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/estudiantes')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {estudiante.nombre} {estudiante.apellido}
            </h1>
            <p className="text-gray-500">{estudiante.email}</p>
          </div>
        </div>
        <Button
          icon={Pencil}
          onClick={() => navigate(`/estudiantes/${id}/editar`)}
        >
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informacion Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Documento</p>
              <p className="font-medium">{estudiante.documento}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
              <p className="font-medium">
                {estudiante.fechaNacimiento
                  ? new Date(estudiante.fechaNacimiento).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Institucion</p>
              <p className="font-medium">{estudiante.institucion?.nombre || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calificaciones</CardTitle>
          </CardHeader>
          {calificaciones.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Sin calificaciones"
              description="Este estudiante no tiene calificaciones registradas"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Materia</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Nota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calificaciones.map((cal) => (
                  <TableRow key={cal._id}>
                    <TableCell>{cal.materia?.nombre || '-'}</TableCell>
                    <TableCell>{cal.periodo || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(cal.nota)}>
                        {cal.nota}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
