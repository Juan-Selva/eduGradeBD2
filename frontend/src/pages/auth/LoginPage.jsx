import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">EduGrade</h1>
            <p className="text-sm text-gray-500 mt-2">Sistema de Gestion Educativa</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electronico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              required
            />

            <Input
              label="Contrasena"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              icon={Lock}
            >
              Iniciar sesion
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
