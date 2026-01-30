import { useState } from 'react'
import { Route, GitBranch, ArrowRight, Search, GraduationCap, MapPin, BookOpen, Building2 } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useTrayectoriaEstudiante, useEquivalencias, useCrearEquivalencia, useCaminoAcademico } from '../../hooks/useTrayectorias'
import { useEstudiantes } from '../../hooks/useEstudiantes'

function TrayectoriaVisual({ trayectoria }) {
  if (!trayectoria) {
    return (
      <EmptyState
        icon={Route}
        title="Sin trayectoria"
        description="Este estudiante no tiene trayectoria academica registrada"
      />
    )
  }

  const { estudiante, resumen, calificaciones } = trayectoria

  if (!calificaciones?.length) {
    return (
      <EmptyState
        icon={Route}
        title="Sin calificaciones"
        description="Este estudiante no tiene calificaciones registradas"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Info del estudiante */}
      {estudiante && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">{estudiante.nombre}</h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-blue-700">
            {estudiante.paisOrigen && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {estudiante.paisOrigen}
              </span>
            )}
            {resumen?.totalCalificaciones && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {resumen.totalCalificaciones} calificaciones
              </span>
            )}
          </div>
          {resumen?.sistemasUsados?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {resumen.sistemasUsados.map((sistema, i) => (
                <Badge key={i} variant="info">{sistema}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de calificaciones */}
      {calificaciones.map((cal, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-bold">{index + 1}</span>
          </div>
          <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {cal.materiaId?.nombre || cal.materia || 'Materia sin nombre'}
                </h4>
                <p className="text-sm text-gray-500">
                  {cal.institucionId?.nombre || cal.institucion || 'Institucion no especificada'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(cal.valorOriginal?.ar?.nota || cal.valor) && (
                  <Badge variant="info">
                    {cal.valorOriginal?.ar?.nota || cal.valor}
                  </Badge>
                )}
                {cal.sistema && (
                  <Badge variant="warning">{cal.sistema}</Badge>
                )}
              </div>
            </div>
            {cal.periodo && (
              <p className="text-xs text-gray-400 mt-1">{cal.periodo}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TrayectoriasPage() {
  const [estudianteId, setEstudianteId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNuevaEquivalencia, setShowNuevaEquivalencia] = useState(false)
  const [nuevaEquivalencia, setNuevaEquivalencia] = useState({
    materiaOrigenId: '',
    materiaDestinoId: '',
    tipoEquivalencia: 'total',
    porcentajeEquivalencia: 100,
  })
  const [error, setError] = useState('')

  const { data: estudiantes } = useEstudiantes({ search: searchTerm, limit: 10 })
  const { data: trayectoria, isLoading: loadingTrayectoria, error: errorTrayectoria } = useTrayectoriaEstudiante(estudianteId)
  const { data: camino, isLoading: loadingCamino } = useCaminoAcademico(estudianteId)
  // Backend devuelve array directo, sin paginacion
  const { data: equivalencias, isLoading: loadingEquivalencias } = useEquivalencias()
  const crearEquivalenciaMutation = useCrearEquivalencia()

  const handleSelectEstudiante = (id) => {
    setEstudianteId(id)
    setSearchTerm('')
  }

  const handleCrearEquivalencia = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await crearEquivalenciaMutation.mutateAsync(nuevaEquivalencia)
      setShowNuevaEquivalencia(false)
      setNuevaEquivalencia({
        materiaOrigenId: '',
        materiaDestinoId: '',
        tipoEquivalencia: 'total',
        porcentajeEquivalencia: 100,
      })
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear la equivalencia')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trayectorias Academicas</h1>
        <p className="text-gray-500">Visualiza y gestiona trayectorias academicas de estudiantes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Estudiante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && estudiantes?.data?.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {estudiantes.data.map((est) => (
                  <button
                    key={est._id}
                    onClick={() => handleSelectEstudiante(est._id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {est.nombreCompleto || `${est.nombre} ${est.apellido}`}
                      </p>
                      <p className="text-sm text-gray-500">{est.email}</p>
                    </div>
                    <Badge variant="info">{est.paisOrigen}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {estudianteId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Trayectoria Academica
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrayectoria ? (
                <Loading />
              ) : errorTrayectoria ? (
                <ErrorMessage message={errorTrayectoria.message || 'Error cargando trayectoria'} />
              ) : (
                <TrayectoriaVisual trayectoria={trayectoria} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Camino Academico (Neo4j)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCamino ? (
                <Loading />
              ) : !camino?.estudiante && !camino?.materiasCursadas?.length ? (
                <EmptyState
                  icon={GitBranch}
                  title="Sin datos en grafo"
                  description="Este estudiante no tiene datos en Neo4j"
                />
              ) : (
                <div className="space-y-4">
                  {/* Instituciones */}
                  {camino.instituciones?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Instituciones ({camino.instituciones.length})
                      </h4>
                      <div className="space-y-1">
                        {camino.instituciones.map((inst, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-purple-50 rounded text-sm">
                            <span className="font-medium text-purple-900">{inst.institucion}</span>
                            <Badge variant="info">{inst.sistema || inst.pais}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materias Cursadas */}
                  {camino.materiasCursadas?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Materias Cursadas ({camino.materiasCursadas.length})
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {camino.materiasCursadas.map((mat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-900">{mat.materia}</span>
                              <Badge variant="info">{mat.sistema}</Badge>
                            </div>
                            {mat.calificacion && (
                              <Badge variant="success">{mat.calificacion}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Equivalencias */}
                  {camino.equivalencias?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Equivalencias Disponibles ({camino.equivalencias.length})
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {camino.equivalencias.map((eq, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-green-800">{eq.materiaOrigen}</span>
                              <Badge variant="info">{eq.sistemaOrigen}</Badge>
                            </div>
                            <ArrowRight className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-green-800">{eq.materiaDestino}</span>
                              <Badge variant="warning">{eq.sistemaDestino}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje si no hay equivalencias */}
                  {(!camino.equivalencias || camino.equivalencias.length === 0) && camino.materiasCursadas?.length > 0 && (
                    <p className="text-xs text-gray-500 italic">
                      No hay equivalencias definidas para las materias de este estudiante
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Equivalencias de Materias
          </CardTitle>
          <Button onClick={() => setShowNuevaEquivalencia(!showNuevaEquivalencia)}>
            {showNuevaEquivalencia ? 'Cancelar' : 'Nueva Equivalencia'}
          </Button>
        </CardHeader>

        {showNuevaEquivalencia && (
          <CardContent className="border-b border-gray-200">
            <form onSubmit={handleCrearEquivalencia} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="ID Materia Origen"
                  placeholder="ID de la materia origen"
                  value={nuevaEquivalencia.materiaOrigenId}
                  onChange={(e) =>
                    setNuevaEquivalencia({ ...nuevaEquivalencia, materiaOrigenId: e.target.value })
                  }
                  required
                />
                <Input
                  label="ID Materia Destino"
                  placeholder="ID de la materia destino"
                  value={nuevaEquivalencia.materiaDestinoId}
                  onChange={(e) =>
                    setNuevaEquivalencia({ ...nuevaEquivalencia, materiaDestinoId: e.target.value })
                  }
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Equivalencia
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={nuevaEquivalencia.tipoEquivalencia}
                    onChange={(e) =>
                      setNuevaEquivalencia({ ...nuevaEquivalencia, tipoEquivalencia: e.target.value })
                    }
                  >
                    <option value="total">Total</option>
                    <option value="parcial">Parcial</option>
                  </select>
                </div>
                <Input
                  label="Porcentaje de Equivalencia"
                  type="number"
                  min="0"
                  max="100"
                  value={nuevaEquivalencia.porcentajeEquivalencia}
                  onChange={(e) =>
                    setNuevaEquivalencia({ ...nuevaEquivalencia, porcentajeEquivalencia: Number(e.target.value) })
                  }
                  required
                />
              </div>
              {error && <ErrorMessage message={error} />}
              <Button type="submit" isLoading={crearEquivalenciaMutation.isPending}>
                Crear Equivalencia
              </Button>
            </form>
          </CardContent>
        )}

        {loadingEquivalencias ? (
          <div className="p-8 flex justify-center">
            <Loading />
          </div>
        ) : !equivalencias?.length ? (
          <EmptyState
            icon={ArrowRight}
            title="Sin equivalencias"
            description="No hay equivalencias de materias registradas"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materia Origen</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead className="text-center"></TableHead>
                <TableHead>Materia Destino</TableHead>
                <TableHead>Sistema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equivalencias.map((equiv, index) => (
                <TableRow key={equiv._id || index}>
                  <TableCell className="font-medium">
                    {equiv.materiaOrigen?.nombre || equiv.materiaOrigenId || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">
                      {equiv.materiaOrigen?.sistema || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowRight className="h-4 w-4 text-gray-400 inline" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {equiv.materiaDestino?.nombre || equiv.materiaDestinoId || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="warning">
                      {equiv.materiaDestino?.sistema || 'N/A'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
