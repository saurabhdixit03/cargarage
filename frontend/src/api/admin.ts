import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { AdminAppointment } from './types'

// Every booking, oldest date first (the next jobs come first). The page filters by status itself:
// a garage has a few hundred bookings at most. With far more, we'd use the API's ?status= filter and paging.
export function useAdminAppointments() {
  return useQuery({
    queryKey: ['admin', 'appointments'],
    queryFn: () => apiFetch<AdminAppointment[]>('/admin/appointments'),
  })
}

export type AdminAction = 'accept' | 'reject' | 'complete'

// One endpoint per action: staff ask to accept, reject or complete, and the server decides
// whether that's allowed from the booking's current status (it answers 409 if not)
export function useAppointmentAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action: AdminAction }) =>
      apiFetch<AdminAppointment>(`/admin/appointments/${id}/${action}`, { method: 'POST' }),
    // Reload the list: the booking moves to another tab, and completing can change the customer's type
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  })
}