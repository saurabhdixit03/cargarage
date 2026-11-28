import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { renameSession } from '../auth/session'
import { apiFetch } from './client'
import type { Appointment, Car, CustomerProfile, Discount, FaceliftKit } from './types'

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

// The kits that fit one of the customer's cars. The backend looks the car up for this customer only,
// so another customer's car id gets a 404, as everywhere else.
export function useKitsForCar(carId: number) {
  return useQuery({
    queryKey: ['me', 'cars', carId, 'kits'],
    queryFn: () => apiFetch<FaceliftKit[]>(`/customers/me/cars/${carId}/facelift-kits`),
  })
}

// After any change, everything under 'me' is loaded again.
// Bookings show car details too, so editing a car has to refresh them as well.
function useRefreshMe() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['me'] })
}

export type ProfileInput = {
  name: string
  mobile: string
}

// Name and mobile only: the email is the login, so the backend keeps it as it is
export function useUpdateProfile() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: (input: ProfileInput) =>
      apiFetch<CustomerProfile>('/customers/me', {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: (profile) => {
      renameSession(profile.name) // the top bar shows the name saved at login, so it changes too
      return refreshMe()
    },
  })
}

// The current password is checked again, so someone with a stolen token can't lock the owner out.
// Tokens aren't tied to the password, so this logs nobody out: old tokens work until they expire.
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      apiFetch<void>('/customers/me/password', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
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

// Change the date of a booking. Allowed only for pending or accepted bookings, before their day.
// The server keeps the price and offer, and sets the booking back to PENDING for the garage to confirm.
export function useRescheduleAppointment() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: ({ id, appointmentDate }: { id: number; appointmentDate: string | null }) =>
      apiFetch<Appointment>(`/customers/me/appointments/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ appointmentDate }),
      }),
    onSuccess: refreshMe,
  })
}

// An action endpoint: the client asks to cancel and the server decides whether that's allowed
export function useCancelAppointment() {
  const refreshMe = useRefreshMe()
  return useMutation({
    mutationFn: (id: number) => apiFetch<Appointment>(`/customers/me/appointments/${id}/cancel`, { method: 'POST' }),
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