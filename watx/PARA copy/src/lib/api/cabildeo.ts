import {type BskyAgent} from '@atproto/api'

import {
  type CabildeoDelegationRecord,
  type CabildeoPositionRecord,
  type CabildeoRecord,
  type CabildeoVoteRecord,
} from '#/lib/api/para-lexicons'
import {MOCK_CABILDEOS, MOCK_CABILDEO_POSITIONS} from '#/lib/constants/mockData'

/**
 * Cabildeo API Service
 * 
 * Handles interaction with the PDS for civic deliberation records.
 * Currently falls back to mock data for reads when actual records aren't available,
 * but implements real XRPC writes to `com.para.civic.*` collections.
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
  record: Omit<CabildeoVoteRecord, 'createdAt' | 'delegatedFrom' | 'effectivePower'>,
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

// ─── Reads (currently falling back to mock) ──────────────────────────────────

/**
 * Fetch all active and resolved Cabildeos.
 * For now, this returns the mock list until the AppView custom lexicons are deployed.
 */
export async function fetchCabildeos(_agent: BskyAgent): Promise<CabildeoRecord[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  // TODO: Replace with actual XRPC call like:
  // const res = await agent.api.app.bsky.feed.getActorFeed({ actor: 'cabildeo.para' })
  return MOCK_CABILDEOS
}

/**
 * Fetch positions/debates for a specific Cabildeo.
 */
export async function fetchCabildeoPositions(
  _agent: BskyAgent,
  cabildeoUri: string,
): Promise<CabildeoPositionRecord[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))
  // TODO: Implement actual lookup against com.para.civic.position indexing the cabildeoUri
  return MOCK_CABILDEO_POSITIONS.filter(p => p.cabildeo === cabildeoUri || p.cabildeo === 'mock-uri')
}
