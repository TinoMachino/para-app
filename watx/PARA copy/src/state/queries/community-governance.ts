import {useQuery} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'

export type CommunityGovernanceMember = {
  did: string
  handle?: string
  displayName?: string
  avatar?: string
  party?: string
  influence: number
  votesReceivedAllTime: number
  votesCastAllTime: number
  policyPosts: number
  matterPosts: number
}

export type CommunityGovernanceResponse = {
  community: string
  summary: {
    members: number
    visiblePosters: number
    policyPosts: number
    matterPosts: number
    badgeHolders: number
  }
  moderators: Array<{
    member: CommunityGovernanceMember
    role: string
    badge: string
  }>
  officials: Array<{
    member: CommunityGovernanceMember
    office: string
    mandate: string
  }>
  deputies: Array<{
    tier: string
    role: string
    activeHolder: CommunityGovernanceMember
    votesBackingRole: number
    applicants: string[]
  }>
  computedAt: string
}

export const communityGovernanceQueryKey = ({
  community,
  limit,
}: {
  community: string
  limit: number
}) => ['community-governance', community.trim().toLowerCase(), limit]

export function useCommunityGovernanceQuery({
  community,
  limit = 50,
  enabled,
}: {
  community: string
  limit?: number
  enabled?: boolean
}) {
  const agent = useAgent()
  return useQuery<CommunityGovernanceResponse, Error>({
    queryKey: communityGovernanceQueryKey({community, limit}),
    enabled: (enabled ?? true) && Boolean(community.trim()),
    staleTime: STALE.MINUTES.ONE,
    queryFn: async () => {
      const res = await agent.call('com.para.community.getGovernance', {
        community,
        limit,
      })
      return res.data as CommunityGovernanceResponse
    },
  })
}
