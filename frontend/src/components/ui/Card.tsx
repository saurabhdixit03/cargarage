import type { HTMLAttributes } from 'react'

// The dark panel that most content sits on
export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-card border border-line bg-surface p-6 ${className}`} {...props} />
}