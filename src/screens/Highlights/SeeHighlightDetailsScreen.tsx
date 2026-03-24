import {useCallback, useMemo} from 'react'
import {Image, StyleSheet, View} from 'react-native'
import {
  type AppBskyFeedDefs,
  AppBskyFeedPost,
  RichText as RichTextAPI,
} from '@atproto/api'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {NINTHS_COMMUNITIES} from '#/lib/communities'
import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {MOCK_HIGHLIGHTS} from '#/lib/mock-highlights'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {FeedFeedbackProvider, useFeedFeedback} from '#/state/feed-feedback'
import {useHighlights} from '#/state/highlights/useHighlights'
import {useHighlightVoteMutation} from '#/state/mutations/highlights'
import {useHighlightQuery} from '#/state/queries/highlights'
import {
  PostThreadContextProvider,
  usePostThread,
} from '#/state/queries/usePostThread'
import {useSession} from '#/state/session'
import {List} from '#/view/com/util/List'
import {Text} from '#/view/com/util/text/Text'
import {ThreadItemPost} from '#/screens/PostThread/components/ThreadItemPost'
import {useTheme} from '#/alf'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowShareRight'
import {Bookmark, BookmarkFilled} from '#/components/icons/Bookmark'
import {BubbleQuestion_Stroke2_Corner0_Rounded as TranslateIcon} from '#/components/icons/Bubble'
import {Clipboard_Stroke2_Corner2_Rounded as ClipboardIcon} from '#/components/icons/Clipboard'
import {DotGrid_Stroke2_Corner0_Rounded as MoreIcon} from '#/components/icons/DotGrid'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import * as Menu from '#/components/Menu'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from '#/components/PostControls/PostControlButton'
import {PostMenuButton} from '#/components/PostControls/PostMenu'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'
import * as Toast from '#/components/Toast'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'SeeHighlightDetails'
>

// Helper function to extract highlight data from feed

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

// Darken a hex color by a factor (0-1)

export function SeeHighlightDetailsScreen({route}: Props) {
  const t = useTheme()
  const {highlightId} = route.params
  const {mutate: voteHighlight} = useHighlightVoteMutation()
  const initialNumToRender = useInitialNumToRender()
  const {openComposer} = useOpenComposer()
  const {hasSession, currentAccount} = useSession()
  const feedFeedback = useFeedFeedback(undefined, hasSession)

  // Persistence
  const {highlights, addHighlight, removeHighlight} = useHighlights(highlightId)
  const isSaved = highlights.length > 0
  const {data: remoteHighlight} = useHighlightQuery(
    isHighlightRecordUri(highlightId) ? highlightId : undefined,
  )

  // Fetch full thread for the post behind this highlight.
  const isRealUri = highlightId.startsWith('at://')
  const sourceUri =
    remoteHighlight?.sourcePostUri ||
    (isRealUri && !isHighlightRecordUri(highlightId) ? highlightId : undefined)
  const {data: threadData, context: threadContext} = usePostThread({
    anchor: sourceUri,
  })

  const {post, record, richText} = useMemo(() => {
    const anchorItem = threadData?.items.find(
      item => item.type === 'threadPost' && item.uri === sourceUri,
    )
    if (
      anchorItem &&
      anchorItem.type === 'threadPost' &&
      AppBskyFeedPost.isRecord(anchorItem.value.post.record)
    ) {
      const p = anchorItem.value.post as any
      const r = anchorItem.value.post.record
      return {
        post: p,
        record: r,
        richText: new RichTextAPI({
          text: r.text,
          facets: r.facets,
        }),
      }
    }
    return {post: null, record: null, richText: null}
  }, [threadData, sourceUri])

  // Derive highlight data
  const highlight = useMemo(() => {
    if (remoteHighlight) {
      return remoteHighlight
    }

    // 1. Fallback: derive from fetched post when the route points directly to a post URI.
    if (sourceUri && threadData?.items) {
      const anchorItem = threadData.items.find(
        item => item.type === 'threadPost' && item.uri === sourceUri,
      )

      if (anchorItem && anchorItem.type === 'threadPost') {
        const post = anchorItem.value.post
        const record = post.record as any // Cast to access text
        const text = (record.text as string) || ''
        const tags = text.match(/#\w+/g) || []

        let community = 'Unknown'
        let state: string | undefined
        let color = '#888888'

        for (const tag of tags) {
          const cleanTag = tag.substring(1)
          const matchingComm = Object.values(NINTHS_COMMUNITIES).find(
            c =>
              c.name.replace(/\s+/g, '').toLowerCase() ===
              cleanTag.toLowerCase(),
          )
          if (matchingComm) {
            community = matchingComm.name
            color = matchingComm.color
          } else {
            state = cleanTag
          }
        }

        return {
          id: post.uri,
          text: text, // Full text
          postAuthor: post.author.handle,
          authorName: post.author.displayName || post.author.handle,
          avatarUrl: post.author.avatar || 'https://i.pravatar.cc/150',
          postPreview: '', // We use full text now
          color: color as any,
          community,
          state: state || 'Unknown',
          createdAt: new Date(post.indexedAt).getTime(),
          upvotes: post.likeCount || 0,
          downvotes: 0,
          saves: post.repostCount || 0,
          replyCount: post.replyCount || 0,
          isVerified: !!post.author.viewer?.followedBy,
          isTrending: (post.likeCount || 0) > 0,
          viewerHasUpvoted: !!post.viewer?.like,
          viewerHasDownvoted: false,
          // viewerHasSaved is handled by our local persistence now
        }
      }
    }

    // 2. Fallback to mock data or passed params
    return MOCK_HIGHLIGHTS.find(h => h.id === highlightId) || null
  }, [remoteHighlight, sourceUri, threadData, highlightId])

  // Highlight text splitting logic
  const {textParts, highlightPart, fullContent} = useMemo(() => {
    if (!highlight) return {textParts: [], highlightPart: '', fullContent: ''}

    // Determine Full Content vs Snippet
    // For mocks, text is snippet, postPreview is full text (if present).
    // For real posts, text is full text.
    let fullText = highlight.text
    let snippet = highlight.text

    if (
      highlight.postPreview &&
      highlight.postPreview.length > highlight.text.length
    ) {
      fullText = highlight.postPreview
      snippet = highlight.text
    }

    // If we have saved highlight range (from persistence), prioritize that
    if (highlights.length > 0) {
      const h = highlights[0]
      if (h.end > h.start && fullText.length >= h.end) {
        const before = fullText.slice(0, h.start)
        const hl = fullText.slice(h.start, h.end)
        const after = fullText.slice(h.end)
        return {
          textParts: [before, after],
          highlightPart: hl,
          fullContent: fullText,
        }
      }
    }

    // Otherwise, try to match the snippet in the full text
    if (fullText.includes(snippet) && snippet !== fullText) {
      const parts = fullText.split(snippet)
      // Limitation: only highlighting first occurrence for now
      if (parts.length >= 2) {
        const before = parts[0]
        const after = parts.slice(1).join(snippet) // Join rest in case of multiple
        return {
          textParts: [before, after],
          highlightPart: snippet,
          fullContent: fullText,
        }
      }
    }

    // Fallback: Show entire text as highlight or just text
    return {textParts: [fullText], highlightPart: '', fullContent: fullText}
  }, [highlight, highlights])

  const toggleSave = useCallback(() => {
    if (isSaved) {
      if (highlights.length > 0) {
        removeHighlight(highlights[0].id)
      }
    } else {
      if (!highlight) return
      // We save the whole thing as a dummy or...
      // Ideally we save the "snippet".
      // Since we might not have the snippet if we just fetched the full post,
      // let's save the whole post as a highlight for now (start:0, end: length).
      addHighlight(
        0,
        highlight.text.length,
        highlight.color || '#FEF08A',
        false,
        highlight.text,
        highlight.community,
      )
    }
  }, [isSaved, highlight, highlights, addHighlight, removeHighlight])

  // Optimistic vote state
  const [localVote, setLocalVote] = useState<'up' | 'down' | 'none'>('none')

  const voteAdjustedScore = useMemo(() => {
    if (!highlight) return 0
    const base = highlight.upvotes - (highlight.downvotes || 0)
    if (localVote === 'up' && !highlight.viewerHasUpvoted) return base + 1
    if (localVote === 'down' && !highlight.viewerHasDownvoted) return base - 1
    return base
  }, [highlight, localVote])

  const currentVoteState = useMemo(() => {
    if (localVote !== 'none') return localVote === 'up' ? 'upvote' : 'downvote'
    if (!highlight) return 'none'
    if (highlight.viewerHasUpvoted) return 'upvote'
    if (highlight.viewerHasDownvoted) return 'downvote'
    return 'none'
  }, [highlight, localVote])

  const handleVote = useCallback(
    (direction: 'up' | 'down') => {
      setLocalVote(prev => (prev === direction ? 'none' : direction))
      voteHighlight({id: highlightId, direction})
    },
    [voteHighlight, highlightId],
  )

  const slices = useMemo(() => {
    return (threadData?.items || []).filter(
      item => item.type === 'threadPost' && item.depth > 0,
    ) as Extract<AppBskyFeedDefs.ThreadViewPost, {type: 'threadPost'}>[]
  }, [threadData])

  const renderItem = useCallback(
    ({item}: {item: any}) => {
      return (
        <ThreadItemPost
          item={item}
          threadgateRecord={threadData?.threadgate?.record ?? undefined}
        />
      )
    },
    [threadData],
  )

  const header = useMemo(() => {
    if (!highlight) return null
    return (
      <View style={styles.content}>
        {/* 1. The Highlight (Quote) with Nested Source */}
        <View
          style={[
            styles.card,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
          ]}>
          {/* Header: Highlight Author */}
          <View style={styles.cardHeader}>
            <Image
              accessibilityIgnoresInvertColors
              source={{uri: highlight.avatarUrl}}
              style={styles.cardAvatar}
            />
            <View style={{flex: 1}}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Text style={[styles.cardName, t.atoms.text]} numberOfLines={1}>
                  {highlight.authorName}
                </Text>
                {highlight.isVerified && (
                  <VerifiedIcon
                    width={14}
                    height={14}
                    style={{color: t.palette.primary_500}}
                  />
                )}
              </View>
              <Text
                style={[styles.cardHandle, t.atoms.text_contrast_low]}
                numberOfLines={1}>
                @{highlight.postAuthor}
              </Text>
            </View>
            <Text style={[styles.cardTime, t.atoms.text_contrast_low]}>
              {formatRelativeTime(highlight.createdAt)}
            </Text>
          </View>

          {/* Quote Snippet (Title/Comment) */}
          <View style={{marginTop: 12}}>
            <Text style={[styles.highlightText, t.atoms.text]}>
              "{highlightPart || highlight.text}"
            </Text>
          </View>

          {/* Embedded Source Post */}
          <View
            style={[
              styles.embedCard,
              {borderColor: t.atoms.border_contrast_low.borderColor},
            ]}>
            <View style={styles.embedHeader}>
              <Image
                accessibilityIgnoresInvertColors
                source={{uri: highlight.avatarUrl}}
                style={styles.embedAvatar}
              />
              <View style={{flex: 1}}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                  <Text
                    style={[styles.embedName, t.atoms.text]}
                    numberOfLines={1}>
                    {highlight.authorName}
                  </Text>
                  <Text
                    style={[styles.embedHandle, t.atoms.text_contrast_low]}
                    numberOfLines={1}>
                    @{highlight.postAuthor}
                  </Text>
                </View>
              </View>
              <Text style={[styles.embedTime, t.atoms.text_contrast_low]}>
                {formatRelativeTime(highlight.createdAt)}
              </Text>
            </View>

            <Text style={[styles.embedText, t.atoms.text]}>
              {textParts.length > 1 ? (
                <>
                  {textParts[0]}
                  <Text style={{color: highlight.color, fontWeight: '700'}}>
                    {highlightPart}
                  </Text>
                  {textParts[1]}
                </>
              ) : (
                fullContent || highlight.text
              )}
            </Text>
          </View>
        </View>

        {/* Engagement & Actions (Controls) */}
        <View
          style={[
            styles.card,
            t.atoms.bg_contrast_25,
            t.atoms.border_contrast_low,
          ]}>
          <View style={styles.controlsRow}>
            {/* Vote */}
            <View style={styles.voteSection}>
              <RedditVoteButton
                score={voteAdjustedScore}
                currentVote={currentVoteState}
                hasBeenToggled={localVote !== 'none'}
                onUpvote={() => handleVote('up')}
                onDownvote={() => handleVote('down')}
              />
            </View>

            {/* Reply */}
            <PostControlButton
              testID="replyBtn"
              label="Reply"
              onPress={() => {
                if (post && record) {
                  openComposer({
                    replyTo: {
                      uri: post.uri,
                      cid: post.cid,
                      text: record.text,
                      author: post.author,
                      embed: post.embed,
                      moderation:
                        threadData?.items?.find(
                          i => i.type === 'threadPost' && i.uri === post.uri,
                        )?.type === 'threadPost'
                          ? (
                              threadData?.items?.find(
                                i =>
                                  i.type === 'threadPost' && i.uri === post.uri,
                              ) as any
                            ).moderation
                          : undefined,
                      langs: record.langs,
                    },
                    logContext: 'PostReply',
                  })
                } else if (highlight) {
                  const mention =
                    highlight.postAuthor === currentAccount?.handle
                      ? undefined
                      : highlight.postAuthor
                  openComposer({
                    mention,
                    logContext: 'PostReply',
                  })
                }
              }}>
              <PostControlButtonIcon icon={MessageIcon} />
              <PostControlButtonText>
                {highlight.replyCount || 0}
              </PostControlButtonText>
            </PostControlButton>

            {/* Save */}
            <PostControlButton
              testID="saveBtn"
              label={isSaved ? 'Unsave highlight' : 'Save highlight'}
              onPress={toggleSave}
              active={isSaved}
              activeColor={t.palette.primary_500}>
              <PostControlButtonIcon
                icon={isSaved ? BookmarkFilled : Bookmark}
              />
              <PostControlButtonText>
                {isSaved ? 'Saved' : 'Save'}
              </PostControlButtonText>
            </PostControlButton>

            {/* Share */}
            <PostControlButton
              testID="shareBtn"
              label="Share highlight"
              onPress={() => {}}>
              <PostControlButtonIcon icon={ShareIcon} />
            </PostControlButton>

            {/* More / Menu */}
            {post && record && richText ? (
              <PostMenuButton
                testID="moreBtn"
                post={post}
                postFeedContext={undefined}
                postReqId={undefined}
                big={true}
                record={record}
                richText={richText}
                timestamp={post.indexedAt}
                logContext="Post"
              />
            ) : (
              <Menu.Root>
                <Menu.Trigger label="Open post options menu">
                  {({props}) => (
                    <PostControlButton
                      testID="moreBtn"
                      label="More options"
                      {...props}>
                      <PostControlButtonIcon icon={MoreIcon} />
                    </PostControlButton>
                  )}
                </Menu.Trigger>
                <Menu.Outer>
                  <Menu.Group>
                    <Menu.Item
                      label="Translate"
                      onPress={() => Toast.show('Translate (Mock)')}>
                      <Menu.ItemText>Translate</Menu.ItemText>
                      <Menu.ItemIcon icon={TranslateIcon} />
                    </Menu.Item>
                    <Menu.Item
                      label="Copy post text"
                      onPress={() => Toast.show('Copied to clipboard (Mock)')}>
                      <Menu.ItemText>Copy post text</Menu.ItemText>
                      <Menu.ItemIcon icon={ClipboardIcon} />
                    </Menu.Item>
                  </Menu.Group>
                </Menu.Outer>
              </Menu.Root>
            )}
          </View>
        </View>

        <View style={styles.commentsHeader}>
          <Text style={[styles.commentsTitle, t.atoms.text_contrast_medium]}>
            Comments
          </Text>
        </View>
      </View>
    )
  }, [
    highlight,
    t,
    highlightPart,
    highlightId,
    textParts,
    fullContent,
    voteAdjustedScore,
    currentVoteState,
    localVote,
    handleVote,
    isSaved,
    toggleSave,
    post,
    record,
    richText,
    openComposer,
    threadData,
    currentAccount?.handle,
  ])

  if (!highlight) {
    return (
      <Layout.Screen>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Highlight</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <Layout.Content>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, t.atoms.text_contrast_medium]}>
              Highlight not found.
            </Text>
          </View>
        </Layout.Content>
      </Layout.Screen>
    )
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Highlight</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Content>
        <PostThreadContextProvider context={threadContext as any}>
          <FeedFeedbackProvider value={feedFeedback}>
            <List
              data={slices}
              renderItem={renderItem}
              ListHeaderComponent={header}
              keyExtractor={item => item.key}
              initialNumToRender={initialNumToRender}
              contentContainerStyle={{paddingBottom: 40}}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Text
                    style={[styles.emptyText, t.atoms.text_contrast_medium]}>
                    No comments yet.
                  </Text>
                </View>
              }
            />
          </FeedFeedbackProvider>
        </PostThreadContextProvider>
      </Layout.Content>
    </Layout.Screen>
  )
}

function isHighlightRecordUri(uri: string) {
  return uri.includes('/com.para.highlight.annotation/')
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Common Card Style
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  // Highlight Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardHandle: {
    fontSize: 14,
  },
  cardTime: {
    fontSize: 12,
    marginLeft: 'auto',
  },

  // Highlight Text
  highlightText: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 26,
  },
  commentsHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 8,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyComments: {
    padding: 40,
    alignItems: 'center',
  },

  // Embed Card (Reddit Style)
  embedCard: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  embedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  embedAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
  },
  embedName: {
    fontSize: 13,
    fontWeight: '700',
  },
  embedHandle: {
    fontSize: 12,
    opacity: 0.8,
  },
  embedTime: {
    fontSize: 11,
    marginLeft: 'auto',
    opacity: 0.7,
  },
  embedText: {
    fontSize: 14, // Slightly smaller
    lineHeight: 20,
  },

  // Source Card
  sourceLabelRow: {
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  voteSection: {
    //
  },

  // Related
  relatedCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  relatedPlaceholder: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },

  // Flairs (retained for usage in SourceCard if needed, though mostly simplified)
  // We used only `sourceAuthorRow` etc below?
  // I need to check if I used `styles.authorFlairSmall` in previous step's JSX.
  // I did not use authorFlairSmall in the REDESIGNED HighlightCard, but I used it in SourceCard?
  // Let's check the JSX replacement.
  // Source Card JSX:
  // ... sourceLabelRow ...
  // ... sourceText ...
  // Wait, I simplified Source Card in the previous step?
  // Let's check Step 1828 replacement content for Source Card.
  // It has `sourceLabelRow` and `sourceText`.
  // IT DOES NOT HAVE THE COMPLEX AUTHOR ROW in the replacement!
  // I simplified it to just Text?
  // "View style={styles.sourceLabelRow} ... Text Original Post"
  // "Text style={styles.sourceText} ... content ..."
  // I REMOVED the Source Author Row in the JSX replacement!
  // This means I don't need `sourceAuthorRow` styles.
  // The user said "Source Post ... stacked". Usually source post has author.
  // But my plan said "Source Post... Standard visuals (Avatar, Name)".
  // Did I miss adding the author row in the JSX?
  // Step 1828 JSX for Source Card:
  /*
          <View style={[styles.card, t.atoms.bg_contrast_25, t.atoms.border_contrast_low]}>
             <View style={styles.sourceLabelRow}>
               <Text style={[styles.sectionTitle, t.atoms.text_contrast_low]}>Original Post</Text>
             </View>
            
             <Text style={[styles.sourceText, t.atoms.text]}>
                ...
             </Text>
          </View>
  */
  // Yes, I omitted the author row in the Source Card in the previous step.
  // The Highlight Card has the author row (which is the source author).
  // If I show it again in Source Card, it's repetitive.
  // "Alice quoted..." -> "Alice said..."
  // So maybe it's fine.
  // I'll keep it simple for now as per my implementation in step 1828.
  // So I don't need `sourceAuthorRow`, `sourceAvatar` etc.
})
