import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useLogin } from '../api/auth'
import { ApiError } from '../api/client'
import type { Role } from '../api/types'
import { useSession } from '../auth/session'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field } from '../components/ui/Field'

const roleOptions: { value: Role; label: string }[] = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'ADMIN', label: 'Garage staff' },
]

export function LoginPage() {
  const [role, setRole] = useState<Role>('CUSTOMER')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const session = useSession()
  const location = useLocation()

  // Once logged in, go back to the page that sent you here (or to your own area)
  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? (session.role === 'CUSTOMER' ? '/my' : '/')
    return <Navigate to={from} replace />
  }

  // A 400 comes with messages per field; anything else (e.g. a wrong password, 401) is one message for the form
  const fieldErrors = login.error instanceof ApiError ? login.error.fieldErrors : {}
  const formError = login.error && Object.keys(fieldErrors).length === 0 ? login.error.message : null

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6 py-6">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">Welcome back</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Log in</h1>
      </div>

      <Card>
        {/* noValidate: the backend's validation messages are shown, so the rules live in one place */}
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            login.mutate({ email, password, role })
          }}
        >
          <fieldset className="flex rounded-control border border-line-strong p-1">
            <legend className="sr-only">Log in as</legend>
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={`flex-1 cursor-pointer rounded-[10px] px-4 py-2 text-center text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  role === option.value ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <Field
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
          />

          {formError && <Alert>{formError}</Alert>}

          <Button type="submit" disabled={login.isPending} className="w-full">
            {login.isPending ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </Card>
    </section>
  )
}