/**
 * Hook for fetching and managing highlights for a specific post
 */
import {useCallback, useEffect, useState} from 'react'

import {
  clearHighlightsForPost,
  deleteHighlight,
  getHighlightsForPost,
  saveHighlight,
  updateHighlight,
} from './highlightStorage'
import {type HighlightColor, type HighlightData} from './highlightTypes'

// Simple store for reactive updates
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach(l => l())
}

export function useHighlights(postUri: string) {
  // Use useState with a simple refresh trigger
  const [, forceUpdate] = useState(0)
  const [highlights, setHighlights] = useState<HighlightData[]>(() =>
    getHighlightsForPost(postUri),
  )

  // Subscribe to updates
  useEffect(() => {
    const handleUpdate = () => {
      setHighlights(getHighlightsForPost(postUri))
      forceUpdate(n => n + 1)
    }
    listeners.add(handleUpdate)
    return () => {
      listeners.delete(handleUpdate)
    }
  }, [postUri])

  // Add a new highlight
  const addHighlight = useCallback(
    (
      start: number,
      end: number,
      color: HighlightColor,
      isPublic: boolean = false,
      text: string,
      tag?: string,
    ) => {
      const newHighlight = saveHighlight(postUri, {
        start,
        end,
        color,
        isPublic,
        text,
        tag,
      })
      setHighlights(getHighlightsForPost(postUri))
      notifyListeners()
      return newHighlight
    },
    [postUri],
  )

  // Remove a highlight
  const removeHighlight = useCallback(
    (highlightId: string) => {
      deleteHighlight(postUri, highlightId)
      setHighlights(getHighlightsForPost(postUri))
      notifyListeners()
    },
    [postUri],
  )

  // Update highlight color or tag
  const updateHighlightData = useCallback(
    (highlightId: string, updates: {color?: HighlightColor; tag?: string}) => {
      updateHighlight(postUri, highlightId, updates)
      setHighlights(getHighlightsForPost(postUri))
      notifyListeners()
    },
    [postUri],
  )

  // Clear all highlights for this post
  const clearAll = useCallback(() => {
    clearHighlightsForPost(postUri)
    setHighlights([])
    notifyListeners()
  }, [postUri])

  // Convert to format expected by rn-text-touch-highlight
  const initialHighlightData = highlights.map(h => ({
    start: h.start,
    end: h.end,
  }))

  return {
    highlights,
    initialHighlightData,
    addHighlight,
    removeHighlight,
    updateHighlightData,
    clearAll,
  }
}

/**
 * Get the highlight at a specific text position
 */
export function findHighlightAtPosition(
  highlights: HighlightData[],
  position: number,
): HighlightData | undefined {
  return highlights.find(h => position >= h.start && position <= h.end)
}
