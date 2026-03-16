/**
 * Policies Service
 *
 * Handles fetching policies and matters from different feeds
 * (featured, community, party, state, recommended).
 */

import {type PolicyItem} from '#/lib/mock-data'
import {
  COMMUNITY_POLICIES,
  FEATURED_POLICIES,
  PARTY_POLICIES,
  RECOMMENDED_POLICIES,
  STATE_POLICIES,
} from '#/lib/mock-data'
import {
  COMMUNITY_MATTERS,
  FEATURED_MATTERS,
  PARTY_MATTERS,
  RECOMMENDED_MATTERS,
  STATE_MATTERS,
} from '#/lib/mock-data'
import {USE_MOCK_DATA} from './config'
import {type PaginationParams, type ServiceResponse} from './types'

export type PolicyFeed =
  | 'featured'
  | 'community'
  | 'party'
  | 'state'
  | 'recommended'

export interface PoliciesQueryParams extends PaginationParams {
  feed: PolicyFeed
  type?: 'Policy' | 'Matter' // Filter by type
}

/**
 * Fetch policies from a specific feed
 */
export async function fetchPolicies(
  params: PoliciesQueryParams,
): Promise<ServiceResponse<PolicyItem[]>> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()

    const useMatters = params.type === 'Matter'

    // Select the appropriate feed based on type
    let data: PolicyItem[]
    switch (params.feed) {
      case 'featured':
        data = useMatters ? FEATURED_MATTERS : FEATURED_POLICIES
        break
      case 'community':
        data = useMatters ? COMMUNITY_MATTERS : COMMUNITY_POLICIES
        break
      case 'party':
        data = useMatters ? PARTY_MATTERS : PARTY_POLICIES
        break
      case 'state':
        data = useMatters ? STATE_MATTERS : STATE_POLICIES
        break
      case 'recommended':
        data = useMatters ? RECOMMENDED_MATTERS : RECOMMENDED_POLICIES
        break
      default:
        data = useMatters ? FEATURED_MATTERS : FEATURED_POLICIES
    }

    // Apply pagination
    const limit = params?.limit || 20
    const start = 0
    data = data.slice(start, start + limit)

    return {data, cursor: data.length >= limit ? 'next-page' : undefined}
  }

  throw new Error('Real API not yet implemented for policies')
}

/**
 * Fetch a single policy by ID
 */
export async function fetchPolicyById(id: string): Promise<PolicyItem | null> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()

    // Search across all feeds
    const allItems = [
      ...FEATURED_POLICIES,
      ...COMMUNITY_POLICIES,
      ...PARTY_POLICIES,
      ...STATE_POLICIES,
      ...RECOMMENDED_POLICIES,
      ...FEATURED_MATTERS,
      ...COMMUNITY_MATTERS,
      ...PARTY_MATTERS,
      ...STATE_MATTERS,
      ...RECOMMENDED_MATTERS,
    ]

    return allItems.find(p => p.id === id) || null
  }

  throw new Error('Real API not yet implemented for policies')
}

function simulateNetworkDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 100))
}
