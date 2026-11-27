import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAdminAppointments, useAppointmentAction, type AdminAction } from '../api/admin'
import type { AdminAppointment, AppointmentStatus } from '../api/types'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { isoDateFromToday } from '../lib/booking'
import { formatDate, formatRupees } from '../lib/format'

const tabs: { status: AppointmentStatus; label: string; empty: string }[] = [
  { status: 'PENDING', label: 'Pending', empty: 'Nothing is waiting for a decision.' },
  { status: 'ACCEPTED', label: 'Accepted', empty: 'No accepted bookings.' },
  { status: 'COMPLETED', label: 'Completed', empty: 'No completed jobs yet.' },
  { status: 'REJECTED', label: 'Rejected', empty: 'No rejected bookings.' },
  { status: 'CANCELLED', label: 'Cancelled', empty: 'No cancelled bookings.' },
]

// The garage staff's home: every booking by status, with the actions each status allows
export function AdminDashboardPage() {
  const bookings = useAdminAppointments()
  const [searchParams, setSearchParams] = useSearchParams()
  // The chosen tab lives in the URL (/admin?status=ACCEPTED), so a refresh or the Back button keeps it
  const tab = tabs.find((t) => t.status === searchParams.get('status')) ?? tabs[0]
  const today = isoDateFromToday(0) // "YYYY-MM-DD" strings compare correctly as text

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">Garage staff</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Bookings</h1>
      </div>

      {bookings.error ? (
        <Alert>Couldn't load bookings: {bookings.error.message}</Alert>
      ) : bookings.isPending ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Waiting for a decision" value={String(countWith(bookings.data, (b) => b.status === 'PENDING'))} />
            <Stat
              label="Jobs today"
              value={String(countWith(bookings.data, (b) => b.status === 'ACCEPTED' && b.appointmentDate === today))}
            />
            <Stat
              label="Earned from completed jobs"
              value={formatRupees(
                bookings.data.filter((b) => b.status === 'COMPLETED').reduce((sum, b) => sum + b.totalAmount, 0),
              )}
            />
          </div>

          <Card>
            <div role="group" aria-label="Show bookings by status" className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.status}
                  type="button"
                  aria-pressed={t.status === tab.status}
                  onClick={() => setSearchParams({ status: t.status })}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-accent ${
                    t.status === tab.status
                      ? 'border-accent-line bg-accent-soft text-accent'
                      : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  {t.label} · {countWith(bookings.data, (b) => b.status === t.status)}
                </button>
              ))}
            </div>

            {bookings.data.some((b) => b.status === tab.status) ? (
              <ul className="mt-6 flex flex-col gap-3">
                {bookings.data
                  .filter((b) => b.status === tab.status)
                  .map((booking) => (
                    <BookingRow key={booking.id} booking={booking} today={today} />
                  ))}
              </ul>
            ) : (
              <p className="mt-6 text-muted">{tab.empty}</p>
            )}
          </Card>
        </>
      )}
    </section>
  )
}

function countWith(bookings: AdminAppointment[], test: (booking: AdminAppointment) => boolean): number {
  return bookings.filter(test).length
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </Card>
  )
}

// "2026-12-01" → { day: "1 Dec", weekday: "Tuesday" }
function dateParts(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return {
    day: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    weekday: date.toLocaleDateString('en-IN', { weekday: 'long' }),
  }
}

// One booking. Each row has its own mutation, so "Accepting…" and errors stay with that booking.
// The buttons follow the same rules as AdminAppointmentService; the server still checks them.
function BookingRow({ booking, today }: { booking: AdminAppointment; today: string }) {
  const action = useAppointmentAction()
  const [confirmingReject, setConfirmingReject] = useState(false)
  const { day, weekday } = dateParts(booking.appointmentDate)
  const running = action.isPending ? action.variables.action : null

  function run(name: AdminAction) {
    action.mutate({ id: booking.id, action: name })
  }

  return (
    <li className="grid gap-4 rounded-control bg-raised p-4 sm:grid-cols-[7rem_1fr_auto]">
      <div>
        <p className="font-display text-2xl font-bold">{day}</p>
        <p className={`text-sm ${booking.appointmentDate === today ? 'font-semibold text-accent' : 'text-muted'}`}>
          {booking.appointmentDate === today ? 'Today' : weekday}
        </p>
      </div>

      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          {booking.customer.name}
          {booking.customer.customerType === 'REPEAT' && (
            <span className="rounded-full border border-accent-line bg-accent-soft px-2 py-0.5 text-xs text-accent">
              Repeat
            </span>
          )}
        </p>
        <p className="text-sm text-muted">
          {booking.customer.mobile} · {booking.customer.email}
        </p>
        <p className="mt-2 text-sm">
          {booking.car.make} {booking.car.model} ·{' '}
          <span className="font-display font-semibold tracking-wider">{booking.car.licensePlate}</span>
        </p>
        <p className="text-sm text-muted">{booking.items.map((item) => item.serviceName).join(', ')}</p>
        {booking.discountName && (
          <p className="text-sm text-saving">
            {booking.discountName}: −{formatRupees(booking.discountAmount)}
          </p>
        )}
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} />
          <span className="font-display text-xl font-bold">{formatRupees(booking.totalAmount)}</span>
        </div>

        {booking.status === 'PENDING' && !confirmingReject && (
          <div className="flex flex-wrap gap-2">
            {booking.appointmentDate >= today && (
              <Button size="sm" disabled={action.isPending} onClick={() => run('accept')}>
                {running === 'accept' ? 'Accepting…' : 'Accept'}
              </Button>
            )}
            <Button size="sm" variant="danger" disabled={action.isPending} onClick={() => setConfirmingReject(true)}>
              Reject
            </Button>
          </div>
        )}
        {booking.status === 'PENDING' && booking.appointmentDate < today && (
          <p className="text-sm text-muted">The date has passed, so it can only be rejected.</p>
        )}

        {/* Rejecting can't be undone, so it takes a second click */}
        {confirmingReject && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Reject this booking?</span>
            <Button size="sm" variant="danger" disabled={action.isPending} onClick={() => run('reject')}>
              {running === 'reject' ? 'Rejecting…' : 'Yes, reject'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              autoFocus
              disabled={action.isPending}
              onClick={() => {
                action.reset()
                setConfirmingReject(false)
              }}
            >
              Keep it
            </Button>
          </div>
        )}

        {booking.status === 'ACCEPTED' &&
          (booking.appointmentDate <= today ? (
            <Button size="sm" disabled={action.isPending} onClick={() => run('complete')}>
              {running === 'complete' ? 'Completing…' : 'Mark completed'}
            </Button>
          ) : (
            <p className="text-sm text-muted">Can be completed from {formatDate(booking.appointmentDate)}</p>
          ))}
      </div>

      {action.error && (
        <div className="sm:col-span-3">
          <Alert>{action.error.message}</Alert>
        </div>
      )}
    </li>
  )
}