import { AppContext } from '../../../../context'
import { DataPlaneClient } from '../../../../data-plane'
import { parseString } from '../../../../hydration/util'
import { Server } from '../../../../lexicon'
import { QueryParams } from '../../../../lexicon/types/com/para/community/getGovernance'
import { resHeaders } from '../../../util'

export default function (server: Server, ctx: AppContext) {
  server.com.para.community.getGovernance({
    auth: ctx.authVerifier.optionalStandardOrRole,
    handler: async ({ params, auth, req }) => {
      const { viewer } = ctx.authVerifier.parseCreds(auth)
      const labelers = ctx.reqLabelers(req)
      const result = await getGovernance({ ctx, params })
      const repoRev = await ctx.hydrator.actor.getRepoRevSafe(viewer)
      return {
        encoding: 'application/json' as const,
        body: result,
        headers: resHeaders({ repoRev, labelers }),
      }
    },
  })
}

const getGovernance = async (inputs: { ctx: Context; params: QueryParams }) => {
  const { ctx, params } = inputs
  const res = await ctx.dataplane.getParaCommunityGovernance({
    community: params.community,
    limit: params.limit ?? 50,
  })

  return {
    community: res.community,
    summary: {
      members: res.summary?.members ?? 0,
      visiblePosters: res.summary?.visiblePosters ?? 0,
      policyPosts: res.summary?.policyPosts ?? 0,
      matterPosts: res.summary?.matterPosts ?? 0,
      badgeHolders: res.summary?.badgeHolders ?? 0,
    },
    moderators: res.moderators.map((moderator) => ({
      member: {
        did: moderator.member?.did ?? '',
        handle: parseString(moderator.member?.handle),
        displayName: parseString(moderator.member?.displayName),
        avatar: parseString(moderator.member?.avatar),
        party: parseString(moderator.member?.party),
        influence: moderator.member?.influence ?? 0,
        votesReceivedAllTime: moderator.member?.votesReceivedAllTime ?? 0,
        votesCastAllTime: moderator.member?.votesCastAllTime ?? 0,
        policyPosts: moderator.member?.policyPosts ?? 0,
        matterPosts: moderator.member?.matterPosts ?? 0,
      },
      role: moderator.role,
      badge: moderator.badge,
    })),
    officials: res.officials.map((official) => ({
      member: {
        did: official.member?.did ?? '',
        handle: parseString(official.member?.handle),
        displayName: parseString(official.member?.displayName),
        avatar: parseString(official.member?.avatar),
        party: parseString(official.member?.party),
        influence: official.member?.influence ?? 0,
        votesReceivedAllTime: official.member?.votesReceivedAllTime ?? 0,
        votesCastAllTime: official.member?.votesCastAllTime ?? 0,
        policyPosts: official.member?.policyPosts ?? 0,
        matterPosts: official.member?.matterPosts ?? 0,
      },
      office: official.office,
      mandate: official.mandate,
    })),
    deputies: res.deputies.map((deputy) => ({
      tier: deputy.tier,
      role: deputy.role,
      activeHolder: {
        did: deputy.activeHolder?.did ?? '',
        handle: parseString(deputy.activeHolder?.handle),
        displayName: parseString(deputy.activeHolder?.displayName),
        avatar: parseString(deputy.activeHolder?.avatar),
        party: parseString(deputy.activeHolder?.party),
        influence: deputy.activeHolder?.influence ?? 0,
        votesReceivedAllTime: deputy.activeHolder?.votesReceivedAllTime ?? 0,
        votesCastAllTime: deputy.activeHolder?.votesCastAllTime ?? 0,
        policyPosts: deputy.activeHolder?.policyPosts ?? 0,
        matterPosts: deputy.activeHolder?.matterPosts ?? 0,
      },
      votesBackingRole: deputy.votesBackingRole,
      applicants: deputy.applicants,
    })),
    computedAt: parseString(res.computedAt) ?? new Date().toISOString(),
  }
}

type Context = {
  dataplane: DataPlaneClient
  hydrator: AppContext['hydrator']
}
