import {useCallback, useMemo, useState} from 'react'
import {
  type NativeScrollEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {type AppBskyFeedDefs} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation, useRoute} from '@react-navigation/native'
import {useQuery} from '@tanstack/react-query'

import {
  type CommunityCredential,
  type CommunityMemberSignal,
  deriveCommunityCredentials,
  type ParaProfileStats,
  type ParaStatusView,
} from '#/lib/community-credentials'
import {type NavigationProp} from '#/lib/routes/types'
import {cleanError} from '#/lib/strings/errors'
import {useSearchPostsQuery} from '#/state/queries/search-posts'
import {useAgent} from '#/state/session'
import {Text} from '#/view/com/util/text/Text'
import {PreviewableUserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ListFooter, ListMaybePlaceholder} from '#/components/Lists'

type CommunityBadgeParams = {
  communityId: string
  communityName: string
}

type BadgeHolder = {
  author: AppBskyFeedDefs.PostView['author']
  signal: CommunityMemberSignal
  latestIndexedAt: string
}

type BadgeSection = {
  credential: CommunityCredential
  description: string
  holders: BadgeHolder[]
}

function inferPostType(record: any): 'policy' | 'matter' | undefined {
  if (record?.postType === 'policy' || record?.postType === 'matter') {
    return record.postType
  }

  if (!Array.isArray(record?.flairs)) {
    return undefined
  }

  if (record.flairs.some((tag: string) => tag.includes('#Policy'))) {
    return 'policy'
  }
  if (record.flairs.some((tag: string) => tag.includes('#Matter'))) {
    return 'matter'
  }
  return undefined
}

export function CommunityBadgesScreen() {
  const t = useTheme()
  const {_} = useLingui()
  const agent = useAgent()
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<{
    key: string
    name: 'CommunityBadges'
    params: CommunityBadgeParams
  }>()
  const {communityName = 'Community'} = route.params || {}
  const [isPTR, setIsPTR] = useState(false)

  const {
    data,
    isFetched,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSearchPostsQuery({query: communityName, sort: 'latest'})

  const posts = useMemo(
    () => data?.pages.flatMap(page => page.posts) || [],
    [data],
  )

  const membersByDid = useMemo(() => {
    const map = new Map<string, CommunityMemberSignal>()

    for (const post of posts) {
      const current = map.get(post.author.did)
      const postType = inferPostType(post.record)

      if (!current) {
        map.set(post.author.did, {
          did: post.author.did,
          author: post.author,
          postCount: 1,
          policyPosts: postType === 'policy' ? 1 : 0,
          matterPosts: postType === 'matter' ? 1 : 0,
          latestIndexedAt: post.indexedAt,
        })
        continue
      }

      current.postCount += 1
      if (postType === 'policy') current.policyPosts += 1
      if (postType === 'matter') current.matterPosts += 1
      if (
        new Date(post.indexedAt).getTime() >
        new Date(current.latestIndexedAt).getTime()
      ) {
        current.latestIndexedAt = post.indexedAt
      }
    }

    return map
  }, [posts])

  const profileSignalsQuery = useQuery({
    queryKey: [
      'community-credential-signals',
      communityName,
      Array.from(membersByDid.keys()).sort().join(','),
    ],
    enabled: membersByDid.size > 0,
    queryFn: async () => {
      const out = new Map<
        string,
        {
          status?: ParaStatusView
          stats?: ParaProfileStats
        }
      >()

      await Promise.all(
        Array.from(membersByDid.keys()).map(async did => {
          try {
            const res = await agent.call('com.para.actor.getProfileStats', {
              actor: did,
            })
            const payload = res.data as {
              status?: ParaStatusView
              stats?: ParaProfileStats
            }
            out.set(did, {
              status: payload.status,
              stats: payload.stats,
            })
            return
          } catch {
            // Fall back to raw status lookup for older clients lacking typed para endpoints.
          }

          try {
            const statusRes = await agent.com.atproto.repo.getRecord({
              repo: did,
              collection: 'com.para.status',
              rkey: 'self',
            })
            const status = statusRes.data.value as ParaStatusView
            out.set(did, {status})
          } catch {
            out.set(did, {})
          }
        }),
      )

      return out
    },
  })

  const badgeSections = useMemo<BadgeSection[]>(() => {
    const sections = new Map<
      string,
      {
        credential: CommunityCredential
        holders: Map<string, BadgeHolder>
      }
    >()

    for (const [did, baseSignal] of membersByDid.entries()) {
      const profileSignal = profileSignalsQuery.data?.get(did)
      const signal: CommunityMemberSignal = {
        ...baseSignal,
        status: profileSignal?.status,
        stats: profileSignal?.stats,
      }
      const credentials = deriveCommunityCredentials(signal, communityName)

      for (const credential of credentials) {
        let section = sections.get(credential.id)
        if (!section) {
          section = {
            credential,
            holders: new Map(),
          }
          sections.set(credential.id, section)
        }

        const existingHolder = section.holders.get(did)
        if (!existingHolder) {
          section.holders.set(did, {
            author: signal.author,
            signal,
            latestIndexedAt: signal.latestIndexedAt,
          })
        } else if (
          new Date(signal.latestIndexedAt).getTime() >
          new Date(existingHolder.latestIndexedAt).getTime()
        ) {
          existingHolder.latestIndexedAt = signal.latestIndexedAt
          existingHolder.signal = signal
        }
      }
    }

    return Array.from(sections.values())
      .map(section => ({
        credential: section.credential,
        description: section.credential.description,
        holders: Array.from(section.holders.values()).sort((left, right) => {
          if (right.signal.postCount !== left.signal.postCount) {
            return right.signal.postCount - left.signal.postCount
          }
          return (
            new Date(right.latestIndexedAt).getTime() -
            new Date(left.latestIndexedAt).getTime()
          )
        }),
      }))
      .sort((left, right) => {
        const levelOrder = {governance: 0, stewardship: 1, contributor: 2}
        if (
          levelOrder[left.credential.level] !== levelOrder[right.credential.level]
        ) {
          return (
            levelOrder[left.credential.level] - levelOrder[right.credential.level]
          )
        }
        return right.holders.length - left.holders.length
      })
  }, [communityName, membersByDid, profileSignalsQuery.data])

  const holderCount = useMemo(() => {
    const dids = new Set<string>()
    for (const section of badgeSections) {
      for (const holder of section.holders) {
        dids.add(holder.author.did)
      }
    }
    return dids.size
  }, [badgeSections])

  const onRefresh = useCallback(async () => {
    setIsPTR(true)
    await refetch()
    setIsPTR(false)
  }, [refetch])
  const onPullToRefresh = useCallback(() => {
    void onRefresh()
  }, [onRefresh])

  const onMaybeLoadMore = useCallback(
    ({layoutMeasurement, contentOffset, contentSize}: NativeScrollEvent) => {
      if (
        isFetchingNextPage ||
        !hasNextPage ||
        layoutMeasurement.height + contentOffset.y < contentSize.height - 120
      ) {
        return
      }
      void fetchNextPage()
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  return (
    <Layout.Screen testID="communityBadgesScreen" style={t.atoms.bg}>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Community Credentials</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      {!badgeSections.length &&
      (isLoading || !isFetched || isError || profileSignalsQuery.isLoading) ? (
        <ListMaybePlaceholder
          isLoading={isLoading || !isFetched || profileSignalsQuery.isLoading}
          isError={isError}
          onRetry={() => refetch()}
          emptyType="results"
          emptyMessage={_(
            msg`We couldn't resolve enough member activity for this community yet.`,
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isPTR}
              onRefresh={onPullToRefresh}
              tintColor={t.palette.primary_500}
            />
          }
          onScroll={({nativeEvent}) => onMaybeLoadMore(nativeEvent)}
          scrollEventThrottle={400}>
          <View
            style={[
              styles.summaryCard,
              t.atoms.bg_contrast_25,
              t.atoms.border_contrast_low,
            ]}>
            <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
              p/{communityName}
            </Text>
            <Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_medium]}>
              {badgeSections.length} credential types, {holderCount} visible members
            </Text>
            <Text style={[a.text_sm, a.mt_sm, t.atoms.text_contrast_medium]}>
              Credentials are assigned to people from community participation and
              Para actor status/profile signals.
            </Text>
          </View>

          {badgeSections.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
              ]}>
              <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
                <Trans>No credentials yet</Trans>
              </Text>
              <Text style={[a.text_sm, a.mt_xs, t.atoms.text_contrast_medium]}>
                <Trans>
                  As soon as members post and profile signals are available,
                  credential holders will appear here.
                </Trans>
              </Text>
            </View>
          ) : (
            badgeSections.map(section => (
              <View
                key={section.credential.id}
                style={[
                  styles.sectionCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <View style={[a.flex_row, a.align_center, a.justify_between]}>
                  <View
                    style={[
                      styles.badgePill,
                      {backgroundColor: section.credential.bgColor},
                    ]}>
                    <Text
                      style={[
                        a.text_sm,
                        a.font_bold,
                        {color: section.credential.color},
                      ]}>
                      {section.credential.label}
                    </Text>
                  </View>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    {section.holders.length} members
                  </Text>
                </View>

                <Text style={[a.text_sm, a.mt_sm, t.atoms.text_contrast_medium]}>
                  {section.description}
                </Text>

                <View style={[a.mt_md, a.gap_sm]}>
                  {section.holders.map(holder => (
                    <TouchableOpacity
                      key={`${section.credential.id}:${holder.author.did}`}
                      accessibilityRole="button"
                      onPress={() =>
                        navigation.navigate('Profile', {
                          name: holder.author.handle,
                        })
                      }
                      style={[
                        styles.holderRow,
                        t.atoms.bg_contrast_25,
                        t.atoms.border_contrast_low,
                      ]}>
                      <PreviewableUserAvatar
                        size={38}
                        profile={holder.author}
                        type={holder.author.associated?.labeler ? 'labeler' : 'user'}
                        moderation={undefined}
                        disableHoverCard
                      />
                      <View style={[a.flex_1, a.ml_md]}>
                        <Text style={[a.text_md, a.font_bold, t.atoms.text]}>
                          {holder.author.displayName || holder.author.handle}
                        </Text>
                        <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                          @{holder.author.handle}
                        </Text>
                      </View>
                      <View style={[a.align_end]}>
                        <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                          {holder.signal.postCount} posts
                        </Text>
                        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                          {holder.signal.status?.party || 'Independent'}
                        </Text>
                        <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                          {new Date(holder.latestIndexedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}

          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            error={cleanError(error)}
            onRetry={() => fetchNextPage()}
          />
        </ScrollView>
      )}
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  badgePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  holderRow: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
