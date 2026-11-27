import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { FaceliftKit } from './types'

// A change here also changes the public kits page, so its list (['facelift-kits']) is refreshed too
function useRefreshKits() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'kits'] }),
      queryClient.invalidateQueries({ queryKey: ['facelift-kits'] }),
    ])
}

// Every kit, hidden ones included, sorted by name
export function useAdminKits() {
  return useQuery({
    queryKey: ['admin', 'kits'],
    queryFn: () => apiFetch<FaceliftKit[]>('/admin/facelift-kits'),
  })
}

export type KitInput = {
  kitName: string
  carMake: string
  carModel: string
  description: string
  price: number | null // null lets the server reply "Price is required"
  imageUrls: string[] // in order: the first one is the photo customers see on the card
}

export function useCreateKit() {
  const refreshKits = useRefreshKits()
  return useMutation({
    mutationFn: (input: KitInput) =>
      apiFetch<FaceliftKit>('/admin/facelift-kits', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshKits,
  })
}

export function useUpdateKit() {
  const refreshKits = useRefreshKits()
  return useMutation({
    mutationFn: ({ id, ...input }: KitInput & { id: number }) =>
      apiFetch<FaceliftKit>(`/admin/facelift-kits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshKits,
  })
}

export function useSetKitActive() {
  const refreshKits = useRefreshKits()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch<FaceliftKit>(`/admin/facelift-kits/${id}/active?value=${active}`, { method: 'PATCH' }),
    onSuccess: refreshKits,
  })
}