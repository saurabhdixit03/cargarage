import type { CustomerType, Discount } from '../api/types'

// How staff screens name each customer type
export const audience: Record<CustomerType, string> = {
  REGULAR: 'Regular customers',
  REPEAT: 'Repeat customers',
}

// Live: switched on and not past its date. Only live offers reach customers.
export function offerState(offer: Discount, today: string): { label: string; classes: string } {
  if (!offer.active) return { label: 'Switched off', classes: 'bg-cancelled-soft text-cancelled' }
  if (offer.validUntil < today) return { label: 'Expired', classes: 'bg-cancelled-soft text-cancelled' }
  return { label: 'Live', classes: 'bg-completed-soft text-completed' }
}