import { useId, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useFaceliftKits } from '../api/catalog'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { formatRupees } from '../lib/format'

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

function sameText(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

// One entry per name, ignoring capitals ("Hyundai" and "HYUNDAI" are the same make), sorted
function uniqueNames(names: string[]): string[] {
  const unique: string[] = []
  for (const name of names) {
    if (!unique.some((existing) => sameText(existing, name))) unique.push(name)
  }
  return unique.sort((a, b) => a.localeCompare(b))
}

type FilterSelectProps = {
  label: string
  allLabel: string
  options: string[]
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

function FilterSelect({ label, allLabel, options, value, disabled, onChange }: FilterSelectProps) {
  const id = useId()
  // A value from a link may differ in capitals from the option, or not be an option at all: show it anyway
  const current = options.find((option) => sameText(option, value)) ?? value
  const choices = current && !options.includes(current) ? [current, ...options] : options

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-56">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <select
        id={id}
        value={current}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-control border border-line-strong bg-header px-3 text-ink focus:outline-2 focus:outline-offset-1 focus:outline-accent disabled:opacity-50"
      >
        <option value="">{allLabel}</option>
        {choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    </div>
  )
}

export function KitsPage() {
  // The filter lives in the address (/facelift-kits?make=Hyundai&model=Creta), so it can be shared or bookmarked
  const [searchParams, setSearchParams] = useSearchParams()
  const make = searchParams.get('make') ?? ''
  const model = searchParams.get('model') ?? ''

  const allKits = useFaceliftKits() // only for the filter's choices
  const kits = useFaceliftKits({ make, model }) // the same request as above when no filter is set

  const makes = uniqueNames((allKits.data ?? []).map((kit) => kit.carMake))
  const models = uniqueNames(
    (allKits.data ?? []).filter((kit) => sameText(kit.carMake, make)).map((kit) => kit.carModel),
  )
  // "hyundai" from a link is shown as the kits spell it, "Hyundai"
  const shownMake = makes.find((name) => sameText(name, make)) ?? make
  const shownModel = models.find((name) => sameText(name, model)) ?? model
  const filterLabel = [shownMake, shownModel].filter(Boolean).join(' ')

  function choose(nextMake: string, nextModel: string) {
    const next = new URLSearchParams()
    if (nextMake) next.set('make', nextMake)
    if (nextModel) next.set('model', nextModel)
    setSearchParams(next)
  }

  return (
    <section>
      <p className="text-sm tracking-widest text-muted uppercase">Styling upgrades</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Facelift kits</h1>
      <p className="mt-2 text-muted">Body kits and styling parts, matched to your car's make and model.</p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <FilterSelect
          label="Make"
          allLabel="All makes"
          options={makes}
          value={make}
          onChange={(value) => choose(value, '')}
        />
        <FilterSelect
          label="Model"
          allLabel="All models"
          options={models}
          value={model}
          disabled={!make}
          onChange={(value) => choose(make, value)}
        />
        {filterLabel && (
          <Button variant="ghost" onClick={() => choose('', '')}>
            Show all kits
          </Button>
        )}
      </div>

      <div className="mt-8">
        {kits.error ? (
          <Alert>Couldn't load kits: {kits.error.message}</Alert>
        ) : kits.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        ) : kits.data.length === 0 ? (
          <p className="text-muted">
            {filterLabel ? `No facelift kits for ${filterLabel} yet.` : 'No facelift kits are available right now.'}
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted" aria-live="polite">
              {kits.data.length} {kits.data.length === 1 ? 'kit' : 'kits'}
              {filterLabel && ` for ${filterLabel}`}
            </p>
            {/* Dimmed while the next filter's results load */}
            <ul
              className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${kits.isPlaceholderData ? 'opacity-60' : ''}`}
              aria-busy={kits.isPlaceholderData}
            >
              {kits.data.map((kit) => (
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
          </>
        )}
      </div>
    </section>
  )
}