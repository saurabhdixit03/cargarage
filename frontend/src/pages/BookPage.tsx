import { useState, type ReactNode } from 'react'
import { useServices } from '../api/catalog'
import { ApiError } from '../api/client'
import { useBookAppointment, useMyCars, useMyOffers } from '../api/customer'
import type { Appointment, Car, Discount, GarageService } from '../api/types'
import { Alert } from '../components/ui/Alert'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Skeleton } from '../components/ui/Skeleton'
import { StatusBadge } from '../components/ui/StatusBadge'
import { MAX_DAYS_AHEAD, isoDateFromToday, priceBooking } from '../lib/booking'
import { formatDate, formatRupees } from '../lib/format'

// Loads what the form needs (cars, services, offers), then shows the form
export function BookPage() {
  const cars = useMyCars()
  const services = useServices()
  const offers = useMyOffers()

  let content: ReactNode
  if (cars.isError || services.isError || offers.isError) {
    const error = cars.error ?? services.error ?? offers.error
    content = <Alert>Couldn't load the booking form: {error?.message}</Alert>
  } else if (cars.isPending || services.isPending || offers.isPending) {
    content = (
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-96 lg:col-span-3" />
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
    )
  } else if (cars.data.length === 0) {
    content = <Card><p className="text-muted">Add a car to your account before booking a service.</p></Card>
  } else if (services.data.length === 0) {
    content = <Card><p className="text-muted">No services are available right now.</p></Card>
  } else {
    content = <BookingForm cars={cars.data} services={services.data} offers={offers.data} />
  }

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">New booking</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Book a service</h1>
      </div>
      {content}
    </section>
  )
}

const optionClasses = 'flex cursor-pointer items-center gap-4 rounded-control border px-4 py-3 transition'
const checkClasses = 'size-4 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-accent'

function optionState(selected: boolean): string {
  return selected ? 'border-accent bg-raised' : 'border-line hover:border-line-strong'
}

type BookingFormProps = {
  cars: Car[]
  services: GarageService[]
  offers: Discount[]
}

function BookingForm({ cars, services, offers }: BookingFormProps) {
  const [pickedCarId, setPickedCarId] = useState<number | null>(null)
  const [date, setDate] = useState('')
  const [serviceIds, setServiceIds] = useState<number[]>([])
  const book = useBookAppointment()

  // With only one car there's nothing to choose, so it's picked for you
  const carId = pickedCarId ?? (cars.length === 1 ? cars[0].id : null)
  const car = cars.find((c) => c.id === carId)
  const chosen = services.filter((service) => serviceIds.includes(service.id))
  const price = priceBooking(chosen, offers)

  // The server's checks are the ones shown, so the rules live in one place (as on the login page)
  const fieldErrors = book.error instanceof ApiError ? book.error.fieldErrors : {}
  const formError = book.error && Object.keys(fieldErrors).length === 0 ? book.error.message : null

  function toggleService(id: number) {
    setServiceIds((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]))
  }

  if (book.data) {
    return (
      <BookedCard
        booking={book.data}
        onBookAnother={() => {
          book.reset()
          setDate('')
          setServiceIds([])
        }}
      />
    )
  }

  return (
    <form
      noValidate
      className="grid items-start gap-6 lg:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault()
        book.mutate({ carId, appointmentDate: date || null, serviceIds })
      }}
    >
      <Card className="flex flex-col gap-8 lg:col-span-3">
        <fieldset aria-describedby={fieldErrors.carId ? 'car-error' : undefined}>
          <legend className="font-display text-lg font-semibold">1. Your car</legend>
          <div className="mt-3 flex flex-col gap-2">
            {cars.map((option) => (
              <label key={option.id} className={`${optionClasses} ${optionState(option.id === carId)}`}>
                <input
                  type="radio"
                  name="car"
                  checked={option.id === carId}
                  onChange={() => setPickedCarId(option.id)}
                  className={checkClasses}
                />
                <span className="flex-1">
                  <span className="block font-semibold">{option.make} {option.model}</span>
                  <span className="text-sm text-muted">{option.color}</span>
                </span>
                <span className="font-display font-semibold tracking-wider">{option.licensePlate}</span>
              </label>
            ))}
          </div>
          {fieldErrors.carId && <p id="car-error" className="mt-2 text-sm text-danger">{fieldErrors.carId}</p>}
        </fieldset>

        <div>
          <h2 className="font-display text-lg font-semibold">2. Date</h2>
          <Field
            label={`From tomorrow up to ${MAX_DAYS_AHEAD} days ahead`}
            type="date"
            min={isoDateFromToday(1)}
            max={isoDateFromToday(MAX_DAYS_AHEAD)}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            error={fieldErrors.appointmentDate}
            className="mt-3 sm:max-w-xs"
          />
        </div>

        <fieldset aria-describedby={fieldErrors.serviceIds ? 'services-error' : undefined}>
          <legend className="font-display text-lg font-semibold">3. Services</legend>
          <div className="mt-3 flex flex-col gap-2">
            {services.map((service) => {
              // Offers arrive biggest percentage first, so the first one that covers this service is its best
              const offer = offers.find((o) => o.services.some((covered) => covered.id === service.id))
              return (
                <label key={service.id} className={`${optionClasses} ${optionState(serviceIds.includes(service.id))}`}>
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className={checkClasses}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{service.name}</span>
                    <span className="block text-sm text-muted">{service.description}</span>
                    {offer && (
                      <span className="mt-1 block text-sm text-saving">
                        {offer.percentage}% off with {offer.name}
                      </span>
                    )}
                  </span>
                  <span className="font-display font-semibold">{formatRupees(service.price)}</span>
                </label>
              )
            })}
          </div>
          {fieldErrors.serviceIds && (
            <p id="services-error" className="mt-2 text-sm text-danger">{fieldErrors.serviceIds}</p>
          )}
        </fieldset>
      </Card>

      <Card className="lg:sticky lg:top-6 lg:col-span-2">
        <h2 className="font-display text-xl font-semibold">Summary</h2>
        <p className="mt-1 text-sm text-muted">
          {car ? `${car.make} ${car.model}` : 'No car chosen'} · {date ? formatDate(date) : 'No date yet'}
        </p>

        {chosen.length === 0 ? (
          <p className="mt-4 text-muted">Choose one or more services to see your price.</p>
        ) : (
          <>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {chosen.map((service) => (
                <li key={service.id} className="flex justify-between gap-3">
                  <span>{service.name}</span>
                  <span>{formatRupees(service.price)}</span>
                </li>
              ))}
            </ul>
            <PriceRows
              subtotal={price.subtotal}
              offerLabel={price.offer && `${price.offer.name} · ${price.offer.percentage}% off`}
              saving={price.saving}
              total={price.total}
            />
          </>
        )}

        {formError && <div className="mt-4"><Alert>{formError}</Alert></div>}

        <Button type="submit" disabled={book.isPending} className="mt-6 w-full">
          {book.isPending ? 'Booking…' : 'Confirm booking'}
        </Button>
        <p className="mt-3 text-center text-sm text-muted">The garage confirms each booking. Until then it shows as Pending.</p>
      </Card>
    </form>
  )
}

type PriceRowsProps = {
  subtotal: number
  offerLabel: string | null
  saving: number
  total: number
}

// Subtotal, offer and total: used for the preview and again for the confirmed booking
function PriceRows({ subtotal, offerLabel, saving, total }: PriceRowsProps) {
  return (
    <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Subtotal</dt>
        <dd>{formatRupees(subtotal)}</dd>
      </div>
      <div className={`flex justify-between gap-3 ${offerLabel ? 'text-saving' : 'text-muted'}`}>
        <dt>{offerLabel ?? 'Offer'}</dt>
        <dd>{offerLabel ? `−${formatRupees(saving)}` : 'None for these services'}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display text-3xl font-bold text-accent">{formatRupees(total)}</dd>
      </div>
    </dl>
  )
}

// Shown after booking, with the price the server actually charged
function BookedCard({ booking, onBookAnother }: { booking: Appointment; onBookAnother: () => void }) {
  return (
    <Card className="mx-auto w-full max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm tracking-widest text-muted uppercase">Booking #{booking.id} received</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
            See you on {formatDate(booking.appointmentDate)}
          </h2>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <p className="mt-4 text-muted">
        {booking.car.make} {booking.car.model} · {booking.car.licensePlate}
        <br />
        {booking.items.map((item) => item.serviceName).join(', ')}
      </p>
      <PriceRows
        subtotal={booking.subtotal}
        offerLabel={booking.discountName}
        saving={booking.discountAmount}
        total={booking.totalAmount}
      />
      <p className="mt-4 text-sm text-muted">The garage will confirm it soon. You can follow it in My garage.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink to="/my">Go to My garage</ButtonLink>
        <Button variant="secondary" onClick={onBookAnother}>
          Book another
        </Button>
      </div>
    </Card>
  )
}