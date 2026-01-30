import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, GraduationCap, ChevronLeft, ChevronRight, BookOpen, Globe } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useCalificaciones } from '../../hooks/useCalificaciones'
import { useMaterias } from '../../hooks/useMaterias'

// Extrae la nota del valorOriginal segun el sistema educativo
function extraerNota(cal) {
  const sistema = cal.sistemaOrigen?.toLowerCase()
  const valor = cal.valorOriginal?.[sistema]

  if (!valor) return '-'

  switch (sistema) {
    case 'uk':
      return valor.letra || valor.numerico || '-'
    case 'us':
      return valor.letra ? `${valor.letra} (${valor.porcentaje}%)` : '-'
    case 'de':
      return valor.nota ? `${valor.nota}${valor.tendencia || ''}` : '-'
    case 'ar':
      return valor.nota !== undefined ? valor.nota : '-'
    default:
      return '-'
  }
}

// Obtiene el periodo formateado
function formatPeriodo(cal) {
  if (cal.cicloLectivo) {
    return `${cal.cicloLectivo.anio} - ${cal.cicloLectivo.periodo || ''}`
  }
  return cal.periodo || '-'
}

// Obtiene variante de badge segun sistema y valor
function getBadgeVariant(cal) {
  const sistema = cal.sistemaOrigen?.toLowerCase()
  const valor = cal.valorOriginal?.[sistema]

  if (!valor) return 'default'

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

export default function CalificacionesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [paisFilter, setPaisFilter] = useState('')
  const [materiaFilter, setMateriaFilter] = useState('')
  const limit = 20

  const { data, isLoading, error } = useCalificaciones({
    page,
    limit,
    sistemaOrigen: paisFilter || undefined,
    materiaId: materiaFilter || undefined
  })
  const { data: materiasData } = useMaterias({
    limit: 500,
    sistemaEducativo: paisFilter || undefined
  })
  const calificaciones = data?.data || []
  const pagination = data?.pagination || { total: 0, pages: 1 }
  const materias = materiasData?.data || []

  const handlePaisChange = (value) => {
    setPaisFilter(value)
    setMateriaFilter('')  // Reset materia cuando cambia país
    setPage(1)
  }

  const handleMateriaChange = (value) => {
    setMateriaFilter(value)
    setPage(1)
  }

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message="Error al cargar las calificaciones" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
          <p className="text-gray-500">
            {pagination.total.toLocaleString()} calificaciones en total
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/calificaciones/nueva')}>
          Nueva Calificacion
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar calificaciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <select
                value={paisFilter}
                onChange={(e) => handlePaisChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white min-w-[150px]"
              >
                <option value="">Todos los países</option>
                <option value="UK">Reino Unido</option>
                <option value="US">Estados Unidos</option>
                <option value="DE">Alemania</option>
                <option value="AR">Argentina</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-400" />
              <select
                value={materiaFilter}
                onChange={(e) => handleMateriaChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white min-w-[200px]"
              >
                <option value="">Todas las materias</option>
                {materias.map((mat) => (
                  <option key={mat._id} value={mat._id}>
                    {mat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {calificaciones.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No hay calificaciones"
            description={materiaFilter ? "No hay calificaciones para esta materia" : "Comienza registrando una nueva calificacion"}
            action={
              !materiaFilter && (
                <Button icon={Plus} onClick={() => navigate('/calificaciones/nueva')}>
                  Nueva Calificacion
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Nota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calificaciones.map((cal) => (
                  <TableRow key={cal._id}>
                    <TableCell className="font-medium">
                      {cal.estudianteId?.nombre || cal.estudiante?.nombre} {cal.estudianteId?.apellido || cal.estudiante?.apellido}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cal.materiaId?.nombre || cal.materia?.nombre || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {cal.sistemaOrigen}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatPeriodo(cal)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(cal)}>
                        {extraerNota(cal)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginacion */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} de {pagination.total.toLocaleString()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Pagina {page} de {pagination.pages.toLocaleString()}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
