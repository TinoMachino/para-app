import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

import {
  type CommunityGovernanceApplicant,
  type CommunityGovernanceOfficialRepresentative,
  PARA_COMMUNITY_GOVERNANCE_COLLECTION,
} from '#/lib/api/para-lexicons'
import {
  appendGovernanceHistoryEntry,
  buildMockCommunityGovernance,
  canManageGovernance,
  communityGovernanceRkey,
  type CommunityGovernanceView,
  createCommunityGovernanceRecord,
  normalizeCommunityGovernance,
} from '#/lib/community-governance'
import {STALE} from '#/state/queries'
import {useAgent, useSession} from '#/state/session'

const RQKEY_ROOT = 'community-governance'

export const communityGovernanceQueryKey = (
  communityName: string,
  communityId?: string,
) => [RQKEY_ROOT, communityGovernanceRkey(communityName), communityId || '']

export function useCommunityGovernanceQuery({
  communityName,
  communityId,
}: {
  communityName: string
  communityId?: string
}) {
  const agent = useAgent()
  const {currentAccount} = useSession()

  return useQuery<CommunityGovernanceView>({
    staleTime: STALE.SECONDS.THIRTY,
    queryKey: communityGovernanceQueryKey(communityName, communityId),
    queryFn: async () => {
      const fetched =
        (await fetchGovernanceFromXrpc({
          agent,
          communityName,
          communityId,
        })) ||
        (await fetchGovernanceFromRepo({
          agent,
          repo: currentAccount?.did,
          communityName,
          communityId,
        }))

      return fetched || buildMockCommunityGovernance(communityName, communityId)
    },
  })
}

export function useCommunityGovernanceMutation({
  communityName,
  communityId,
}: {
  communityName: string
  communityId?: string
}) {
  const agent = useAgent()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()
  const queryKey = communityGovernanceQueryKey(communityName, communityId)

  return useMutation<
    CommunityGovernanceView,
    Error,
    (current: CommunityGovernanceView) => CommunityGovernanceView
  >({
    mutationFn: async updater => {
      if (!currentAccount?.did) {
        throw new Error('You need to be signed in to edit governance.')
      }

      const current =
        queryClient.getQueryData<CommunityGovernanceView>(queryKey) ||
        buildMockCommunityGovernance(communityName, communityId)

      if (!canManageGovernance(current, currentAccount.did)) {
        throw new Error(
          'This account is not authorized to publish governance updates.',
        )
      }

      const next = updater({
        ...current,
        updatedAt: new Date().toISOString(),
        source: current.source === 'mock' ? 'repo' : current.source,
        repoDid: currentAccount.did,
      })

      await agent.com.atproto.repo.putRecord({
        repo: currentAccount.did,
        collection: PARA_COMMUNITY_GOVERNANCE_COLLECTION,
        rkey: communityGovernanceRkey(communityName),
        record: createCommunityGovernanceRecord(next),
      })

      return {
        ...next,
        repoDid: currentAccount.did,
        source: 'repo',
      }
    },
    onSuccess: next => {
      queryClient.setQueryData(queryKey, next)
    },
  })
}

export function publishDeputySelection(
  governance: CommunityGovernanceView,
  roleKey: string,
  applicant: CommunityGovernanceApplicant,
  actorDid: string,
  actorHandle?: string,
) {
  return {
    ...governance,
    deputies: governance.deputies.map(role => {
      if (role.key !== roleKey) return role
      return {
        ...role,
        activeHolder: {
          did: applicant.did,
          handle: applicant.handle,
          displayName: applicant.displayName,
          avatar: applicant.avatar,
        },
        activeSince: new Date().toISOString(),
        applicants: role.applicants.map(existing =>
          applicantIdentity(existing) === applicantIdentity(applicant)
            ? {...existing, status: 'approved'}
            : existing,
        ),
      }
    }),
    editHistory: appendGovernanceHistoryEntry(governance.editHistory, {
      action: 'appoint_deputies',
      actorDid,
      actorHandle,
      summary: `Appointed ${applicant.displayName || applicant.handle || 'applicant'} to ${roleKey}.`,
    }),
  }
}

export function publishOfficialRepresentative(
  governance: CommunityGovernanceView,
  representative: CommunityGovernanceOfficialRepresentative,
  actorDid: string,
  actorHandle?: string,
) {
  return {
    ...governance,
    officials: [...governance.officials, representative],
    editHistory: appendGovernanceHistoryEntry(governance.editHistory, {
      action: 'set_official_representatives',
      actorDid,
      actorHandle,
      summary: `Added ${representative.displayName || representative.handle || representative.office} as an official representative.`,
    }),
  }
}

async function fetchGovernanceFromXrpc({
  agent,
  communityName,
  communityId,
}: {
  agent: ReturnType<typeof useAgent>
  communityName: string
  communityId?: string
}) {
  const params = new URLSearchParams()
  params.set('community', communityName)
  if (communityId) {
    params.set('communityId', communityId)
  }

  try {
    const res = await agent.fetchHandler(
      `/xrpc/com.para.community.getGovernance?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
        },
      },
    )

    if (!res.ok) {
      return null
    }

    const json = await res.json()
    return normalizeCommunityGovernance(
      json,
      communityName,
      communityId,
      'network',
    )
  } catch {
    return null
  }
}

async function fetchGovernanceFromRepo({
  agent,
  repo,
  communityName,
  communityId,
}: {
  agent: ReturnType<typeof useAgent>
  repo?: string
  communityName: string
  communityId?: string
}) {
  if (!repo) return null

  try {
    const res = await agent.com.atproto.repo.getRecord({
      repo,
      collection: PARA_COMMUNITY_GOVERNANCE_COLLECTION,
      rkey: communityGovernanceRkey(communityName),
    })

    return normalizeCommunityGovernance(
      {
        ...(res.data.value as object),
        uri: res.data.uri,
        repoDid: repo,
      },
      communityName,
      communityId,
      'repo',
    )
  } catch {
    return null
  }
}

function applicantIdentity(applicant: CommunityGovernanceApplicant) {
  return applicant.did || applicant.handle || applicant.displayName || ''
}
