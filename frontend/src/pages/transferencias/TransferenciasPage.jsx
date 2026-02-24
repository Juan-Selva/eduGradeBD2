import { useState, useMemo, useEffect } from 'react'
import { useEstudiantes } from '../../hooks/useEstudiantes'
import { useCalificacionesByEstudiante } from '../../hooks/useCalificaciones'
import { useInstituciones } from '../../hooks/useInstituciones'
import { useSimularTransferencia, useEjecutarTransferencia, useTransferenciasEstudiante } from '../../hooks/useTransferencias'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { ArrowRight, Check, User, MapPin, School, Globe } from 'lucide-react'

function formatNota(valor) {
  if (valor == null) return '-'
  if (typeof valor !== 'object') return String(valor)

  const sistemas = Object.keys(valor).filter((k) => ['uk', 'us', 'de', 'ar'].includes(k) && valor[k] && typeof valor[k] === 'object')
  const sistema = sistemas.find((k) => {
    const d = valor[k]
    if (k === 'uk') return d.letra || (Array.isArray(d.moduloNotas) && d.moduloNotas.length > 0)
    if (k === 'us') return d.letra || d.porcentaje
    if (k === 'de') return d.nota != null
    if (k === 'ar') return d.nota != null
    return false
  }) || sistemas[0]
  if (!sistema) return JSON.stringify(valor)

  const data = valor[sistema]
  switch (sistema) {
    case 'uk':
      if (data.letra) return `${data.letra} (${data.puntos} pts UCAS)`
      if (Array.isArray(data.moduloNotas) && data.moduloNotas.length > 0)
        return data.moduloNotas.map((m) => `${m.modulo}: ${m.nota}`).join(', ')
      return '-'
    case 'us':
      if (data.letra) return `${data.letra} (GPA ${data.gpa}, ${data.porcentaje}%)`
      return '-'
    case 'de':
      if (data.nota != null) return `${data.nota}${data.tendencia || ''} (${data.puntos} pts)`
      return '-'
    case 'ar':
      if (data.nota != null) return `${data.nota}/10${data.instancia ? ` (${data.instancia})` : ''}`
      return '-'
    default:
      return JSON.stringify(valor)
  }
}

const PAISES = [
  { code: 'UK', label: 'Reino Unido', flag: '🇬🇧' },
  { code: 'US', label: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'DE', label: 'Alemania', flag: '🇩🇪' },
  { code: 'AR', label: 'Argentina', flag: '🇦🇷' },
]

const PAIS_LABEL = { UK: 'Reino Unido', US: 'Estados Unidos', DE: 'Alemania', AR: 'Argentina' }

const STEPS = ['País origen', 'País destino', 'Estudiante', 'Confirmación']

export default function TransferenciasPage() {
  const [step, setStep] = useState(0)
  const [paisOrigenCode, setPaisOrigenCode] = useState('')
  const [paisDestinoCode, setPaisDestinoCode] = useState('')
  const [estudianteId, setEstudianteId] = useState('')
  const [institucionDestinoId, setInstitucionDestinoId] = useState('')
  const [simulacion, setSimulacion] = useState(null)

  const paisDestinoLabel = PAIS_LABEL[paisDestinoCode] || ''

  const { data: estudiantesData, isLoading: loadingEst } = useEstudiantes(
    paisOrigenCode ? { limit: 100, paisOrigen: paisOrigenCode } : undefined
  )
  const { data: calificacionesData, isLoading: loadingCalif } = useCalificacionesByEstudiante(estudianteId || undefined)
  const { data: institucionesData, isLoading: loadingInst } = useInstituciones(
    paisDestinoLabel ? { pais: paisDestinoLabel } : undefined
  )
  const { data: historialData } = useTransferenciasEstudiante(estudianteId || undefined)
  const simularMutation = useSimularTransferencia()
  const ejecutarMutation = useEjecutarTransferencia()

  const estudiantes = estudiantesData?.data || []
  const calificaciones = calificacionesData?.calificaciones || []
  const instituciones = institucionesData?.data || []

  const estudianteSeleccionado = useMemo(
    () => estudiantes.find((e) => e._id === estudianteId),
    [estudiantes, estudianteId]
  )

  // Map materia name → calificacion for showing actual current grades
  const califByMateria = useMemo(() => {
    const map = {}
    for (const cal of calificaciones) {
      const nombre = cal.materiaId?.nombre
      if (nombre) map[nombre] = cal
    }
    return map
  }, [calificaciones])

  // Auto-simulate when student + institution are selected
  useEffect(() => {
    if (!estudianteId || !institucionDestinoId) {
      setSimulacion(null)
      return
    }
    let cancelled = false
    simularMutation.mutateAsync({ estudianteId, institucionDestinoId }).then((result) => {
      if (!cancelled) setSimulacion(result.data)
    }).catch(() => {
      if (!cancelled) setSimulacion(null)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudianteId, institucionDestinoId])

  // Auto-select first institution when institutions load
  useEffect(() => {
    if (instituciones.length > 0 && !institucionDestinoId) {
      setInstitucionDestinoId(instituciones[0]._id)
    }
  }, [instituciones, institucionDestinoId])

  const handleSelectPaisOrigen = (code) => {
    setPaisOrigenCode(code)
    setPaisDestinoCode('')
    setEstudianteId('')
    setInstitucionDestinoId('')
    setSimulacion(null)
    ejecutarMutation.reset()
    simularMutation.reset()
    setStep(1)
  }

  const handleSelectPaisDestino = (code) => {
    setPaisDestinoCode(code)
    setEstudianteId('')
    setInstitucionDestinoId('')
    setSimulacion(null)
    ejecutarMutation.reset()
    setStep(2)
  }

  const handleSelectEstudiante = (id) => {
    setEstudianteId(id)
    setSimulacion(null)
    ejecutarMutation.reset()
    if (id) setStep(3)
    else setStep(2)
  }

  const handleSelectInstitucion = (id) => {
    setInstitucionDestinoId(id)
    setSimulacion(null)
    ejecutarMutation.reset()
  }

  const handleEjecutar = async () => {
    try {
      await ejecutarMutation.mutateAsync({ estudianteId, institucionDestinoId })
      setSimulacion(null)
    } catch {
      // error handled by mutation
    }
  }

  const handleReset = () => {
    setStep(0)
    setPaisOrigenCode('')
    setPaisDestinoCode('')
    setEstudianteId('')
    setInstitucionDestinoId('')
    setSimulacion(null)
    ejecutarMutation.reset()
    simularMutation.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transferencias</h1>
        {step > 0 && (
          <Button variant="secondary" size="sm" onClick={handleReset}>
            Nueva transferencia
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && <ArrowRight className="h-3 w-3 text-gray-300" />}
            <span
              className={`px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                i === step
                  ? 'bg-black text-white font-medium'
                  : i < step
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-400'
              }`}
              onClick={() => { if (i < step) setStep(i) }}
            >
              {i < step ? <Check className="h-3 w-3 inline" /> : null} {label}
            </span>
          </div>
        ))}
      </div>

      {/* Paso 1: País de origen */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Globe className="h-4 w-4 inline mr-2" />
            País de origen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PAISES.map((pais) => {
              const isSelected = paisOrigenCode === pais.code
              return (
                <button
                  key={pais.code}
                  onClick={() => handleSelectPaisOrigen(pais.code)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-black bg-gray-50 font-medium'
                      : 'border-gray-200 hover:border-gray-400 cursor-pointer'
                  }`}
                >
                  <div className="text-2xl mb-1">{pais.flag}</div>
                  <div className="text-sm">{pais.label}</div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Paso 2: País destino */}
      {step >= 1 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <MapPin className="h-4 w-4 inline mr-2" />
              País destino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PAISES.map((pais) => {
                const isOrigin = paisOrigenCode === pais.code
                const isSelected = paisDestinoCode === pais.code
                return (
                  <button
                    key={pais.code}
                    disabled={isOrigin}
                    onClick={() => handleSelectPaisDestino(pais.code)}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      isSelected
                        ? 'border-black bg-gray-50 font-medium'
                        : isOrigin
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-400 cursor-pointer'
                    }`}
                  >
                    <div className="text-2xl mb-1">{pais.flag}</div>
                    <div className="text-sm">{pais.label}</div>
                    {isOrigin && <div className="text-xs text-gray-400 mt-1">(Origen)</div>}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: Estudiante + Institución destino + Simulación + Confirmación */}
      {step >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <User className="h-4 w-4 inline mr-2" />
              Estudiante y transferencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Select estudiante */}
            {loadingEst ? (
              <p className="text-sm text-gray-500">Cargando estudiantes...</p>
            ) : estudiantes.length === 0 ? (
              <p className="text-sm text-gray-500">No se encontraron estudiantes en {PAIS_LABEL[paisOrigenCode] || paisOrigenCode}.</p>
            ) : (
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={estudianteId}
                onChange={(e) => handleSelectEstudiante(e.target.value)}
              >
                <option value="">Seleccionar estudiante ({estudiantes.length})...</option>
                {estudiantes.map((est) => (
                  <option key={est._id} value={est._id}>
                    {est.nombre} {est.apellido} - {est.dni}
                  </option>
                ))}
              </select>
            )}

            {/* Info estudiante */}
            {estudianteSeleccionado && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Nombre</div>
                  <div className="font-medium text-sm">{estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">DNI</div>
                  <div className="font-medium text-sm">{estudianteSeleccionado.dni}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">País de origen</div>
                  <div className="font-medium text-sm">{estudianteSeleccionado.paisOrigen}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Institución actual</div>
                  <div className="font-medium text-sm">
                    {estudianteSeleccionado.institucionId?.nombre || (estudianteSeleccionado.institucionId ? estudianteSeleccionado.institucionId : 'Sin institución asignada')}
                  </div>
                </div>
              </div>
            )}

            {/* Select institución destino */}
            {estudianteId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <School className="h-4 w-4 inline mr-1" />
                  Institución destino
                </label>
                {loadingInst ? (
                  <p className="text-sm text-gray-500">Cargando instituciones...</p>
                ) : instituciones.length === 0 ? (
                  <p className="text-sm text-gray-500">No se encontraron instituciones en {paisDestinoLabel}.</p>
                ) : (
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={institucionDestinoId}
                    onChange={(e) => handleSelectInstitucion(e.target.value)}
                  >
                    {instituciones.map((inst) => (
                      <option key={inst._id} value={inst._id}>
                        {inst.nombre} ({inst.sistemaEducativo})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Simulación loading */}
            {simularMutation.isPending && (
              <p className="text-sm text-gray-500">Simulando transferencia...</p>
            )}

            {simularMutation.isError && (
              <ErrorMessage message={simularMutation.error?.response?.data?.message || 'Error en simulación'} />
            )}

            {/* Tabla unificada de conversiones */}
            {simulacion && simulacion.conversiones?.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Materia origen</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Nota actual</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Normalizado (0-100)</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Nota convertida</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Materia equivalente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {simulacion.conversiones.map((conv, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{conv.materiaOrigen}</td>
                          <td className="px-4 py-2">{formatNota(califByMateria[conv.materiaOrigen]?.valorOriginal ?? conv.valorOriginal)}</td>
                          <td className="px-4 py-2 font-mono">{conv.valorNormalizado ?? '-'}</td>
                          <td className="px-4 py-2">{formatNota(conv.valorConvertido)}</td>
                          <td className="px-4 py-2">
                            {conv.materiaEquivalente ? (
                              conv.materiaEquivalente.nombre || conv.materiaEquivalente
                            ) : (
                              <span className="text-gray-400">Sin equivalencia</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Total: {simulacion.totalMaterias} materias</span>
                  <Badge variant="success">{simulacion.materiasConEquivalencia} con equivalencia</Badge>
                  <Badge variant="warning">{simulacion.materiasSinEquivalencia} sin equivalencia</Badge>
                </div>

                {/* Confirmar */}
                {!ejecutarMutation.isSuccess && (
                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      onClick={handleEjecutar}
                      loading={ejecutarMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirmar Transferencia
                    </Button>
                    <span className="text-sm text-gray-500">
                      Se transferirán {simulacion.materiasConEquivalencia} materias con equivalencia.
                    </span>
                  </div>
                )}

                {ejecutarMutation.isError && (
                  <ErrorMessage message={ejecutarMutation.error?.response?.data?.message || 'Error en transferencia'} />
                )}

                {ejecutarMutation.isSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                    Transferencia completada exitosamente. Se crearon{' '}
                    <strong>{ejecutarMutation.data?.data?.calificacionesCreadas}</strong> calificaciones en la institución destino.
                    <div className="mt-3">
                      <Button variant="secondary" size="sm" onClick={handleReset}>
                        Realizar otra transferencia
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      {estudianteId && historialData?.data?.transferencias?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transferencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Fecha</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Sistema Origen</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Sistema Destino</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Materias</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historialData.data.transferencias.map((t, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{new Date(t.fecha).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{PAIS_LABEL[t.sistemaOrigen] || t.sistemaOrigen}</td>
                      <td className="px-4 py-2">{PAIS_LABEL[t.sistemaDestino] || t.sistemaDestino}</td>
                      <td className="px-4 py-2">{t.materiasTransferidas}</td>
                      <td className="px-4 py-2">
                        <Badge variant={t.estado === 'completada' ? 'success' : 'warning'}>
                          {t.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
