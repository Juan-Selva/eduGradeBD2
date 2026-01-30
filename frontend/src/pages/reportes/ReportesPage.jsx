import { useState } from 'react'
import { BarChart3, Users, Building2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useResumen, usePromediosPorMateria, usePromediosPorInstitucion } from '../../hooks/useReportes'

function getBadgeVariant(promedio) {
  if (promedio >= 90) return 'success'
  if (promedio >= 70) return 'info'
  if (promedio >= 60) return 'warning'
  return 'error'
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null

  const { page, totalPages, total } = pagination

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Mostrando pagina {page} de {totalPages} ({total} total)
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

export default function ReportesPage() {
  // Filtros para Institucion
  const [paisFilter, setPaisFilter] = useState('')
  const [ordenFilter, setOrdenFilter] = useState('desc')
  const [pageInstitucion, setPageInstitucion] = useState(1)

  // Filtros para Materia
  const [paisFilterMateria, setPaisFilterMateria] = useState('')
  const [ordenFilterMateria, setOrdenFilterMateria] = useState('desc')
  const [pageMateria, setPageMateria] = useState(1)

  const { data: resumen, isLoading: loadingResumen } = useResumen()
  const { data: promediosMateria, isLoading: loadingMaterias } = usePromediosPorMateria({
    pais: paisFilterMateria || undefined,
    orden: ordenFilterMateria,
    page: pageMateria,
    limit: 10
  })
  const { data: promediosInstitucion, isLoading: loadingInstituciones } = usePromediosPorInstitucion({
    pais: paisFilter || undefined,
    orden: ordenFilter,
    page: pageInstitucion,
    limit: 10
  })

  const isLoading = loadingResumen

  if (isLoading) return <Loading />

  const materiasData = promediosMateria?.data || []
  const materiasPagination = promediosMateria?.pagination
  const institucionesData = promediosInstitucion?.data || []
  const institucionesPagination = promediosInstitucion?.pagination

  // Reset page when filters change
  const handleMateriaFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPageMateria(1)
  }

  const handleInstitucionFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPageInstitucion(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500">Estadisticas y reportes del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-100">
              <Users className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Estudiantes</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumen?.totalEstudiantes?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-100">
              <BarChart3 className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Promedio General</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumen?.promedioGeneral?.toFixed(2) || '0.00'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-100">
              <Building2 className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Instituciones Activas</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumen?.totalInstituciones?.toLocaleString() || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Promedios por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="flex gap-4 mb-4">
              <select
                value={paisFilterMateria}
                onChange={handleMateriaFilterChange(setPaisFilterMateria)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los paises</option>
                <option value="AR">Argentina</option>
                <option value="UK">Reino Unido</option>
                <option value="US">Estados Unidos</option>
                <option value="DE">Alemania</option>
              </select>

              <select
                value={ordenFilterMateria}
                onChange={handleMateriaFilterChange(setOrdenFilterMateria)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Mayor a menor</option>
                <option value="asc">Menor a mayor</option>
              </select>
            </div>
          </CardContent>
          {loadingMaterias ? (
            <div className="p-8 flex justify-center">
              <Loading />
            </div>
          ) : materiasData.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin datos"
              description="No hay calificaciones registradas por materia"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materia</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead>Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiasData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.materia || item.nombre || '-'}
                      </TableCell>
                      <TableCell>{item.cantidad || item.totalEstudiantes || 0}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(item.promedio)}>
                          {item.promedio?.toFixed(2) || '0.00'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                pagination={materiasPagination}
                onPageChange={setPageMateria}
              />
            </>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Promedios por Institucion
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="flex gap-4 mb-4">
              <select
                value={paisFilter}
                onChange={handleInstitucionFilterChange(setPaisFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los paises</option>
                <option value="AR">Argentina</option>
                <option value="UK">Reino Unido</option>
                <option value="US">Estados Unidos</option>
                <option value="DE">Alemania</option>
              </select>

              <select
                value={ordenFilter}
                onChange={handleInstitucionFilterChange(setOrdenFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Mayor a menor</option>
                <option value="asc">Menor a mayor</option>
              </select>
            </div>
          </CardContent>
          {loadingInstituciones ? (
            <div className="p-8 flex justify-center">
              <Loading />
            </div>
          ) : institucionesData.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Sin datos"
              description="No hay calificaciones registradas por institucion"
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institucion</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead>Promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institucionesData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.institucion || item.nombre || '-'}
                      </TableCell>
                      <TableCell>{item.cantidad || item.totalEstudiantes || 0}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(item.promedio)}>
                          {item.promedio?.toFixed(2) || '0.00'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                pagination={institucionesPagination}
                onPageChange={setPageInstitucion}
              />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
