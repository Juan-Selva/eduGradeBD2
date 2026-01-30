import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Users, ChevronRight, ChevronLeft, Building2, Globe, Pencil, Trash2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table'
import Loading from '../../components/shared/Loading'
import EmptyState from '../../components/shared/EmptyState'
import ErrorMessage from '../../components/shared/ErrorMessage'
import { useEstudiantes, useDeleteEstudiante } from '../../hooks/useEstudiantes'
import { useInstituciones } from '../../hooks/useInstituciones'

export default function EstudiantesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [paisFilter, setPaisFilter] = useState('')
  const [institucionFilter, setInstitucionFilter] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [estudianteToDelete, setEstudianteToDelete] = useState(null)
  const limit = 20

  const deleteMutation = useDeleteEstudiante()

  const openDeleteConfirm = (estudiante) => {
    setEstudianteToDelete(estudiante)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(estudianteToDelete._id)
      setDeleteConfirmOpen(false)
      setEstudianteToDelete(null)
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

  const { data, isLoading, error } = useEstudiantes({
    page,
    limit,
    paisOrigen: paisFilter || undefined,
    institucionId: institucionFilter || undefined,
    search: search || undefined
  })
  const { data: institucionesData } = useInstituciones({
    limit: 500,
    sistemaEducativo: paisFilter || undefined
  })
  const estudiantes = data?.data || []
  const pagination = data?.pagination || { total: 0, pages: 1 }
  const instituciones = institucionesData?.data || []

  const handlePaisChange = (value) => {
    setPaisFilter(value)
    setInstitucionFilter('')  // Reset institución cuando cambia país
    setPage(1)
  }

  const handleInstitucionChange = (value) => {
    setInstitucionFilter(value)
    setPage(1)
  }

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message="Error al cargar los estudiantes" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-gray-500">
            {pagination.total.toLocaleString()} estudiantes en total
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/estudiantes/nuevo')}>
          Nuevo Estudiante
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar estudiantes..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <select
                value={paisFilter}
                onChange={(e) => handlePaisChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white min-w-[150px]"
              >
                <option value="">Todos los países</option>
                <option value="UK">Reino Unido</option>
                <option value="US">Estados Unidos</option>
                <option value="DE">Alemania</option>
                <option value="AR">Argentina</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <select
                value={institucionFilter}
                onChange={(e) => handleInstitucionChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white min-w-[200px]"
              >
                <option value="">Todas las instituciones</option>
                {instituciones.map((inst) => (
                  <option key={inst._id} value={inst._id}>
                    {inst.nombreCorto || inst.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {estudiantes.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay estudiantes"
            description={institucionFilter ? "No hay estudiantes en esta institucion" : "Comienza agregando un nuevo estudiante"}
            action={
              !institucionFilter && (
                <Button icon={Plus} onClick={() => navigate('/estudiantes/nuevo')}>
                  Nuevo Estudiante
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Pais</TableHead>
                  <TableHead>Institucion</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estudiantes.map((estudiante) => (
                  <TableRow key={estudiante._id}>
                    <TableCell className="font-medium">
                      {estudiante.nombre} {estudiante.apellido}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {estudiante.email || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{estudiante.dni}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {estudiante.paisOrigen}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {estudiante.institucionId?.nombreCorto || estudiante.institucionId?.nombre || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/estudiantes/${estudiante._id}/editar`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(estudiante)}
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
          </>
        )}
      </Card>

      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirmar eliminacion"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ¿Estas seguro de que deseas eliminar al estudiante <strong>{estudianteToDelete?.nombre} {estudianteToDelete?.apellido}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta accion marcara al estudiante como inactivo.
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
