import { useQuery } from '@tanstack/react-query'
import { auditoriaApi } from '../api/auditoria'

export function useEventosAuditoria(params) {
  return useQuery({
    queryKey: ['auditoria', 'eventos', params],
    queryFn: () => auditoriaApi.getEventos(params),
  })
}

export function useAuditoriaByEntidad(tipo, id) {
  return useQuery({
    queryKey: ['auditoria', 'entidad', tipo, id],
    queryFn: () => auditoriaApi.getByEntidad(tipo, id),
    enabled: !!tipo && !!id,
  })
}

export function useAuditoriaByUsuario(id, params) {
  return useQuery({
    queryKey: ['auditoria', 'usuario', id, params],
    queryFn: () => auditoriaApi.getByUsuario(id, params),
    enabled: !!id,
  })
}

export function useEstadisticasAuditoria() {
  return useQuery({
    queryKey: ['auditoria', 'estadisticas'],
    queryFn: () => auditoriaApi.getEstadisticas(),
  })
}
