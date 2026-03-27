import {useQuery} from '@tanstack/react-query'

import {getDmServiceHeadersForServiceUrl} from '#/lib/constants'
import {useAgent} from '#/state/session'
import {STALE} from '..'

const RQKEY_ROOT = 'convo-availability'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

export function useGetConvoAvailabilityQuery(did: string) {
  const agent = useAgent()
  const dmServiceHeaders = getDmServiceHeadersForServiceUrl(
    agent.serviceUrl.toString(),
  )

  return useQuery({
    queryKey: RQKEY(did),
    queryFn: async () => {
      const {data} = await agent.chat.bsky.convo.getConvoAvailability(
        {members: [did]},
        {headers: dmServiceHeaders},
      )

      return data
    },
    staleTime: STALE.INFINITY,
  })
}
