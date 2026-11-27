import { useId, useState } from 'react'
import type { KitInput } from '../../api/adminKits'
import { ApiError } from '../../api/client'
import type { FaceliftKit } from '../../api/types'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { TextAreaField } from '../ui/TextAreaField'
import { Thumb } from '../ui/Thumb'

const MAX_PHOTOS = 6 // the same limit as FaceliftKitRequest

// The price stays as text while typing; it becomes a number (or null if empty) when sent
type FormValues = {
  kitName: string
  carMake: string
  carModel: string
  description: string
  price: string
  imageUrls: string[]
}

type KitFormProps = {
  initial?: FaceliftKit
  autoFocus?: boolean
  submitLabel: string
  pendingLabel: string
  isPending: boolean
  error: Error | null
  onSubmit: (input: KitInput) => void
  onCancel?: () => void
}

// The same form adds a new kit and edits an existing one, showing the server's messages per field.
// Photo link errors come back per position (e.g. "imageUrls[1]"), so each appears under its own link.
export function KitForm({ initial, autoFocus, submitLabel, pendingLabel, isPending, error, onSubmit, onCancel }: KitFormProps) {
  const idPrefix = useId()
  const [values, setValues] = useState<FormValues>({
    kitName: initial?.kitName ?? '',
    carMake: initial?.carMake ?? '',
    carModel: initial?.carModel ?? '',
    description: initial?.description ?? '',
    price: initial ? String(initial.price) : '',
    imageUrls: initial?.imageUrls.length ? initial.imageUrls : [''],
  })
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {}
  const formError = error && Object.keys(fieldErrors).length === 0 ? error.message : null

  function change<K extends keyof FormValues>(name: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function changeUrl(index: number, url: string) {
    change('imageUrls', values.imageUrls.map((current, i) => (i === index ? url : current)))
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const price = values.price.trim()
        onSubmit({
          kitName: values.kitName,
          carMake: values.carMake,
          carModel: values.carModel,
          description: values.description,
          price: price === '' ? null : Number(price),
          imageUrls: values.imageUrls,
        })
      }}
    >
      <Field
        label="Kit name"
        autoFocus={autoFocus}
        value={values.kitName}
        onChange={(event) => change('kitName', event.target.value)}
        error={fieldErrors.kitName}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Car make"
          placeholder="e.g. Hyundai"
          value={values.carMake}
          onChange={(event) => change('carMake', event.target.value)}
          error={fieldErrors.carMake}
        />
        <Field
          label="Car model"
          placeholder="e.g. Creta"
          value={values.carModel}
          onChange={(event) => change('carModel', event.target.value)}
          error={fieldErrors.carModel}
        />
      </div>
      <p className="-mt-2 text-sm text-muted">
        Kits are matched to customers' cars by make and model (capitals don't matter), so spell them the way customers do.
      </p>
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

      {/* min-w-0: a fieldset won't shrink below its content by default, which widened the page on phones */}
      <fieldset className="min-w-0">
        <legend className="text-sm text-muted">Photo links, 1 to {MAX_PHOTOS} (the first one is shown on the kit's card)</legend>
        <ol className="mt-1.5 flex flex-col gap-2">
          {values.imageUrls.map((url, index) => {
            const urlError = fieldErrors[`imageUrls[${index}]`]
            const errorId = `${idPrefix}-photo-${index}-error`
            return (
              <li key={index} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Thumb url={url.trim()} className="size-11 shrink-0" />
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    aria-label={`Photo link ${index + 1}`}
                    aria-invalid={urlError ? true : undefined}
                    aria-describedby={urlError ? errorId : undefined}
                    value={url}
                    onChange={(event) => changeUrl(index, event.target.value)}
                    className={`h-11 min-w-0 flex-1 rounded-control border bg-header px-3 text-ink placeholder:text-muted/60 focus:outline-2 focus:outline-offset-1 focus:outline-accent ${urlError ? 'border-danger' : 'border-line-strong'}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove photo link ${index + 1}`}
                    disabled={values.imageUrls.length === 1}
                    onClick={() => change('imageUrls', values.imageUrls.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </div>
                {urlError && (
                  <p id={errorId} className="text-sm text-danger">
                    {urlError}
                  </p>
                )}
              </li>
            )
          })}
        </ol>
        {fieldErrors.imageUrls && <p className="mt-1.5 text-sm text-danger">{fieldErrors.imageUrls}</p>}
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          disabled={values.imageUrls.length >= MAX_PHOTOS}
          onClick={() => change('imageUrls', [...values.imageUrls, ''])}
        >
          Add another photo link
        </Button>
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