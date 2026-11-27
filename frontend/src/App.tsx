import { useEffect, useState } from 'react'

// Same fields as GarageServiceResponse in the backend
type GarageService = {
  id: number
  name: string
  description: string
  price: number
  active: boolean
}

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function App() {
  const [services, setServices] = useState<GarageService[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // "/api/services" goes to the Vite dev server, which forwards it to Spring Boot (see vite.config.ts)
    fetch('/api/services')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json() as Promise<GarageService[]>
      })
      .then(setServices)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm tracking-widest text-muted uppercase">Car care and detailing</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Our services</h1>

        {error && (
          <p className="mt-6 rounded-control bg-danger-soft p-4 text-danger">Couldn't load services: {error}</p>
        )}

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <li key={service.id} className="rounded-card border border-line bg-surface p-6">
              <h2 className="font-display text-xl font-semibold">{service.name}</h2>
              <p className="mt-1 text-sm text-muted">{service.description}</p>
              <p className="mt-5 font-display text-2xl font-bold text-accent">{rupees.format(service.price)}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default App