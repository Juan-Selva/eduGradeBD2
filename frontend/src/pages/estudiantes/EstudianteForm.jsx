import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Loading from '../../components/shared/Loading'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useEstudiante, useCreateEstudiante, useUpdateEstudiante } from '../../hooks/useEstudiantes'
import { useInstituciones } from '../../hooks/useInstituciones'

export default function EstudianteForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const { data: estudiante, isLoading: loadingEstudiante } = useEstudiante(id)
  const { data: institucionesData } = useInstituciones()
  const createMutation = useCreateEstudiante()
  const updateMutation = useUpdateEstudiante()

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    documento: '',
    fechaNacimiento: '',
    institucion: '',
  })
  const [error, setError] = useState('')

  const instituciones = institucionesData?.instituciones || institucionesData || []

  useEffect(() => {
    if (estudiante) {
      setFormData({
        nombre: estudiante.nombre || '',
        apellido: estudiante.apellido || '',
        email: estudiante.email || '',
        documento: estudiante.documento || '',
        fechaNacimiento: estudiante.fechaNacimiento?.split('T')[0] || '',
        institucion: estudiante.institucion?._id || estudiante.institucion || '',
      })
    }
  }, [estudiante])

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, ...formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      navigate('/estudiantes')
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar el estudiante')
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
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Documento"
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                required
              />
              <Input
                label="Fecha de Nacimiento"
                type="date"
                name="fechaNacimiento"
                value={formData.fechaNacimiento}
                onChange={handleChange}
              />
            </div>

            <Select
              label="Institucion"
              name="institucion"
              value={formData.institucion}
              onChange={handleChange}
              options={instituciones.map((inst) => ({
                value: inst._id,
                label: inst.nombre,
              }))}
              placeholder="Seleccionar institucion..."
            />

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
                loading={createMutation.isPending || updateMutation.isPending}
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
