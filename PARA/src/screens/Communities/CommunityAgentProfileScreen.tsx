import {useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {type RouteProp, useNavigation, useRoute} from '@react-navigation/native'

import {
  COMMUNITY_AGENT_POSTS,
  COMMUNITY_AGENT_PROFILE,
} from '#/lib/mock-data/community-agent'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {useProfileQuery} from '#/state/queries/profile'
import {useTheme} from '#/alf'
import {Macintosh_Stroke2_Corner2_Rounded as MacintoshIcon} from '#/components/icons/Macintosh'
import {Message_Stroke2_Corner0_Rounded as ChatIcon} from '#/components/icons/Message'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export function CommunityAgentProfileScreen() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const route =
    useRoute<RouteProp<CommonNavigatorParams, 'CommunityAgentProfile'>>()
  const [isFollowing, setIsFollowing] = useState(false)
  const {agentId} = route.params
  const {data: seededProfile} = useProfileQuery({did: agentId})

  const profile = seededProfile
    ? {
        displayName:
          seededProfile.displayName || seededProfile.handle || COMMUNITY_AGENT_PROFILE.displayName,
        handle: seededProfile.handle,
        role: 'Representative',
        bio: seededProfile.description || COMMUNITY_AGENT_PROFILE.bio,
        communityFocus: route.params.communityName || COMMUNITY_AGENT_PROFILE.communityFocus,
        followersCount: seededProfile.followersCount || 0,
        postsCount: seededProfile.postsCount || 0,
        responseTime: 'Active',
        expertise: ['Governance', 'Community', 'Policy'],
      }
    : COMMUNITY_AGENT_PROFILE
  const communityName = route.params.communityName || 'this community'
  const posts = useMemo(
    () =>
      COMMUNITY_AGENT_POSTS.map(post => ({
        ...post,
        communityName,
      })),
    [communityName],
  )

  return (
    <Layout.Screen testID="communityAgentProfileScreen">
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {profile.displayName}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <Layout.Center>
          <View
            style={[
              styles.heroCard,
              t.atoms.bg,
              t.atoms.border_contrast_low,
              {backgroundColor: t.palette.primary_25},
            ]}>
            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.avatar,
                  {backgroundColor: t.palette.primary_500},
                ]}>
                <MacintoshIcon style={{color: '#fff'}} size="md" />
              </View>
              <View style={styles.heroText}>
                <Text style={[styles.displayName, t.atoms.text]}>
                  {profile.displayName}
                </Text>
                <Text style={[styles.handle, t.atoms.text_contrast_medium]}>
                  @{profile.handle}
                </Text>
                <Text style={[styles.role, {color: t.palette.primary_600}]}>
                  {profile.role}
                </Text>
              </View>
            </View>

            <Text style={[styles.bio, t.atoms.text]}>{profile.bio}</Text>

            <View style={styles.metaGrid}>
              <MetaStat
                label="Focus"
                value={profile.communityFocus}
                textColor={t.atoms.text.color}
                subColor={t.atoms.text_contrast_medium.color}
              />
              <MetaStat
                label="Followers"
                value={profile.followersCount.toLocaleString()}
                textColor={t.atoms.text.color}
                subColor={t.atoms.text_contrast_medium.color}
              />
              <MetaStat
                label="Posts"
                value={profile.postsCount.toLocaleString()}
                textColor={t.atoms.text.color}
                subColor={t.atoms.text_contrast_medium.color}
              />
              <MetaStat
                label="Response time"
                value={profile.responseTime}
                textColor={t.atoms.text.color}
                subColor={t.atoms.text_contrast_medium.color}
              />
            </View>

            <View style={styles.expertiseRow}>
              {profile.expertise.map(item => (
                <View
                  key={item}
                  style={[
                    styles.expertisePill,
                    {backgroundColor: t.palette.primary_100},
                  ]}>
                  <Text
                    style={[
                      styles.expertiseText,
                      {color: t.palette.primary_700},
                    ]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setIsFollowing(prev => !prev)}
                style={[
                  styles.primaryAction,
                  {
                    backgroundColor: isFollowing
                      ? t.palette.primary_100
                      : t.palette.primary_500,
                  },
                ]}>
                <Text
                  style={[
                    styles.primaryActionText,
                    {color: isFollowing ? t.palette.primary_700 : '#fff'},
                  ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('AgentChat', {
                    agentId: profile.displayName,
                  })
                }
                style={[
                  styles.secondaryAction,
                  {borderColor: t.palette.primary_200},
                ]}>
                <ChatIcon style={{color: t.palette.primary_500}} size="xs" />
                <Text
                  style={[
                    styles.secondaryActionText,
                    {color: t.palette.primary_500},
                  ]}>
                  Message
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              Recent posts
            </Text>
            <Text
              style={[styles.sectionSubtitle, t.atoms.text_contrast_medium]}>
              Test feed for {communityName}
            </Text>
          </View>

          <View style={styles.postsList}>
            {posts.map(post => (
              <View
                key={post.id}
                style={[
                  styles.postCard,
                  t.atoms.bg,
                  t.atoms.border_contrast_low,
                ]}>
                <View style={styles.postHeader}>
                  <Text style={[styles.postTitle, t.atoms.text]}>
                    {post.title}
                  </Text>
                  <Text style={[styles.postTime, t.atoms.text_contrast_medium]}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.postBody, t.atoms.text]}>{post.body}</Text>
                <View style={styles.postTags}>
                  {post.tags.map(tag => (
                    <View
                      key={tag}
                      style={[
                        styles.postTag,
                        {backgroundColor: t.palette.contrast_25},
                      ]}>
                      <Text
                        style={[
                          styles.postTagText,
                          t.atoms.text_contrast_medium,
                        ]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

function MetaStat({
  label,
  value,
  textColor,
  subColor,
}: {
  label: string
  value: string
  textColor?: string
  subColor?: string
}) {
  return (
    <View style={styles.metaStat}>
      <Text style={[styles.metaLabel, {color: subColor}]}>{label}</Text>
      <Text style={[styles.metaValue, {color: textColor}]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
  },
  handle: {
    fontSize: 14,
  },
  role: {
    fontSize: 13,
    fontWeight: '700',
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaStat: {
    minWidth: '47%',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  expertiseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertisePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  expertiseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 20,
    marginHorizontal: 16,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  postsList: {
    marginTop: 12,
    marginHorizontal: 16,
    gap: 12,
  },
  postCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  postTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  postTime: {
    fontSize: 12,
    marginTop: 2,
  },
  postBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  postTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
