import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { institucionesApi } from '../api/instituciones'

export function useInstituciones(params) {
  return useQuery({
    queryKey: ['instituciones', params],
    queryFn: () => institucionesApi.getAll(params),
  })
}

export function useInstitucion(id) {
  return useQuery({
    queryKey: ['institucion', id],
    queryFn: () => institucionesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateInstitucion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: institucionesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instituciones'] })
    },
  })
}

export function useUpdateInstitucion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }) => institucionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instituciones'] })
      queryClient.invalidateQueries({ queryKey: ['institucion'] })
    },
  })
}

export function useDeleteInstitucion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: institucionesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instituciones'] })
    },
  })
}
