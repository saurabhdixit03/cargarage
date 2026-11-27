import { useServices } from '../api/catalog'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { formatRupees } from '../lib/format'

export function ServicesPage() {
  const { data: services, isPending, error } = useServices()

  return (
    <section>
      <p className="text-sm tracking-widest text-muted uppercase">Car care and detailing</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Our services</h1>

      <div className="mt-8">
        {error ? (
          <Alert>Couldn't load services: {error.message}</Alert>
        ) : isPending ? (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-muted">No services are available right now.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.id}>
                <Card>
                  <h2 className="font-display text-xl font-semibold">{service.name}</h2>
                  <p className="mt-1 text-sm text-muted">{service.description}</p>
                  <p className="mt-5 font-display text-2xl font-bold text-accent">{formatRupees(service.price)}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}