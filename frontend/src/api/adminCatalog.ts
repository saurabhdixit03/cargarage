import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { GarageService } from './types'

// Staff editing of the catalogue. A change here also changes what customers see,
// so the public list (['services']) is refreshed together with the staff one.
function useRefreshServices() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] }),
      queryClient.invalidateQueries({ queryKey: ['services'] }),
    ])
}

// All services, hidden ones included, sorted by name
export function useAdminServices() {
  return useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => apiFetch<GarageService[]>('/admin/services'),
  })
}

export type ServiceInput = {
  name: string
  description: string
  price: number | null // null lets the server reply "Price is required"
}

export function useCreateService() {
  const refreshServices = useRefreshServices()
  return useMutation({
    mutationFn: (input: ServiceInput) =>
      apiFetch<GarageService>('/admin/services', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshServices,
  })
}

export function useUpdateService() {
  const refreshServices = useRefreshServices()
  return useMutation({
    mutationFn: ({ id, ...input }: ServiceInput & { id: number }) =>
      apiFetch<GarageService>(`/admin/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshServices,
  })
}

// Hiding is a soft delete: the row stays in the database, so old bookings that mention it still make sense
export function useSetServiceActive() {
  const refreshServices = useRefreshServices()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch<GarageService>(`/admin/services/${id}/active?value=${active}`, { method: 'PATCH' }),
    onSuccess: refreshServices,
  })
}