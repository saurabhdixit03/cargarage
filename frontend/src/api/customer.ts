import { useQuery } from '@tanstack/react-query'
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