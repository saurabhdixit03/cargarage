import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDate, formatRupees } from '../lib/format'

// Every shared component in one place, to check the theme at a glance
export function StyleGuide() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-2xl font-semibold">Style guide</h2>

      <Card className="flex flex-col gap-4">
        <h3 className="font-display text-lg font-semibold">Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button>Confirm booking</Button>
          <Button variant="secondary">Clear</Button>
          <Button variant="ghost">Cancel</Button>
          <Button disabled>Saving…</Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h3 className="font-display text-lg font-semibold">Booking statuses</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="PENDING" />
          <StatusBadge status="ACCEPTED" />
          <StatusBadge status="COMPLETED" />
          <StatusBadge status="REJECTED" />
          <StatusBadge status="CANCELLED" />
        </div>
      </Card>

      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" type="email" placeholder="you@example.com" />
        <Field label="Licence plate" defaultValue="ABC" error="License plate must look like MH12AB1234" />
      </Card>

      <Card className="flex flex-col gap-2 text-sm">
        <h3 className="font-display text-lg font-semibold">Money and dates</h3>
        <p className="text-muted">
          {formatRupees(15000)} · {formatRupees(150000)} · {formatDate('2026-11-28')}
        </p>
        <p className="text-saving">Loyalty Offer −{formatRupees(3000)}</p>
      </Card>
    </div>
  )
}