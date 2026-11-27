import { ButtonLink } from '../components/ui/Button'

// Shown for any URL that matches no page
export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-4 py-16">
      <p className="text-sm tracking-widest text-muted uppercase">Error 404</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted">The page you're looking for doesn't exist or has moved.</p>
      <ButtonLink to="/">Back to services</ButtonLink>
    </section>
  )
}