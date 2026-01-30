import { useState } from 'react'
import { ArrowRightLeft, Calculator, Table2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useConvertir, useTablaEquivalencias, useReglasConversion } from '../../hooks/useConversiones'

const SISTEMAS_CALIFICACION = [
  { value: 'AR', label: 'Argentina (1-10)' },
  { value: 'US', label: 'Estados Unidos (A-F / GPA)' },
  { value: 'UK', label: 'Reino Unido (GCSE 1-9)' },
  { value: 'DE', label: 'Alemania (1.0-6.0)' },
]

// Construir objeto valorOriginal según sistema
function construirValorOriginal(sistema, valor) {
  const numVal = parseFloat(valor)
  switch (sistema) {
    case 'AR': return { ar: { nota: numVal } }
    case 'US': return { us: { porcentaje: numVal } }
    case 'UK': return { uk: { numerico: numVal } } // UK usa escala GCSE 1-9
    case 'DE': return { de: { nota: numVal } }
    default: return {}
  }
}

// Extraer valor mostrable del resultado
function extraerValorMostrable(valorConvertido, sistema) {
  if (!valorConvertido) return '-'

  // Intentar obtener datos del sistema destino
  const datos = valorConvertido[sistema.toLowerCase()]

  if (datos && typeof datos === 'object') {
    if (datos.letra) return datos.letra
    if (datos.clasificacion) return datos.clasificacion
    if (datos.gpa !== undefined) return `GPA ${datos.gpa.toFixed(1)}`
    // Para notas numéricas (AR, DE), mostrar con formato apropiado
    if (datos.nota !== undefined) {
      return sistema === 'DE' ? datos.nota.toFixed(1) : datos.nota
    }
    if (datos.porcentaje !== undefined) return `${datos.porcentaje}%`
    if (datos.numerico !== undefined) return datos.numerico
  }

  // Fallback: usar formatearValorEquivalencia
  return formatearValorEquivalencia(valorConvertido)
}

// Obtener placeholder según sistema
function getPlaceholder(sistema) {
  switch (sistema) {
    case 'AR': return 'Ej: 8 (nota 1-10)'
    case 'US': return 'Ej: 85 (porcentaje)'
    case 'UK': return 'Ej: 7 (9=mejor, 1=peor)'
    case 'DE': return 'Ej: 2.0 (1.0=mejor, 6.0=peor)'
    default: return 'Ingrese valor'
  }
}

// Obtener rango válido según sistema
function getRangoValido(sistema) {
  switch (sistema) {
    case 'AR': return { min: 1, max: 10, step: 0.5 }
    case 'US': return { min: 0, max: 100, step: 1 }
    case 'UK': return { min: 1, max: 9, step: 1 }
    case 'DE': return { min: 1, max: 6, step: 0.1 }
    default: return { min: 0, max: 100, step: 1 }
  }
}

// Formatear valor de equivalencia para mostrar
function formatearValorEquivalencia(valor, sistema = null) {
  if (valor === null || valor === undefined) return '-'

  if (typeof valor === 'object') {
    // Caso 1: Objeto con sistema como clave { ar: { nota: 10 } } o { de: { nota: 1.0 } }
    for (const [key, datos] of Object.entries(valor)) {
      // Si datos es un objeto con propiedades de calificacion
      if (typeof datos === 'object' && datos !== null) {
        if (datos.letra) return datos.letra
        if (datos.clasificacion) return datos.clasificacion
        if (datos.gpa !== undefined) return `GPA ${datos.gpa.toFixed(1)}`
        if (datos.nota !== undefined) {
          // Para Alemania mostrar con decimal, para otros sin
          return (key === 'de' || sistema === 'DE')
            ? Number(datos.nota).toFixed(1)
            : datos.nota
        }
        if (datos.porcentaje !== undefined) return `${datos.porcentaje}%`
        if (datos.numerico !== undefined) return datos.numerico
        if (datos.descripcion) return datos.descripcion
      }
      // Si es un valor primitivo directo
      if (typeof datos === 'number') return datos
      if (typeof datos === 'string') return datos
    }

    // Caso 2: Objeto directo { nota: 10, aprobado: true }
    if (valor.letra) return valor.letra
    if (valor.clasificacion) return valor.clasificacion
    if (valor.gpa !== undefined) return `GPA ${valor.gpa.toFixed(1)}`
    if (valor.nota !== undefined) return valor.nota
    if (valor.porcentaje !== undefined) return `${valor.porcentaje}%`
    if (valor.numerico !== undefined) return valor.numerico

    // Fallback: intentar mostrar algo legible
    const keys = Object.keys(valor).filter(k => k !== 'aprobado')
    if (keys.length === 1) {
      const v = valor[keys[0]]
      if (typeof v === 'number' || typeof v === 'string') return v
    }

    return '-'
  }

  return valor
}

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

export default function ConversionesPage() {
  const [sistemaOrigen, setSistemaOrigen] = useState('AR')
  const [sistemaDestino, setSistemaDestino] = useState('US')
  const [valorOrigen, setValorOrigen] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  const convertirMutation = useConvertir()
  const { data: tablaEquivalencias, isLoading: loadingTabla } = useTablaEquivalencias(
    sistemaOrigen,
    sistemaDestino
  )
  const { data: reglas, isLoading: loadingReglas } = useReglasConversion()

  const rangoActual = getRangoValido(sistemaOrigen)

  const handleConvertir = async (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)

    if (!valorOrigen) {
      setError('Ingrese un valor para convertir')
      return
    }

    const numVal = parseFloat(valorOrigen)
    if (numVal < rangoActual.min || numVal > rangoActual.max) {
      setError(`El valor debe estar entre ${rangoActual.min} y ${rangoActual.max} para el sistema ${sistemaOrigen}`)
      return
    }

    try {
      const data = await convertirMutation.mutateAsync({
        sistemaOrigen: sistemaOrigen,
        sistemaDestino: sistemaDestino,
        valorOriginal: construirValorOriginal(sistemaOrigen, valorOrigen)
      })
      setResultado(data)
    } catch (err) {
      setError(err.response?.data?.mensaje || err.response?.data?.error || 'Error al convertir la calificacion')
    }
  }

  const handleSwapSistemas = () => {
    const temp = sistemaOrigen
    setSistemaOrigen(sistemaDestino)
    setSistemaDestino(temp)
    setResultado(null)
    setValorOrigen('')
  }

  // Verificar si hay datos en la tabla de equivalencias
  const tieneTabla = tablaEquivalencias?.tabla?.length > 0

  // Verificar si hay datos en las reglas
  const tieneReglas = reglas && (reglas.sistemas || reglas.tablas)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conversiones</h1>
        <p className="text-gray-500">Convierte calificaciones entre diferentes sistemas internacionales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Conversor de Calificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConvertir} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sistema Origen
                  </label>
                  <select
                    value={sistemaOrigen}
                    onChange={(e) => {
                      setSistemaOrigen(e.target.value)
                      setResultado(null)
                      setValorOrigen('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SISTEMAS_CALIFICACION.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSwapSistemas}
                    className="p-2"
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sistema Destino
                  </label>
                  <select
                    value={sistemaDestino}
                    onChange={(e) => {
                      setSistemaDestino(e.target.value)
                      setResultado(null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SISTEMAS_CALIFICACION.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Input
                  label="Valor a Convertir"
                  type="number"
                  step={rangoActual.step}
                  min={rangoActual.min}
                  max={rangoActual.max}
                  value={valorOrigen}
                  onChange={(e) => setValorOrigen(e.target.value)}
                  placeholder={getPlaceholder(sistemaOrigen)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Rango valido: {rangoActual.min} - {rangoActual.max}
                </p>
              </div>

              {error && <ErrorMessage message={error} />}

              <Button
                type="submit"
                className="w-full"
                isLoading={convertirMutation.isPending}
              >
                Convertir
              </Button>

              {resultado && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">Resultado de la conversion:</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-green-800">
                        {extraerValorMostrable(resultado.valorConvertido, sistemaDestino)}
                      </span>
                      {resultado.clasificacion && (
                        <Badge variant="success" className="ml-2">
                          {resultado.clasificacion}
                        </Badge>
                      )}
                    </div>
                    {resultado.descripcion && (
                      <span className="text-sm text-green-600">
                        {resultado.descripcion}
                      </span>
                    )}
                  </div>
                  {resultado.metadatos && (
                    <p className="mt-2 text-xs text-green-600">
                      Metodologia: {resultado.metadatos.metodologia || 'N/A'}
                    </p>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Tabla de Equivalencias
            </CardTitle>
          </CardHeader>
          {loadingTabla ? (
            <div className="p-8 flex justify-center">
              <Loading />
            </div>
          ) : !tieneTabla ? (
            <EmptyState
              icon={Table2}
              title="Sin equivalencias"
              description="No hay tabla de equivalencias disponible para estos sistemas"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {SISTEMAS_CALIFICACION.find((s) => s.value === sistemaOrigen)?.label || sistemaOrigen}
                  </TableHead>
                  <TableHead>
                    {SISTEMAS_CALIFICACION.find((s) => s.value === sistemaDestino)?.label || sistemaDestino}
                  </TableHead>
                  <TableHead>Descripcion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablaEquivalencias.tabla.map((equiv, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {formatearValorEquivalencia(equiv.origen)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">
                        {formatearValorEquivalencia(equiv.destino)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {equiv.descripcion || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Reglas de Conversion
          </CardTitle>
        </CardHeader>
        {loadingReglas ? (
          <div className="p-8 flex justify-center">
            <Loading />
          </div>
        ) : !tieneReglas ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="Sin reglas"
            description="No hay reglas de conversion definidas"
          />
        ) : (
          <CardContent>
            <div className="space-y-6">
              {/* Metadata */}
              {reglas.version && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Version: <strong>{reglas.version}</strong></span>
                  {reglas.metodologia && (
                    <span>Metodologia: <strong>{reglas.metodologia}</strong></span>
                  )}
                </div>
              )}

              {/* Sistemas disponibles */}
              {reglas.sistemas && Object.keys(reglas.sistemas).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Sistemas Disponibles</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(reglas.sistemas).map(([codigo, info]) => (
                      <Badge key={codigo} variant="secondary">
                        {info.nombre || codigo} ({codigo.toUpperCase()})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tablas de conversión */}
              {reglas.tablas && Object.keys(reglas.tablas).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Tablas de Conversion Disponibles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(reglas.tablas).map(([key, tabla]) => {
                      const [origen, destino] = key.split('_')
                      return (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="info">{origen?.toUpperCase()}</Badge>
                            <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                            <Badge variant="success">{destino?.toUpperCase()}</Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {Array.isArray(tabla) ? `${tabla.length} equivalencias` : 'Tabla disponible'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
