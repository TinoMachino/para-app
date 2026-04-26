// @ts-nocheck
import { AppContext } from '../../../../context'
import { parseString } from '../../../../hydration/util'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/com/para/community/listMembers'
import { resHeaders } from '../../../util'

export default function (server: Server, ctx: AppContext) {
  server.com.para.community.listMembers({
    auth: ctx.authVerifier.optionalStandardOrRole,
    handler: async ({ params, auth, req }) => {
      const { viewer } = ctx.authVerifier.parseCreds(auth)
      const labelers = ctx.reqLabelers(req)
      const result = await listMembers({ ctx, params })
      const repoRev = await ctx.hydrator.actor.getRepoRevSafe(viewer)

      return {
        encoding: 'application/json' as const,
        body: result,
        headers: resHeaders({ repoRev, labelers }),
      }
    },
  })
}

const listMembers = async ({
  ctx,
  params,
}: {
  ctx: AppContext
  params: QueryParams
}) => {
  const res = await ctx.dataplane.getParaCommunityMembers({
    communityId: params.communityId,
    membershipState: params.membershipState ?? '',
    role: params.role ?? '',
    sort: params.sort ?? '',
    limit: normalizeLimit(params.limit),
    cursor: params.cursor ?? '',
  })

  return {
    members: res.members.map((member) => ({
      did: member.did,
      handle: parseString(member.handle),
      displayName: parseString(member.displayName),
      avatar: parseString(member.avatar),
      membershipState: member.membershipState,
      roles: member.roles.length ? member.roles : undefined,
      joinedAt: member.joinedAt,
      votesCast: member.votesCast,
      delegationsReceived: member.delegationsReceived,
      policyPosts: member.policyPosts,
      matterPosts: member.matterPosts,
    })),
    cursor: parseString(res.cursor),
  }
}

const normalizeLimit = (limit: number | undefined) => {
  if (!limit || Number.isNaN(limit)) return 50
  return Math.max(1, Math.min(limit, 100))
}
