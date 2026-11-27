// Indian rupee formatting used everywhere money is shown: 15000 → "₹15,000.00", 150000 → "₹1,50,000.00"
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

export function formatRupees(amount: number): string {
  return rupees.format(amount)
}

// "2026-11-28" (how the API sends dates) → "28 Nov 2026"
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}