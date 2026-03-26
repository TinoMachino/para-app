import { Timestamp } from '@bufbuild/protobuf'
import { ServiceImpl } from '@connectrpc/connect'
import { Selectable, sql } from 'kysely'
import {
  AppBskyNotificationDeclaration,
  ChatBskyActorDeclaration,
} from '@atproto/api'
import { keyBy } from '@atproto/common'
import { app, chat } from '../../../lexicons.js'
import { parseJsonBytes } from '../../../hydration/util'
import { Service } from '../../../proto/bsky_connect'
import { VerificationMeta } from '../../../proto/bsky_pb'
import { Database } from '../db'
import { Verification } from '../db/tables/verification'
import { getRecords } from './records'

type VerifiedBy = {
  [handle: string]: Pick<
    VerificationMeta,
    'rkey' | 'handle' | 'displayName' | 'sortedAt'
  >
}

export default (db: Database): Partial<ServiceImpl<typeof Service>> => ({
  async getActors(req) {
    const { dids, returnAgeAssuranceForDids } = req
    if (dids.length === 0) {
      return { actors: [] }
    }
    const profileUris = dids.map(
      (did) => `at://${did}/app.bsky.actor.profile/self`,
    )
    const statusUris = dids.map(
      (did) => `at://${did}/app.bsky.actor.status/self`,
    )
    const chatDeclarationUris = dids.map(
      (did) => `at://${did}/chat.bsky.actor.declaration/self`,
    )
    const notifDeclarationUris = dids.map(
      (did) => `at://${did}/app.bsky.notification.declaration/self`,
    )
    const germDeclarationUris = dids.map(
      (did) => `at://${did}/com.germnetwork.declaration/self`,
    )
    const { ref } = db.db.dynamic
    const [
      handlesRes,
      verificationsReceived,
      profiles,
      statuses,
      chatDeclarations,
      notifDeclarations,
      germDeclarations,
    ] = await Promise.all([
      db.db
        .selectFrom('actor')
        .leftJoin('actor_state', 'actor_state.did', 'actor.did')
        .where('actor.did', 'in', dids)
        .selectAll('actor')
        .select('actor_state.priorityNotifs')
        .select([
          db.db
            .selectFrom('labeler')
            .whereRef('creator', '=', ref('actor.did'))
            .select(sql<true>`${true}`.as('val'))
            .as('isLabeler'),
        ])
        .execute(),
      db.db
        .selectFrom('verification')
        .selectAll('verification')
        .innerJoin('actor', 'actor.did', 'verification.creator')
        .where('verification.subject', 'in', dids)
        .where('actor.trustedVerifier', '=', true)
        .orderBy('sortedAt', 'asc')
        .execute(),
      getRecords(db)({ uris: profileUris }),
      getRecords(db)({ uris: statusUris }),
      getRecords(db)({ uris: chatDeclarationUris }),
      getRecords(db)({ uris: notifDeclarationUris }),
      getRecords(db)({ uris: germDeclarationUris }),
    ])

    const verificationsBySubjectDid = verificationsReceived.reduce(
      (acc, cur) => {
        const list = acc.get(cur.subject) ?? []
        list.push(cur)
        acc.set(cur.subject, list)
        return acc
      },
      new Map<string, Selectable<Verification>[]>(),
    )

    const byDid = keyBy(handlesRes, 'did')
    const actors = dids.map((did, i) => {
      const row = byDid.get(did)

      const status = statuses.records[i]

      const chatDeclaration = parseJsonBytes<ChatBskyActorDeclaration.Record>(
        chat.bsky.actor.declaration.main,
        chatDeclarations.records[i].record,
      )

      const germDeclaration = germDeclarations.records[i]

      const verifications = verificationsBySubjectDid.get(did) ?? []
      const verifiedBy: VerifiedBy = verifications.reduce((acc, cur) => {
        acc[cur.creator] = {
          rkey: cur.rkey,
          handle: cur.handle,
          displayName: cur.displayName,
          sortedAt: Timestamp.fromDate(new Date(cur.sortedAt)),
        }
        return acc
      }, {} as VerifiedBy)
      const ageAssuranceForDids = new Set(returnAgeAssuranceForDids)

      const activitySubscription = () => {
        const record =
          parseJsonBytes<AppBskyNotificationDeclaration.Record>(
          app.bsky.notification.declaration.main,
          notifDeclarations.records[i].record,
        )

        // The dataplane is responsible for setting the default of "followers" (default according to the lexicon).
        const defaultVal = 'followers'

        if (typeof record?.allowSubscriptions !== 'string') {
          return defaultVal
        }

        switch (record.allowSubscriptions) {
          case 'followers':
          case 'mutuals':
          case 'none':
            return record.allowSubscriptions
          default:
            return defaultVal
        }
      }

      const ageAssuranceStatus = () => {
        if (!ageAssuranceForDids.has(did)) {
          return undefined
        }

        const status = row?.ageAssuranceStatus ?? 'unknown'
        let access = row?.ageAssuranceAccess
        if (!access || access === 'unknown') {
          if (status === 'assured') {
            access = 'full'
          } else if (status === 'blocked') {
            access = 'none'
          } else {
            access = 'unknown'
          }
        }

        return {
          lastInitiatedAt: row?.ageAssuranceLastInitiatedAt
            ? Timestamp.fromDate(new Date(row?.ageAssuranceLastInitiatedAt))
            : undefined,
          status,
          access,
        }
      }

      return {
        exists: !!row,
        handle: row?.handle ?? undefined,
        profile: profiles.records[i],
        takenDown: !!row?.takedownRef,
        takedownRef: row?.takedownRef || undefined,
        tombstonedAt: undefined, // in current implementation, tombstoned actors are deleted
        labeler: row?.isLabeler ?? false,
        allowIncomingChatsFrom:
          typeof chatDeclaration?.['allowIncoming'] === 'string'
            ? chatDeclaration['allowIncoming']
            : undefined,
        upstreamStatus: row?.upstreamStatus ?? '',
        createdAt: profiles.records[i].createdAt, // @NOTE profile creation date not trusted in production
        priorityNotifications: row?.priorityNotifs ?? false,
        trustedVerifier: row?.trustedVerifier ?? false,
        verifiedBy,
        statusRecord: status,
        germRecord: germDeclaration,
        tags: [],
        profileTags: [],
        allowActivitySubscriptionsFrom: activitySubscription(),
        ageAssuranceStatus: ageAssuranceStatus(),
      }
    })
    return { actors }
  },

  // @TODO handle req.lookupUnidirectional w/ networked handle resolution
  async getDidsByHandles(req) {
    const { handles } = req
    if (handles.length === 0) {
      return { dids: [] }
    }
    const res = await db.db
      .selectFrom('actor')
      .where('handle', 'in', handles)
      .selectAll()
      .execute()
    const byHandle = keyBy(res, 'handle')
    const dids = handles.map((handle) => byHandle.get(handle)?.did ?? '')
    return { dids }
  },

  async getParaProfileStats(req) {
    const { actorDid } = req
    const [stats, status] = await Promise.all([
      db.db
        .selectFrom('para_profile_stats')
        .where('did', '=', actorDid)
        .selectAll()
        .executeTakeFirst(),
      db.db
        .selectFrom('para_status')
        .where('did', '=', actorDid)
        .selectAll()
        .executeTakeFirst(),
    ])

    return {
      actorDid,
      stats: {
        influence: stats?.influence ?? 0,
        votesReceivedAllTime: stats?.votesReceivedAllTime ?? 0,
        votesCastAllTime: stats?.votesCastAllTime ?? 0,
        contributions: {
          policies: stats?.policies ?? 0,
          matters: stats?.matters ?? 0,
          comments: stats?.comments ?? 0,
        },
        activeIn: stats?.activeIn ?? [],
        computedAt: stats?.computedAt ?? new Date().toISOString(),
      },
      status: status
        ? {
            status: status.status,
            party: status.party ?? undefined,
            community: status.community ?? undefined,
            createdAt: status.createdAt,
          }
        : undefined,
    }
  },

  async getParaCommunityGovernance(req) {
    const normCommunity = normalizeCommunityKey(req.community)
    const limit = req.limit > 0 ? req.limit : 50

    const publishedGovernance = await getPublishedGovernanceRecord({
      db,
      community: req.community,
      normalizedCommunity: normCommunity,
    })

    const members = await db.db
      .selectFrom('para_status as ps')
      .innerJoin('actor as a', 'a.did', 'ps.did')
      .leftJoin('profile as p', (join) =>
        join.onRef('p.creator', '=', 'ps.did').on('p.uri', 'like', '%/self'),
      )
      .leftJoin('para_profile_stats as s', 's.did', 'ps.did')
      .where(
        sql`regexp_replace(lower(translate(regexp_replace(coalesce(ps.community, ''), '^p/', '', 'i'), ${COMMUNITY_TRANSLATION_SOURCE}, ${COMMUNITY_TRANSLATION_TARGET})), '[^a-z0-9]+', '', 'g')`,
        '=',
        normCommunity,
      )
      .select([
        'ps.did as did',
        'a.handle as handle',
        'p.displayName as displayName',
        'p.avatarCid as avatarCid',
        'ps.party as party',
        's.influence as influence',
        's.votesReceivedAllTime as votesReceivedAllTime',
        's.votesCastAllTime as votesCastAllTime',
      ])
      .orderBy('s.influence', 'desc')
      .limit(limit)
      .execute()

    const dids = members.map((m) => m.did)
    const postCounts = dids.length
      ? await db.db
          .selectFrom('para_post')
          .where('creator', 'in', dids)
          .select([
            'creator',
            sql<number>`count(*)`.as('postCount'),
            sql<number>`coalesce(sum(case when "postType" = 'policy' then 1 else 0 end), 0)`.as(
              'policyPosts',
            ),
            sql<number>`coalesce(sum(case when "postType" = 'matter' then 1 else 0 end), 0)`.as(
              'matterPosts',
            ),
          ])
          .groupBy('creator')
          .execute()
      : []

    const countsByDid = keyBy(postCounts, 'creator')
    const mapped = members.map((member) => {
      const counts = countsByDid.get(member.did)
      const handle = member.handle ?? undefined
      const avatar = member.avatarCid
        ? `https://bsky.public.url/img/avatar/plain/${member.did}/${member.avatarCid}@jpeg`
        : undefined
      return {
        did: member.did,
        handle,
        displayName: member.displayName ?? undefined,
        avatar,
        party: member.party ?? undefined,
        influence: member.influence ?? 0,
        votesReceivedAllTime: member.votesReceivedAllTime ?? 0,
        votesCastAllTime: member.votesCastAllTime ?? 0,
        policyPosts: counts?.policyPosts ?? 0,
        matterPosts: counts?.matterPosts ?? 0,
        postCount: counts?.postCount ?? 0,
      }
    })

    const memberByDid = keyBy(mapped, 'did')
    const moderators = (publishedGovernance?.moderators || []).map(
      (moderator) => ({
        member: resolveGovernanceMember(moderator, memberByDid),
        role: moderator.role || 'Moderator',
        badge: moderator.badge || 'Moderator',
      }),
    )

    const officials = (publishedGovernance?.officials || []).map(
      (official) => ({
        member: resolveGovernanceMember(official, memberByDid),
        office: official.office || 'Representative',
        mandate: official.mandate || 'No mandate published yet.',
      }),
    )

    const deputies = (publishedGovernance?.deputies || []).map((role) => {
      const activeHolder = resolveGovernanceMember(
        role.activeHolder || undefined,
        memberByDid,
      )
      const applicants = (role.applicants || []).map((applicant) => {
        if (!applicant) return 'Unknown applicant'
        return (
          applicant.displayName ||
          applicant.handle ||
          applicant.did ||
          'Unknown applicant'
        )
      })
      return {
        tier: role.tier || 'Tier II',
        role: role.role || 'Deputy Role',
        activeHolder,
        votesBackingRole: role.votes || activeHolder.votesReceivedAllTime,
        applicants,
      }
    })

    const policyPosts = mapped.reduce((acc, item) => acc + item.policyPosts, 0)
    const matterPosts = mapped.reduce((acc, item) => acc + item.matterPosts, 0)
    const visiblePosters = mapped.filter((item) => item.postCount > 0).length
    const badgeHolders = mapped.filter(
      (item) => item.policyPosts > 0 || item.matterPosts > 0,
    ).length

    return {
      community: publishedGovernance?.community || req.community,
      summary: {
        members: mapped.length,
        visiblePosters,
        policyPosts,
        matterPosts,
        badgeHolders,
      },
      moderators,
      officials,
      deputies,
      metadata: publishedGovernance?.metadata,
      editHistory: publishedGovernance?.editHistory || [],
      computedAt: new Date().toISOString(),
    }
  },

  async updateActorUpstreamStatus(req) {
    const { actorDid, upstreamStatus } = req
    await db.db
      .updateTable('actor')
      .set({ upstreamStatus })
      .where('did', '=', actorDid)
      .execute()
  },
})

type GovernanceRecord = {
  community?: string
  communityId?: string
  slug?: string
  moderators?: GovernancePersonWithRole[]
  officials?: GovernanceOfficial[]
  deputies?: GovernanceDeputyRole[]
  metadata?: GovernanceMetadata
  editHistory?: GovernanceHistoryEntry[]
}

type GovernancePerson = {
  did?: string
  handle?: string
  displayName?: string
  avatar?: string
}

type GovernancePersonWithRole = GovernancePerson & {
  role?: string
  badge?: string
}

type GovernanceOfficial = GovernancePerson & {
  office?: string
  mandate?: string
}

type GovernanceApplicant = GovernancePerson

type GovernanceDeputyRole = {
  key?: string
  tier?: string
  role?: string
  activeHolder?: GovernancePerson
  votes?: number
  applicants?: GovernanceApplicant[]
}

type GovernanceMetadata = {
  termLengthDays?: number
  reviewCadence?: string
  escalationPath?: string
  publicContact?: string
  lastPublishedAt?: string
  state?: string
  matterFlairIds?: string[]
  policyFlairIds?: string[]
}

type GovernanceHistoryEntry = {
  id: string
  action: string
  actorDid?: string
  actorHandle?: string
  createdAt: string
  summary: string
}

type GovernanceMemberView = {
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
  postCount: number
}

const normalizeCommunityKey = (value: string) =>
  value
    .trim()
    .replace(/^p\//i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const normalizeCommunitySlug = (value: string) =>
  value
    .trim()
    .replace(/^p\//i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const COMMUNITY_TRANSLATION_SOURCE =
  'ÁÀÄÂÃáàäâãÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç'
const COMMUNITY_TRANSLATION_TARGET =
  'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'

const getPublishedGovernanceRecord = async ({
  db,
  community,
  normalizedCommunity,
}: {
  db: Database
  community: string
  normalizedCommunity: string
}): Promise<GovernanceRecord | null> => {
  const slug = normalizeCommunitySlug(community)
  const suffix = `/com.para.community.governance/${slug || 'community'}`

  const slugMatch = await db.db
    .selectFrom('record')
    .select(['json'])
    .where('uri', 'like', `%${suffix}`)
    .orderBy('indexedAt', 'desc')
    .executeTakeFirst()
  if (slugMatch) {
    return parseGovernanceRecord(slugMatch.json)
  }

  const recordMatch = await db.db
    .selectFrom('record')
    .select(['json'])
    .where('uri', 'like', '%/com.para.community.governance/%')
    .where(
      sql`regexp_replace(lower(translate(regexp_replace(coalesce(("record"."json"::jsonb ->> 'community'), ''), '^p/', '', 'i'), ${COMMUNITY_TRANSLATION_SOURCE}, ${COMMUNITY_TRANSLATION_TARGET})), '[^a-z0-9]+', '', 'g')`,
      '=',
      normalizedCommunity,
    )
    .orderBy('indexedAt', 'desc')
    .executeTakeFirst()

  return recordMatch ? parseGovernanceRecord(recordMatch.json) : null
}

const parseGovernanceRecord = (json: string): GovernanceRecord | null => {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    return {
      community: stringOr(parsed.community),
      communityId: stringOr(parsed.communityId),
      slug: stringOr(parsed.slug),
      moderators: normalizeModerators(parsed.moderators),
      officials: normalizeOfficials(parsed.officials),
      deputies: normalizeDeputies(parsed.deputies),
      metadata: normalizeGovernanceMetadata(parsed.metadata),
      editHistory: normalizeGovernanceHistory(parsed.editHistory),
    }
  } catch {
    return null
  }
}

const normalizeModerators = (raw: unknown): GovernancePersonWithRole[] => {
  if (!Array.isArray(raw)) return []
  const out: GovernancePersonWithRole[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const value = item as Record<string, unknown>
    out.push({
      did: stringOr(value.did),
      handle: stringOr(value.handle),
      displayName: stringOr(value.displayName) || stringOr(value.name),
      avatar: stringOr(value.avatar),
      role: stringOr(value.role),
      badge: stringOr(value.badge),
    })
  }
  return out
}

const normalizeOfficials = (raw: unknown): GovernanceOfficial[] => {
  if (!Array.isArray(raw)) return []
  const out: GovernanceOfficial[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const value = item as Record<string, unknown>
    out.push({
      did: stringOr(value.did),
      handle: stringOr(value.handle),
      displayName: stringOr(value.displayName) || stringOr(value.name),
      avatar: stringOr(value.avatar),
      office: stringOr(value.office),
      mandate: stringOr(value.mandate),
    })
  }
  return out
}

const normalizeDeputies = (raw: unknown): GovernanceDeputyRole[] => {
  if (!Array.isArray(raw)) return []
  const out: GovernanceDeputyRole[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const value = item as Record<string, unknown>
    out.push({
      key: stringOr(value.key),
      tier: stringOr(value.tier),
      role: stringOr(value.role) || stringOr(value.title),
      activeHolder: normalizePerson(value.activeHolder),
      votes: numberOr(value.votes),
      applicants: normalizeApplicants(value.applicants),
    })
  }
  return out
}

const normalizeApplicants = (raw: unknown): GovernanceApplicant[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return { displayName: item }
      }
      return normalizePerson(item)
    })
    .filter((item): item is GovernanceApplicant => !!item)
}

const normalizePerson = (raw: unknown): GovernancePerson | undefined => {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as Record<string, unknown>
  const displayName = stringOr(value.displayName) || stringOr(value.name)
  const handle = stringOr(value.handle)
  const did = stringOr(value.did)
  const avatar = stringOr(value.avatar)
  if (!displayName && !handle && !did && !avatar) return undefined
  return { did, handle, displayName, avatar }
}

const resolveGovernanceMember = (
  source: GovernancePerson | undefined,
  memberByDid: Map<string, GovernanceMemberView>,
) => {
  const did = source?.did || ''
  const matched = did ? memberByDid.get(did) : undefined
  return {
    did: did || matched?.did || '',
    handle: source?.handle || matched?.handle,
    displayName: source?.displayName || matched?.displayName,
    avatar: source?.avatar || matched?.avatar,
    party: matched?.party,
    influence: matched?.influence ?? 0,
    votesReceivedAllTime: matched?.votesReceivedAllTime ?? 0,
    votesCastAllTime: matched?.votesCastAllTime ?? 0,
    policyPosts: matched?.policyPosts ?? 0,
    matterPosts: matched?.matterPosts ?? 0,
  }
}

const normalizeGovernanceMetadata = (
  raw: unknown,
): GovernanceMetadata | undefined => {
  if (!raw || typeof raw !== 'object') return undefined
  const value = raw as Record<string, unknown>
  return {
    termLengthDays: numberOr(value.termLengthDays),
    reviewCadence: stringOr(value.reviewCadence),
    escalationPath: stringOr(value.escalationPath),
    publicContact: stringOr(value.publicContact),
    lastPublishedAt: stringOr(value.lastPublishedAt),
    state: stringOr(value.state),
    matterFlairIds: optionalStringList(value.matterFlairIds),
    policyFlairIds: optionalStringList(value.policyFlairIds),
  }
}

const normalizeGovernanceHistory = (raw: unknown): GovernanceHistoryEntry[] => {
  if (!Array.isArray(raw)) return []
  return raw.reduce<GovernanceHistoryEntry[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc
    const value = item as Record<string, unknown>
    acc.push({
      id:
        stringOr(value.id) ||
        `${stringOr(value.action) || 'publish-governance-updates'}-history`,
      action: stringOr(value.action) || 'publish_governance_updates',
      actorDid: stringOr(value.actorDid),
      actorHandle: stringOr(value.actorHandle),
      createdAt: stringOr(value.createdAt) || new Date().toISOString(),
      summary: stringOr(value.summary) || 'Governance update published.',
    })
    return acc
  }, [])
}

const stringOr = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined

const numberOr = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const optionalStringList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : undefined
