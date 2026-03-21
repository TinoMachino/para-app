import { ServiceImpl } from '@connectrpc/connect'
import { sql } from 'kysely'
import { Service } from '../../../proto/bsky_connect'
import { Database } from '../db'
import { TimeCidKeyset, paginate } from '../db/pagination'

export default (db: Database): Partial<ServiceImpl<typeof Service>> => ({
  async getParaCabildeos(req) {
    const { ref } = db.db.dynamic
    const normalizedCommunity = normalizeCommunity(req.community)
    const phase = req.phase?.trim()

    let builder = db.db.selectFrom('cabildeo_cabildeo').selectAll()

    if (normalizedCommunity) {
      builder = builder.where(
        sql`lower(regexp_replace(coalesce("community", ''), '^p/', ''))`,
        '=',
        normalizedCommunity,
      )
    }
    if (phase) {
      builder = builder.where('phase', '=', phase)
    }

    const keyset = new TimeCidKeyset(
      ref('cabildeo_cabildeo.sortAt'),
      ref('cabildeo_cabildeo.cid'),
    )

    builder = paginate(builder, {
      limit: req.limit,
      cursor: req.cursor,
      keyset,
      tryIndex: true,
    })

    const rows = await builder.execute()
    const views = await Promise.all(
      rows.map((row) => mapCabildeoRow(db, row, req.viewerDid || undefined)),
    )

    return {
      items: views,
      cursor: keyset.packFromResult(rows),
    }
  },

  async getParaCabildeo(req) {
    const row = await db.db
      .selectFrom('cabildeo_cabildeo')
      .where('uri', '=', req.cabildeoUri)
      .selectAll()
      .executeTakeFirst()

    if (!row) {
      return {}
    }

    return {
      cabildeo: await mapCabildeoRow(db, row, req.viewerDid || undefined),
    }
  },

  async getParaCabildeoPositions(req) {
    const { ref } = db.db.dynamic
    let builder = db.db
      .selectFrom('cabildeo_position')
      .where('cabildeo', '=', req.cabildeoUri)
      .selectAll()

    if (req.stance) {
      builder = builder.where('stance', '=', req.stance)
    }

    const keyset = new TimeCidKeyset(
      ref('cabildeo_position.sortAt'),
      ref('cabildeo_position.cid'),
    )

    builder = paginate(builder, {
      limit: req.limit,
      cursor: req.cursor,
      keyset,
      tryIndex: true,
    })

    const positions = await builder.execute()
    return {
      positions: positions.map((position) => ({
        uri: position.uri,
        cid: position.cid,
        creator: position.creator,
        indexedAt: position.indexedAt,
        cabildeo: position.cabildeo,
        stance: position.stance,
        optionIndex:
          typeof position.optionIndex === 'number'
            ? position.optionIndex
            : undefined,
        text: position.text,
        compassQuadrant: position.compassQuadrant ?? '',
        createdAt: position.createdAt,
      })),
      cursor: keyset.packFromResult(positions),
    }
  },
})

const mapCabildeoRow = async (
  db: Database,
  row: {
    uri: string
    cid: string
    creator: string
    title: string
    description: string
    community: string
    communities: unknown
    flairs: unknown
    region: string | null
    geoRestricted: 0 | 1 | null
    options: unknown
    minQuorum: number | null
    phase: string
    phaseDeadline: string | null
    createdAt: string
    indexedAt: string
    positionCount: number
    positionForCount: number
    positionAgainstCount: number
    positionAmendmentCount: number
    voteCount: number
    directVoteCount: number
    delegatedVoteCount: number
    optionVoteCounts: unknown
    optionPositionCounts: unknown
    winningOption: number | null
    isTie: 0 | 1
  },
  viewerDid?: string,
) => {
  const options = asOptions(row.options)
  const voteCounts = asNumberArray(row.optionVoteCounts, options.length)
  const positionCounts = asNumberArray(row.optionPositionCounts, options.length)

  const optionSummary = options.map((option, optionIndex) => ({
    optionIndex,
    label: option.label,
    votes: voteCounts[optionIndex] || 0,
    positions: positionCounts[optionIndex] || 0,
  }))

  const positionSummary = {
    total: row.positionCount,
    forCount: row.positionForCount,
    againstCount: row.positionAgainstCount,
    amendmentCount: row.positionAmendmentCount,
    byOption: optionSummary,
  }

  const voteTotals = {
    total: row.voteCount,
    direct: row.directVoteCount,
    delegated: row.delegatedVoteCount,
  }

  const outcomeSummary =
    row.phase === 'resolved'
      ? {
          winningOption:
            typeof row.winningOption === 'number' ? row.winningOption : undefined,
          totalParticipants: row.voteCount,
          effectiveTotalPower: row.voteCount,
          tie: row.isTie === 1,
          breakdown: optionSummary,
        }
      : undefined

  const viewerContext = viewerDid
    ? await getViewerContext(db, row.uri, viewerDid)
    : undefined

  return {
    uri: row.uri,
    cid: row.cid,
    creator: row.creator,
    indexedAt: row.indexedAt,
    title: row.title,
    description: row.description,
    community: row.community,
    communities: asStringArray(row.communities),
    flairs: asStringArray(row.flairs),
    region: row.region ?? '',
    geoRestricted: row.geoRestricted === 1,
    options,
    minQuorum:
      typeof row.minQuorum === 'number' && row.minQuorum > 0
        ? row.minQuorum
        : undefined,
    phase: row.phase,
    phaseDeadline: row.phaseDeadline ?? '',
    createdAt: row.createdAt,
    optionSummary,
    positionCounts: positionSummary,
    voteTotals,
    outcomeSummary,
    viewerContext,
  }
}

const getViewerContext = async (
  db: Database,
  cabildeoUri: string,
  viewerDid: string,
) => {
  const [currentVote, delegation] = await Promise.all([
    db.db
      .selectFrom('cabildeo_vote')
      .where('creator', '=', viewerDid)
      .where('cabildeo', '=', cabildeoUri)
      .orderBy('sortAt', 'desc')
      .orderBy('cid', 'desc')
      .select(['selectedOption', 'isDirect'])
      .executeTakeFirst(),
    db.db
      .selectFrom('cabildeo_delegation')
      .where('creator', '=', viewerDid)
      .where((qb) =>
        qb.where('cabildeo', '=', cabildeoUri).orWhere('cabildeo', 'is', null),
      )
      .orderBy(sql`case when "cabildeo" = ${cabildeoUri} then 0 else 1 end`)
      .orderBy('createdAt', 'desc')
      .orderBy('indexedAt', 'desc')
      .select(['delegateTo'])
      .executeTakeFirst(),
  ])

  const delegateVote =
    delegation?.delegateTo && delegation.delegateTo.length
      ? await db.db
          .selectFrom('cabildeo_vote')
          .where('creator', '=', delegation.delegateTo)
          .where('cabildeo', '=', cabildeoUri)
          .orderBy('sortAt', 'desc')
          .orderBy('cid', 'desc')
          .select(['selectedOption', 'createdAt'])
          .executeTakeFirst()
      : null

  const delegatedVotedAt = delegateVote?.createdAt ?? ''
  const gracePeriodEndsAt = delegatedVotedAt
    ? new Date(
        new Date(delegatedVotedAt).getTime() + 24 * 60 * 60 * 1000,
      ).toISOString()
    : ''

  return {
    currentVoteOption:
      typeof currentVote?.selectedOption === 'number'
        ? currentVote.selectedOption
        : undefined,
    currentVoteIsDirect: currentVote?.isDirect === 1,
    activeDelegation: delegation?.delegateTo ?? '',
    delegateHasVoted: !!delegateVote,
    delegatedVoteOption:
      typeof delegateVote?.selectedOption === 'number'
        ? delegateVote.selectedOption
        : undefined,
    delegatedVotedAt,
    gracePeriodEndsAt,
    delegateVoteDismissed: false,
  }
}

type CivicOption = {
  label: string
  description?: string
  isConsensus?: boolean
}

const asOptions = (value: unknown): CivicOption[] => {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is { label?: unknown; description?: unknown; isConsensus?: unknown } =>
      typeof item === 'object' && item !== null,
    )
    .map((item) => ({
      label: typeof item.label === 'string' ? item.label : '',
      description: typeof item.description === 'string' ? item.description : '',
      isConsensus: item.isConsensus === true,
    }))
}

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

const asNumberArray = (value: unknown, length: number): number[] => {
  const base = Array.from({ length }, () => 0)
  if (!Array.isArray(value)) return base
  for (let i = 0; i < Math.min(value.length, length); i++) {
    const current = value[i]
    if (typeof current === 'number' && Number.isFinite(current)) {
      base[i] = Math.max(0, Math.floor(current))
    }
  }
  return base
}

const normalizeCommunity = (value: string | undefined) => {
  return value?.trim().toLowerCase().replace(/^p\//, '') || ''
}
