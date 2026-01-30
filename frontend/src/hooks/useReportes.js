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

export function usePromedioPorPais(params = {}) {
  return useQuery({
    queryKey: ['reportes', 'promedio-pais', params],
    queryFn: () => reportesApi.getPromedioPorPais(params),
  })
}

export function usePromedioPorInstitucion(params = {}) {
  return useQuery({
    queryKey: ['reportes', 'promedio-institucion', params],
    queryFn: () => reportesApi.getPromedioPorInstitucion(params),
  })
}

export function useDistribucion(params = {}) {
  return useQuery({
    queryKey: ['reportes', 'distribucion', params],
    queryFn: () => reportesApi.getDistribucion(params),
  })
}

export function useTasaAprobacion(params = {}) {
  return useQuery({
    queryKey: ['reportes', 'aprobacion', params],
    queryFn: () => reportesApi.getTasaAprobacion(params),
  })
}

export function useComparacionHistorica(params = {}) {
  return useQuery({
    queryKey: ['reportes', 'historico', params],
    queryFn: () => reportesApi.getComparacionHistorica(params),
  })
}

export function useTopMaterias(params = {}) {
  return useQuery({
    queryKey: ['reportes', 'top-materias', params],
    queryFn: () => reportesApi.getTopMaterias(params),
  })
}
