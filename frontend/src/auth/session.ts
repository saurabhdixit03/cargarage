import { useSyncExternalStore } from 'react'
import type { AuthResponse, Role } from '../api/types'

// Who is logged in. Kept in localStorage, so refreshing the page doesn't log you out.
export type Session = {
  token: string
  userId: number
  name: string
  role: Role
  expiresAt: number // when the token stops working, in milliseconds since 1970
}

const STORAGE_KEY = 'cargarage.session'
const listeners = new Set<() => void>()

function load(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const session = raw ? (JSON.parse(raw) as Session) : null
    return session && session.expiresAt > Date.now() ? session : null
  } catch {
    return null
  }
}

let current: Session | null = load()

function setSession(next: Session | null) {
  current = next
  if (next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
  listeners.forEach((listener) => listener())
}

export function saveLogin(auth: AuthResponse) {
  setSession({
    token: auth.token,
    userId: auth.userId,
    name: auth.name,
    role: auth.role,
    expiresAt: Date.now() + auth.expiresInMinutes * 60_000,
  })
}

// After a name change, the top bar shows the new name without logging in again
export function renameSession(name: string) {
  if (current) {
    setSession({ ...current, name })
  }
}

export function logout() {
  setSession(null)
}

// The token to send with a request, or null. An expired session is dropped instead of being sent.
export function getToken(): string | null {
  if (current && current.expiresAt <= Date.now()) {
    setSession(null)
  }
  return current?.token ?? null
}

// Logging in or out in another browser tab updates this tab too
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    current = load()
    listeners.forEach((listener) => listener())
  }
})

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Components call this to read the session; they re-render whenever someone logs in or out
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => current)
}