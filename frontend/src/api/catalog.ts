import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { FaceliftKit, GarageService } from './types'

// Public catalogue data. Each hook gives a page { data, isPending, error } and caches the result
// under its queryKey, so moving between pages doesn't download the same list again every time.

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => apiFetch<GarageService[]>('/services'),
  })
}

export type KitFilter = { make?: string; model?: string }

// Active kits, optionally only those for one make and/or model. The server does the filtering
// (ignoring capitals). Each filter gets its own cache entry under 'facelift-kits', so when staff
// change a kit, refreshing ['facelift-kits'] refreshes every filtered list too.
export function useFaceliftKits(filter: KitFilter = {}) {
  const params = new URLSearchParams()
  if (filter.make) params.set('make', filter.make)
  if (filter.model) params.set('model', filter.model)
  const query = params.toString()

  return useQuery({
    queryKey: ['facelift-kits', query],
    queryFn: () => apiFetch<FaceliftKit[]>(query ? `/facelift-kits?${query}` : '/facelift-kits'),
    // While a new filter loads, keep showing the last results instead of a loading skeleton
    placeholderData: keepPreviousData,
  })
}