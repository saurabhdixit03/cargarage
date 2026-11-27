import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { formatRupees } from '../lib/format'

// Same fields as FaceliftKitResponse in the backend
type FaceliftKit = {
  id: number
  kitName: string
  carMake: string
  carModel: string
  description: string
  price: number
  active: boolean
  imageUrls: string[]
}

// The kit's first photo, or a plain panel if it has none or the photo fails to load
function KitPhoto({ url, alt }: { url?: string; alt: string }) {
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-control bg-raised text-muted">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M5 17h14M6 17l1.5-5.5A2 2 0 0 1 9.4 10h5.2a2 2 0 0 1 1.9 1.5L18 17" />
          <circle cx="8" cy="17" r="2" />
          <circle cx="16" cy="17" r="2" />
        </svg>
      </div>
    )
  }
  return <img src={url} alt={alt} onError={() => setFailed(true)} className="aspect-video w-full rounded-control object-cover" />
}

export function KitsPage() {
  const [kits, setKits] = useState<FaceliftKit[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/facelift-kits')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        return response.json() as Promise<FaceliftKit[]>
      })
      .then(setKits)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <section>
      <p className="text-sm tracking-widest text-muted uppercase">Styling upgrades</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Facelift kits</h1>
      <p className="mt-2 text-muted">Body kits and styling parts, matched to your car's make and model.</p>

      {error && <p className="mt-6 rounded-control bg-danger-soft p-4 text-danger">Couldn't load kits: {error}</p>}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kits.map((kit) => (
          <li key={kit.id}>
            <Card className="flex h-full flex-col gap-4 p-4">
              <KitPhoto url={kit.imageUrls[0]} alt={kit.kitName} />
              <div>
                <p className="text-xs tracking-widest text-muted uppercase">
                  {kit.carMake} {kit.carModel}
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold">{kit.kitName}</h2>
                <p className="mt-1 text-sm text-muted">{kit.description}</p>
              </div>
              <p className="mt-auto font-display text-xl font-bold text-accent">{formatRupees(kit.price)}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}