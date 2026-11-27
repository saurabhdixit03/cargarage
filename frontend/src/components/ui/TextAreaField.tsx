import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

// Like Field, but for longer text that can run over several lines (descriptions)
export function TextAreaField({ label, error, id, className = '', ...props }: TextAreaFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm text-muted">
        {label}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-24 rounded-control border bg-header px-3 py-2.5 text-ink placeholder:text-muted/60 focus:outline-2 focus:outline-offset-1 focus:outline-accent ${error ? 'border-danger' : 'border-line-strong'}`}
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