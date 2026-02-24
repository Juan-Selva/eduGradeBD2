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

function extraerNota(cal) {
  const sistema = cal.sistemaOrigen?.toLowerCase()
  const valor = cal.valorOriginal?.[sistema]
  if (!valor) return cal.nota ?? '-'
  switch (sistema) {
    case 'uk': return valor.letra || '-'
    case 'us': return valor.porcentaje !== undefined ? `${valor.porcentaje}%` : '-'
    case 'de': return valor.nota ? `${valor.nota}${valor.tendencia || ''}` : '-'
    case 'ar': return valor.nota !== undefined ? valor.nota : '-'
    default: return '-'
  }
}

function formatPeriodo(cal) {
  if (cal.cicloLectivo) return `${cal.cicloLectivo.anio} - ${cal.cicloLectivo.periodo || ''}`
  return cal.periodo || '-'
}

function getBadgeVariant(cal) {
  const sistema = cal.sistemaOrigen?.toLowerCase()
  const valor = cal.valorOriginal?.[sistema]
  if (!valor) {
    const nota = cal.nota
    if (nota >= 90) return 'success'
    if (nota >= 70) return 'info'
    if (nota >= 60) return 'warning'
    return 'error'
  }
  switch (sistema) {
    case 'uk':
      if (['A*', 'A', 'B'].includes(valor.letra)) return 'success'
      if (['C', 'D'].includes(valor.letra)) return 'warning'
      return 'error'
    case 'us':
      if (valor.porcentaje >= 90) return 'success'
      if (valor.porcentaje >= 70) return 'info'
      if (valor.porcentaje >= 60) return 'warning'
      return 'error'
    case 'de':
      if (valor.nota <= 2) return 'success'
      if (valor.nota <= 3) return 'info'
      if (valor.nota <= 4) return 'warning'
      return 'error'
    case 'ar':
      if (valor.nota >= 8) return 'success'
      if (valor.nota >= 6) return 'info'
      if (valor.nota >= 4) return 'warning'
      return 'error'
    default:
      return 'default'
  }
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
              <p className="font-medium">{estudiante.dni || estudiante.documento}</p>
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
              <p className="font-medium">{estudiante.institucionId?.nombre || estudiante.institucion?.nombre || '-'}</p>
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
                    <TableCell>{cal.materiaId?.nombre || cal.materia?.nombre || '-'}</TableCell>
                    <TableCell>{formatPeriodo(cal)}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(cal)}>
                        {extraerNota(cal)}
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
