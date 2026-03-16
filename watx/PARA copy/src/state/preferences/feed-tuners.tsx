import {useMemo} from 'react'

import {FeedTuner} from '#/lib/api/feed-manip'
import {MOCK_REPS} from '#/lib/mock-representatives' // Added import
import {type FeedDescriptor} from '../queries/post-feed'
import {usePreferencesQuery} from '../queries/preferences'
import {useSession} from '../session'
import {useBaseFilter} from '../shell/base-filter'
import {usePoliticalAffiliation} from '../shell/political-affiliation'
import {useLanguagePrefs} from './languages'

export function useFeedTuners(feedDesc: FeedDescriptor) {
  const langPrefs = useLanguagePrefs()
  const {data: preferences} = usePreferencesQuery()
  const {currentAccount} = useSession()
  const {activeFilters} = useBaseFilter() // Use activeFilters from card selections
  const {affiliation} = usePoliticalAffiliation() // User's declared affiliation

  return useMemo(() => {
    if (feedDesc.startsWith('author')) {
      if (feedDesc.endsWith('|posts_with_replies')) {
        // TODO: Do this on the server instead.
        return [FeedTuner.removeReposts]
      }
    }
    if (feedDesc.startsWith('feedgen')) {
      return [
        FeedTuner.preferredLangOnly(langPrefs.contentLanguages),
        FeedTuner.removeMutedThreads,
      ]
    }
    if (feedDesc === 'following' || feedDesc.startsWith('list')) {
      const feedTuners = [FeedTuner.removeOrphans]

      if (preferences?.feedViewPrefs.hideReposts) {
        feedTuners.push(FeedTuner.removeReposts)
      }
      if (preferences?.feedViewPrefs.hideReplies) {
        feedTuners.push(FeedTuner.removeReplies)
      } else {
        feedTuners.push(
          FeedTuner.followedRepliesOnly({
            userDid: currentAccount?.did || '',
          }),
        )
      }
      if (preferences?.feedViewPrefs.hideQuotePosts) {
        feedTuners.push(FeedTuner.removeQuotePosts)
      }
      feedTuners.push(FeedTuner.dedupThreads)
      feedTuners.push(FeedTuner.removeMutedThreads)

      // Community Filtering Logic
      // Combine card selections (activeFilters) with user's declared affiliation
      const allFilters = affiliation
        ? [...new Set([...activeFilters, affiliation])]
        : activeFilters

      if (allFilters.length > 0) {
        feedTuners.push((tuner, slices) => {
          // 1. Identify allowed handles from MOCK_REPS based on allFilters
          // allFilters contains Community Names (e.g. "Morena", "Auth Left")
          // MOCK_REPS has 'affiliate' field which matches these names
          const allowedHandles = new Set(
            MOCK_REPS.filter(rep => allFilters.includes(rep.affiliate)).map(
              rep => rep.handle,
            ),
          )

          try {
            // 2. Filter slices
            return slices
              .map(slice => {
                const filteredItems = slice.items.filter(item => {
                  // Check if author's handle is in allowed list
                  return (
                    allowedHandles.size === 0 ||
                    [...allowedHandles].some(h => item.post.author.handle === h)
                  )
                })

                if (filteredItems.length === 0) return null

                // Return new slice with filtered items
                // We need to preserve the FeedViewPostsSlice class instance structure if possible,
                // or ensure what we return satisfies the type.
                // Creating a new object with the same prototype is safer than returning a plain object.
                const newSlice = Object.create(Object.getPrototypeOf(slice))
                Object.assign(newSlice, slice)
                newSlice.items = filteredItems
                return newSlice
              })
              .filter(slice => slice !== null) as any
          } catch (e) {
            console.error('Error filtering feed:', e)
            return slices
          }
        })
      }

      return feedTuners
    }
    return []
  }, [
    feedDesc,
    currentAccount,
    preferences,
    langPrefs,
    activeFilters,
    affiliation,
  ])
}
