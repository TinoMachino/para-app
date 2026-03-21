import {useQuery} from '@tanstack/react-query'

import {
  fetchCabildeo,
  fetchCabildeoPositions,
  fetchCabildeos,
} from '#/lib/api/cabildeo'
import {
  type CabildeoView,
  mapCabildeoPositionsFromRead,
  mapCabildeoReadViewToView,
  mapCabildeosToView,
} from '#/lib/cabildeo-client'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

const RQKEY_ROOT = 'cabildeo'

export const cabildeosQueryKey = [RQKEY_ROOT, 'list']
export const cabildeoDetailQueryKey = (cabildeoUri: string) => [
  RQKEY_ROOT,
  'detail',
  cabildeoUri,
]

export function useCabildeosQuery() {
  const agent = useAgent()
  return useQuery<CabildeoView[]>({
    staleTime: STALE.MINUTES.ONE,
    queryKey: cabildeosQueryKey,
    placeholderData: previous => previous,
    queryFn: async () => {
      const records = await fetchCabildeos(agent)
      return mapCabildeosToView(records)
    },
  })
}

export function useCabildeoQuery(cabildeoUri: string | undefined) {
  const agent = useAgent()
  return useQuery<CabildeoView | null>({
    staleTime: STALE.SECONDS.THIRTY,
    queryKey: cabildeoDetailQueryKey(cabildeoUri || ''),
    enabled: Boolean(cabildeoUri),
    placeholderData: previous => previous,
    queryFn: async () => {
      if (!cabildeoUri) return null
      const cabildeo = await fetchCabildeo(agent, cabildeoUri)
      return cabildeo ? mapCabildeoReadViewToView(cabildeo) : null
    },
  })
}

export function useCabildeoPositionsQuery(cabildeoUri: string | undefined) {
  const agent = useAgent()
  return useQuery({
    staleTime: STALE.SECONDS.THIRTY,
    queryKey: [RQKEY_ROOT, 'positions', cabildeoUri || ''],
    enabled: Boolean(cabildeoUri),
    placeholderData: previous => previous,
    queryFn: async () => {
      if (!cabildeoUri) return []
      const positions = await fetchCabildeoPositions(agent, {cabildeoUri})
      return mapCabildeoPositionsFromRead(positions)
    },
  })
}
