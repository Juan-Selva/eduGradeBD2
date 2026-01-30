import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trayectoriasApi } from '../api/trayectorias'

export function useTrayectoriaEstudiante(id) {
  return useQuery({
    queryKey: ['trayectorias', 'estudiante', id],
    queryFn: () => trayectoriasApi.getByEstudiante(id),
    enabled: !!id,
  })
}

export function useEquivalencias(params) {
  return useQuery({
    queryKey: ['trayectorias', 'equivalencias', params],
    queryFn: () => trayectoriasApi.getEquivalencias(params),
  })
}

export function useCrearEquivalencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: trayectoriasApi.crearEquivalencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trayectorias'] })
    },
  })
}

export function useCaminoAcademico(id) {
  return useQuery({
    queryKey: ['trayectorias', 'camino', id],
    queryFn: () => trayectoriasApi.getCaminoAcademico(id),
    enabled: !!id,
  })
}
