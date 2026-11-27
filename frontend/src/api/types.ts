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

export type CustomerType = 'REGULAR' | 'REPEAT'

export type CustomerProfile = {
  id: number
  name: string
  email: string
  mobile: string
  customerType: CustomerType
  memberSince: string // "2026-11-27"
}

export type Car = {
  id: number
  make: string
  model: string
  color: string
  licensePlate: string
}

export type AppointmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

export type AppointmentItem = {
  serviceId: number
  serviceName: string
  price: number // the price when it was booked
}

export type Appointment = {
  id: number
  appointmentDate: string // "2026-11-28"
  status: AppointmentStatus
  car: Car
  items: AppointmentItem[]
  subtotal: number
  discountName: string | null
  discountAmount: number
  totalAmount: number
}

export type Discount = {
  id: number
  name: string
  description: string
  percentage: number
  validUntil: string // "2026-12-27"
  targetCustomerType: CustomerType
  active: boolean
  services: { id: number; name: string }[]
}

// What staff see for a booking: the same fields as Appointment, plus who booked it
export type AdminAppointment = Appointment & {
  customer: {
    id: number
    name: string
    email: string
    mobile: string
    customerType: CustomerType
  }
}

// The backend's error format (RFC 9457 ProblemDetail). "errors" holds field messages for a 400.
export type ProblemDetail = {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string>
}