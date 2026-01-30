import { useQuery } from '@tanstack/react-query'
import { reportesApi } from '../api/reportes'

export function useResumen() {
  return useQuery({
    queryKey: ['reportes', 'resumen'],
    queryFn: reportesApi.getResumen,
  })
}

export function useEstadisticas(params) {
  return useQuery({
    queryKey: ['reportes', 'estadisticas', params],
    queryFn: () => reportesApi.getEstadisticas(params),
  })
}

export function usePromediosPorMateria(filters = {}) {
  return useQuery({
    queryKey: ['reportes', 'promedios-materia', filters],
    queryFn: () => reportesApi.getPromediosPorMateria(filters),
  })
}

export function usePromediosPorInstitucion(filters = {}) {
  return useQuery({
    queryKey: ['reportes', 'promedios-institucion', filters],
    queryFn: () => reportesApi.getPromediosPorInstitucion(filters),
  })
}
