import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { CustomerType, Discount } from './types'

function useRefreshOffers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] })
}

// Every offer, live or not, the ones that run longest first
export function useAdminOffers() {
  return useQuery({
    queryKey: ['admin', 'offers'],
    queryFn: () => apiFetch<Discount[]>('/admin/discounts'),
  })
}

// null values let the server reply with its own "… is required" messages
export type OfferInput = {
  name: string
  description: string
  percentage: number | null
  validUntil: string | null // "2026-12-31"
  targetCustomerType: CustomerType | null
  serviceIds: number[]
}

// Creating an offer also emails every customer of the target type.
// The backend sends those emails after the save commits, on a background thread, so this request doesn't wait.
export function useCreateOffer() {
  const refreshOffers = useRefreshOffers()
  return useMutation({
    mutationFn: (input: OfferInput) =>
      apiFetch<Discount>('/admin/discounts', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshOffers,
  })
}

export function useUpdateOffer() {
  const refreshOffers = useRefreshOffers()
  return useMutation({
    mutationFn: ({ id, ...input }: OfferInput & { id: number }) =>
      apiFetch<Discount>(`/admin/discounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshOffers,
  })
}

// Switching off instead of deleting: bookings remember which offer they used
export function useSetOfferActive() {
  const refreshOffers = useRefreshOffers()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch<Discount>(`/admin/discounts/${id}/active?value=${active}`, { method: 'PATCH' }),
    onSuccess: refreshOffers,
  })
}