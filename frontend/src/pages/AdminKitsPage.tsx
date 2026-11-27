import { useState } from 'react'
import { useAdminKits, useCreateKit, useSetKitActive, useUpdateKit } from '../api/adminKits'
import type { FaceliftKit } from '../api/types'
import { KitForm } from '../components/admin/KitForm'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Thumb } from '../components/ui/Thumb'
import { formatRupees } from '../lib/format'

// Staff manage the facelift kits customers browse: add, edit, and hide or show them
export function AdminKitsPage() {
  const kits = useAdminKits()
  const hiddenCount = kits.data?.filter((kit) => !kit.active).length ?? 0

  return (
    <section className="flex flex-col gap-8">
      <div>
        <p className="text-sm tracking-widest text-muted uppercase">Garage staff</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Facelift kits</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Body kits and styling parts that customers browse by make and model. A hidden kit disappears from the kits
          page straight away.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">All kits</h2>
            {kits.data && (
              <p className="text-sm text-muted">
                {kits.data.length} in total · {hiddenCount} hidden
              </p>
            )}
          </div>
          {kits.error ? (
            <div className="mt-4"><Alert>Couldn't load kits: {kits.error.message}</Alert></div>
          ) : kits.isPending ? (
            <Skeleton className="mt-4 h-48" />
          ) : kits.data.length === 0 ? (
            <p className="mt-4 text-muted">No kits yet. Add the first one.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {kits.data.map((kit) => (
                <KitRow key={kit.id} kit={kit} />
              ))}
            </ul>
          )}
        </Card>

        <AddKitCard />
      </div>
    </section>
  )
}

// After a kit is added, a new key gives a fresh, empty form
function AddKitCard() {
  const create = useCreateKit()
  const [formKey, setFormKey] = useState(0)

  return (
    <Card className="lg:col-span-2">
      <h2 className="font-display text-xl font-semibold">Add a kit</h2>
      {create.isSuccess && <p className="mt-2 text-sm text-saving">{create.data.kitName} was added.</p>}
      <div className="mt-4">
        <KitForm
          key={formKey}
          submitLabel="Add kit"
          pendingLabel="Adding…"
          isPending={create.isPending}
          error={create.error}
          onSubmit={(input) => create.mutate(input, { onSuccess: () => setFormKey((key) => key + 1) })}
        />
      </div>
    </Card>
  )
}

// One kit, with its own mutations so each row shows its own "Saving…" and errors
function KitRow({ kit }: { kit: FaceliftKit }) {
  const [editing, setEditing] = useState(false)
  const update = useUpdateKit()
  const setActive = useSetKitActive()

  if (editing) {
    return (
      <li className="rounded-control border border-accent bg-raised p-4">
        <KitForm
          initial={kit}
          autoFocus
          submitLabel="Save changes"
          pendingLabel="Saving…"
          isPending={update.isPending}
          error={update.error}
          onSubmit={(input) => update.mutate({ ...input, id: kit.id }, { onSuccess: () => setEditing(false) })}
          onCancel={() => {
            update.reset()
            setEditing(false)
          }}
        />
      </li>
    )
  }

  return (
    <li className="rounded-control bg-raised p-3">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <Thumb url={kit.imageUrls[0] ?? ''} className="h-16 w-24 shrink-0" />
        <div className="min-w-0 flex-1 basis-48">
          <p className="text-xs tracking-widest text-muted uppercase">
            {kit.carMake} {kit.carModel}
          </p>
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {kit.kitName}
            {!kit.active && (
              <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs text-muted">Hidden</span>
            )}
          </p>
          <p className="text-sm text-muted">{kit.description}</p>
          <p className="mt-1 text-xs text-muted">
            {kit.imageUrls.length} {kit.imageUrls.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        <p className="font-display font-semibold">{formatRupees(kit.price)}</p>
      </div>
      <div className="mt-1 -ml-4 flex flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={setActive.isPending}
          onClick={() => setActive.mutate({ id: kit.id, active: !kit.active })}
        >
          {setActive.isPending ? 'Saving…' : kit.active ? 'Hide from customers' : 'Show to customers'}
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