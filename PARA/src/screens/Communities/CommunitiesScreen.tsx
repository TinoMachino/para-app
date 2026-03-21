import {useMemo, useState} from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {COMMUNITY_DATA, type CommunityData} from '#/lib/constants/mockData'
import {type NavigationProp} from '#/lib/routes/types'
import {POST_FLAIRS, type PostFlair} from '#/lib/tags'
import {useSession} from '#/state/session'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {FlairSelectionList} from '#/components/FlairSelectionList'
import {IconCircle} from '#/components/IconCircle'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded as ListMagnifyingGlass} from '#/components/icons/ListMagnifyingGlass'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import {WebScrollControls} from '#/components/WebScrollControls'
import {IS_WEB} from '#/env'

type ThemeShape = ReturnType<typeof useTheme>

type SelectedParticipationFilter = {
  kind: 'matter' | 'policy'
  flairId: string
  label: string
}

const STATES = [
  'Cualquiera',
  'Aguascalientes',
  'Baja California',
  'CDMX',
  'Chiapas',
  'Chihuahua',
  'Jalisco',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'Yucatán',
]

const FEATURED_STATE_NAMES = ['CDMX', 'Jalisco', 'Nuevo León']

export function CommunitiesScreen() {
  const t = useTheme()
  useSession()
  const navigation = useNavigation<NavigationProp>()

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'Participation' | 'State'>(
    'Participation',
  )
  const [participationType, setParticipationType] = useState<
    'Matter' | 'Policy'
  >('Matter')
  const [selectedParticipationFilter, setSelectedParticipationFilter] =
    useState<SelectedParticipationFilter | null>(null)
  const [selectedStateItem, setSelectedStateItem] = useState<string>('')
  const [recentlyVisited, setRecentlyVisited] = useState<string[]>([
    'mx-jalisco',
    'pan',
    'mx-cdmx',
  ])

  const civicScrollRef = useRef<ScrollView>(null)
  const politicalScrollRef = useRef<ScrollView>(null)

  const communityById = useMemo(
    () =>
      new Map(
        COMMUNITY_DATA.map(community => [community.communityId, community]),
      ),
    [],
  )
  const recentCommunities = useMemo(
    () =>
      recentlyVisited
        .map(id => communityById.get(id))
        .filter(Boolean) as CommunityData[],
    [communityById, recentlyVisited],
  )
  const civicCommunities = useMemo(
    () =>
      COMMUNITY_DATA.filter(community => community.directoryGroup === 'civic'),
    [],
  )
  const politicalCommunities = useMemo(
    () =>
      COMMUNITY_DATA.filter(
        community => community.directoryGroup === 'political',
      ),
    [],
  )
  const matterFlairs = useMemo(
    () =>
      Object.values(POST_FLAIRS)
        .filter(flair => flair.id.startsWith('matter_'))
        .slice(0, 8),
    [],
  )
  const policyFlairs = useMemo(
    () =>
      Object.values(POST_FLAIRS)
        .filter(flair => flair.id.startsWith('policy_'))
        .slice(0, 8),
    [],
  )

  const navigateToCommunityProfile = useCallback(
    (community: CommunityData) => {
      navigation.navigate('CommunityProfile', {
        communityId: community.communityId,
        communityName: community.communityName,
      })
    },
    [navigation],
  )

  const removeRecentlyVisited = useCallback((communityId: string) => {
    setRecentlyVisited(prev => prev.filter(item => item !== communityId))
  }, [])

  const openParticipationModal = () => {
    setModalType('Participation')
    setShowModal(true)
  }

  const openStateModal = () => {
    setModalType('State')
    setShowModal(true)
  }

  const onSelectPickerItem = (value: string) => {
    setSelectedStateItem(value === 'Cualquiera' ? '' : value)
  }

  const handleDone = () => {
    setShowModal(false)
  }

  const isStateModal = modalType === 'State'

  return (
    <Layout.Screen testID="communitiesScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Communities</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>

      <Layout.Center style={styles.screenCenter}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          <View style={[styles.contentShell, IS_WEB && styles.contentShellWeb]}>
            <View style={styles.section}>
              <Text
                style={[styles.sectionEyebrow, {color: t.palette.primary_500}]}>
                <Trans>Continue exploring</Trans>
              </Text>
              <Text style={[styles.heroTitle, t.atoms.text]}>
                <Trans>Your community directory</Trans>
              </Text>
              <Text style={[styles.sectionLead, t.atoms.text_contrast_medium]}>
                <Trans>
                  Pick up where you left off, browse civic territories, and move
                  into political communities without the dashboard clutter.
                </Trans>
              </Text>

              <View style={[styles.resumeGrid, IS_WEB && styles.resumeGridWeb]}>
                {recentCommunities.map(community => (
                  <ContinueExploringCard
                    key={community.communityId}
                    community={community}
                    onPress={() => navigateToCommunityProfile(community)}
                    onRemove={removeRecentlyVisited}
                    theme={t}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text
                style={[styles.sectionEyebrow, {color: t.palette.primary_500}]}>
                <Trans>Discover communities</Trans>
              </Text>
              <Text style={[styles.sectionHeading, t.atoms.text]}>
                <Trans>Browse the directory by context</Trans>
              </Text>
              <Text style={[styles.sectionLead, t.atoms.text_contrast_medium]}>
                <Trans>
                  Start with civic territories, then move into political
                  communities and coalition spaces.
                </Trans>
              </Text>

              <View style={styles.directoryStack}>
                <DirectoryModule
                  title="Civic Territories"
                  description="State and territorial hubs grounded in the seeded civic network."
                  theme={t}>
                  <View style={{position: 'relative'}}>
                    <WebScrollControls scrollViewRef={civicScrollRef} />
                    <ScrollView
                      ref={civicScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.cardsScroll}
                      contentContainerStyle={styles.directoryRail}>
                      {civicCommunities.map(community => (
                        <CivicCommunityCard
                          key={community.communityId}
                          community={community}
                          theme={t}
                          onPress={() => navigateToCommunityProfile(community)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </DirectoryModule>

                <DirectoryModule
                  title="Political Communities"
                  description="National parties, movement communities, and coalition spaces."
                  theme={t}>
                  {IS_WEB ? (
                    <View style={styles.politicalGrid}>
                      {politicalCommunities.map(community => (
                        <PoliticalCommunityCard
                          key={community.communityId}
                          community={community}
                          theme={t}
                          style={styles.politicalCardWeb}
                          onPress={() => navigateToCommunityProfile(community)}
                        />
                      ))}
                    </View>
                  ) : (
                    <ScrollView
                      ref={politicalScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.cardsScroll}
                      contentContainerStyle={styles.directoryRail}>
                      {politicalCommunities.map(community => (
                        <PoliticalCommunityCard
                          key={community.communityId}
                          community={community}
                          theme={t}
                          onPress={() => navigateToCommunityProfile(community)}
                        />
                      ))}
                    </ScrollView>
                  )}
                </DirectoryModule>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.86}
              onPress={() => navigation.navigate('CabildeoList')}
              style={[
                styles.cabildeoCard,
                {
                  backgroundColor: t.palette.primary_500 + '0E',
                  borderColor: t.palette.primary_500 + '24',
                },
              ]}>
              <View style={styles.cabildeoMeta}>
                <Text
                  style={[
                    styles.cabildeoEyebrow,
                    {color: t.palette.primary_500},
                  ]}>
                  <Trans>Action lane</Trans>
                </Text>
                <Text style={[styles.cabildeoTitle, t.atoms.text]}>
                  <Trans>Cabildeo</Trans>
                </Text>
                <Text
                  style={[styles.cabildeoBody, t.atoms.text_contrast_medium]}>
                  <Trans>
                    Move from community browsing into proposals, deliberation,
                    and quadratic voting when you want an active civic path.
                  </Trans>
                </Text>
              </View>

              <View
                style={[
                  styles.cabildeoPill,
                  {backgroundColor: t.palette.primary_500},
                ]}>
                <Text style={styles.cabildeoPillText}>
                  <Trans>Open Cabildeo</Trans>
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.section}>
              <Text
                style={[styles.sectionEyebrow, {color: t.palette.primary_500}]}>
                <Trans>Refine discovery</Trans>
              </Text>
              <Text style={[styles.sectionHeading, t.atoms.text]}>
                <Trans>Explore by participation or geography</Trans>
              </Text>
              <Text style={[styles.sectionLead, t.atoms.text_contrast_medium]}>
                <Trans>
                  Use the existing discovery tools without pretending that
                  ranking is ready yet.
                </Trans>
              </Text>

              <View
                style={[styles.refineLayout, IS_WEB && styles.refineLayoutWeb]}>
                <RefinementPanel
                  title="Find by participation"
                  description="Browse live matter and policy themes, then refine once matching is ready."
                  icon={ListMagnifyingGlass}
                  onPress={openParticipationModal}
                  theme={t}>
                  {selectedParticipationFilter ? (
                    <FilterComingSoonCard
                      theme={t}
                      compact
                      pillLabel={`${participationType}: ${selectedParticipationFilter.label}`}
                      title={`Community matches for ${participationType}: ${selectedParticipationFilter.label} are coming soon`}
                      body="We’re not showing placeholder communities here until participation-based matching is ready."
                      ctaLabel="Choose another filter"
                      onPress={openParticipationModal}
                    />
                  ) : (
                    <View style={styles.discoveryPanelBody}>
                      <View>
                        <Text style={[styles.miniRailTitle, t.atoms.text]}>
                          <Trans>Trending Matters</Trans>
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.topicRail}>
                          {matterFlairs.map(flair => (
                            <TopicDiscoveryCard
                              key={flair.id}
                              label={flair.tag}
                              helper={flair.label}
                              accent={flair.color}
                              theme={t}
                              onPress={() => {
                                setParticipationType('Matter')
                                setSelectedParticipationFilter(
                                  buildParticipationFilter(flair),
                                )
                              }}
                            />
                          ))}
                        </ScrollView>
                      </View>

                      <View>
                        <Text style={[styles.miniRailTitle, t.atoms.text]}>
                          <Trans>Popular Policies</Trans>
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.topicRail}>
                          {policyFlairs.map(flair => (
                            <TopicDiscoveryCard
                              key={flair.id}
                              label={flair.tag}
                              helper={flair.label}
                              accent={flair.color}
                              theme={t}
                              onPress={() => {
                                setParticipationType('Policy')
                                setSelectedParticipationFilter(
                                  buildParticipationFilter(flair),
                                )
                              }}
                            />
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  )}
                </RefinementPanel>

                <RefinementPanel
                  title="Find by state"
                  description="Use geographic discovery once you know the territory you want to explore."
                  icon={FilterIcon}
                  onPress={openStateModal}
                  theme={t}>
                  {selectedStateItem ? (
                    <FilterComingSoonCard
                      theme={t}
                      compact
                      pillLabel={selectedStateItem}
                      title={`Community matches for ${selectedStateItem} are coming soon`}
                      body="We’ll show real state-based community matches once public ranking is available."
                      ctaLabel="Choose another state"
                      onPress={openStateModal}
                    />
                  ) : (
                    <View style={styles.discoveryPanelBody}>
                      <Text style={[styles.miniRailTitle, t.atoms.text]}>
                        <Trans>Featured States</Trans>
                      </Text>
                      <View
                        style={[
                          styles.featuredStates,
                          IS_WEB && styles.featuredStatesWeb,
                        ]}>
                        {FEATURED_STATE_NAMES.map(state => (
                          <FeaturedStateCard
                            key={state}
                            state={state}
                            theme={t}
                            onPress={() => setSelectedStateItem(state)}
                          />
                        ))}
                      </View>
                    </View>
                  )}
                </RefinementPanel>
              </View>
            </View>
          </View>
        </ScrollView>
      </Layout.Center>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View
          style={[
            styles.modalOverlay,
            IS_WEB && isStateModal && styles.modalOverlayWeb,
          ]}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => setShowModal(false)}
          />
          <View
            style={[
              styles.modalContent,
              t.atoms.bg,
              modalType === 'Participation'
                ? {height: '80%', padding: 0}
                : styles.stateModalContent,
              IS_WEB && isStateModal && styles.stateModalContentWeb,
            ]}>
            {modalType === 'Participation' ? (
              <View style={{flex: 1, padding: 16}}>
                <View
                  style={[
                    styles.modalHandle,
                    {
                      alignSelf: 'center',
                      marginBottom: 10,
                      backgroundColor: t.palette.contrast_300,
                    },
                  ]}
                />

                <FlairSelectionList
                  selectedFlairs={
                    selectedParticipationFilter
                      ? Object.values(POST_FLAIRS).filter(
                          flair =>
                            flair.id === selectedParticipationFilter.flairId,
                        )
                      : []
                  }
                  setSelectedFlairs={(flairs: any[]) => {
                    if (flairs.length > 0) {
                      const flair = flairs[0] as PostFlair
                      setParticipationType(
                        flair.id.startsWith('policy_') ? 'Policy' : 'Matter',
                      )
                      setSelectedParticipationFilter(
                        buildParticipationFilter(flair),
                      )
                    } else {
                      setSelectedParticipationFilter(null)
                    }
                    setShowModal(false)
                  }}
                  mode={participationType.toLowerCase() as 'matter' | 'policy'}
                  onClose={() => setShowModal(false)}
                />
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.modalHandle,
                    {backgroundColor: t.palette.contrast_300},
                  ]}
                />
                <Text style={[styles.modalSubtitle, t.atoms.text]}>
                  <Trans>Select a state</Trans>
                </Text>

                <WheelPicker
                  items={STATES}
                  selectedValue={selectedStateItem || STATES[0]}
                  onValueChange={onSelectPickerItem}
                  theme={t}
                />

                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.closeButton,
                    {backgroundColor: t.palette.primary_500},
                  ]}
                  onPress={handleDone}>
                  <Text style={styles.closeButtonText}>
                    <Trans>Done</Trans>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </Layout.Screen>
  )
}

function buildParticipationFilter(
  flair: PostFlair,
): SelectedParticipationFilter {
  return {
    kind: flair.id.startsWith('policy_') ? 'policy' : 'matter',
    flairId: flair.id,
    label: flair.label,
  }
}

function ContinueExploringCard({
  community,
  onPress,
  onRemove,
  theme,
}: {
  community: CommunityData
  onPress: () => void
  onRemove: (communityId: string) => void
  theme: ThemeShape
}) {
  const accent = community.accent || community.color

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      style={[
        styles.resumeCard,
        {
          backgroundColor: theme.palette.contrast_25 + '1A',
          borderColor: theme.palette.contrast_100,
        },
        IS_WEB && styles.resumeCardWeb,
      ]}
      onPress={onPress}>
      <View style={styles.resumeHeader}>
        <View style={[styles.resumeAvatar, {backgroundColor: community.color}]}>
          <Text style={styles.resumeAvatarText}>
            {community.name.charAt(0)}
          </Text>
        </View>

        <View style={styles.resumeMeta}>
          <Text
            style={[styles.resumeTitle, theme.atoms.text]}
            numberOfLines={1}>
            {community.communityName}
          </Text>
          <Text
            style={[styles.resumeSubtitle, {color: accent}]}
            numberOfLines={1}>
            {community.subtitle || community.eyebrow || community.desc}
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.resumeDismiss}
          onPress={() => onRemove(community.communityId)}>
          <XIcon
            width={12}
            height={12}
            fill={theme.atoms.text_contrast_medium.color}
          />
        </TouchableOpacity>
      </View>

      <Text
        style={[styles.resumeDescription, theme.atoms.text_contrast_medium]}
        numberOfLines={2}>
        {community.desc}
      </Text>

      <View style={styles.resumeFooter}>
        <View style={[styles.metaBadge, {backgroundColor: accent + '1F'}]}>
          <Text style={[styles.metaBadgeText, {color: accent}]}>
            {community.region || community.eyebrow || 'Community'}
          </Text>
        </View>
        <Text style={[styles.resumeMembers, theme.atoms.text_contrast_medium]}>
          {community.members} miembros
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function DirectoryModule({
  title,
  description,
  theme,
  children,
}: {
  title: string
  description: string
  theme: ThemeShape
  children: React.ReactNode
}) {
  return (
    <View
      style={[
        styles.directoryModule,
        {
          backgroundColor: theme.palette.contrast_25 + '18',
          borderColor: theme.palette.contrast_100,
        },
      ]}>
      <Text style={[styles.moduleTitle, theme.atoms.text]}>{title}</Text>
      <Text
        style={[styles.moduleDescription, theme.atoms.text_contrast_medium]}>
        {description}
      </Text>
      {children}
    </View>
  )
}

function CivicCommunityCard({
  community,
  theme,
  onPress,
}: {
  community: CommunityData
  theme: ThemeShape
  onPress: () => void
}) {
  const accent = community.accent || community.color

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      style={[
        styles.civicCard,
        {
          backgroundColor: accent + '12',
          borderColor: accent + '35',
        },
      ]}
      onPress={onPress}>
      <Text style={[styles.cardEyebrow, {color: accent}]}>
        {community.eyebrow || 'Civic Territory'}
      </Text>
      <Text style={[styles.civicTitle, theme.atoms.text]}>
        {community.name}
      </Text>
      <Text style={[styles.civicSubtitle, theme.atoms.text]}>
        {community.subtitle || community.region}
      </Text>
      <Text
        style={[styles.civicDescription, theme.atoms.text_contrast_medium]}
        numberOfLines={2}>
        {community.desc}
      </Text>
      <View style={styles.civicFooter}>
        <View style={[styles.metaBadge, {backgroundColor: accent + '18'}]}>
          <Text style={[styles.metaBadgeText, {color: accent}]}>
            {community.region || community.communityName}
          </Text>
        </View>
        <Text style={[styles.civicMembers, theme.atoms.text_contrast_medium]}>
          {community.members}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function PoliticalCommunityCard({
  community,
  theme,
  style,
  onPress,
}: {
  community: CommunityData
  theme: ThemeShape
  style?: any
  onPress: () => void
}) {
  const accent = community.accent || community.color

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      style={[
        styles.politicalCard,
        {
          backgroundColor: theme.palette.contrast_25 + '18',
          borderColor: theme.palette.contrast_100,
        },
        style,
      ]}
      onPress={onPress}>
      <View style={styles.politicalHeader}>
        <View
          style={[styles.politicalAvatar, {backgroundColor: community.color}]}>
          <Text style={styles.politicalAvatarText}>
            {community.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.politicalMeta}>
          <Text style={[styles.cardEyebrow, {color: accent}]}>
            {community.eyebrow || 'Political Community'}
          </Text>
          <Text
            style={[styles.politicalTitle, theme.atoms.text]}
            numberOfLines={1}>
            {community.name}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.politicalSubtitle, theme.atoms.text]}
        numberOfLines={2}>
        {community.subtitle || community.communityName}
      </Text>
      <Text
        style={[styles.politicalDescription, theme.atoms.text_contrast_medium]}
        numberOfLines={2}>
        {community.desc}
      </Text>

      <View style={styles.politicalFooter}>
        <Text style={[styles.politicalHandle, {color: accent}]}>
          {community.communityName}
        </Text>
        <Text
          style={[styles.politicalMembers, theme.atoms.text_contrast_medium]}>
          {community.members}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function RefinementPanel({
  title,
  description,
  icon,
  onPress,
  theme,
  children,
}: {
  title: string
  description: string
  icon: React.ComponentType<any>
  onPress: () => void
  theme: ThemeShape
  children: React.ReactNode
}) {
  return (
    <View
      style={[
        styles.refinementPanel,
        {
          backgroundColor: theme.palette.contrast_25 + '18',
          borderColor: theme.palette.contrast_100,
        },
      ]}>
      <View style={styles.refinementHeader}>
        <View style={styles.refinementHeaderCopy}>
          <Text style={[styles.moduleTitle, theme.atoms.text]}>{title}</Text>
          <Text
            style={[
              styles.moduleDescription,
              theme.atoms.text_contrast_medium,
            ]}>
            {description}
          </Text>
        </View>

        <TouchableOpacity accessibilityRole="button" onPress={onPress}>
          <IconCircle
            icon={icon}
            size="lg"
            style={{
              backgroundColor: theme.palette.primary_500 + '14',
            }}
          />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  )
}

function TopicDiscoveryCard({
  label,
  helper,
  accent,
  theme,
  onPress,
}: {
  label: string
  helper: string
  accent: string
  theme: ThemeShape
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      style={[
        styles.topicCard,
        {
          backgroundColor: accent + '12',
          borderColor: accent + '28',
        },
      ]}
      onPress={onPress}>
      <Text style={[styles.topicLabel, theme.atoms.text]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={[styles.topicHelper, {color: accent}]} numberOfLines={2}>
        {helper}
      </Text>
    </TouchableOpacity>
  )
}

function FeaturedStateCard({
  state,
  theme,
  onPress,
}: {
  state: string
  theme: ThemeShape
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      style={[
        styles.stateCard,
        {
          backgroundColor: theme.palette.contrast_50,
          borderColor: theme.palette.contrast_100,
        },
      ]}
      onPress={onPress}>
      <Text style={[styles.stateCardTitle, theme.atoms.text]}>{state}</Text>
      <Text style={[styles.stateCardBody, theme.atoms.text_contrast_medium]}>
        <Trans>Explore territorial context</Trans>
      </Text>
    </TouchableOpacity>
  )
}

function FilterComingSoonCard({
  theme,
  pillLabel,
  title,
  body,
  ctaLabel,
  onPress,
  compact = false,
}: {
  theme: ThemeShape
  pillLabel: string
  title: string
  body: string
  ctaLabel: string
  onPress: () => void
  compact?: boolean
}) {
  return (
    <View
      style={[
        styles.comingSoonCard,
        compact && styles.comingSoonCardCompact,
        {
          backgroundColor: theme.palette.contrast_25 + '20',
          borderColor: theme.palette.contrast_100,
        },
      ]}>
      <View
        style={[
          styles.comingSoonPill,
          {backgroundColor: theme.palette.primary_500 + '18'},
        ]}>
        <Text
          style={[
            styles.comingSoonPillText,
            {color: theme.palette.primary_500},
          ]}>
          {pillLabel}
        </Text>
      </View>
      <Text style={[styles.comingSoonTitle, theme.atoms.text]}>{title}</Text>
      <Text style={[styles.comingSoonBody, theme.atoms.text_contrast_medium]}>
        {body}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.comingSoonButton,
          {
            backgroundColor: theme.palette.contrast_50,
            borderColor: theme.palette.contrast_100,
          },
        ]}
        onPress={onPress}>
        <Text style={[styles.comingSoonButtonText, theme.atoms.text]}>
          {ctaLabel}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 3

function WheelPicker({
  items,
  selectedValue,
  onValueChange,
  theme,
}: {
  items: string[]
  selectedValue: string
  onValueChange: (value: string) => void
  theme: ThemeShape
}) {
  const scrollViewRef = useRef<ScrollView>(null)
  const initialIndex = items.findIndex(item => item === selectedValue)
  const [selectedIndex, setSelectedIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0,
  )
  const isProgrammaticScroll = useRef(false)

  const getOffsetForIndex = useCallback(
    (index: number) => (index + 1) * ITEM_HEIGHT,
    [],
  )
  const getIndexFromOffset = useCallback(
    (offset: number) => Math.round(offset / ITEM_HEIGHT) - 1,
    [],
  )

  useEffect(() => {
    const index = items.findIndex(item => item === selectedValue)
    const targetIndex = index >= 0 ? index : 0
    requestAnimationFrame(() => {
      setSelectedIndex(targetIndex)
      scrollViewRef.current?.scrollTo({
        y: getOffsetForIndex(targetIndex),
        animated: false,
      })
    })
  }, [getOffsetForIndex, items, selectedValue])

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y
    const index = getIndexFromOffset(y)
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1))

    if (clampedIndex !== selectedIndex) {
      setSelectedIndex(clampedIndex)
      onValueChange(items[clampedIndex])
    }
  }

  const settleToIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1))
      const targetY = getOffsetForIndex(clampedIndex)

      scrollViewRef.current?.scrollTo({
        y: targetY,
        animated: true,
      })
      isProgrammaticScroll.current = true

      if (clampedIndex !== selectedIndex) {
        setSelectedIndex(clampedIndex)
        onValueChange(items[clampedIndex])
      }
    },
    [getOffsetForIndex, items, onValueChange, selectedIndex],
  )

  const handleScrollEndDrag = (event: any) => {
    const y = event.nativeEvent.contentOffset.y
    const index = getIndexFromOffset(y)
    settleToIndex(index)
  }

  const handleMomentumEnd = (event: any) => {
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false
      return
    }

    const y = event.nativeEvent.contentOffset.y
    const index = getIndexFromOffset(y)
    settleToIndex(index)
  }

  return (
    <View style={styles.wheelPickerContainer}>
      <View
        style={[styles.wheelPickerSelection, theme.atoms.border_contrast_low]}
      />
      <WebScrollControls
        scrollViewRef={scrollViewRef}
        direction="vertical"
        scrollAmount={ITEM_HEIGHT}
        iconSize={20}
        style={{right: 10}}
      />
      <ScrollView
        ref={scrollViewRef}
        style={styles.wheelPickerScroll}
        contentContainerStyle={styles.wheelPickerContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate={0.92}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={8}>
        <View style={{height: ITEM_HEIGHT}} />
        {items.map((item, index) => (
          <View
            key={item}
            style={[styles.wheelPickerItem, {height: ITEM_HEIGHT}]}>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.wheelPickerItemTouchable}
              onPress={() => settleToIndex(index)}>
              <Text
                style={[
                  styles.wheelPickerItemText,
                  theme.atoms.text,
                  index === selectedIndex && styles.wheelPickerItemTextSelected,
                ]}>
                {item}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{height: ITEM_HEIGHT}} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screenCenter: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  contentShell: {
    width: '100%',
    alignSelf: 'center',
  },
  contentShellWeb: {
    maxWidth: 1100,
  },
  section: {
    marginBottom: 32,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.9,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  sectionLead: {
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 720,
    marginBottom: 18,
  },
  resumeGrid: {
    gap: 12,
  },
  resumeGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resumeCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  resumeCardWeb: {
    width: '31.9%',
  },
  resumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  resumeMeta: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resumeSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  resumeDismiss: {
    padding: 6,
  },
  resumeDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  resumeFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resumeMembers: {
    fontSize: 12,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  directoryStack: {
    gap: 16,
  },
  directoryModule: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  moduleTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  moduleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardsScroll: {
    marginBottom: 0,
  },
  directoryRail: {
    gap: 12,
    paddingRight: 16,
  },
  civicCard: {
    width: 286,
    minHeight: 214,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  civicTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  civicSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  civicDescription: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  civicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  civicMembers: {
    fontSize: 12,
    fontWeight: '600',
  },
  politicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  politicalCard: {
    width: 250,
    minHeight: 186,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  politicalCardWeb: {
    flexBasis: '31%',
    minWidth: 240,
    flexGrow: 1,
  },
  politicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  politicalAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  politicalAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  politicalMeta: {
    flex: 1,
  },
  politicalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  politicalSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 8,
  },
  politicalDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  politicalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  politicalHandle: {
    fontSize: 12,
    fontWeight: '700',
  },
  politicalMembers: {
    fontSize: 12,
  },
  cabildeoCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  cabildeoMeta: {
    flex: 1,
  },
  cabildeoEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  cabildeoTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  cabildeoBody: {
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 620,
  },
  cabildeoPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  cabildeoPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  refineLayout: {
    gap: 16,
  },
  refineLayoutWeb: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  refinementPanel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  refinementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  refinementHeaderCopy: {
    flex: 1,
  },
  discoveryPanelBody: {
    gap: 16,
  },
  miniRailTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  topicRail: {
    gap: 10,
    paddingRight: 8,
  },
  topicCard: {
    width: 180,
    minHeight: 116,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  topicHelper: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  featuredStates: {
    gap: 10,
  },
  featuredStatesWeb: {
    flexDirection: 'row',
  },
  stateCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 104,
    justifyContent: 'space-between',
    flex: 1,
  },
  stateCardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  stateCardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  comingSoonCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  comingSoonCardCompact: {
    maxWidth: '100%',
    minHeight: 272,
  },
  comingSoonPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  comingSoonPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  comingSoonBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 420,
  },
  comingSoonButton: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  comingSoonButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  stateModalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  stateModalContentWeb: {
    width: '100%',
    maxWidth: 420,
    maxHeight: 360,
    alignSelf: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  wheelPickerContainer: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: 'relative',
    marginTop: 12,
    marginBottom: 12,
  },
  wheelPickerSelection: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 1,
    pointerEvents: 'none',
  },
  wheelPickerScroll: {
    flex: 1,
  },
  wheelPickerContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelPickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  wheelPickerItemTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelPickerItemText: {
    fontSize: 16,
    fontWeight: '400',
    opacity: 0.5,
  },
  wheelPickerItemTextSelected: {
    fontWeight: '600',
    opacity: 1,
  },
})
