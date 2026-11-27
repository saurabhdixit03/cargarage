import { useState } from 'react'
import { ApiError } from '../api/client'
import {
  useCancelAppointment,
  useMyAppointments,
  useMyCars,
  useMyOffers,
  useMyProfile,
  useRescheduleAppointment,
} from '../api/customer'
import type { Appointment } from '../api/types'
import { Alert } from '../components/ui/Alert'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Skeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MAX_DAYS_AHEAD, isoDateFromToday } from '../lib/booking'
import { formatDate, formatRupees } from '../lib/format'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// The customer's home: their bookings, cars and offers, like the "Showroom Dark" design
export function MyGaragePage() {
  const profile = useMyProfile()
  const cars = useMyCars()
  const bookings = useMyAppointments()
  const offers = useMyOffers()

  const firstCar = cars.data?.[0]
  const firstName = profile.data?.name.split(' ')[0]

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-widest text-muted uppercase">
            {firstCar ? `${firstCar.make} ${firstCar.model} · ${firstCar.licensePlate}` : 'Your garage'}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
            {greeting()}
            {firstName && `, ${firstName}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {profile.data?.customerType === 'REPEAT' && (
            <span className="rounded-full border border-accent-line bg-accent-soft px-3.5 py-1.5 text-sm font-semibold text-accent">
              Repeat customer
            </span>
          )}
          <ButtonLink to="/book">Book a service</ButtonLink>
        </div>
      </div>

      {/* grid-cols-1 = minmax(0, 1fr): lets long lines truncate on phones instead of widening the page */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="font-display text-xl font-semibold">Your bookings</h2>
          {bookings.error ? (
            <div className="mt-4"><Alert>Couldn't load your bookings: {bookings.error.message}</Alert></div>
          ) : bookings.isPending ? (
            <Skeleton className="mt-4 h-48" />
          ) : bookings.data.length === 0 ? (
            <p className="mt-4 text-muted">No bookings yet.</p>
          ) : (
            <ul className="mt-2">
              {bookings.data.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">Your cars</h2>
              <ButtonLink to="/my/cars" variant="ghost" size="sm" className="-my-2">
                Manage
              </ButtonLink>
            </div>
            {cars.error ? (
              <div className="mt-4"><Alert>Couldn't load your cars: {cars.error.message}</Alert></div>
            ) : cars.isPending ? (
              <Skeleton className="mt-4 h-20" />
            ) : cars.data.length === 0 ? (
              <p className="mt-4 text-muted">No cars added yet.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {cars.data.map((car) => (
                  <li key={car.id} className="flex items-center justify-between gap-3 rounded-control bg-raised px-4 py-3">
                    <span>
                      <span className="block font-semibold">{car.make} {car.model}</span>
                      <span className="text-sm text-muted">{car.color}</span>
                    </span>
                    <span className="font-display font-semibold tracking-wider">{car.licensePlate}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold">Offers for you</h2>
            {offers.error ? (
              <div className="mt-4"><Alert>Couldn't load your offers: {offers.error.message}</Alert></div>
            ) : offers.isPending ? (
              <Skeleton className="mt-4 h-24" />
            ) : offers.data.length === 0 ? (
              <p className="mt-4 text-muted">No offers right now.</p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {offers.data.map((offer) => (
                  <li key={offer.id} className="rounded-control border border-accent-line bg-accent-soft p-4">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold">{offer.name}</span>
                      <span className="font-display text-lg font-bold text-accent">{Number(offer.percentage)}% off</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {offer.services.map((service) => service.name).join(', ')} · until {formatDate(offer.validUntil)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </section>
  )
}

type RowMode = 'view' | 'reschedule' | 'cancel'

// One booking, with "Change date" and "Cancel booking" while it can still be changed
function BookingRow({ booking }: { booking: Appointment }) {
  const [mode, setMode] = useState<RowMode>('view')
  const [newDate, setNewDate] = useState('')
  const reschedule = useRescheduleAppointment()
  const cancel = useCancelAppointment()

  // The same rule as AppointmentService: only pending or accepted bookings, and only before their day
  const changeable =
    (booking.status === 'PENDING' || booking.status === 'ACCEPTED') && booking.appointmentDate > isoDateFromToday(0)

  const fieldErrors = reschedule.error instanceof ApiError ? reschedule.error.fieldErrors : {}
  const rescheduleError = reschedule.error && Object.keys(fieldErrors).length === 0 ? reschedule.error.message : null

  function close() {
    reschedule.reset()
    cancel.reset()
    setMode('view')
  }

  return (
    <li className="border-b border-line py-3 last:border-b-0">
      {/* On phones the badge and total wrap onto a second line, so the text keeps its width */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-semibold">{formatDate(booking.appointmentDate)}</p>
          <p className="truncate text-sm text-muted">{booking.items.map((item) => item.serviceName).join(', ')}</p>
          {booking.discountName && <p className="text-sm text-saving">{booking.discountName} applied</p>}
        </div>
        <StatusBadge status={booking.status} />
        <p className="ml-auto text-right font-semibold sm:w-28">{formatRupees(booking.totalAmount)}</p>
      </div>

      {mode === 'view' && changeable && (
        <div className="mt-1 -ml-4 flex flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNewDate(booking.appointmentDate) // start from the current date
              setMode('reschedule')
            }}
          >
            Change date
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMode('cancel')}>
            Cancel booking
          </Button>
        </div>
      )}

      {mode === 'reschedule' && (
        <form
          noValidate
          className="mt-3 flex flex-col gap-3 rounded-control bg-raised p-4"
          onSubmit={(event) => {
            event.preventDefault()
            reschedule.mutate({ id: booking.id, appointmentDate: newDate || null }, { onSuccess: close })
          }}
        >
          <Field
            label={`New date (from tomorrow up to ${MAX_DAYS_AHEAD} days ahead)`}
            type="date"
            autoFocus
            min={isoDateFromToday(1)}
            max={isoDateFromToday(MAX_DAYS_AHEAD)}
            value={newDate}
            onChange={(event) => setNewDate(event.target.value)}
            error={fieldErrors.appointmentDate}
            className="sm:max-w-xs"
          />
          <p className="text-sm text-muted">
            The price and offer stay the same. The garage confirms the new date again, so the booking shows as Pending.
          </p>
          {rescheduleError && <Alert>{rescheduleError}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={reschedule.isPending}>
              {reschedule.isPending ? 'Saving…' : 'Save new date'}
            </Button>
            <Button variant="ghost" size="sm" onClick={close}>
              Keep current date
            </Button>
          </div>
        </form>
      )}

      {mode === 'cancel' && (
        <div className="mt-3 flex flex-col gap-3 rounded-control bg-raised p-4">
          <p className="text-sm">Cancel your booking on {formatDate(booking.appointmentDate)}?</p>
          {cancel.error && <Alert>{cancel.error.message}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(booking.id, { onSuccess: close })}
            >
              {cancel.isPending ? 'Cancelling…' : 'Yes, cancel it'}
            </Button>
            <Button variant="ghost" size="sm" autoFocus onClick={close}>
              Keep booking
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}