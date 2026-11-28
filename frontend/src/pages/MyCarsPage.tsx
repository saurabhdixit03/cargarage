import { useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { useAddCar, useDeleteCar, useKitsForCar, useMyCars, useUpdateCar, type CarInput } from '../api/customer'
import type { Car } from '../api/types'
import { Alert } from '../components/ui/Alert'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Skeleton } from '../components/ui/Skeleton'

// The customer's cars: add new ones, edit details, remove ones without bookings
export function MyCarsPage() {
  const cars = useMyCars()

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm tracking-widest text-muted uppercase">Your garage</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">My cars</h1>
        </div>
        {cars.data && cars.data.length > 0 && (
          <ButtonLink to="/book" variant="secondary">
            Book a service
          </ButtonLink>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="font-display text-xl font-semibold">Your cars</h2>
          {cars.error ? (
            <div className="mt-4"><Alert>Couldn't load your cars: {cars.error.message}</Alert></div>
          ) : cars.isPending ? (
            <Skeleton className="mt-4 h-40" />
          ) : cars.data.length === 0 ? (
            <p className="mt-4 text-muted">No cars yet. Add one to start booking services.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {cars.data.map((car) => (
                <CarRow key={car.id} car={car} />
              ))}
            </ul>
          )}
        </Card>

        <AddCarCard />
      </div>
    </section>
  )
}

// After a car is added, the form gets a new key. React then throws the old form away
// and starts a fresh, empty one: an easy way to reset all of a component's state.
function AddCarCard() {
  const add = useAddCar()
  const [formKey, setFormKey] = useState(0)

  return (
    <Card className="lg:col-span-2">
      <h2 className="font-display text-xl font-semibold">Add a car</h2>
      {add.isSuccess && (
        <p className="mt-2 text-sm text-saving">
          {add.data.make} {add.data.model} ({add.data.licensePlate}) was added.
        </p>
      )}
      <div className="mt-4">
        <CarForm
          key={formKey}
          submitLabel="Add car"
          pendingLabel="Adding…"
          isPending={add.isPending}
          error={add.error}
          onSubmit={(values) => add.mutate(values, { onSuccess: () => setFormKey((key) => key + 1) })}
        />
      </div>
    </Card>
  )
}

type RowMode = 'view' | 'edit' | 'remove'

// One car. Each row has its own mutations, so saving or removing one car doesn't affect the others.
function CarRow({ car }: { car: Car }) {
  const [mode, setMode] = useState<RowMode>('view')
  const update = useUpdateCar()
  const remove = useDeleteCar()

  if (mode === 'edit') {
    return (
      <li className="rounded-control border border-accent bg-raised p-4">
        <CarForm
          initial={car}
          autoFocus
          submitLabel="Save changes"
          pendingLabel="Saving…"
          isPending={update.isPending}
          error={update.error}
          onSubmit={(values) => update.mutate({ ...values, id: car.id }, { onSuccess: () => setMode('view') })}
          onCancel={() => {
            update.reset()
            setMode('view')
          }}
        />
      </li>
    )
  }

  return (
    <li className="rounded-control bg-raised px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{car.make} {car.model}</span>
          <span className="text-sm text-muted">{car.color}</span>
          <CarKits car={car} />
        </span>
        <span className="font-display font-semibold tracking-wider">{car.licensePlate}</span>
        {mode === 'view' && (
          <span className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMode('edit')}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMode('remove')}>
              Remove
            </Button>
          </span>
        )}
      </div>

      {/* Asked inside the row instead of with window.confirm(), which blocks the whole page */}
      {mode === 'remove' && (
        <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
          <p className="text-sm">Remove this car from your account?</p>
          {remove.error && <Alert>{remove.error.message}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" size="sm" disabled={remove.isPending} onClick={() => remove.mutate(car.id)}>
              {remove.isPending ? 'Removing…' : 'Yes, remove'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              autoFocus
              onClick={() => {
                remove.reset()
                setMode('view')
              }}
            >
              Keep it
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

// How many facelift kits fit this car (the backend's "kits for my car" endpoint), linking to them.
// It's only a hint, so nothing shows while it loads or if it fails.
function CarKits({ car }: { car: Car }) {
  const kits = useKitsForCar(car.id)
  if (kits.isPending || kits.isError) return null
  if (kits.data.length === 0) {
    return <span className="block text-sm text-muted">No facelift kits for this car yet</span>
  }
  const filter = new URLSearchParams({ make: car.make, model: car.model })
  return (
    <Link to={`/facelift-kits?${filter.toString()}`} className="block text-sm text-accent underline-offset-4 hover:underline">
      {kits.data.length === 1 ? '1 facelift kit fits this car' : `${kits.data.length} facelift kits fit this car`}
    </Link>
  )
}

const emptyCar: CarInput = { make: '', model: '', color: '', licensePlate: '' }

type CarFormProps = {
  initial?: CarInput
  autoFocus?: boolean
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  error: Error | null
  onSubmit: (values: CarInput) => void
  onCancel?: () => void
}

// The same form adds a new car and edits an existing one.
// As on the other forms, the server's validation messages appear under each field.
function CarForm({ initial = emptyCar, autoFocus, submitLabel, pendingLabel, isPending, error, onSubmit, onCancel }: CarFormProps) {
  const [values, setValues] = useState(initial)
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {}
  const formError = error && Object.keys(fieldErrors).length === 0 ? error.message : null

  function change(name: keyof CarInput, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(values)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Make"
          placeholder="e.g. Hyundai"
          autoFocus={autoFocus}
          value={values.make}
          onChange={(event) => change('make', event.target.value)}
          error={fieldErrors.make}
        />
        <Field
          label="Model"
          placeholder="e.g. Creta"
          value={values.model}
          onChange={(event) => change('model', event.target.value)}
          error={fieldErrors.model}
        />
        <Field
          label="Color"
          placeholder="e.g. White"
          value={values.color}
          onChange={(event) => change('color', event.target.value)}
          error={fieldErrors.color}
        />
        <Field
          label="License plate"
          placeholder="e.g. MH12AB1234"
          autoCapitalize="characters"
          spellCheck={false}
          value={values.licensePlate}
          onChange={(event) => change('licensePlate', event.target.value)}
          error={fieldErrors.licensePlate}
        />
      </div>

      {formError && <Alert>{formError}</Alert>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}