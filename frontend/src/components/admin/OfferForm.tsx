import { useId, useState } from 'react'
import type { OfferInput } from '../../api/adminOffers'
import { ApiError } from '../../api/client'
import type { CustomerType, Discount, GarageService } from '../../api/types'
import { isoDateFromToday } from '../../lib/booking'
import { formatRupees } from '../../lib/format'
import { audience } from '../../lib/offers'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { TextAreaField } from '../ui/TextAreaField'

// Numbers and dates stay as text while typing; they become number/null when sent
type FormValues = {
  name: string
  description: string
  percentage: string
  validUntil: string
  target: CustomerType | null
  serviceIds: number[]
}

type OfferFormProps = {
  initial?: Discount
  bookable: GarageService[]
  autoFocus?: boolean
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  error: Error | null
  onSubmit: (input: OfferInput) => void
  onCancel?: () => void
}

// The same form creates a new offer and edits an existing one, showing the server's messages per field
export function OfferForm({ initial, bookable, autoFocus, submitLabel, pendingLabel, isPending, error, onSubmit, onCancel }: OfferFormProps) {
  const groupName = useId() // each form on the page needs its own radio group name
  const bookableIds = new Set(bookable.map((service) => service.id))
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    percentage: initial ? String(initial.percentage) : '',
    validUntil: initial?.validUntil ?? '',
    target: initial?.targetCustomerType ?? null,
    // Hidden services can't stay on an offer (the backend refuses them), so they start unticked
    serviceIds: initial?.services.map((service) => service.id).filter((id) => bookableIds.has(id)) ?? [],
  })
  const hiddenCovered = initial?.services.filter((service) => !bookableIds.has(service.id)) ?? []
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {}
  const formError = error && Object.keys(fieldErrors).length === 0 ? error.message : null

  function change<K extends keyof FormValues>(name: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function toggleService(id: number) {
    const ids = values.serviceIds
    change('serviceIds', ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id])
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const percentage = values.percentage.trim()
        onSubmit({
          name: values.name,
          description: values.description,
          percentage: percentage === '' ? null : Number(percentage),
          validUntil: values.validUntil || null,
          targetCustomerType: values.target,
          serviceIds: values.serviceIds,
        })
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
        label="Description (used in the email to customers)"
        rows={2}
        value={values.description}
        onChange={(event) => change('description', event.target.value)}
        error={fieldErrors.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Percentage off (1 to 90)"
          type="number"
          inputMode="decimal"
          min="1"
          max="90"
          step="0.01"
          value={values.percentage}
          onChange={(event) => change('percentage', event.target.value)}
          error={fieldErrors.percentage}
        />
        <Field
          label="Valid until"
          type="date"
          min={isoDateFromToday(0)}
          value={values.validUntil}
          onChange={(event) => change('validUntil', event.target.value)}
          error={fieldErrors.validUntil}
        />
      </div>

      <fieldset>
        <legend className="text-sm text-muted">Who gets it</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(['REGULAR', 'REPEAT'] as const).map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center gap-2 rounded-control border px-3 py-2.5 text-sm transition ${
                values.target === type ? 'border-accent bg-raised' : 'border-line-strong hover:border-line'
              }`}
            >
              <input
                type="radio"
                name={groupName}
                checked={values.target === type}
                onChange={() => change('target', type)}
                className="size-4 shrink-0 accent-accent"
              />
              {audience[type]}
            </label>
          ))}
        </div>
        {fieldErrors.targetCustomerType && <p className="mt-1.5 text-sm text-danger">{fieldErrors.targetCustomerType}</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm text-muted">Services it covers</legend>
        {bookable.length === 0 ? (
          <p className="mt-1.5 text-sm text-muted">There are no bookable services. Add or show one on the Services tab first.</p>
        ) : (
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {bookable.map((service) => (
              <label
                key={service.id}
                className={`flex cursor-pointer items-center gap-2 rounded-control border px-3 py-2.5 text-sm transition ${
                  values.serviceIds.includes(service.id) ? 'border-accent bg-raised' : 'border-line-strong hover:border-line'
                }`}
              >
                <input
                  type="checkbox"
                  checked={values.serviceIds.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                  className="size-4 shrink-0 accent-accent"
                />
                <span className="min-w-0 flex-1">
                  <span className="block">{service.name}</span>
                  <span className="text-xs text-muted">{formatRupees(service.price)}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {fieldErrors.serviceIds && <p className="mt-1.5 text-sm text-danger">{fieldErrors.serviceIds}</p>}
        {hiddenCovered.length > 0 && (
          <p className="mt-1.5 text-sm text-muted">
            Saving removes hidden services from this offer: {hiddenCovered.map((service) => service.name).join(', ')}
          </p>
        )}
      </fieldset>

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