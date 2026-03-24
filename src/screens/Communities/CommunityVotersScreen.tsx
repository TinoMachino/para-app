import {useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useRoute} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {TOP_POLICIES, VOTERS as MOCK_VOTERS} from '#/lib/mock-data'
import {List} from '#/view/com/util/List'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron'
import * as Layout from '#/components/Layout'

function VoteBadge({
  vote,
  size = 'normal',
}: {
  vote: number
  size?: 'small' | 'normal'
}) {
  const t = useTheme()
  let color = t.atoms.text.color
  let bg = t.atoms.bg_contrast_25.backgroundColor

  if (vote > 0) {
    color = '#fff'
    bg = t.palette.primary_500
  } else if (vote < 0) {
    color = '#fff'
    bg = '#E11D48'
  }

  const badgeSize = size === 'small' ? 24 : 32
  const fontSize = size === 'small' ? 11 : 14

  return (
    <View
      style={[
        styles.voteBadge,
        {
          backgroundColor: bg,
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
        },
      ]}>
      <Text style={[styles.voteText, {color: color, fontSize}]}>
        {vote > 0 ? '+' : ''}
        {vote}
      </Text>
    </View>
  )
}

function VoteDetailRow({
  policyTitle,
  vote,
}: {
  policyTitle: string
  vote: number
}) {
  const pal = usePalette('default')
  const t = useTheme()

  return (
    <View
      style={[
        styles.voteDetailRow,
        {borderBottomColor: t.atoms.border_contrast_low.borderColor},
      ]}>
      <Text numberOfLines={1} style={[a.flex_1, a.text_sm, pal.text]}>
        {policyTitle}
      </Text>
      <VoteBadge vote={vote} size="small" />
    </View>
  )
}

function VoterRow({item}: {item: (typeof MOCK_VOTERS)[0]}) {
  const t = useTheme()
  const pal = usePalette('default')
  const [expanded, setExpanded] = useState(false)

  const toggleExpand = () => setExpanded(!expanded)

  return (
    <View style={[a.border_t, t.atoms.border_contrast_low]}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={toggleExpand}
        style={[a.flex_row, a.align_center, a.py_md, a.px_xl]}>
        <UserAvatar type="user" avatar={item.avatar} size={44} />
        <View style={[a.flex_1, a.ml_md]}>
          <Text style={[a.font_bold, a.text_md, pal.text]}>
            {item.displayName || item.handle}
          </Text>
          <Text style={[a.text_sm, pal.textLight]}>@{item.handle}</Text>
          <View style={[a.flex_row, a.align_center, a.mt_xs, a.gap_sm]}>
            <Text style={[a.text_xs, pal.textLight]}>
              {item.totalVotes} votes
            </Text>
            <Text
              style={[
                a.text_xs,
                {color: item.avgScore >= 0 ? t.palette.primary_500 : '#E11D48'},
              ]}>
              Avg: {item.avgScore >= 0 ? '+' : ''}
              {item.avgScore.toFixed(1)}
            </Text>
          </View>
        </View>
        <View style={[a.flex_row, a.align_center, a.gap_sm]}>
          {/* Mini vote distribution preview */}
          <View style={styles.miniVotePreview}>
            {item.votes.slice(0, 3).map((v, i) => (
              <View
                key={i}
                style={[
                  styles.miniVoteDot,
                  {
                    backgroundColor:
                      v.vote > 0
                        ? t.palette.primary_500
                        : v.vote < 0
                          ? '#E11D48'
                          : t.palette.contrast_300,
                  },
                ]}
              />
            ))}
            {item.votes.length > 3 && (
              <Text style={[a.text_xs, pal.textLight]}>
                +{item.votes.length - 3}
              </Text>
            )}
          </View>
          {expanded ? (
            <ChevronUpIcon size="sm" style={{color: pal.textLight.color}} />
          ) : (
            <ChevronDownIcon size="sm" style={{color: pal.textLight.color}} />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Detail View */}
      {expanded && (
        <View style={[styles.expandedSection, t.atoms.bg_contrast_25]}>
          <Text style={[a.text_xs, a.font_bold, a.mb_sm, pal.textLight]}>
            <Trans>VOTE BREAKDOWN</Trans>
          </Text>
          {item.votes.map((voteItem, _index) => (
            <VoteDetailRow
              key={voteItem.policyId}
              policyTitle={voteItem.policyTitle}
              vote={voteItem.vote}
            />
          ))}
        </View>
      )}
    </View>
  )
}

export function CommunityVotersScreen() {
  const t = useTheme()
  const pal = usePalette('default')
  const route = useRoute<any>()
  const {communityName = 'Community'} = route.params || {}
  useLingui()

  const renderHeader = useMemo(() => {
    return (
      <View style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
        {/* Summary Stats */}
        <View style={[a.flex_row, a.gap_md, a.mb_lg]}>
          <View style={[styles.summaryCard, t.atoms.bg_contrast_25]}>
            <Text style={[a.text_2xl, a.font_bold, pal.text]}>763</Text>
            <Text style={[a.text_xs, pal.textLight]}>Total Voters</Text>
          </View>
          <View style={[styles.summaryCard, t.atoms.bg_contrast_25]}>
            <Text
              style={[a.text_2xl, a.font_bold, {color: t.palette.primary_500}]}>
              +1.4
            </Text>
            <Text style={[a.text_xs, pal.textLight]}>Avg Score</Text>
          </View>
          <View style={[styles.summaryCard, t.atoms.bg_contrast_25]}>
            <Text style={[a.text_2xl, a.font_bold, pal.text]}>2.8k</Text>
            <Text style={[a.text_xs, pal.textLight]}>Total Votes</Text>
          </View>
        </View>

        <Text style={[a.text_lg, a.font_bold, a.mb_md, pal.text]}>
          <Trans>Most Voted Policies</Trans>
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[a.gap_md]}>
          {TOP_POLICIES.map(policy => (
            <View
              key={policy.id}
              style={[
                styles.policyCard,
                t.atoms.bg_contrast_25,
                t.atoms.border_contrast_low,
              ]}>
              <Text
                numberOfLines={2}
                style={[a.text_md, a.font_bold, a.mb_sm, pal.text]}>
                {policy.title}
              </Text>
              <View style={[a.flex_row, a.justify_between, a.mb_xs]}>
                <Text style={[a.text_sm, pal.textLight]}>
                  {policy.votes} votes
                </Text>
                <Text
                  style={[
                    a.text_sm,
                    a.font_bold,
                    {
                      color:
                        policy.avgScore >= 0
                          ? t.palette.primary_500
                          : '#E11D48',
                    },
                  ]}>
                  Avg: {policy.avgScore >= 0 ? '+' : ''}
                  {policy.avgScore.toFixed(1)}
                </Text>
              </View>
              <View
                style={[
                  styles.progressBarBG,
                  {backgroundColor: t.palette.contrast_100},
                ]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${policy.percentage}%`,
                      backgroundColor: t.palette.primary_500,
                    },
                  ]}
                />
              </View>
              <Text style={[a.text_xs, a.mt_xs, pal.textLight, a.text_center]}>
                {policy.percentage}% has voted
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={[a.flex_row, a.justify_between, a.align_center, a.mt_xl]}>
          <Text style={[a.text_lg, a.font_bold, pal.text]}>
            <Trans>Voters</Trans>
          </Text>
          <Text style={[a.text_xs, pal.textLight]}>
            <Trans>Tap to see vote breakdown</Trans>
          </Text>
        </View>
      </View>
    )
  }, [t, pal])

  return (
    <Layout.Screen testID="communityVotersScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {communityName} Voters
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <List
        data={MOCK_VOTERS}
        renderItem={({item}) => <VoterRow item={item} />}
        keyExtractor={item => item.did}
        ListHeaderComponent={renderHeader}
      />
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  policyCard: {
    width: 180,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressBarBG: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  voteBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteText: {
    fontWeight: 'bold',
  },
  miniVotePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniVoteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandedSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  voteDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})
