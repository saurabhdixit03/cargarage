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

export type BookingInput = {
  carId: number | null
  appointmentDate: string | null // "2026-11-28"; null lets the server reply "Appointment date is required"
  serviceIds: number[]
}

// Books an appointment. The server checks everything again and works out the final price and offer.
export function useBookAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BookingInput) =>
      apiFetch<Appointment>('/customers/me/appointments', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    // A new booking changes the customer's data, so everything under 'me' is loaded again
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })
}