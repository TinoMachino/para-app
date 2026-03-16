import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type AppBskyFeedDefs} from '@atproto/api'
import {AtUri} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

// Fallback mock data when no AT Proto posts are found
import {OPEN_QUESTIONS} from '#/lib/mock-data'
import {type NavigationProp} from '#/lib/routes/types'
import {useOpenQuestions} from '#/state/queries/useOpenQuestions'
import {Text} from '#/view/com/util/text/Text'
import {TimeElapsed} from '#/view/com/util/TimeElapsed'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'

// Fallback mock data when no AT Proto posts are found
const FALLBACK_QUESTIONS = OPEN_QUESTIONS.map(q => ({
  ...q,
  isMock: true,
}))

export default function OpenQuestionsListScreen() {
  const t = useTheme()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const insets = useSafeAreaInsets()

  // Fetch real Open Questions from AT Proto
  const {data: openQuestions, isLoading, error} = useOpenQuestions()

  // Transform AT Proto posts to our display format
  const questions =
    openQuestions && openQuestions.length > 0
      ? openQuestions.map((post: AppBskyFeedDefs.PostView) => ({
          id: post.uri,
          text:
            (post.record as {text?: string})?.text?.replace(
              /\|#\?OpenQuestion/g,
              '',
            ) || '',
          author: {
            handle: post.author.handle,
            avatar: post.author.avatar || '',
          },
          replyCount: post.replyCount || 0,
          timestamp: post.indexedAt,
          isMock: false,
          post, // Keep original for navigation
        }))
      : FALLBACK_QUESTIONS

  const navigateToPost = (item: (typeof questions)[0]) => {
    if (item.isMock) {
      // Navigate to mock screen for fallback data
      navigation.navigate('OpenQuestionThread', {id: item.id})
    } else {
      // Navigate to real PostThread for AT Proto posts
      const urip = new AtUri(item.id)
      navigation.navigate('PostThread', {
        name: urip.host,
        rkey: urip.rkey,
      })
    }
  }

  const renderItem = ({item}: {item: (typeof questions)[0]}) => (
    <TouchableOpacity
      accessibilityRole="button"
      style={[styles.card, t.atoms.bg_contrast_25, t.atoms.border_contrast_low]}
      onPress={() => navigateToPost(item)}>
      <View style={styles.header}>
        <UserAvatar size={24} type="user" avatar={item.author.avatar} />
        <Text style={[t.atoms.text_contrast_medium, a.text_sm]}>
          @{item.author.handle} ·{' '}
          {item.isMock ? (
            item.timestamp
          ) : (
            <TimeElapsed timestamp={item.timestamp}>
              {({timeElapsed}) => <>{timeElapsed}</>}
            </TimeElapsed>
          )}
        </Text>
      </View>
      <Text style={[t.atoms.text, a.text_md, a.font_bold, styles.questionText]}>
        {item.text.trim()}
      </Text>
      <View style={styles.footer}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <RedditVoteButton
            score={item.replyCount * 2}
            currentVote="none"
            hasBeenToggled={false}
            onUpvote={() => console.log('Upvote')}
            onDownvote={() => console.log('Downvote')}
          />
          <Text style={[t.atoms.text_contrast_medium, a.text_sm]}>
            <Trans>{item.replyCount} replies</Trans>
          </Text>
        </View>
        <Button
          label={_(msg`Reply`)}
          size="tiny"
          variant="ghost"
          color="secondary"
          onPress={() => navigateToPost(item)}>
          <ButtonText>
            <Trans>Reply</Trans>
          </ButtonText>
        </Button>
      </View>
    </TouchableOpacity>
  )

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Open Questions</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Button
          label={_(msg`Add`)}
          size="small"
          variant="solid"
          color="primary"
          onPress={() => navigation.navigate('CreatePost')}>
          <ButtonText>
            <Trans>Add</Trans>
          </ButtonText>
        </Button>
      </Layout.Header.Outer>

      <Layout.Center style={{flex: 1}}>
        {isLoading ? (
          <View style={[a.flex_1, a.justify_center, a.align_center]}>
            <Text style={[t.atoms.text_contrast_medium]}>
              <Trans>Loading...</Trans>
            </Text>
          </View>
        ) : error ? (
          <View style={[a.flex_1, a.justify_center, a.align_center]}>
            <Text style={[t.atoms.text_contrast_medium]}>
              <Trans>Could not load questions</Trans>
            </Text>
          </View>
        ) : (
          <FlatList
            data={questions}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              styles.container,
              {paddingBottom: insets.bottom + 100},
            ]}
          />
        )}
      </Layout.Center>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionText: {
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
})
