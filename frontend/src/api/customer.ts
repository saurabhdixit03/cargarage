import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Appointment, Car, CustomerProfile, Discount } from './types'

// The logged-in customer's own data. The backend works out who "me" is from the token,
// so these URLs never contain a customer id. All keys start with 'me', and logging out clears them.

export function useMyProfile() {
  return useQuery({
    queryKey: ['me', 'profile'],
    queryFn: () => apiFetch<CustomerProfile>('/customers/me'),
  })
}

export function useMyCars() {
  return useQuery({
    queryKey: ['me', 'cars'],
    queryFn: () => apiFetch<Car[]>('/customers/me/cars'),
  })
}

export function useMyAppointments() {
  return useQuery({
    queryKey: ['me', 'appointments'],
    queryFn: () => apiFetch<Appointment[]>('/customers/me/appointments'),
  })
}

export function useMyOffers() {
  return useQuery({
    queryKey: ['me', 'offers'],
    queryFn: () => apiFetch<Discount[]>('/customers/me/discounts'),
  })
}

// After any change, everything under 'me' is loaded again.
// Bookings show car details too, so editing a car has to refresh them as well.
function useRefreshMe() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['me'] })
}

export type BookingInput = {
  carId: number | null
  appointmentDate: string | null // "2026-11-28"; null lets the server reply "Appointment date is required"
  serviceIds: number[]
}

// Books an appointment. The server checks everything again and works out the final price and offer.
export function useBookAppointment() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: (input: BookingInput) =>
      apiFetch<Appointment>('/customers/me/appointments', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshMe,
  })
}

export type CarInput = {
  make: string
  model: string
  color: string
  licensePlate: string // "MH12AB1234"; the server also accepts spaces, dashes and lowercase
}

export function useAddCar() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: (input: CarInput) =>
      apiFetch<Car>('/customers/me/cars', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshMe,
  })
}

// A car id in the URL is safe: the backend only finds cars that belong to the customer in the token
export function useUpdateCar() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: ({ id, ...input }: CarInput & { id: number }) =>
      apiFetch<Car>(`/customers/me/cars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: refreshMe,
  })
}

export function useDeleteCar() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/customers/me/cars/${id}`, { method: 'DELETE' }),
    onSuccess: refreshMe,
  })
}