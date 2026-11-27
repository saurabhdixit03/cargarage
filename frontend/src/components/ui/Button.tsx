import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

// Full class names written out, so Tailwind can find them when it scans the code
const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110',
  secondary: 'border border-line-strong text-ink hover:bg-raised',
  ghost: 'text-muted hover:bg-raised hover:text-ink',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

// type defaults to "button": a plain <button> inside a <form> would submit the form by accident
export function Button({ variant = 'primary', type = 'button', className = '', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-control px-6 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}