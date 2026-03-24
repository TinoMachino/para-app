import {type BskyAgent} from '@atproto/api'

import {
  type CabildeoDelegationRecord,
  type CabildeoOption,
  type CabildeoPhase,
  type CabildeoPositionRecord,
  type CabildeoRecord,
  type CabildeoVoteRecord,
} from '#/lib/api/para-lexicons'

/**
 * Cabildeo API service for writes + AppView-backed reads.
 */

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function publishCabildeo(
  agent: BskyAgent,
  record: Omit<CabildeoRecord, 'author' | 'createdAt'>,
) {
  if (!agent.session) throw new Error('Not logged in')

  const now = new Date().toISOString()
  const fullRecord: CabildeoRecord = {
    ...record,
    author: agent.session.did,
    createdAt: now,
  }

  return await agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'com.para.civic.cabildeo',
    record: fullRecord as unknown as Record<string, unknown>,
  })
}

export async function publishCabildeoPosition(
  agent: BskyAgent,
  record: Omit<CabildeoPositionRecord, 'createdAt'>,
) {
  if (!agent.session) throw new Error('Not logged in')

  return await agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'com.para.civic.position',
    record: {
      ...record,
      createdAt: new Date().toISOString(),
    } as unknown as Record<string, unknown>,
  })
}

export async function castCabildeoVote(
  agent: BskyAgent,
  record: Omit<
    CabildeoVoteRecord,
    'createdAt' | 'delegatedFrom' | 'effectivePower'
  >,
) {
  if (!agent.session) throw new Error('Not logged in')

  // In a real PDS/AppView the effective power and delegation counts
  // are calculated network-side. The client just submits their intent.
  const fullRecord: CabildeoVoteRecord = {
    ...record,
    createdAt: new Date().toISOString(),
    delegatedFrom: [], // Set by AppView context later
    effectivePower: 1.0, // Base power, AppView calculates √N
  }

  return await agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'com.para.civic.vote',
    record: fullRecord as unknown as Record<string, unknown>,
  })
}

export async function delegateCabildeoVote(
  agent: BskyAgent,
  record: Omit<CabildeoDelegationRecord, 'createdAt'>,
) {
  if (!agent.session) throw new Error('Not logged in')

  return await agent.com.atproto.repo.createRecord({
    repo: agent.session.did,
    collection: 'com.para.civic.delegation',
    record: {
      ...record,
      createdAt: new Date().toISOString(),
    } as unknown as Record<string, unknown>,
  })
}

// ─── Reads (AppView) ─────────────────────────────────────────────────────────

export type CabildeoOptionSummary = {
  optionIndex: number
  label: string
  votes: number
  positions: number
}

export type CabildeoPositionCounts = {
  total: number
  for: number
  against: number
  amendment: number
  byOption: CabildeoOptionSummary[]
}

export type CabildeoVoteTotals = {
  total: number
  direct: number
  delegated: number
}

export type CabildeoOutcomeSummary = {
  winningOption?: number
  totalParticipants: number
  effectiveTotalPower: number
  tie: boolean
  breakdown: CabildeoOptionSummary[]
}

export type CabildeoViewerContext = {
  currentVoteOption?: number
  currentVoteIsDirect?: boolean
  activeDelegation?: string
  delegateHasVoted?: boolean
  delegatedVoteOption?: number
  delegatedVotedAt?: string
  gracePeriodEndsAt?: string
  delegateVoteDismissed?: boolean
}

export type CabildeoReadView = {
  uri: string
  cid: string
  creator: string
  indexedAt: string
  title: string
  description: string
  community: string
  communities?: string[]
  flairs?: string[]
  region?: string
  geoRestricted?: boolean
  options: CabildeoOption[]
  minQuorum?: number
  phase: CabildeoPhase | (string & {})
  phaseDeadline?: string
  createdAt: string
  optionSummary: CabildeoOptionSummary[]
  positionCounts: CabildeoPositionCounts
  voteTotals: CabildeoVoteTotals
  outcomeSummary?: CabildeoOutcomeSummary
  viewerContext?: CabildeoViewerContext
}

export type CabildeoPositionReadView = {
  uri: string
  cid: string
  creator: string
  indexedAt: string
  cabildeo: string
  stance: CabildeoPositionRecord['stance']
  optionIndex?: number
  text: string
  compassQuadrant?: string
  createdAt: string
}

type ListCabildeosResponse = {
  cabildeos?: CabildeoReadView[]
  cursor?: string
}

type GetCabildeoResponse = {
  cabildeo?: CabildeoReadView
}

type ListCabildeoPositionsResponse = {
  positions?: CabildeoPositionReadView[]
  cursor?: string
}

const MAX_PAGINATION_PAGES = 20

export async function fetchCabildeosPage(
  agent: BskyAgent,
  opts?: {
    community?: string
    phase?: CabildeoPhase
    limit?: number
    cursor?: string
  },
): Promise<{cabildeos: CabildeoReadView[]; cursor?: string}> {
  const res = await requestCivic<ListCabildeosResponse>(
    agent,
    'com.para.civic.listCabildeos',
    {
      community: opts?.community,
      phase: opts?.phase,
      limit: opts?.limit ? String(opts.limit) : undefined,
      cursor: opts?.cursor,
    },
  )
  return {
    cabildeos: res.cabildeos ?? [],
    cursor: res.cursor,
  }
}

export async function fetchCabildeos(
  agent: BskyAgent,
  opts?: {
    community?: string
    phase?: CabildeoPhase
    limit?: number
  },
): Promise<CabildeoReadView[]> {
  const pageLimit = opts?.limit ?? 50
  const all: CabildeoReadView[] = []
  let cursor: string | undefined

  for (let page = 0; page < MAX_PAGINATION_PAGES; page++) {
    const result = await fetchCabildeosPage(agent, {
      community: opts?.community,
      phase: opts?.phase,
      limit: pageLimit,
      cursor,
    })
    all.push(...result.cabildeos)
    if (!result.cursor) break
    cursor = result.cursor
  }

  return all
}

export async function fetchCabildeo(
  agent: BskyAgent,
  cabildeoUri: string,
): Promise<CabildeoReadView | null> {
  const params = new URLSearchParams()
  params.set('cabildeo', cabildeoUri)
  const res = await agent.fetchHandler(
    `/xrpc/com.para.civic.getCabildeo?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    },
  )

  if (!res.ok) {
    const error = await safeJson(res)
    if (
      (res.status === 400 && error?.error === 'NotFound') ||
      res.status === 404
    ) {
      return null
    }
    throw new Error(error?.message || 'Unable to fetch cabildeo.')
  }

  const json = (await res.json()) as GetCabildeoResponse
  return json.cabildeo ?? null
}

export async function fetchCabildeoPositionsPage(
  agent: BskyAgent,
  opts: {
    cabildeoUri: string
    stance?: CabildeoPositionRecord['stance']
    limit?: number
    cursor?: string
  },
): Promise<{positions: CabildeoPositionReadView[]; cursor?: string}> {
  const res = await requestCivic<ListCabildeoPositionsResponse>(
    agent,
    'com.para.civic.listCabildeoPositions',
    {
      cabildeo: opts.cabildeoUri,
      stance: opts.stance,
      limit: opts.limit ? String(opts.limit) : undefined,
      cursor: opts.cursor,
    },
  )

  return {
    positions: res.positions ?? [],
    cursor: res.cursor,
  }
}

export async function fetchCabildeoPositions(
  agent: BskyAgent,
  opts: {
    cabildeoUri: string
    stance?: CabildeoPositionRecord['stance']
    limit?: number
  },
): Promise<CabildeoPositionReadView[]> {
  const pageLimit = opts.limit ?? 50
  const all: CabildeoPositionReadView[] = []
  let cursor: string | undefined

  for (let page = 0; page < MAX_PAGINATION_PAGES; page++) {
    const result = await fetchCabildeoPositionsPage(agent, {
      cabildeoUri: opts.cabildeoUri,
      stance: opts.stance,
      limit: pageLimit,
      cursor,
    })
    all.push(...result.positions)
    if (!result.cursor) break
    cursor = result.cursor
  }

  return all
}

async function requestCivic<T>(
  agent: BskyAgent,
  endpoint: string,
  params: Record<string, string | undefined>,
): Promise<T> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value && value.length > 0) {
      search.set(key, value)
    }
  }
  const query = search.toString()
  const url = query.length ? `/xrpc/${endpoint}?${query}` : `/xrpc/${endpoint}`

  const res = await agent.fetchHandler(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  })

  if (!res.ok) {
    const error = await safeJson(res)
    throw new Error(error?.message || `Request failed: ${endpoint}`)
  }

  return (await res.json()) as T
}

async function safeJson(res: Response): Promise<Record<string, any> | null> {
  try {
    return (await res.json()) as Record<string, any>
  } catch {
    return null
  }
}
