import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materiasApi } from '../api/materias'

export function useMaterias(params) {
  return useQuery({
    queryKey: ['materias', params],
    queryFn: () => materiasApi.getAll(params),
  })
}

export function useMateria(id) {
  return useQuery({
    queryKey: ['materia', id],
    queryFn: () => materiasApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateMateria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: materiasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materias'] })
    },
  })
}

export function useUpdateMateria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }) => materiasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materias'] })
      queryClient.invalidateQueries({ queryKey: ['materia'] })
    },
  })
}

export function useDeleteMateria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: materiasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materias'] })
    },
  })
}
