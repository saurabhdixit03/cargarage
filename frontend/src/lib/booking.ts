import type { Discount, GarageService } from '../api/types'

// The same limit the backend checks in AppointmentService
export const MAX_DAYS_AHEAD = 60

// "YYYY-MM-DD" for today plus some days, in the user's own time zone (the format the API expects).
// Not toISOString(): it converts to UTC, so in India before 5:30 am it would give yesterday's date.
export function isoDateFromToday(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export type PriceBreakdown = {
  subtotal: number
  offer: Discount | null
  saving: number
  total: number
}

// Money is counted in whole paise, so floating-point errors (0.1 + 0.2 = 0.30000000000000004) can't creep in
function toPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

// A preview of the price, using the same rule as DiscountService in the backend:
// an offer takes its percentage off only the services it covers (rounded half up to the paisa),
// and the offer that saves the most is applied. The server still works out the real price when you book.
export function priceBooking(services: GarageService[], offers: Discount[]): PriceBreakdown {
  const subtotal = services.reduce((sum, service) => sum + toPaise(service.price), 0)

  let offer: Discount | null = null
  let saving = 0
  for (const candidate of offers) {
    const covered = new Set(candidate.services.map((service) => service.id))
    const coveredTotal = services
      .filter((service) => covered.has(service.id))
      .reduce((sum, service) => sum + toPaise(service.price), 0)
    // The percentage as a whole number of hundredths (12.5% -> 1250), then divide and round half up
    const percentHundredths = Math.round(candidate.percentage * 100)
    const candidateSaving = Math.floor((coveredTotal * percentHundredths + 5000) / 10000)
    // Offers arrive biggest percentage first. On a tie the earlier one stays, as on the server.
    if (candidateSaving > saving) {
      offer = candidate
      saving = candidateSaving
    }
  }

  return { subtotal: subtotal / 100, offer, saving: saving / 100, total: (subtotal - saving) / 100 }
}