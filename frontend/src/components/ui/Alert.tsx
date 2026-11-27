import type { ReactNode } from 'react'

// An error message panel. role="alert" makes screen readers announce it as soon as it appears.
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-control bg-danger-soft p-4 text-danger">
      {children}
    </p>
  )
}