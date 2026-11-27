import { useState } from 'react'
import { useAdminServices } from '../api/adminCatalog'
import { useAdminOffers, useCreateOffer, useSetOfferActive, useUpdateOffer } from '../api/adminOffers'
import type { Discount, GarageService } from '../api/types'
import { OfferForm } from '../components/admin/OfferForm'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { isoDateFromToday } from '../lib/booking'
import { formatDate } from '../lib/format'
import { audience, offerState } from '../lib/offers'

// Staff manage offers: who gets them, how much off, which services, and until when
export function AdminOffersPage() {
  const offers = useAdminOffers()
  const services = useAdminServices()
  const today = isoDateFromToday(0)
  const liveCount = offers.data?.filter((offer) => offer.active && offer.validUntil >= today).length ?? 0
  // Offers can only cover services customers can book, as the backend checks
  const bookable = services.data?.filter((service) => service.active) ?? []

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">Garage staff</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Offers</h1>
        <p className="mt-2 max-w-2xl text-muted">
          An offer takes its percentage off the services it covers, for one type of customer. When a customer books,
          the offer that saves them the most is applied automatically. Creating an offer emails every customer it's for.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">All offers</h2>
            {offers.data && (
              <p className="text-sm text-muted">
                {offers.data.length} in total · {liveCount} live
              </p>
            )}
          </div>
          {offers.error ? (
            <div className="mt-4"><Alert>Couldn't load offers: {offers.error.message}</Alert></div>
          ) : offers.isPending ? (
            <Skeleton className="mt-4 h-48" />
          ) : offers.data.length === 0 ? (
            <p className="mt-4 text-muted">No offers yet. Create the first one.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {offers.data.map((offer) => (
                <OfferRow key={offer.id} offer={offer} today={today} bookable={bookable} />
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-display text-xl font-semibold">Create an offer</h2>
          {services.error ? (
            <div className="mt-4"><Alert>Couldn't load services: {services.error.message}</Alert></div>
          ) : services.isPending ? (
            <Skeleton className="mt-4 h-96" />
          ) : (
            <CreateOffer bookable={bookable} />
          )}
        </Card>
      </div>
    </section>
  )
}

// After an offer is created, a new key gives a fresh, empty form
function CreateOffer({ bookable }: { bookable: GarageService[] }) {
  const create = useCreateOffer()
  const [formKey, setFormKey] = useState(0)

  return (
    <>
      {create.isSuccess && (
        <p className="mt-2 text-sm text-saving">
          {create.data.name} was created. {audience[create.data.targetCustomerType]} are being emailed about it.
        </p>
      )}
      <div className="mt-4">
        <OfferForm
          key={formKey}
          bookable={bookable}
          submitLabel="Create offer"
          pendingLabel="Creating…"
          isPending={create.isPending}
          error={create.error}
          onSubmit={(input) => create.mutate(input, { onSuccess: () => setFormKey((key) => key + 1) })}
        />
      </div>
    </>
  )
}

type OfferRowProps = { offer: Discount; today: string; bookable: GarageService[] }

function OfferRow({ offer, today, bookable }: OfferRowProps) {
  const [editing, setEditing] = useState(false)
  const update = useUpdateOffer()
  const setActive = useSetOfferActive()
  const state = offerState(offer, today)

  if (editing) {
    return (
      <li className="rounded-control border border-accent bg-raised p-4">
        <OfferForm
          initial={offer}
          bookable={bookable}
          autoFocus
          submitLabel="Save changes"
          pendingLabel="Saving…"
          isPending={update.isPending}
          error={update.error}
          onSubmit={(input) => update.mutate({ ...input, id: offer.id }, { onSuccess: () => setEditing(false) })}
          onCancel={() => {
            update.reset()
            setEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="rounded-control bg-raised px-4 py-3">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
        <div className="min-w-0 flex-1 basis-56">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {offer.name}
            <span className={`rounded-full px-2 py-0.5 text-xs ${state.classes}`}>{state.label}</span>
          </p>
          <p className="text-sm text-muted">{offer.description}</p>
        </div>
        <p className="font-display text-xl font-bold text-accent">{offer.percentage}% off</p>
      </div>
      <p className="mt-2 text-sm">
        {audience[offer.targetCustomerType]} · until {formatDate(offer.validUntil)}
      </p>
      <p className="text-sm text-muted">Covers {offer.services.map((service) => service.name).join(', ')}</p>
      <div className="mt-1 -ml-4 flex flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={setActive.isPending}
          onClick={() => setActive.mutate({ id: offer.id, active: !offer.active })}
        >
          {setActive.isPending ? 'Saving…' : offer.active ? 'Switch off' : 'Switch on'}
        </Button>
      </div>
      {setActive.error && (
        <div className="mt-2">
          <Alert>{setActive.error.message}</Alert>
        </div>
      )}
    </li>
  )
}