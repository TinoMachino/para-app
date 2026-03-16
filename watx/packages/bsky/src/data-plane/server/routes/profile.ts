import { Timestamp } from '@bufbuild/protobuf'
import { ServiceImpl } from '@connectrpc/connect'
import { Selectable, sql } from 'kysely'
import {
  AppBskyNotificationDeclaration,
  ChatBskyActorDeclaration,
} from '@atproto/api'
import { keyBy } from '@atproto/common'
import { parseRecordBytes } from '../../../hydration/util'
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

      const chatDeclaration = parseRecordBytes<ChatBskyActorDeclaration.Record>(
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
        const record = parseRecordBytes<AppBskyNotificationDeclaration.Record>(
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
    const normalizeCommunity = (value: string) =>
      value.trim().toLowerCase().replace(/^p\//, '')
    const normCommunity = normalizeCommunity(req.community)
    const limit = req.limit > 0 ? req.limit : 50

    const members = await db.db
      .selectFrom('para_status as ps')
      .innerJoin('actor as a', 'a.did', 'ps.did')
      .leftJoin('profile as p', (join) =>
        join.onRef('p.creator', '=', 'ps.did').on('p.uri', 'like', '%/self'),
      )
      .leftJoin('para_profile_stats as s', 's.did', 'ps.did')
      .where(
        sql`lower(regexp_replace(coalesce(ps.community, ''), '^p/', ''))`,
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

    const moderators = mapped.slice(0, 3).map((member, index) => ({
      member,
      role:
        index === 0
          ? 'Lead moderator'
          : index === 1
            ? 'Case moderator'
            : 'Process moderator',
      badge:
        index === 0
          ? 'Moderation Lead'
          : index === 1
            ? 'Safety & Appeals'
            : 'Procedure',
    }))

    const partyMembers = mapped.filter((member) => !!member.party)
    const officials = (partyMembers.length ? partyMembers : mapped)
      .slice(0, 3)
      .map((member, index) => ({
        member,
        office:
          index === 0
            ? 'Official representative'
            : index === 1
              ? 'Policy coordinator'
              : 'Matter coordinator',
        mandate:
          index === 0
            ? 'Policy comms and final statements'
            : index === 1
              ? 'Tracks active policy records and escalations'
              : 'Curates local incidents and issue threads',
      }))

    const deputySpecs = [
      { tier: 'Tier I', role: 'Chief Digital Deputy' },
      { tier: 'Tier II', role: 'Policy Deputy' },
      { tier: 'Tier II', role: 'Matter Deputy' },
      { tier: 'Tier III', role: 'Mobilization Deputy' },
    ]
    const deputies = deputySpecs
      .map((spec, index) => {
        const active = mapped[index] ?? mapped[0]
        if (!active) return null
        const applicants = mapped
          .slice(index + 1, index + 4)
          .map((member) => member.displayName || member.handle || member.did)
        return {
          tier: spec.tier,
          role: spec.role,
          activeHolder: active,
          votesBackingRole: active.votesReceivedAllTime,
          applicants,
        }
      })
      .filter((item): item is NonNullable<typeof item> => !!item)

    const policyPosts = mapped.reduce((acc, item) => acc + item.policyPosts, 0)
    const matterPosts = mapped.reduce((acc, item) => acc + item.matterPosts, 0)
    const visiblePosters = mapped.filter((item) => item.postCount > 0).length
    const badgeHolders = mapped.filter(
      (item) => item.policyPosts > 0 || item.matterPosts > 0,
    ).length

    return {
      community: req.community,
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
