import { useState } from 'react'
import { ApiError } from '../api/client'
import { useChangePassword, useMyProfile, useUpdateProfile } from '../api/customer'
import type { CustomerProfile } from '../api/types'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDate } from '../lib/format'

// The customer's own account: their details, and their password
export function AccountPage() {
  const profile = useMyProfile()

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">Your garage</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Account</h1>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-semibold">Your details</h2>
          {profile.error ? (
            <div className="mt-4"><Alert>Couldn't load your details: {profile.error.message}</Alert></div>
          ) : profile.isPending ? (
            <Skeleton className="mt-4 h-64" />
          ) : (
            <DetailsForm profile={profile.data} />
          )}
        </Card>

        <Card>
          <h2 className="font-display text-xl font-semibold">Change password</h2>
          <PasswordSection email={profile.data?.email ?? ''} />
        </Card>
      </div>
    </section>
  )
}

function DetailsForm({ profile }: { profile: CustomerProfile }) {
  const update = useUpdateProfile()
  const [values, setValues] = useState({ name: profile.name, mobile: profile.mobile })
  const fieldErrors = update.error instanceof ApiError ? update.error.fieldErrors : {}
  const formError = update.error && Object.keys(fieldErrors).length === 0 ? update.error.message : null
  // Nothing to save until something differs from what the server has
  const changed = values.name !== profile.name || values.mobile !== profile.mobile

  return (
    <>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted">Email</dt>
        <dd className="min-w-0 break-words">{profile.email}</dd>
        <dt className="text-muted">Customer type</dt>
        <dd>{profile.customerType === 'REPEAT' ? 'Repeat customer' : 'Regular customer'}</dd>
        <dt className="text-muted">Member since</dt>
        <dd>{formatDate(profile.memberSince)}</dd>
      </dl>
      <p className="mt-2 text-sm text-muted">Your email is how you log in, so it stays as it is.</p>

      <form
        noValidate
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          update.mutate(values)
        }}
      >
        <Field
          label="Full name"
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          error={fieldErrors.name}
        />
        <Field
          label="Mobile number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={values.mobile}
          onChange={(event) => setValues({ ...values, mobile: event.target.value })}
          error={fieldErrors.mobile}
        />
        {formError && <Alert>{formError}</Alert>}
        {update.isSuccess && !changed && <p className="text-sm text-saving">Your details were saved.</p>}
        <div>
          <Button type="submit" disabled={update.isPending || !changed}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </>
  )
}

// After a successful change, a new key gives a fresh, empty form, so no password stays in the page
function PasswordSection({ email }: { email: string }) {
  const change = useChangePassword()
  const [formKey, setFormKey] = useState(0)

  return (
    <>
      {change.isSuccess && (
        <p className="mt-2 text-sm text-saving">Your password was changed. Use the new one next time you log in.</p>
      )}
      <PasswordForm
        key={formKey}
        email={email}
        isPending={change.isPending}
        error={change.error}
        onSubmit={(input) => change.mutate(input, { onSuccess: () => setFormKey((key) => key + 1) })}
      />
    </>
  )
}

type PasswordFormProps = {
  email: string
  isPending: boolean
  error: Error | null
  onSubmit: (input: { currentPassword: string; newPassword: string }) => void
}

function PasswordForm({ email, isPending, error, onSubmit }: PasswordFormProps) {
  const [values, setValues] = useState({ currentPassword: '', newPassword: '' })
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {}
  const formError = error && Object.keys(fieldErrors).length === 0 ? error.message : null

  return (
    <form
      noValidate
      className="mt-4 flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(values)
      }}
    >
      {/* Tells password managers which account this password belongs to, so they update the right one */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <Field
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={(event) => setValues({ ...values, currentPassword: event.target.value })}
        error={fieldErrors.currentPassword}
      />
      <Field
        label="New password (at least 8 characters)"
        type="password"
        autoComplete="new-password"
        value={values.newPassword}
        onChange={(event) => setValues({ ...values, newPassword: event.target.value })}
        error={fieldErrors.newPassword}
      />
      {formError && <Alert>{formError}</Alert>}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Changing…' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}