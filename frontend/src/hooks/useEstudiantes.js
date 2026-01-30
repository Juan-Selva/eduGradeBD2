import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { estudiantesApi } from '../api/estudiantes'

export function useEstudiantes(params) {
  return useQuery({
    queryKey: ['estudiantes', params],
    queryFn: () => estudiantesApi.getAll(params),
  })
}

export function useEstudiante(id) {
  return useQuery({
    queryKey: ['estudiante', id],
    queryFn: () => estudiantesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateEstudiante() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: estudiantesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudiantes'] })
    },
  })
}

export function useUpdateEstudiante() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }) => estudiantesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudiantes'] })
      queryClient.invalidateQueries({ queryKey: ['estudiante'] })
    },
  })
}

export function useDeleteEstudiante() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: estudiantesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estudiantes'] })
    },
  })
}
