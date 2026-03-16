/**
 * Representatives Service
 *
 * Handles fetching and filtering political representatives.
 */

import {type RepresentativeItem} from '#/lib/mock-data'
import {filterRepsByState, REPRESENTATIVES} from '#/lib/mock-data'
import {USE_MOCK_DATA} from './config'
import {
  type FilterParams,
  type PaginationParams,
  type ServiceResponse,
} from './types'

export interface RepresentativesQueryParams
  extends FilterParams, PaginationParams {}

/**
 * Fetch representatives with optional filtering and pagination
 */
export async function fetchRepresentatives(
  params?: RepresentativesQueryParams,
): Promise<ServiceResponse<RepresentativeItem[]>> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()

    let data = REPRESENTATIVES

    // Apply state filter
    if (params?.state) {
      data = filterRepsByState(params.state)
    }

    // Apply category filter
    if (params?.category) {
      data = data.filter(r => r.category === params.category)
    }

    // Apply pagination
    const limit = params?.limit || 20
    const start = 0
    data = data.slice(start, start + limit)

    return {data, cursor: data.length >= limit ? 'next-page' : undefined}
  }

  throw new Error('Real API not yet implemented for representatives')
}

/**
 * Fetch a single representative by ID
 */
export async function fetchRepresentativeById(
  id: string,
): Promise<RepresentativeItem | null> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    return REPRESENTATIVES.find(r => r.id === id) || null
  }

  throw new Error('Real API not yet implemented for representatives')
}

function simulateNetworkDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 100))
}
