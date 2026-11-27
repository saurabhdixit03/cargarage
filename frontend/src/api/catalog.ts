import { useQuery } from '@tanstack/react-query'
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

export function useFaceliftKits() {
  return useQuery({
    queryKey: ['facelift-kits'],
    queryFn: () => apiFetch<FaceliftKit[]>('/facelift-kits'),
  })
}