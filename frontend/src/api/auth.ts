import { useMutation } from '@tanstack/react-query'
import { saveLogin } from '../auth/session'
import { apiFetch } from './client'
import type { AuthResponse, Role } from './types'

export type LoginInput = {
  email: string
  password: string
  role: Role
}

// Customers and the admin are separate accounts with separate login endpoints
function loginPath(role: Role): string {
  return role === 'ADMIN' ? '/auth/admin/login' : '/auth/customers/login'
}

// A mutation: a request that changes something (here, it starts a session). Runs only when the form calls mutate().
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password, role }: LoginInput) =>
      apiFetch<AuthResponse>(loginPath(role), {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: saveLogin,
  })
}

export type SignupInput = {
  name: string
  email: string
  mobile: string
  password: string
}

// Creates a customer account. The backend answers just like a login (with a token),
// so saving that answer logs the new customer in straight away.
export function useSignup() {
  return useMutation({
    mutationFn: (input: SignupInput) =>
      apiFetch<AuthResponse>('/auth/customers/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: saveLogin,
  })
}