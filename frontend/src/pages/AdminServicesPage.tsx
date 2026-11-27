import { useState } from 'react'
import {
  useAdminServices,
  useCreateService,
  useSetServiceActive,
  useUpdateService,
  type ServiceInput,
} from '../api/adminCatalog'
import { ApiError } from '../api/client'
import type { GarageService } from '../api/types'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Skeleton } from '../components/ui/Skeleton'
import { TextAreaField } from '../components/ui/TextAreaField'
import { formatRupees } from '../lib/format'

// Staff manage what customers can book: add, edit, and hide or show services
export function AdminServicesPage() {
  const services = useAdminServices()
  const hiddenCount = services.data?.filter((service) => !service.active).length ?? 0

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">Garage staff</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Services</h1>
        <p className="mt-2 max-w-2xl text-muted">
          What customers can book. A hidden service disappears from the catalogue and the booking form, while past
          bookings keep its name and the price they were booked at.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">All services</h2>
            {services.data && (
              <p className="text-sm text-muted">
                {services.data.length} in total · {hiddenCount} hidden
              </p>
            )}
          </div>
          {services.error ? (
            <div className="mt-4"><Alert>Couldn't load services: {services.error.message}</Alert></div>
          ) : services.isPending ? (
            <Skeleton className="mt-4 h-48" />
          ) : services.data.length === 0 ? (
            <p className="mt-4 text-muted">No services yet. Add the first one.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {services.data.map((service) => (
                <ServiceRow key={service.id} service={service} />
              ))}
            </ul>
          )}
        </Card>

        <AddServiceCard />
      </div>
    </section>
  )
}

// After a service is added, a new key gives a fresh, empty form (as on the My cars page)
function AddServiceCard() {
  const create = useCreateService()
  const [formKey, setFormKey] = useState(0)

  return (
    <Card className="lg:col-span-2">
      <h2 className="font-display text-xl font-semibold">Add a service</h2>
      {create.isSuccess && <p className="mt-2 text-sm text-saving">{create.data.name} was added.</p>}
      <div className="mt-4">
        <ServiceForm
          key={formKey}
          submitLabel="Add service"
          pendingLabel="Adding…"
          isPending={create.isPending}
          error={create.error}
          onSubmit={(input) => create.mutate(input, { onSuccess: () => setFormKey((key) => key + 1) })}
        />
      </div>
    </Card>
  )
}

// One service, with its own mutations so each row shows its own "Saving…" and errors
function ServiceRow({ service }: { service: GarageService }) {
  const [editing, setEditing] = useState(false)
  const update = useUpdateService()
  const setActive = useSetServiceActive()

  if (editing) {
    return (
      <li className="rounded-control border border-accent bg-raised p-4">
        <ServiceForm
          initial={service}
          autoFocus
          submitLabel="Save changes"
          pendingLabel="Saving…"
          isPending={update.isPending}
          error={update.error}
          onSubmit={(input) => update.mutate({ ...input, id: service.id }, { onSuccess: () => setEditing(false) })}
          onCancel={() => {
            update.reset()
            setEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="rounded-control bg-raised px-4 py-3">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
        <div className="min-w-0 flex-1 basis-56">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {service.name}
            {!service.active && (
              <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs text-muted">Hidden</span>
            )}
          </p>
          <p className="text-sm text-muted">{service.description}</p>
        </div>
        <p className="font-display font-semibold">{formatRupees(service.price)}</p>
      </div>
      <div className="mt-1 -ml-4 flex flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={setActive.isPending}
          onClick={() => setActive.mutate({ id: service.id, active: !service.active })}
        >
          {setActive.isPending ? 'Saving…' : service.active ? 'Hide from customers' : 'Show to customers'}
        </Button>
      </div>
      {setActive.error && (
        <div className="mt-2">
          <Alert>{setActive.error.message}</Alert>
        </div>
      )}
    </li>
  )
}

// The form keeps the price as text while typing; it becomes a number (or null if empty) when sent
type FormValues = { name: string; description: string; price: string }

type ServiceFormProps = {
  initial?: GarageService
  autoFocus?: boolean
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  error: Error | null
  onSubmit: (input: ServiceInput) => void
  onCancel?: () => void
}

// The same form adds a new service and edits an existing one, showing the server's messages per field
function ServiceForm({ initial, autoFocus, submitLabel, pendingLabel, isPending, error, onSubmit, onCancel }: ServiceFormProps) {
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial ? String(initial.price) : '',
  })
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {}
  const formError = error && Object.keys(fieldErrors).length === 0 ? error.message : null

  function change(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const price = values.price.trim()
        onSubmit({ name: values.name, description: values.description, price: price === '' ? null : Number(price) })
      }}
    >
      <Field
        label="Name"
        autoFocus={autoFocus}
        value={values.name}
        onChange={(event) => change('name', event.target.value)}
        error={fieldErrors.name}
      />
      <TextAreaField
        label="Description"
        rows={3}
        value={values.description}
        onChange={(event) => change('description', event.target.value)}
        error={fieldErrors.description}
      />
      <Field
        label="Price (₹)"
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={values.price}
        onChange={(event) => change('price', event.target.value)}
        error={fieldErrors.price}
        className="sm:max-w-48"
      />
      {initial && <p className="text-sm text-muted">Existing bookings keep the price they were booked at.</p>}

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