// A grey placeholder block that gently pulses while data loads. Give it a size with className.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-control bg-raised ${className}`} />
}