import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calificacionesApi } from '../api/calificaciones'

export function useCalificaciones(params) {
  return useQuery({
    queryKey: ['calificaciones', params],
    queryFn: () => calificacionesApi.getAll(params),
  })
}

export function useCalificacion(id) {
  return useQuery({
    queryKey: ['calificacion', id],
    queryFn: () => calificacionesApi.getById(id),
    enabled: !!id,
  })
}

export function useCalificacionesByEstudiante(estudianteId) {
  return useQuery({
    queryKey: ['calificaciones', 'estudiante', estudianteId],
    queryFn: () => calificacionesApi.getByEstudiante(estudianteId),
    enabled: !!estudianteId,
  })
}

export function useCreateCalificacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: calificacionesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calificaciones'] })
    },
  })
}

export function useUpdateCalificacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }) => calificacionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calificaciones'] })
      queryClient.invalidateQueries({ queryKey: ['calificacion'] })
    },
  })
}

export function useDeleteCalificacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: calificacionesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calificaciones'] })
    },
  })
}
