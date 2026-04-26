// @ts-nocheck
import { AppContext } from '../../../../context'
import { parseString } from '../../../../hydration/util'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/com/para/civic/listDelegationCandidates'
import { resHeaders } from '../../../util'

export default function (server: Server, ctx: AppContext) {
  server.com.para.civic.listDelegationCandidates({
    auth: ctx.authVerifier.optionalStandardOrRole,
    handler: async ({ params, auth, req }) => {
      const { viewer } = ctx.authVerifier.parseCreds(auth)
      const labelers = ctx.reqLabelers(req)
      const result = await listDelegationCandidates({ ctx, params })
      const repoRev = await ctx.hydrator.actor.getRepoRevSafe(viewer)

      return {
        encoding: 'application/json' as const,
        body: result,
        headers: resHeaders({ repoRev, labelers }),
      }
    },
  })
}

const listDelegationCandidates = async ({
  ctx,
  params,
}: {
  ctx: AppContext
  params: QueryParams
}) => {
  const res = await ctx.dataplane.getParaDelegationCandidates({
    cabildeoUri: params.cabildeo,
    communityId: params.communityId ?? '',
    limit: normalizeLimit(params.limit),
    cursor: params.cursor ?? '',
  })

  return {
    candidates: res.candidates.map((candidate) => ({
      did: candidate.did,
      handle: parseString(candidate.handle),
      displayName: parseString(candidate.displayName),
      avatar: parseString(candidate.avatar),
      description: parseString(candidate.description),
      roles: candidate.roles.length ? candidate.roles : undefined,
      activeDelegationCount: candidate.activeDelegationCount,
      hasVoted: candidate.hasVoted,
      votedAt: parseString(candidate.votedAt),
      selectedOption: candidate.selectedOption,
    })),
    cursor: parseString(res.cursor),
  }
}

const normalizeLimit = (limit: number | undefined) => {
  if (!limit || Number.isNaN(limit)) return 50
  return Math.max(1, Math.min(limit, 100))
}
