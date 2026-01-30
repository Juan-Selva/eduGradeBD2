import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversionesApi } from '../api/conversiones'

export function useConvertir() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: conversionesApi.convertir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversiones'] })
    },
  })
}

export function useConvertirMultiple() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: conversionesApi.convertirMultiple,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversiones'] })
    },
  })
}

export function useConversionesByCalificacion(id, params) {
  return useQuery({
    queryKey: ['conversiones', 'calificacion', id, params],
    queryFn: () => conversionesApi.getByCalificacion(id, params),
    enabled: !!id,
  })
}

export function useReglasConversion(params) {
  return useQuery({
    queryKey: ['conversiones', 'reglas', params],
    queryFn: () => conversionesApi.getReglas(params),
  })
}

export function useTablaEquivalencias(origen, destino) {
  return useQuery({
    queryKey: ['conversiones', 'tabla', origen, destino],
    queryFn: () => conversionesApi.getTablaEquivalencias(origen, destino),
    enabled: !!origen && !!destino,
  })
}
