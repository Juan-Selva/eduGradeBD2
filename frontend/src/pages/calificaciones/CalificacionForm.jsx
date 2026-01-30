import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import Loading from '../../components/shared/Loading'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useCalificacion, useCreateCalificacion, useUpdateCalificacion } from '../../hooks/useCalificaciones'
import { useEstudiantes } from '../../hooks/useEstudiantes'
import { useMaterias } from '../../hooks/useMaterias'

export default function CalificacionForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const { data: calificacion, isLoading: loadingCalificacion } = useCalificacion(id)
  const { data: estudiantesData } = useEstudiantes()
  const { data: materiasData } = useMaterias()
  const createMutation = useCreateCalificacion()
  const updateMutation = useUpdateCalificacion()

  const [formData, setFormData] = useState({
    estudiante: '',
    materia: '',
    nota: '',
    periodo: '',
    observaciones: '',
  })
  const [error, setError] = useState('')

  const estudiantes = estudiantesData?.estudiantes || estudiantesData || []
  const materias = materiasData?.materias || materiasData || []

  useEffect(() => {
    if (calificacion) {
      setFormData({
        estudiante: calificacion.estudiante?._id || calificacion.estudiante || '',
        materia: calificacion.materia?._id || calificacion.materia || '',
        nota: calificacion.nota || '',
        periodo: calificacion.periodo || '',
        observaciones: calificacion.observaciones || '',
      })
    }
  }, [calificacion])

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const dataToSend = {
      ...formData,
      nota: parseFloat(formData.nota),
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, ...dataToSend })
      } else {
        await createMutation.mutateAsync(dataToSend)
      }
      navigate('/calificaciones')
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la calificacion')
    }
  }

  if (isEditing && loadingCalificacion) return <Loading />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/calificaciones')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Calificacion' : 'Nueva Calificacion'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Modifica los datos de la calificacion' : 'Registra una nueva calificacion'}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Estudiante"
              name="estudiante"
              value={formData.estudiante}
              onChange={handleChange}
              options={estudiantes.map((est) => ({
                value: est._id,
                label: `${est.nombre} ${est.apellido}`,
              }))}
              placeholder="Seleccionar estudiante..."
              required
            />

            <Select
              label="Materia"
              name="materia"
              value={formData.materia}
              onChange={handleChange}
              options={materias.map((mat) => ({
                value: mat._id,
                label: mat.nombre,
              }))}
              placeholder="Seleccionar materia..."
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nota"
                type="number"
                name="nota"
                value={formData.nota}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                required
              />
              <Input
                label="Periodo"
                name="periodo"
                value={formData.periodo}
                onChange={handleChange}
                placeholder="Ej: 2024-1"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/calificaciones')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                icon={Check}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Guardar Cambios' : 'Registrar Calificacion'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
