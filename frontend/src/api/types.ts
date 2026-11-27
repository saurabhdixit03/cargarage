// Shapes of the JSON the backend sends. Each type matches a response DTO record in the Spring Boot code.

export type GarageService = {
  id: number
  name: string
  description: string
  price: number
  active: boolean
}

export type FaceliftKit = {
  id: number
  kitName: string
  carMake: string
  carModel: string
  description: string
  price: number
  active: boolean
  imageUrls: string[]
}

export type Role = 'CUSTOMER' | 'ADMIN'

// What a successful login or sign-up returns
export type AuthResponse = {
  token: string
  tokenType: string
  expiresInMinutes: number
  userId: number
  name: string
  role: Role
}

// The backend's error format (RFC 9457 ProblemDetail). "errors" holds field messages for a 400.
export type ProblemDetail = {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string>
}