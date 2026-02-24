import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transferenciasApi } from '../api/transferencias'

export function useTransferenciasEstudiante(estudianteId) {
  return useQuery({
    queryKey: ['transferencias', estudianteId],
    queryFn: () => transferenciasApi.getByEstudiante(estudianteId),
    enabled: !!estudianteId,
  })
}

export function useSimularTransferencia() {
  return useMutation({
    mutationFn: transferenciasApi.simular,
  })
}

export function useEjecutarTransferencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: transferenciasApi.ejecutar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] })
      queryClient.invalidateQueries({ queryKey: ['estudiantes'] })
      queryClient.invalidateQueries({ queryKey: ['estudiante'] })
    },
  })
}
