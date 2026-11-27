import type { ProblemDetail } from './types'

// Thrown for any response that isn't 2xx. Carries the backend's message and, for a 400, the field errors.
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, problem: ProblemDetail | null) {
    super(problem?.detail ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = problem?.errors ?? {}
  }
}

// The one place that talks to the backend. Every request goes through here,
// so headers, error handling (and, soon, the login token) are written once.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`/api${path}`, { ...init, headers })

  if (!response.ok) {
    // An error body may be missing or not JSON (e.g. the backend is down), so read it carefully
    const problem = (await response.json().catch(() => null)) as ProblemDetail | null
    throw new ApiError(response.status, problem)
  }

  // 204 No Content has no body to read
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}