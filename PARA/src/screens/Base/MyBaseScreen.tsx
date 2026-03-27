import {useCallback, useState} from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {AtUri} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useFocusEffect, useNavigation} from '@react-navigation/native'

import {
  type CategoryData,
  MATTER_CATEGORIES,
  VOTED_POLICIES,
} from '#/lib/constants/mockData'
import {type NavigationProp} from '#/lib/routes/types'
import {USER_FLAIRS} from '#/lib/tags'
import {deleteHighlight, getAllHighlights} from '#/state/highlights'
import {type HighlightData} from '#/state/highlights'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {usePoliticalAffiliation} from '#/state/shell/political-affiliation'
import {FOLLOWED_ITEM_CATEGORIES, useFollowedItems} from '#/state/topics'
import {type FollowedItem} from '#/state/topics'
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {Bookmark as BookmarkIcon} from '#/components/icons/Bookmark'
import {ChevronRight_Stroke2_Corner0_Rounded as ChevronRight} from '#/components/icons/Chevron'
import {SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon} from '#/components/icons/SettingsGear2'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Tree_Stroke2_Corner0_Rounded as TreeIcon} from '#/components/icons/Tree'
import * as Layout from '#/components/Layout'
import {PolicyCategoryModal} from '#/screens/Base/PolicyCategoryModal'

// ---------------------------------------------------------------------------
// MyBaseScreen
// ---------------------------------------------------------------------------
export function MyBaseScreen() {
  const {_} = useLingui()
  const t = useTheme()
  const {currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const currentDid = currentAccount!.did
  const {data: currentProfile} = useProfileQuery({did: currentDid})
  const {affiliation} = usePoliticalAffiliation()
  const [activeDetail, setActiveDetail] = useState<
    'Influence' | 'Votes' | 'Posts' | null
  >(null)
  const [activeCategory, setActiveCategory] = useState<CategoryData | null>(
    null,
  )
  const [myHighlights, setMyHighlights] = useState<HighlightData[]>([])
  const [selectedFlair, setSelectedFlair] = useState<
    (typeof USER_FLAIRS)[keyof typeof USER_FLAIRS]
  >(USER_FLAIRS.CENTRISM)

  const [showFlairModal, setShowFlairModal] = useState(false)

  // Load highlights on focus
  useFocusEffect(
    useCallback(() => {
      setMyHighlights(getAllHighlights())
    }, []),
  )

  const handleDeleteHighlight = useCallback((highlight: HighlightData) => {
    deleteHighlight(highlight.postUri, highlight.id)
    setMyHighlights(getAllHighlights())
  }, [])

  // Followed topics/items
  const {items: followedItems, unfollow: unfollowItem} = useFollowedItems()

  const onPressSaved = () => {
    navigation.navigate('Bookmarks')
  }

  const onPressPolicyTree = () => {
    // TODO: navigate to Policy Tree screen
  }

  const onPressRAQ = () => {
    navigation.navigate('RAQ')
  }

  const onPressMetric = (metric: string) => {
    if (metric === 'Followers') {
      navigation.push('ProfileFollowers', {name: currentProfile?.handle || ''})
    } else if (metric === 'Following') {
      navigation.push('ProfileFollows', {name: currentProfile?.handle || ''})
    } else if (metric === 'Influence') {
      navigation.navigate('SeeInfluence', {})
    } else if (metric === 'Votes') {
      navigation.navigate('SeeVotes', {})
    } else if (metric === 'Posts') {
      setActiveDetail('Posts')
    }
  }

  const onPressHighlight = (highlight: HighlightData) => {
    try {
      const urip = new AtUri(highlight.postUri)
      navigation.push('PostThread', {
        name: urip.host,
        rkey: urip.rkey,
      })
    } catch (e) {
      console.error('Invalid post URI', e)
    }
  }

  const onPressSettings = () => {
    navigation.navigate('AccountSettings')
  }

  return (
    <Layout.Screen>
      {/* Header */}
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>My Base</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <Button
            label={_(msg`Settings`)}
            onPress={onPressSettings}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round">
            <ButtonIcon icon={SettingsIcon} size="lg" />
          </Button>
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      <Layout.Center style={styles.flex1}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={[styles.profileSection, t.atoms.border_contrast_low]}>
            <View style={styles.profileHeaderRow}>
              <UserAvatar
                avatar={currentProfile?.avatar}
                size={60}
                type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, t.atoms.text]}>
                  {currentProfile?.displayName ||
                    currentProfile?.handle ||
                    'User'}
                </Text>
                <Text style={[styles.profileHandle, t.atoms.text]}>
                  @{currentProfile?.handle}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.flairBadge,
                    {backgroundColor: selectedFlair.color + '20'},
                  ]}
                  onPress={() => setShowFlairModal(true)}>
                  <View
                    style={[
                      styles.flairDot,
                      {backgroundColor: selectedFlair.color},
                    ]}
                  />
                  <Text
                    style={[
                      styles.flairText,
                      {color: selectedFlair.color},
                      a.font_bold,
                    ]}>
                    {selectedFlair.label}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Metrics Data */}
            <View style={styles.metricsContainer}>
              <MetricItem
                label="Influence"
                value="850"
                onPress={() => onPressMetric('Influence')}
              />
              <MetricItem
                label="Votes"
                value="124"
                onPress={() => onPressMetric('Votes')}
              />
              <MetricItem
                label="Posts"
                value="42"
                onPress={() => onPressMetric('Posts')}
              />
              <MetricItem
                label="Followers"
                value="10.2k"
                onPress={() => onPressMetric('Followers')}
              />
              <MetricItem
                label="Following"
                value="234"
                onPress={() => onPressMetric('Following')}
              />
            </View>

            {/* Political Affiliation Section */}
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.supportInfoContainer}
              onPress={() => navigation.navigate('PoliticalAffiliation')}>
              <View style={styles.supportInfoRow}>
                <View
                  style={[
                    styles.supportAvatar,
                    {
                      backgroundColor: affiliation
                        ? t.palette.primary_500
                        : t.palette.contrast_300,
                    },
                  ]}
                />
                <Text
                  style={[styles.supportInfoText, t.atoms.text_contrast_medium]}>
                  <Trans>Political Affiliation:</Trans>{' '}
                  <Text style={[styles.supportInfoValue, t.atoms.text]}>
                    {affiliation || 'Not set'}
                  </Text>
                </Text>
                <ChevronRight size="sm" style={t.atoms.text_contrast_medium} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Voted Policies Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                <Trans>Voted Policies</Trans>
              </Text>
              <Button
                label={_(msg`Saved`)}
                onPress={onPressSaved}
                size="small"
                variant="ghost"
                color="secondary"
                shape="default"
                style={styles.savedButton}>
                <ButtonIcon icon={BookmarkIcon} />
                <ButtonText>Saved</ButtonText>
              </Button>
            </View>

            <View style={styles.gridContainer}>
              {VOTED_POLICIES.map((category, index) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={index}
                  style={[
                    styles.categoryCard,
                    t.atoms.border_contrast_low,
                    t.atoms.bg_contrast_25,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setActiveCategory(category)}>
                  <Text style={[styles.categoryTitle, t.atoms.text]}>
                    {category.title}
                  </Text>
                  {category.items.map((item, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.categoryItem,
                        t.atoms.text_contrast_medium,
                      ]}>
                      • {item}
                    </Text>
                  ))}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Matters Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                Matters
              </Text>
              <Button
                label={_(msg`Saved`)}
                onPress={onPressSaved}
                size="small"
                variant="ghost"
                color="secondary"
                shape="default"
                style={styles.savedButton}>
                <ButtonIcon icon={BookmarkIcon} />
                <ButtonText>Saved</ButtonText>
              </Button>
            </View>

            <View style={styles.gridContainer}>
              {MATTER_CATEGORIES.map((category, index) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={index}
                  style={[
                    styles.categoryCard,
                    t.atoms.border_contrast_low,
                    t.atoms.bg_contrast_25,
                  ]}
                  activeOpacity={0.7}>
                  <Text style={[styles.categoryTitle, t.atoms.text]}>
                    {category.title}
                  </Text>
                  {category.items.map((item, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.categoryItem,
                        t.atoms.text_contrast_medium,
                      ]}>
                      {item}
                    </Text>
                  ))}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* My Highlights Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                <Trans>My Highlights</Trans>
              </Text>
              <Text
                style={[
                  styles.highlightCount,
                  t.atoms.text_contrast_medium,
                ]}>
                {myHighlights.length} saved
              </Text>
            </View>

            {myHighlights.length === 0 ? (
              <View
                style={[styles.emptyHighlights, t.atoms.bg_contrast_25]}>
                <Text style={styles.emptyHighlightsIcon}>✨</Text>
                <Text style={[styles.emptyHighlightsText, t.atoms.text]}>
                  <Trans>No highlights yet</Trans>
                </Text>
                <Text
                  style={[
                    styles.emptyHighlightsSubtext,
                    t.atoms.text_contrast_medium,
                  ]}>
                  Long-press text in a post and select "Highlight" to save it
                  here
                </Text>
              </View>
            ) : (
              <View style={styles.highlightsListContainer}>
                {myHighlights.slice(0, 5).map(highlight => (
                  <View
                    key={highlight.id}
                    style={[
                      styles.highlightItem,
                      t.atoms.border_contrast_low,
                      t.atoms.bg_contrast_25,
                    ]}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={[styles.highlightItemContent, a.flex_1]}
                      onPress={() => onPressHighlight(highlight)}>
                      <View
                        style={[
                          styles.highlightColorDot,
                          {backgroundColor: highlight.color},
                        ]}
                      />
                      <View style={styles.highlightTextContainer}>
                        {highlight.tag && (
                          <Text
                            style={[
                              styles.highlightTag,
                              {color: highlight.color},
                            ]}>
                            #{highlight.tag}
                          </Text>
                        )}
                        <Text
                          style={[styles.highlightText, t.atoms.text]}
                          numberOfLines={2}>
                          {highlight.text ||
                            `Highlight from post (chars ${highlight.start}-${highlight.end})`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => handleDeleteHighlight(highlight)}
                      style={styles.deleteHighlightButton}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <XIcon size="sm" style={t.atoms.text_contrast_medium} />
                    </TouchableOpacity>
                  </View>
                ))}
                {myHighlights.length > 5 && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[
                      styles.viewAllHighlights,
                      t.atoms.bg_contrast_25,
                    ]}
                    onPress={() => navigation.navigate('Highlights')}>
                    <Text
                      style={[
                        styles.viewAllText,
                        {color: t.palette.primary_500},
                      ]}>
                      View all {myHighlights.length} highlights →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Followed Elements Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.mainSectionTitle, t.atoms.text]}>
                <Trans>Followed Elements</Trans>
              </Text>
              <Text
                style={[
                  styles.highlightCount,
                  t.atoms.text_contrast_medium,
                ]}>
                {followedItems.length} following
              </Text>
            </View>

            {followedItems.length === 0 ? (
              <View
                style={[styles.emptyHighlights, t.atoms.bg_contrast_25]}>
                <Text style={styles.emptyHighlightsIcon}>🔖</Text>
                <Text style={[styles.emptyHighlightsText, t.atoms.text]}>
                  No topics followed
                </Text>
                <Text
                  style={[
                    styles.emptyHighlightsSubtext,
                    t.atoms.text_contrast_medium,
                  ]}>
                  Follow hashtags, policies, matters, or threads to see them
                  here
                </Text>
              </View>
            ) : (
              <View style={styles.topicsGrid}>
                {followedItems.slice(0, 8).map((item: FollowedItem) => {
                  const category = FOLLOWED_ITEM_CATEGORIES[item.type]
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.topicCard,
                        t.atoms.bg_contrast_25,
                        t.atoms.border_contrast_low,
                      ]}>
                      <View style={styles.topicCardContent}>
                        <View
                          style={[
                            styles.topicTypeIcon,
                            {backgroundColor: category.color + '20'},
                          ]}>
                          <Text style={styles.topicTypeEmoji}>
                            {category.icon}
                          </Text>
                        </View>
                        <View style={styles.topicInfo}>
                          <Text
                            style={[styles.topicName, t.atoms.text]}
                            numberOfLines={1}>
                            {item.displayName}
                          </Text>
                          <Text
                            style={[
                              styles.topicType,
                              t.atoms.text_contrast_medium,
                            ]}>
                            {category.label}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => unfollowItem(item.id)}
                        style={styles.unfollowButton}
                        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                        <XIcon
                          size="sm"
                          style={t.atoms.text_contrast_medium}
                        />
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            )}
            {followedItems.length > 8 && (
              <TouchableOpacity
                accessibilityRole="button"
                style={[
                  styles.viewAllHighlights,
                  t.atoms.bg_contrast_25,
                ]}>
                <Text
                  style={[
                    styles.viewAllText,
                    {color: t.palette.primary_500},
                  ]}>
                  View all {followedItems.length} topics →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* RAQ Section */}
          <View
            style={[
              styles.raqSection,
              t.atoms.border_contrast_low,
              t.atoms.bg_contrast_25,
            ]}>
            <View>
              <Text style={[styles.raqTitle, t.atoms.text]}>RAQ</Text>
              <Text style={[styles.raqProgress, t.atoms.text]}>
                17/25 completed
              </Text>
            </View>
            <Button
              label="Continue Questionnaire"
              onPress={onPressRAQ}
              size="small"
              variant="ghost"
              color="secondary"
              shape="round">
              <ButtonIcon icon={ChevronRight} />
            </Button>
          </View>

          {/* Policy Tree Button */}
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.policyTreeButton,
              {backgroundColor: t.palette.primary_500},
            ]}
            onPress={onPressPolicyTree}
            activeOpacity={0.8}>
            <TreeIcon size="xl" style={{color: 'white'}} />
            <Text style={styles.policyTreeText}>Open policy tree</Text>
          </TouchableOpacity>
        </ScrollView>
      </Layout.Center>

      {/* Details Modal */}
      {activeDetail && (
        <DetailsDialog
          title={
            activeDetail === 'Influence'
              ? 'Influence Breakdown'
              : activeDetail === 'Votes'
                ? 'Votes History'
                : 'Posts Breakdown'
          }
          onClose={() => setActiveDetail(null)}>
          {activeDetail === 'Influence' ? (
            <>
              <DetailRow label="Posts Influence" value="650" />
              <DetailRow label="Comments Influence" value="200" />
            </>
          ) : activeDetail === 'Votes' ? (
            <>
              <DetailRow label="Votes in Policies" value="80" />
              <DetailRow label="Votes in Matters" value="34" />
              <DetailRow label="Votes in Posts" value="10" />
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.modalSectionTitle,
                  t.atoms.text_contrast_medium,
                ]}>
                Type
              </Text>
              <DetailRow label="Official" value="12" />
              <DetailRow label="Not Official" value="30" />

              <View
                style={[styles.modalDivider, t.atoms.border_contrast_low]}
              />

              <Text
                style={[
                  styles.modalSectionTitle,
                  t.atoms.text_contrast_medium,
                ]}>
                Tags
              </Text>
              <DetailRow label="Discussion" value="20" />
              <DetailRow label="Survey" value="15" />
              <DetailRow label="Meme" value="7" />
            </>
          )}
        </DetailsDialog>
      )}

      {/* Policy Category Modal */}
      {activeCategory && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={true}
          onRequestClose={() => setActiveCategory(null)}>
          <PolicyCategoryModal
            category={activeCategory}
            onClose={() => setActiveCategory(null)}
          />
        </Modal>
      )}

      {/* Flair Selection Modal */}
      <Modal
        visible={showFlairModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFlairModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.modalBackdrop}
            onPress={() => setShowFlairModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              t.atoms.bg,
              t.atoms.border_contrast_low,
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, t.atoms.text]}>
                Choose Your Flair
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowFlairModal(false)}>
                <XIcon size="lg" style={t.atoms.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.flairScrollView}>
              <View style={styles.modalBody}>
                {Object.values(USER_FLAIRS).map(flair => (
                  <TouchableOpacity
                    key={flair.id}
                    accessibilityRole="button"
                    style={[
                      styles.flairOption,
                      selectedFlair.id === flair.id &&
                        styles.flairOptionSelected,
                      t.atoms.border_contrast_low,
                    ]}
                    onPress={() => {
                      setSelectedFlair(flair)
                      setShowFlairModal(false)
                    }}>
                    <View
                      style={[styles.flairDot, {backgroundColor: flair.color}]}
                    />
                    <Text style={[styles.flairOptionText, t.atoms.text]}>
                      {flair.label}
                    </Text>
                    {selectedFlair.id === flair.id && (
                      <Text style={{color: flair.color, fontWeight: 'bold'}}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Layout.Screen>
  )
}

// ---------------------------------------------------------------------------
// Sub-components — use useTheme() directly instead of prop-drilling `pal`
// ---------------------------------------------------------------------------

function DetailRow({label, value}: {label: string; value: string}) {
  const t = useTheme()
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, t.atoms.text]}>{value}</Text>
    </View>
  )
}

function DetailsDialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  const t = useTheme()
  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityRole="button"
          style={styles.modalBackdrop}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContent,
            t.atoms.bg,
            t.atoms.border_contrast_low,
          ]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, t.atoms.text]}>{title}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              hitSlop={10}>
              <XIcon size="md" style={t.atoms.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>{children}</View>
        </View>
      </View>
    </Modal>
  )
}

function MetricItem({
  label,
  value,
  onPress,
}: {
  label: string
  value: string
  onPress: () => void
}) {
  const t = useTheme()
  return (
    <View style={styles.metricItem}>
      <Text style={[styles.metricLabel, t.atoms.text_contrast_medium]}>
        {label}
      </Text>
      <TouchableOpacity accessibilityRole="button" onPress={onPress}>
        <Text style={[styles.metricValue, t.atoms.text]}>{value}</Text>
      </TouchableOpacity>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // Profile
  profileSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileHandle: {
    fontSize: 16,
    opacity: 0.7,
  },
  // Metrics
  metricsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Political affiliation
  supportInfoContainer: {
    marginTop: 20,
    gap: 8,
  },
  supportInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  supportInfoText: {
    fontSize: 14,
  },
  supportInfoValue: {
    fontWeight: '600',
  },
  // Sections
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savedButton: {
    paddingHorizontal: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  mainSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Category cards
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    opacity: 0.9,
  },
  categoryItem: {
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
  // RAQ
  raqSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  raqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  raqProgress: {
    fontSize: 14,
    opacity: 0.7,
  },
  // Policy tree
  policyTreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  policyTreeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  // Modal styles (shared by Details + Flair)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    gap: 12,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Highlights
  highlightCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyHighlights: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyHighlightsIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyHighlightsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyHighlightsSubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  highlightsListContainer: {
    gap: 8,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  highlightItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  highlightColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  highlightTextContainer: {
    flex: 1,
  },
  highlightTag: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  highlightText: {
    fontSize: 14,
    lineHeight: 18,
  },
  deleteHighlightButton: {
    padding: 4,
  },
  viewAllHighlights: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Topics
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 160,
    flexBasis: '47%',
    flexGrow: 0,
    flexShrink: 0,
  },
  topicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  topicTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTypeEmoji: {
    fontSize: 14,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 13,
    fontWeight: '600',
  },
  topicType: {
    fontSize: 11,
    marginTop: 1,
  },
  unfollowButton: {
    padding: 4,
  },
  // Flair
  flairBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  flairDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  flairText: {
    fontSize: 13,
  },
  flairScrollView: {
    maxHeight: 400,
  },
  flairOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  flairOptionSelected: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  flairOptionText: {
    fontSize: 16,
    flex: 1,
  },
})
