import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import Loading from '../../components/shared/Loading'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useEstudiante, useCreateEstudiante, useUpdateEstudiante } from '../../hooks/useEstudiantes'
import { useInstituciones } from '../../hooks/useInstituciones'
import { useCreateCalificacion } from '../../hooks/useCalificaciones'
import { useMaterias } from '../../hooks/useMaterias'
import { UK_LETRAS, buildValorOriginal } from '../../utils/calificaciones'

const paisesOptions = [
  { value: 'AR', label: 'Argentina' },
  { value: 'UK', label: 'Reino Unido' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'DE', label: 'Alemania' },
]

const selectClass = "w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"

export default function EstudianteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const { data: estudiante, isLoading: loadingEstudiante } = useEstudiante(id)
  const createMutation = useCreateEstudiante()
  const updateMutation = useUpdateEstudiante()
  const createCalificacion = useCreateCalificacion()

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    dni: '',
    fechaNacimiento: '',
    paisOrigen: '',
    institucionId: '',
  })
  const [error, setError] = useState('')
  const [notas, setNotas] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const sistema = formData.paisOrigen?.toUpperCase()

  const { data: institucionesData } = useInstituciones({
    limit: 500,
    sistemaEducativo: formData.paisOrigen || undefined
  })
  const instituciones = institucionesData?.data || []

  const { data: materiasData } = useMaterias({
    limit: 500,
    sistemaEducativo: formData.paisOrigen || undefined
  })
  const materias = materiasData?.data || []

  useEffect(() => {
    if (estudiante) {
      const est = estudiante.data || estudiante
      setFormData({
        nombre: est.nombre || '',
        apellido: est.apellido || '',
        email: est.email || '',
        dni: est.dni || '',
        fechaNacimiento: est.fechaNacimiento?.split('T')[0] || '',
        paisOrigen: est.paisOrigen || '',
        institucionId: est.institucionId?._id || est.institucionId || '',
      })
    }
  }, [estudiante])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'paisOrigen' ? { institucionId: '' } : {}),
    }))
    if (name === 'paisOrigen') {
      setNotas({})
    }
  }

  const setNota = (materiaId, value) => {
    setNotas(prev => ({ ...prev, [materiaId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let estudianteId = id
      let instId = formData.institucionId

      if (isEditing) {
        await updateMutation.mutateAsync({ id, ...formData })
      } else {
        const res = await createMutation.mutateAsync(formData)
        estudianteId = res?.data?._id || res?._id
        instId = formData.institucionId
      }

      const defaultTipo = { AR: 'final', US: 'exam', UK: 'exam', DE: 'escrito' }
      const now = new Date()
      const notasConValor = Object.entries(notas).filter(([, v]) => v !== '')
      for (const [materiaId, nota] of notasConValor) {
        await createCalificacion.mutateAsync({
          estudianteId,
          materiaId,
          institucionId: instId,
          sistemaOrigen: formData.paisOrigen,
          tipoEvaluacion: defaultTipo[sistema] || 'final',
          fechaEvaluacion: now.toISOString(),
          cicloLectivo: { anio: now.getFullYear(), periodo: 'anual' },
          valorOriginal: buildValorOriginal(sistema, nota),
        })
      }

      navigate(estudianteId ? `/estudiantes/${estudianteId}` : '/estudiantes')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.mensaje || 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  if (isEditing && loadingEstudiante) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/estudiantes')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Estudiante' : 'Nuevo Estudiante'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Modifica los datos del estudiante' : 'Completa los datos del nuevo estudiante'}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              <Input
                label="Apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="DNI"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                required
              />
              <Input
                label="Fecha de Nacimiento"
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
                required
              />
            </div>

            <Select
              label="Pais de Origen"
              name="paisOrigen"
              value={formData.paisOrigen}
              onChange={handleChange}
              options={paisesOptions}
              placeholder="Seleccionar pais..."
              required
            />

            <Select
              label="Institucion"
              name="institucionId"
              value={formData.institucionId}
              onChange={handleChange}
              options={instituciones.map((inst) => ({
                value: inst._id,
                label: inst.nombreCorto || inst.nombre,
              }))}
              placeholder="Seleccionar institucion..."
            />

            {/* Sección Calificaciones */}
            {formData.paisOrigen && materias.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Calificaciones</h3>
                <p className="text-sm text-gray-400 mb-3">Completa solo las materias que correspondan. Deja en blanco las que no aplican.</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600">Materia</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 w-36">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materias.map(m => (
                        <tr key={m._id} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-800">{m.nombre}</td>
                          <td className="px-3 py-2">
                            {sistema === 'UK' ? (
                              <select
                                value={notas[m._id] || ''}
                                onChange={(e) => setNota(m._id, e.target.value)}
                                className={selectClass}
                              >
                                <option value="">-</option>
                                {UK_LETRAS.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            ) : (
                              <input
                                type="number"
                                min={sistema === 'DE' ? '1.0' : sistema === 'US' ? '0' : '1'}
                                max={sistema === 'DE' ? '6.0' : sistema === 'US' ? '100' : '10'}
                                step={sistema === 'DE' ? '0.1' : '1'}
                                value={notas[m._id] || ''}
                                onChange={(e) => setNota(m._id, e.target.value)}
                                placeholder={sistema === 'DE' ? '1.0-6.0' : sistema === 'US' ? '0-100' : '1-10'}
                                className={inputClass}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <ErrorMessage message={error} />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/estudiantes')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                icon={Check}
                loading={submitting}
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Estudiante'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
