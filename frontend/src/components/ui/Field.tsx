import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

// A labelled text input with an optional error message under it.
// The label is linked to the input (htmlFor/id), and the error is announced by screen readers (aria-describedby).
export function Field({ label, error, id, className = '', ...props }: FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-11 rounded-control border bg-header px-3 text-ink placeholder:text-muted/60 focus:outline-2 focus:outline-offset-1 focus:outline-accent ${error ? 'border-danger' : 'border-line-strong'}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}