import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useSignup, type SignupInput } from '../api/auth'
import { ApiError } from '../api/client'
import { useSession } from '../auth/session'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'

const emptyForm: SignupInput = { name: '', email: '', mobile: '', password: '' }

export function SignupPage() {
  const [values, setValues] = useState(emptyForm)
  const signup = useSignup()
  const session = useSession()
  const location = useLocation()

  // Signing up logs you in, so this also runs right after the account is created:
  // back to the page that sent you to log in, or to My garage
  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? (session.role === 'CUSTOMER' ? '/my' : '/admin')
    return <Navigate to={from} replace />
  }

  // A 400 comes with messages per field; anything else (e.g. an email that's taken, 409) is one message
  const fieldErrors = signup.error instanceof ApiError ? signup.error.fieldErrors : {}
  const formError = signup.error && Object.keys(fieldErrors).length === 0 ? signup.error.message : null

  function change(name: keyof SignupInput, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6 py-6">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">Join CarGarage</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-muted">Book services, follow every visit and get offers picked for you.</p>
      </div>

      <Card>
        {/* noValidate: the backend's validation messages are shown, so the rules live in one place */}
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            signup.mutate(values)
          }}
        >
          <Field
            label="Full name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => change('name', event.target.value)}
            error={fieldErrors.name}
          />
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => change('email', event.target.value)}
            error={fieldErrors.email}
          />
          <Field
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="e.g. 9876543210"
            value={values.mobile}
            onChange={(event) => change('mobile', event.target.value)}
            error={fieldErrors.mobile}
          />
          <Field
            label="Password (at least 8 characters)"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => change('password', event.target.value)}
            error={fieldErrors.password}
          />

          {formError && <Alert>{formError}</Alert>}

          <Button type="submit" disabled={signup.isPending} className="w-full">
            {signup.isPending ? 'Creating your account…' : 'Create account'}
          </Button>
        </form>
      </Card>

      {/* Passing location.state along keeps "where to go after logging in" when switching pages */}
      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </section>
  )
}