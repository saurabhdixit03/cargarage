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
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900">CarGarage</h1>
        <p className="mt-2 text-slate-600">Our services</p>

        {error && (
          <p className="mt-6 rounded-md bg-red-50 p-4 text-red-700">Couldn't load services: {error}</p>
        )}

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <li key={service.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{service.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{service.description}</p>
              <p className="mt-4 text-xl font-bold text-indigo-600">{rupees.format(service.price)}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default App