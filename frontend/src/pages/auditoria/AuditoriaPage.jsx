import { useState } from 'react'
import { Shield, Activity, User, Database, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import { useEventosAuditoria, useEstadisticasAuditoria } from '../../hooks/useAuditoria'

const TIPOS_ACCION = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREATE', label: 'Crear' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
  { value: 'LOGIN', label: 'Inicio de sesion' },
  { value: 'LOGOUT', label: 'Cierre de sesion' },
]

const TIPOS_ENTIDAD = [
  { value: '', label: 'Todas las entidades' },
  { value: 'estudiante', label: 'Estudiantes' },
  { value: 'calificacion', label: 'Calificaciones' },
  { value: 'institucion', label: 'Instituciones' },
  { value: 'materia', label: 'Materias' },
  { value: 'usuario', label: 'Usuarios' },
]

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null

  const { page, totalPages, total } = pagination

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Pagina {page} de {totalPages} ({total} total)
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function getAccionBadgeVariant(accion) {
  switch (accion) {
    case 'CREATE':
      return 'success'
    case 'UPDATE':
      return 'info'
    case 'DELETE':
      return 'error'
    case 'LOGIN':
    case 'LOGOUT':
      return 'warning'
    default:
      return 'default'
  }
}

function formatFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AuditoriaPage() {
  const [page, setPage] = useState(1)
  const [tipoAccion, setTipoAccion] = useState('')
  const [tipoEntidad, setTipoEntidad] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const { data: eventos, isLoading: loadingEventos } = useEventosAuditoria({
    page,
    limit: 20,
    accion: tipoAccion || undefined,
    entidad: tipoEntidad || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  })

  const { data: estadisticas, isLoading: loadingEstadisticas } = useEstadisticasAuditoria()

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  const clearFilters = () => {
    setTipoAccion('')
    setTipoEntidad('')
    setFechaDesde('')
    setFechaHasta('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-gray-500">Registro de eventos y cambios en el sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Activity className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Eventos</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingEstadisticas ? '-' : estadisticas?.total_eventos?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <Database className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Creaciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingEstadisticas ? '-' : estadisticas?.por_accion?.CREATE?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100">
              <Shield className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Actualizaciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingEstadisticas ? '-' : estadisticas?.por_accion?.UPDATE?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100">
              <User className="h-6 w-6 text-red-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Eliminaciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingEstadisticas ? '-' : estadisticas?.por_accion?.DELETE?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={tipoAccion}
              onChange={handleFilterChange(setTipoAccion)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIPOS_ACCION.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={tipoEntidad}
              onChange={handleFilterChange(setTipoEntidad)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIPOS_ENTIDAD.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fechaDesde}
              onChange={handleFilterChange(setFechaDesde)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Desde"
            />

            <input
              type="date"
              value={fechaHasta}
              onChange={handleFilterChange(setFechaHasta)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hasta"
            />

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Eventos de Auditoria
          </CardTitle>
        </CardHeader>

        {loadingEventos ? (
          <div className="p-8 flex justify-center">
            <Loading />
          </div>
        ) : !eventos?.data?.length ? (
          <EmptyState
            icon={Activity}
            title="Sin eventos"
            description="No hay eventos de auditoria registrados con los filtros seleccionados"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Accion</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Detalles</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.data.map((evento, index) => (
                  <TableRow key={evento._id || index}>
                    <TableCell className="text-sm text-gray-500">
                      {formatFecha(evento.fecha || evento.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAccionBadgeVariant(evento.accion)}>
                        {evento.accion}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {evento.entidad_tipo}
                      {evento.entidad_id && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({evento.entidad_id.substring(0, 8)}...)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {evento.usuario?.nombre || evento.usuario_email || evento.usuario_id || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-500">
                      {evento.descripcion || evento.detalles || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {evento.ip || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              pagination={eventos.pagination}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  )
}
