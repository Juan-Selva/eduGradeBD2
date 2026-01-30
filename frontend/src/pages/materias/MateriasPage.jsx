import { useState } from 'react'
import { Plus, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useMaterias, useCreateMateria } from '../../hooks/useMaterias'

export default function MateriasPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', codigo: '', creditos: '' })
  const [formError, setFormError] = useState('')
  const limit = 20

  const { data, isLoading, error } = useMaterias({ search, page, limit })
  const createMutation = useCreateMateria()

  const materias = data?.data || []
  const pagination = data?.pagination || { total: 0, pages: 1 }

  const openCreateModal = () => {
    setFormData({ nombre: '', codigo: '', creditos: '' })
    setFormError('')
    setFormModalOpen(true)
  }

  const handleFormChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const dataToSend = {
      ...formData,
      creditos: formData.creditos ? parseInt(formData.creditos) : undefined,
    }

    try {
      await createMutation.mutateAsync(dataToSend)
      setFormModalOpen(false)
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al guardar')
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message="Error al cargar las materias" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Materias</h1>
          <p className="text-gray-500">
            {pagination.total.toLocaleString()} materias en total
          </p>
        </div>
        <Button icon={Plus} onClick={openCreateModal}>
          Nueva Materia
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar materias..."
              value={search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {materias.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No hay materias"
            description="Comienza agregando una nueva materia"
            action={
              <Button icon={Plus} onClick={openCreateModal}>
                Nueva Materia
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Creditos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materias.map((materia) => (
                  <TableRow key={materia._id}>
                    <TableCell className="font-medium">{materia.nombre}</TableCell>
                    <TableCell>{materia.codigo || '-'}</TableCell>
                    <TableCell>{materia.creditos || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginacion */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} de {pagination.total.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Pagina {page} de {pagination.pages.toLocaleString()}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page >= pagination.pages}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="Nueva Materia"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleFormChange}
            required
          />
          <Input
            label="Codigo"
            name="codigo"
            value={formData.codigo}
            onChange={handleFormChange}
          />
          <Input
            label="Creditos"
            type="number"
            name="creditos"
            value={formData.creditos}
            onChange={handleFormChange}
            min="1"
          />

          {formError && <ErrorMessage message={formError} />}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
            >
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
