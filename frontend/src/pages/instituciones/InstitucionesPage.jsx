import { useState, useEffect } from 'react'
import { Plus, Search, Building2, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useDebounce } from '../../hooks/useDebounce'
import { useInstituciones, useCreateInstitucion, useUpdateInstitucion, useDeleteInstitucion } from '../../hooks/useInstituciones'

export default function InstitucionesPage() {
  const [search, setSearch] = useState('')
  const [pais, setPais] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 400)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', codigo: '', tipo: '', sistemaEducativo: '', direccion: '', telefono: '' })
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [institucionToDelete, setInstitucionToDelete] = useState(null)
  const limit = 20

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data, isLoading, error } = useInstituciones({ search: debouncedSearch, page, limit, ...(pais && { pais }) })
  const createMutation = useCreateInstitucion()
  const updateMutation = useUpdateInstitucion()
  const deleteMutation = useDeleteInstitucion()

  const instituciones = data?.data || []
  const pagination = data?.pagination || { total: 0, pages: 1 }

  const openCreateModal = () => {
    setFormData({ nombre: '', codigo: '', tipo: '', sistemaEducativo: '', direccion: '', telefono: '' })
    setFormError('')
    setEditingId(null)
    setFormModalOpen(true)
  }

  const openEditModal = (institucion) => {
    setFormData({
      nombre: institucion.nombre || '',
      codigo: institucion.codigo || '',
      tipo: institucion.tipo || '',
      sistemaEducativo: institucion.sistemaEducativo || '',
      direccion: institucion.direccion?.calle || '',
      telefono: institucion.telefono || ''
    })
    setFormError('')
    setEditingId(institucion._id)
    setFormModalOpen(true)
  }

  const openDeleteConfirm = (institucion) => {
    setInstitucionToDelete(institucion)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(institucionToDelete._id)
      setDeleteConfirmOpen(false)
      setInstitucionToDelete(null)
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al eliminar')
    }
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

    const paisMap = { AR: 'Argentina', US: 'Estados Unidos', UK: 'Reino Unido', DE: 'Alemania' }
    const payload = {
      nombre: formData.nombre,
      codigo: formData.codigo,
      tipo: formData.tipo,
      sistemaEducativo: formData.sistemaEducativo,
      pais: paisMap[formData.sistemaEducativo] || '',
      ...(formData.direccion && { direccion: { calle: formData.direccion } }),
      ...(formData.telefono && { telefono: formData.telefono }),
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      setFormModalOpen(false)
      setEditingId(null)
    } catch (err) {
      setFormError(err.response?.data?.mensaje || 'Error al guardar')
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
  }

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message="Error al cargar las instituciones" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instituciones</h1>
          <p className="text-gray-500">
            {pagination.total.toLocaleString()} instituciones en total
          </p>
        </div>
        <Button icon={Plus} onClick={openCreateModal}>
          Nueva Institucion
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar instituciones..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <select
              value={pais}
              onChange={(e) => { setPais(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            >
              <option value="">Todos los paises</option>
              <option value="Argentina">Argentina</option>
              <option value="Alemania">Alemania</option>
              <option value="Estados Unidos">Estados Unidos</option>
              <option value="Reino Unido">Reino Unido</option>
            </select>
          </div>
        </div>

        {instituciones.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No hay instituciones"
            description="Comienza agregando una nueva institucion"
            action={
              <Button icon={Plus} onClick={openCreateModal}>
                Nueva Institucion
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Direccion</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instituciones.map((institucion) => (
                  <TableRow key={institucion._id}>
                    <TableCell className="font-medium">{institucion.nombre}</TableCell>
                    <TableCell>{institucion.direccion?.calle || '-'}</TableCell>
                    <TableCell>{institucion.telefono || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(institucion)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(institucion)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
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
        onClose={() => { setFormModalOpen(false); setEditingId(null); }}
        title={editingId ? 'Editar Institucion' : 'Nueva Institucion'}
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
            placeholder="Ej: ST-MARYS-01"
            required
          />
          <Select
            label="Tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleFormChange}
            options={[
              { value: 'primaria', label: 'Primaria' },
              { value: 'secundaria', label: 'Secundaria' },
              { value: 'preparatoria', label: 'Preparatoria' },
              { value: 'universidad', label: 'Universidad' },
              { value: 'instituto', label: 'Instituto' },
            ]}
            placeholder="Seleccionar tipo..."
            required
          />
          <Select
            label="Sistema Educativo"
            name="sistemaEducativo"
            value={formData.sistemaEducativo}
            onChange={handleFormChange}
            options={[
              { value: 'AR', label: 'Argentina' },
              { value: 'US', label: 'Estados Unidos' },
              { value: 'UK', label: 'Reino Unido' },
              { value: 'DE', label: 'Alemania' },
            ]}
            placeholder="Seleccionar sistema..."
            required
          />
          <Input
            label="Direccion"
            name="direccion"
            value={formData.direccion}
            onChange={handleFormChange}
          />
          <Input
            label="Telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleFormChange}
          />

          {formError && <ErrorMessage message={formError} />}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setFormModalOpen(false); setEditingId(null); }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirmar eliminacion"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estas seguro de que deseas eliminar la institucion <strong>{institucionToDelete?.nombre}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta accion marcara la institucion como inactiva.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
