/**
 * Highlights Service
 *
 * Handles fetching and filtering highlights (posts/statements).
 */

import {type Highlight} from '#/lib/mock-data'
import {filterHighlightsByState, HIGHLIGHTS} from '#/lib/mock-data'
import {USE_MOCK_DATA} from './config'
import {
  type FilterParams,
  type PaginationParams,
  type ServiceResponse,
} from './types'

export interface HighlightsQueryParams extends FilterParams, PaginationParams {}

/**
 * Fetch highlights with optional filtering and pagination
 */
export async function fetchHighlights(
  params?: HighlightsQueryParams,
): Promise<ServiceResponse<Highlight[]>> {
  if (USE_MOCK_DATA) {
    // Mock implementation
    await simulateNetworkDelay()

    let data = HIGHLIGHTS

    // Apply state filter if provided
    if (params?.state) {
      data = filterHighlightsByState(params.state)
    }

    // Apply pagination (simple slice for mock)
    const limit = params?.limit || 20
    const start = 0 // In real impl, we'd use cursor
    data = data.slice(start, start + limit)

    return {data, cursor: data.length >= limit ? 'next-page' : undefined}
  }

  // Real API implementation (placeholder)
  throw new Error('Real API not yet implemented for highlights')
}

/**
 * Fetch a single highlight by ID
 */
export async function fetchHighlightById(
  id: string,
): Promise<Highlight | null> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    return HIGHLIGHTS.find(h => h.id === id) || null
  }

  throw new Error('Real API not yet implemented for highlights')
}

/**
 * Simulate network delay for mock data (makes UX more realistic)
 */
function simulateNetworkDelay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 100))
}

/**
 * Vote on a highlight (Mock only)
 */
export async function voteOnHighlight(
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    const item = HIGHLIGHTS.find(h => h.id === id)
    if (item) {
      // Ensure downvotes is initialized if missing in old mocks
      if (typeof item.downvotes !== 'number') item.downvotes = 0

      // Remove existing vote if any
      if (item.viewerHasUpvoted) item.upvotes--
      if (item.viewerHasDownvoted) item.downvotes--

      // Toggle off if clicking same direction, else apply new vote
      if (direction === 'up') {
        if (item.viewerHasUpvoted) {
          item.viewerHasUpvoted = false
        } else {
          item.viewerHasUpvoted = true
          item.upvotes++
          item.viewerHasDownvoted = false
        }
      } else {
        if (item.viewerHasDownvoted) {
          item.viewerHasDownvoted = false
        } else {
          item.viewerHasDownvoted = true
          item.downvotes++
          item.viewerHasUpvoted = false
        }
      }
    }
    return
  }

  throw new Error('Real API not yet implemented for voting on highlights')
}

/**
 * Toggle save on a highlight (Mock only)
 */
export async function toggleSaveHighlight(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    await simulateNetworkDelay()
    const item = HIGHLIGHTS.find(h => h.id === id)
    if (item) {
      const wasSaved = !!item.viewerHasSaved
      item.viewerHasSaved = !wasSaved
      item.saves += wasSaved ? -1 : 1
    }
    return
  }

  throw new Error('Real API not yet implemented for saving highlights')
}
