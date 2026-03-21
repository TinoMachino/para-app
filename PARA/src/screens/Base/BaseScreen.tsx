import {useCallback, useRef, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {ComposeIcon2} from '#/lib/icons'
import {type NavigationProp} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {useProfileQuery} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {useBaseFilter} from '#/state/shell/base-filter' // Added import
import {PostFeed} from '#/view/com/posts/PostFeed'
import {FAB} from '#/view/com/util/fab/FAB'
import {type ListMethods} from '#/view/com/util/List' // Changed ListRef to ListMethods
import {Text} from '#/view/com/util/text/Text'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useGutters, useTheme} from '#/alf'
import {
  CommunityFilterList,
  CompassSettingsButton,
} from '#/components/BaseFilterControls'
import {Button, ButtonIcon} from '#/components/Button'
import {CommunityIcon_Stroke as CommunityIcon} from '#/components/icons/Community'
import {Compass_Stroke2_Corner0_Rounded as CompassIcon} from '#/components/icons/Compass'
import {Globe_Stroke2_Corner0_Rounded as GlobeIcon} from '#/components/icons/Globe'
import {Image_Stroke2_Corner0_Rounded as ImageIcon} from '#/components/icons/Image'
import {Message_Stroke2_Corner0_Rounded as MessageIcon} from '#/components/icons/Message'
import {PageText_Stroke2_Corner0_Rounded as PageTextIcon} from '#/components/icons/PageText'
import {Pencil_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {Person_Stroke2_Corner0_Rounded as PersonIcon} from '#/components/icons/Person'
import {Verified_Stroke2_Corner2_Rounded as VerifiedIcon} from '#/components/icons/Verified'
import * as Layout from '#/components/Layout'
import {IS_WEB} from '#/env'

export function BaseScreen() {
  const {_} = useLingui()
  const t = useTheme()
  const gutters = useGutters([0, 'base'])
  const {hasSession, currentAccount} = useSession()
  const navigation = useNavigation<NavigationProp>()
  const currentDid = currentAccount?.did
  const {data: currentProfile} = useProfileQuery({did: currentDid || ''})

  // Tab bar state
  const [activeTab, setActiveTab] = useState('Parties')

  // Data Tab State (Official/Unofficial toggle)
  const [isOfficial, setIsOfficial] = useState(true)
  const [refreshSignal, setRefreshSignal] = useState(0) // Added signal state
  const {
    selectedFilters,
    activeFilters,
    selectedState,
    activeState,
    applyFilters,
  } = useBaseFilter()
  const scrollRef = useRef<ListMethods>(null)

  const handleApplyFilters = useCallback(() => {
    // 1. Apply logic
    applyFilters()

    // 2. Scroll to top
    scrollRef.current?.scrollToOffset({offset: 0, animated: true})

    // 3. Trigger refreshing state
    // Increment signal to trigger PostFeed refresh animation
    setRefreshSignal(prev => prev + 1)
  }, [applyFilters])

  const hasPendingChanges =
    JSON.stringify(selectedFilters.slice().sort()) !==
      JSON.stringify(activeFilters.slice().sort()) ||
    selectedState !== activeState

  const handleMyBase = () => {
    navigation.navigate('MyBase')
  }

  const handleCommunities = () => {
    navigation.navigate('Communities')
  }

  const handleCreatePost = () => {
    navigation.navigate('CreatePost')
  }

  // Custom darker background for cards to match user preference
  // Assuming hex colors for palette, adding alpha for transparency
  // 40 = 25% opacity, 80 = 50% opacity
  const cardBgColor = {
    backgroundColor: t.palette.contrast_25 + '30', // Very subtle dark background
    borderWidth: 1,
    borderColor: t.palette.contrast_50 + '40',
  }

  return (
    <Layout.Screen testID="baseScreen">
      {/* Top App Bar Section */}
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.MenuButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>Base</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot>
          <Button
            label={_(msg`Communities`)}
            size="small"
            variant="ghost"
            color="secondary"
            shape="round"
            onPress={handleCommunities}
            style={[
              a.justify_center,
              {transform: [{translateX: 8}, {translateY: 2}]},
            ]}>
            <ButtonIcon icon={CommunityIcon} size="lg" />
          </Button>
        </Layout.Header.Slot>
      </Layout.Header.Outer>

      {/* Main Content - wrapped in Layout.Center on web */}
      <Layout.Center style={{flex: 1}}>
        {/* Tab Bar Section */}
        <View style={[styles.tabBar, t.atoms.border_contrast_low, gutters]}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.myBaseButton}
            onPress={handleMyBase}>
            <UserAvatar
              avatar={currentProfile?.avatar}
              size={32}
              type={currentProfile?.associated?.labeler ? 'labeler' : 'user'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.tabItem,
              activeTab === 'Parties' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('Parties')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'Parties'
                  ? t.atoms.text
                  : t.atoms.text_contrast_medium,
                a.text_md,
                a.font_semi_bold,
                {lineHeight: 20},
              ]}>
              <Trans>Parties</Trans>
            </Text>
            {activeTab === 'Parties' && (
              <View
                style={[
                  styles.tabUnderline,
                  {backgroundColor: t.palette.primary_500},
                ]}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[
              styles.tabItem,
              activeTab === 'Data' && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab('Data')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'Data'
                  ? t.atoms.text
                  : t.atoms.text_contrast_medium,
                a.text_md,
                a.font_semi_bold,
                {lineHeight: 20},
              ]}>
              <Trans>Data</Trans>
            </Text>
            {activeTab === 'Data' && (
              <View
                style={[
                  styles.tabUnderline,
                  {backgroundColor: t.palette.primary_500},
                ]}
              />
            )}
          </TouchableOpacity>
          <CompassSettingsButton />
        </View>

        {/* Content based on active tab */}
        {activeTab === 'Parties' ? (
          <>
            {/* Community Cards Section */}
            <CommunityFilterList
              hasPendingChanges={hasPendingChanges}
              applyFilters={handleApplyFilters}
              filterCount={selectedFilters.length}
            />

            {/* Posts Feed Section */}
            <View style={styles.feedSection}>
              <PostFeed
                feed="following"
                applyBaseCommunityFilters
                style={styles.feedContainer}
                scrollElRef={scrollRef} // Pass ref
                manualRefreshSignal={refreshSignal} // Pass signal
                hideComposerPrompt={true}
                renderEmptyState={() => (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, t.atoms.text]}>
                      <Trans>No posts to show</Trans>
                    </Text>
                  </View>
                )}
              />
            </View>
          </>
        ) : (
          /* Data Screen */
          <View style={[{flex: 1}, t.atoms.bg]}>
            {/* Community Cards Section */}
            <CommunityFilterList
              hasPendingChanges={hasPendingChanges}
              applyFilters={handleApplyFilters}
              filterCount={selectedFilters.length}
            />
            <ScrollView
              style={styles.dataScreen}
              contentContainerStyle={styles.dataScreenContent}>
              <View style={styles.firstDataSection}>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.mb_md,
                  ]}>
                  <Text style={[styles.sectionTitle, t.atoms.text, a.mb_0]}>
                    <Trans>Civic Elements</Trans>
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setIsOfficial(!isOfficial)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    style={[
                      a.flex_row,
                      a.align_center,
                      a.gap_xs,
                      a.px_sm,
                      a.py_xs,
                      {
                        borderRadius: 100,
                        backgroundColor: isOfficial
                          ? t.palette.primary_50
                          : t.palette.contrast_25,
                        borderWidth: 1,
                        borderColor: isOfficial
                          ? t.palette.primary_100
                          : t.palette.contrast_100,
                      },
                    ]}>
                    <Text
                      style={[
                        a.font_bold,
                        a.text_sm,
                        isOfficial
                          ? {color: t.palette.primary_500}
                          : t.atoms.text,
                      ]}>
                      {isOfficial ? 'Official' : 'Community'}
                    </Text>
                    <VerifiedIcon
                      size="md"
                      style={
                        isOfficial
                          ? {color: t.palette.primary_500}
                          : t.atoms.text
                      }
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardsGrid}>
                  {/* Policies Card */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    activeOpacity={0.9} // Keep opacity active for policies/matters
                    onPress={() =>
                      navigation.navigate('PoliciesDashboard', {
                        filter: isOfficial ? 'Parties' : 'Communities',
                        mode: 'Policies',
                      })
                    }>
                    <View style={[a.w_full, a.align_start]}>
                      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                        <Text
                          style={[
                            styles.dataCardTitle,
                            t.atoms.text,
                            {textAlign: 'left'},
                          ]}>
                          Policies
                        </Text>
                        {isOfficial && (
                          <VerifiedIcon
                            size="md"
                            fill={t.palette.primary_500}
                            style={{color: t.palette.primary_500}}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          t.atoms.text_contrast_medium,
                          a.text_xs,
                          a.mt_xs,
                        ]}>
                        {isOfficial ? 'Official' : 'Community'}
                      </Text>
                    </View>

                    <View style={{alignSelf: 'center', marginTop: -32}}>
                      <Text
                        style={[
                          a.font_bold,
                          {
                            fontSize: 24,
                            lineHeight: 32,
                          },
                          isOfficial
                            ? {color: t.palette.primary_500}
                            : t.atoms.text,
                        ]}>
                        ||#
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Matters Card */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('PoliciesDashboard', {
                        filter: isOfficial ? 'Parties' : 'Communities',
                        mode: 'Matters',
                      })
                    }>
                    <View style={[a.w_full, a.align_start]}>
                      <View style={[a.flex_row, a.align_center, a.gap_xs]}>
                        <Text
                          style={[
                            styles.dataCardTitle,
                            t.atoms.text,
                            {textAlign: 'left'},
                          ]}>
                          Matters
                        </Text>
                        {isOfficial && (
                          <VerifiedIcon
                            size="md"
                            fill={t.palette.primary_500}
                            style={{color: t.palette.primary_500}}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          t.atoms.text_contrast_medium,
                          a.text_xs,
                          a.mt_xs,
                        ]}>
                        {isOfficial ? 'Official' : 'Community'}
                      </Text>
                    </View>

                    <View style={{alignSelf: 'center', marginTop: -32}}>
                      <Text
                        style={[
                          a.font_bold,
                          {
                            fontSize: 24,
                            lineHeight: 32,
                          },
                          isOfficial
                            ? {color: t.palette.primary_500}
                            : t.atoms.text,
                        ]}>
                        |#
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() => navigation.navigate('Representatives', {})}>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>
                      Representatives
                    </Text>
                    <View style={{alignSelf: 'center', marginTop: -48}}>
                      <PersonIcon
                        width={48}
                        style={{color: t.palette.primary_500}}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() => navigation.navigate('RAQ')}>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>
                      <Trans>RAQs and Open Questions</Trans>
                    </Text>
                    <View style={{alignSelf: 'center', marginTop: -48}}>
                      <Text
                        style={[
                          a.font_bold,
                          {
                            fontSize: 24,
                            color: t.palette.primary_500,
                            lineHeight: 32,
                          },
                        ]}>
                        |#?! & |#?
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() =>
                      navigation.navigate('MemesAndDocuments', {})
                    }>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>
                      Memes & Docs
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: -32,
                      }}>
                      <ImageIcon
                        width={44}
                        style={{color: t.palette.primary_500}}
                      />
                      <Text
                        style={[
                          a.font_bold,
                          {
                            fontSize: 24,
                            color: t.palette.primary_500,
                            marginHorizontal: 8,
                          },
                        ]}>
                        &
                      </Text>
                      <PageTextIcon
                        width={44}
                        style={{color: t.palette.primary_500}}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() => navigation.navigate('Highlights')}>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>
                      Highlights
                    </Text>
                    <View style={{alignSelf: 'center', marginTop: -48}}>
                      <PencilIcon
                        width={48}
                        style={{color: t.palette.primary_500}}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 2: Visualizaciones */}
              <View style={styles.dataSection}>
                <Text style={[styles.sectionTitle, t.atoms.text]}>
                  <Trans>Visualizations</Trans>
                </Text>
                <View style={styles.cardsGrid}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() =>
                      navigation.navigate('VSScreenV2', {
                        entities: ['PRI', 'DERECHA'],
                      })
                    }>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>VS</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: -48,
                      }}>
                      <PersonIcon
                        width={56}
                        style={{color: t.palette.primary_500}}
                      />
                      <Text
                        style={[
                          a.font_bold,
                          a.text_md,
                          {marginHorizontal: 8, color: t.palette.primary_500},
                        ]}>
                        vs
                      </Text>
                      <CommunityIcon
                        width={56}
                        style={{color: t.palette.primary_500}}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() => navigation.navigate('DiscourseAnalysis')}>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>
                      Discourse Analysis
                    </Text>
                    <View style={{alignSelf: 'center', marginTop: -48}}>
                      <MessageIcon
                        width={48}
                        style={{color: t.palette.primary_500}}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() => navigation.navigate('Map')}>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>
                      Map
                    </Text>
                    <View style={{alignSelf: 'center', marginTop: -48}}>
                      <GlobeIcon
                        width={48}
                        style={{color: t.palette.primary_500}}
                      />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.dataCard, cardBgColor]}
                    onPress={() => navigation.navigate('Compass')}>
                    <Text style={[styles.dataCardTitle, t.atoms.text]}>
                      Compass
                    </Text>
                    <View style={{alignSelf: 'center', marginTop: -48}}>
                      <CompassIcon
                        width={48}
                        style={{color: t.palette.primary_500}}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Layout.Center>

      {/* Bottom Navigation Bar - only show on native */}
      {!IS_WEB && (
        <View style={[styles.bottomNav, t.atoms.border_contrast_low]}>
          <View
            style={[
              styles.navIcon,
              styles.navIconActive,
              {backgroundColor: t.palette.primary_500},
            ]}
          />
          <View
            style={[styles.navIcon, {backgroundColor: t.palette.contrast_300}]}
          />
          <View
            style={[styles.navIcon, {backgroundColor: t.palette.contrast_300}]}
          />
          <View
            style={[styles.navIcon, {backgroundColor: t.palette.contrast_300}]}
          />
          <View
            style={[styles.navIcon, {backgroundColor: t.palette.contrast_300}]}>
            <View
              style={[
                styles.notificationBadge,
                {backgroundColor: t.palette.negative_500},
              ]}
            />
          </View>
          <View
            style={[styles.navIcon, {backgroundColor: t.palette.contrast_300}]}
          />
        </View>
      )}

      {/* Floating Apply Button - Mobile Only */}
      {!IS_WEB && hasPendingChanges && (
        <TouchableOpacity
          style={[
            styles.floatingApplyButton,
            {backgroundColor: t.palette.primary_500},
          ]}
          onPress={handleApplyFilters}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Apply filters`)}
          accessibilityHint={_(
            msg`Applies the selected filters to the results`,
          )}>
          <Text style={[styles.floatingApplyText, t.atoms.text_inverted]}>
            <Trans>Apply ({selectedFilters.length})</Trans>
          </Text>
        </TouchableOpacity>
      )}

      {/* Floating Action Button */}
      {hasSession && (
        <FAB
          testID="composeFAB"
          onPress={handleCreatePost}
          icon={<ComposeIcon2 strokeWidth={1.5} size={29} style={s.white} />}
          accessibilityRole="button"
          accessibilityLabel={_(msg({message: `New post`, context: 'action'}))}
          accessibilityHint=""
        />
      )}
    </Layout.Screen>
  )
}

// Wheel Picker Constants
const ITEM_HEIGHT = 44
const VISIBLE_ITEMS = 3

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  communitySection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  feedSection: {
    flex: 1,
  },
  feedContainer: {
    flex: 1,
  },
  applyButtonContainer: {
    position: 'absolute',
    bottom: 90, // Above tab bar/FAB
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  communityCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  settingsOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#474652',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#474652',
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
  dataScreen: {
    flex: 1,
  },
  dataScreenContent: {
    padding: 16,
  },
  dataSection: {
    marginBottom: 24,
  },
  firstDataSection: {
    marginBottom: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataCard: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  dataCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dataCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: 'center',
  },
  filterButton: {
    width: 33,
    paddingHorizontal: 0,
    paddingVertical: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{translateY: 1}],
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterToggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  myBaseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: -14, // Adjusted back from -19
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{translateY: -3}],
  },
  tabItem: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {
    // Active state styling
  },
  tabText: {
    // Font styling is now handled by a.text_md and a.font_semi_bold atoms
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 2,
    backgroundColor: '#474652',
  },
  contentFeed: {
    flex: 1,
    padding: 16,
  },
  communityCard: {
    borderRadius: 8,
    marginRight: 12,
    width: 120,
    overflow: 'hidden',
  },
  communityCardTop: {
    height: 50,
    position: 'relative',
  },
  communityCardShapes: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    height: 34,
  },
  shape1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 12,
    borderRadius: 6,
  },
  shape2: {
    position: 'absolute',
    top: 8,
    left: 25,
    width: 16,
    height: 10,
    borderRadius: 5,
  },
  shape3: {
    position: 'absolute',
    top: 3,
    right: 12,
    width: 22,
    height: 16,
    borderRadius: 8,
  },
  communityCardBottom: {
    padding: 8,
  },
  communityCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  post: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  postIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#666',
    borderRadius: 12,
  },
  postUserInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postUserHandle: {
    fontSize: 14,
    color: '#999',
  },
  postAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#666',
    borderRadius: 16,
  },
  postCaption: {
    fontSize: 16,
    marginBottom: 12,
  },
  nestedPost: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  nestedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  nestedPostIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#666',
    borderRadius: 10,
  },
  nestedPostName: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#474652',
    borderRadius: 8,
  },
  nestedPostHandle: {
    fontSize: 12,
    color: '#999',
  },
  nestedPostText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  diagram: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  diagramTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  diagramContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagramLeft: {
    flex: 1,
    gap: 8,
  },
  diagramNode: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  diagramNodeText: {
    fontSize: 12,
    textAlign: 'center',
  },
  diagramCenter: {
    marginHorizontal: 16,
  },
  diagramCenterNode: {
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagramCenterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  diagramRight: {
    flex: 1,
    alignItems: 'center',
  },
  diagramRightNode: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagramRightText: {
    fontSize: 12,
    color: '#474652',
    textAlign: 'center',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#666',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#999',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#666',
    borderRadius: 12,
    position: 'relative',
  },
  navIconActive: {
    backgroundColor: '#474652',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
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
  wheelPickerItemSelected: {
    // Selected item styling
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
  statesList: {
    maxHeight: 400,
    marginVertical: 16,
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stateItemSelected: {
    backgroundColor: 'rgba(91, 47, 161, 0.1)',
  },
  stateItemText: {
    fontSize: 16,
    flex: 1,
  },
  stateItemTextSelected: {
    fontWeight: '600',
    color: '#5b2fa1',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingApplyButton: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingApplyText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
})

// Shared constants and component imports are already at the top
