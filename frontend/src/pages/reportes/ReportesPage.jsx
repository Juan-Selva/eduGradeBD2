import { useState } from 'react'
import { BarChart3, Users, Building2, BookOpen, ChevronLeft, ChevronRight, CheckCircle, Globe, Award } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import {
  useResumen,
  usePromediosPorMateria,
  usePromediosPorInstitucion,
  useDistribucion,
  useTasaAprobacion,
  useTopMaterias,
} from '../../hooks/useReportes'

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

  // Filtros para distribucion
  const [paisDistribucion, setPaisDistribucion] = useState('')

  // Filtros para top materias
  const [paisTopMaterias, setPaisTopMaterias] = useState('')

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
  const { data: distribucion, isLoading: loadingDistribucion } = useDistribucion({
    pais: paisDistribucion || undefined,
  })
  const { data: tasaAprobacion, isLoading: loadingAprobacion } = useTasaAprobacion({})
  const { data: topMaterias, isLoading: loadingTopMaterias } = useTopMaterias({
    pais: paisTopMaterias || undefined,
    limit: 10
  })

  const isLoading = loadingResumen

  if (isLoading) return <Loading />

  const materiasData = promediosMateria?.data || []
  const materiasPagination = promediosMateria?.pagination
  const institucionesData = promediosInstitucion?.data || []
  const institucionesPagination = promediosInstitucion?.pagination
  const distribucionData = distribucion?.distribucion || []
  const aprobacionData = tasaAprobacion?.tasas || []
  const topMateriasData = topMaterias?.top10 || []

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasa Aprobacion</p>
              <p className="text-2xl font-bold text-gray-900">
                {loadingAprobacion ? '-' : `${(Array.isArray(aprobacionData) && aprobacionData.length > 0
                  ? (aprobacionData.reduce((acc, t) => acc + (t.tasaAprobacion || 0), 0) / aprobacionData.length)
                  : 0).toFixed(1)}%`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Distribucion de Calificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <select
              value={paisDistribucion}
              onChange={(e) => setPaisDistribucion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="">Todos los paises</option>
              <option value="AR">Argentina</option>
              <option value="UK">Reino Unido</option>
              <option value="US">Estados Unidos</option>
              <option value="DE">Alemania</option>
            </select>
          </CardContent>
          {loadingDistribucion ? (
            <div className="p-8 flex justify-center">
              <Loading />
            </div>
          ) : distribucionData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sin datos"
              description="No hay datos de distribucion disponibles"
            />
          ) : (
            <CardContent>
              <div className="space-y-3">
                {distribucionData
                  .filter(item => item.rango !== 'Sin clasificar')
                  .sort((a, b) => {
                    const order = { 'Excelente': 0, 'Bueno': 1, 'Aprobado': 2, 'Desaprobado': 3 }
                    const getOrder = (rango) => {
                      if (rango.startsWith('Excelente')) return 0
                      if (rango.startsWith('Bueno')) return 1
                      if (rango.startsWith('Aprobado')) return 2
                      return 3
                    }
                    return getOrder(a.rango) - getOrder(b.rango)
                  })
                  .map((item, index) => {
                    const getBarColor = (rango) => {
                      if (rango.startsWith('Excelente')) return 'bg-green-500'
                      if (rango.startsWith('Bueno')) return 'bg-blue-500'
                      if (rango.startsWith('Aprobado')) return 'bg-yellow-500'
                      return 'bg-red-500'
                    }
                    const maxCantidad = Math.max(...distribucionData.map(d => d.cantidad))
                    return (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-gray-700 min-w-[140px]">{item.rango}</span>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`${getBarColor(item.rango)} h-2.5 rounded-full transition-all`}
                              style={{ width: `${(item.cantidad / maxCantidad) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 font-medium w-16 text-right">
                            {item.cantidad?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Mejores Promedios por Materia
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <select
              value={paisTopMaterias}
              onChange={(e) => setPaisTopMaterias(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="">Todos los paises</option>
              <option value="AR">Argentina</option>
              <option value="UK">Reino Unido</option>
              <option value="US">Estados Unidos</option>
              <option value="DE">Alemania</option>
            </select>
          </CardContent>
          {loadingTopMaterias ? (
            <div className="p-8 flex justify-center">
              <Loading />
            </div>
          ) : topMateriasData.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Sin datos"
              description="No hay datos de materias disponibles"
            />
          ) : (
            <CardContent>
              <div className="space-y-4">
                {topMateriasData.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.nombre || '-'}</p>
                      <p className="text-sm text-gray-500">
                        {item.totalEstudiantes?.toLocaleString() || 0} estudiantes
                        {item.paises && ` · ${item.paises.length} países`}
                      </p>
                    </div>
                    <Badge variant={getBadgeVariant(item.promedio)}>
                      {item.promedio?.toFixed(1) || '0.0'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
