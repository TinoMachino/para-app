import React, {useCallback, useRef, useState} from 'react'
import {Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {type NavigationProp} from '#/lib/routes/types'
import {POST_FLAIRS} from '#/lib/tags'
import {useSession} from '#/state/session'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import {FlairSelectionList} from '#/components/FlairSelectionList'
import {IconCircle} from '#/components/IconCircle'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {ListMagnifyingGlass_Stroke2_Corner0_Rounded as ListMagnifyingGlass} from '#/components/icons/ListMagnifyingGlass'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import {WebScrollControls} from '#/components/WebScrollControls'

export function CommunitiesScreen() {
  const pal = usePalette('default')
  const t = useTheme()
  // Custom darker background logic (matching BaseScreen)
  const cardBgColor = {
    backgroundColor: t.palette.contrast_25 + '30',
    borderColor: t.palette.contrast_50 + '40',
  }
  useSession()
  const navigation = useNavigation<NavigationProp>()

  // State for Modal (Shared for Participation and State)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'Participation' | 'State'>(
    'Participation',
  )

  // State for Find by Participation
  const [participationType, setParticipationType] = useState<
    'Matter' | 'Policy'
  >('Matter')
  const [selectedParticipationItem, setSelectedParticipationItem] =
    useState<string>('')

  // State for Find by State
  const [selectedStateItem, setSelectedStateItem] = useState<string>('')

  // State for Filter Buttons
  const [selectedFilter, setSelectedFilter] = useState<string>('')

  // Scroll Refs
  const filterScrollRef = useRef<ScrollView>(null)
  const communitiesScrollRef = useRef<ScrollView>(null)

  const resultsScrollRef = useRef<ScrollView>(null)
  const stateResultsScrollRef = useRef<ScrollView>(null)
  const featuredScrollRef = useRef<ScrollView>(null)

  // State for Recently Visited
  const [recentlyVisited, setRecentlyVisited] = useState<number[]>([1, 4, 7])

  const removeRecentlyVisited = useCallback((id: number) => {
    setRecentlyVisited(prev => prev.filter(item => item !== id))
  }, [])

  // Mock data
  const matters = ['Any', 'Matter 1', 'Matter 2', 'Matter 3']
  const policies = ['Any', 'Policy A', 'Policy B', 'Policy C']
  const states = [
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

  const currentPickerItems =
    modalType === 'Participation'
      ? participationType === 'Matter'
        ? matters
        : policies
      : states

  const currentSelectedValue =
    modalType === 'Participation'
      ? selectedParticipationItem
      : selectedStateItem

  const openParticipationModal = () => {
    setModalType('Participation')
    setShowModal(true)
  }

  const openStateModal = () => {
    setModalType('State')
    setShowModal(true)
  }

  const onSelectPickerItem = (value: string) => {
    if (modalType === 'Participation') {
      setSelectedParticipationItem(value)
    } else {
      setSelectedStateItem(value)
    }
  }

  const handleDone = () => {
    setShowModal(false)
  }

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

      <Layout.Center style={{flex: 1}}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <ScrollView
              ref={filterScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={{paddingRight: 20}}>
              {['Officials', 'Affiliates', "9th's", "25th's"].map(filter => {
                const isSelected = selectedFilter === filter
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={filter}
                    style={[
                      styles.filterButton,
                      isSelected
                        ? {
                            backgroundColor: t.palette.primary_500,
                            shadowColor: t.palette.primary_500,
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            shadowOffset: {width: 0, height: 2},
                          }
                        : {
                            backgroundColor: t.palette.contrast_50,
                            borderWidth: 1,
                            borderColor: t.palette.contrast_100,
                          },
                    ]}
                    onPress={() => setSelectedFilter(isSelected ? '' : filter)}>
                    <Text
                      style={[
                        styles.filterButtonText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : t.palette.contrast_800,
                        },
                      ]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <View
              style={[
                a.p_md,
                a.rounded_md,
                a.border,
                t.atoms.border_contrast_low,
                a.mb_sm,
              ]}>
              <View style={[a.flex_row, a.align_center, a.gap_xs, a.pb_sm]}>
                <ClockIcon width={16} height={16} fill={t.atoms.text.color} />
                <Text
                  style={[a.flex_1, a.text_md, a.font_semi_bold, t.atoms.text]}>
                  <Trans>Recently visited communities</Trans>
                </Text>
              </View>
              <View style={[a.gap_xs, a.px_md]}>
                {recentlyVisited.map(id => (
                  <RecentlyVisitedItem
                    key={id}
                    id={id}
                    navigation={navigation}
                    onRemove={removeRecentlyVisited}
                  />
                ))}
              </View>
            </View>

            <View style={{position: 'relative'}}>
              <WebScrollControls scrollViewRef={communitiesScrollRef} />
              <ScrollView
                ref={communitiesScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.cardsScroll}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9]
                  .map(i => {
                    const data = COMMUNITY_DATA[(i - 1) % COMMUNITY_DATA.length]
                    if (selectedFilter && data.category !== selectedFilter) {
                      return null
                    }
                    return (
                      <CommunityCard
                        key={i}
                        index={i}
                        t={t}
                        pal={pal}
                        style={{width: 300}}
                        onPress={() =>
                          navigation.navigate('CommunityProfile', {
                            communityId: String(i),
                            communityName: `Community ${i}`,
                          })
                        }
                      />
                    )
                  })
                  .filter(Boolean)}
              </ScrollView>
            </View>
          </View>

          {/* ─── Cabildeo Entry Point ─── */}
          <View style={[styles.section, {marginTop: 0}]}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CabildeoList')}
              style={{
                borderRadius: 16,
                padding: 18,
                marginHorizontal: 16,
                backgroundColor: t.palette.primary_500 + '12',
                borderWidth: 1,
                borderColor: t.palette.primary_500 + '30',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
              <Text style={{fontSize: 28}}>🗳️</Text>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    {fontSize: 16, fontWeight: '900'},
                    t.atoms.text,
                  ]}>
                  Cabildeo
                </Text>
                <Text
                  style={[
                    {fontSize: 12, marginTop: 2},
                    t.atoms.text_contrast_medium,
                  ]}>
                  Deliberación cívica · Propuestas y votación cuadrática
                </Text>
              </View>
              <Text style={[{fontSize: 18}, t.atoms.text_contrast_medium]}>
                ›
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, {marginTop: 0}]}>
            <View style={[styles.sectionHeader, {marginBottom: 8}]}>
              <Text style={[styles.sectionTitle, pal.text]}>
                <Trans>Find by participation</Trans>
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={openParticipationModal}>
                <IconCircle
                  icon={ListMagnifyingGlass}
                  size="lg"
                  style={{backgroundColor: '#F2F2F2'}}
                />
              </TouchableOpacity>
            </View>

            {selectedParticipationItem &&
            selectedParticipationItem !== 'Any' ? (
              <View style={styles.resultsContainer}>
                <Text style={[styles.resultsText, pal.text]}>
                  Results for {participationType}: {selectedParticipationItem}
                </Text>
                <View style={{position: 'relative'}}>
                  <WebScrollControls scrollViewRef={resultsScrollRef} />
                  <ScrollView
                    ref={resultsScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.cardsScroll}>
                    {[10, 11].map(i => (
                      <CommunityCard
                        key={i}
                        index={i}
                        t={t}
                        pal={pal}
                        onPress={() =>
                          navigation.navigate('CommunityProfile', {
                            communityId: String(i),
                            communityName: `Community ${i}`,
                          })
                        }
                      />
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : (
              <View style={styles.resultsContainer}>
                <View style={{marginBottom: 12}}>
                  <Text
                    style={[styles.resultsText, pal.text, {marginBottom: 6}]}>
                    <Trans>Trending Matters</Trans>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.cardsScroll}
                    contentContainerStyle={{gap: 8}}>
                    {Object.values(POST_FLAIRS)
                      .filter(f => f.id.startsWith('matter_'))
                      .slice(0, 15) // Limit for performance/demo
                      .map((item, i) => (
                        <TouchableOpacity
                          key={i}
                          accessibilityRole="button"
                          style={[
                            styles.communityCard,
                            {
                              width: 200,
                              height: 120,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: cardBgColor.backgroundColor,
                              borderColor: cardBgColor.borderColor,
                              borderWidth: 1,
                            },
                          ]}
                          onPress={() => {
                            setParticipationType('Matter')
                            setSelectedParticipationItem(item.label)
                          }}>
                          <Text
                            style={[
                              styles.cardTitle,
                              t.atoms.text,
                              {fontSize: 14, textAlign: 'center'},
                            ]}
                            numberOfLines={2}>
                            {item.tag}
                          </Text>
                          <Text
                            style={[
                              styles.cardMembers,
                              t.atoms.text_contrast_medium,
                            ]}>
                            Tap to view
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>

                <View>
                  <Text
                    style={[styles.resultsText, pal.text, {marginBottom: 6}]}>
                    <Trans>Popular Policies</Trans>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.cardsScroll}
                    contentContainerStyle={{gap: 8}}>
                    {Object.values(POST_FLAIRS)
                      .filter(f => f.id.startsWith('policy_'))
                      .slice(0, 15) // Limit for performance/demo
                      .map((item, i) => (
                        <TouchableOpacity
                          key={i}
                          accessibilityRole="button"
                          style={[
                            styles.communityCard,
                            {
                              width: 200,
                              height: 120,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: cardBgColor.backgroundColor,
                              borderColor: cardBgColor.borderColor,
                              borderWidth: 1,
                            },
                          ]}
                          onPress={() => {
                            setParticipationType('Policy')
                            setSelectedParticipationItem(item.label)
                          }}>
                          <Text
                            style={[
                              styles.cardTitle,
                              t.atoms.text,
                              {fontSize: 14, textAlign: 'center'},
                            ]}
                            numberOfLines={2}>
                            {item.tag}
                          </Text>
                          <Text
                            style={[
                              styles.cardMembers,
                              t.atoms.text_contrast_medium,
                            ]}>
                            Tap to view
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.section, {marginTop: 0}]}>
            <View style={[styles.sectionHeader, {marginBottom: 8}]}>
              <Text style={[styles.sectionTitle, pal.text]}>
                <Trans>Find by state</Trans>
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={openStateModal}>
                <IconCircle
                  icon={FilterIcon}
                  size="lg"
                  style={{backgroundColor: '#F2F2F2'}}
                />
              </TouchableOpacity>
            </View>

            {selectedStateItem && selectedStateItem !== 'Cualquiera' ? (
              <View style={styles.resultsContainer}>
                <Text style={[styles.resultsText, pal.text]}>
                  <Trans>Results for State: {selectedStateItem}</Trans>
                </Text>
                <View style={{position: 'relative'}}>
                  <WebScrollControls scrollViewRef={stateResultsScrollRef} />
                  <ScrollView
                    ref={stateResultsScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.cardsScroll}>
                    {[12, 13].map(i => (
                      <CommunityCard
                        key={i}
                        index={i}
                        t={t}
                        pal={pal}
                        onPress={() =>
                          navigation.navigate('CommunityProfile', {
                            communityId: String(i),
                            communityName: `Community ${i}`,
                          })
                        }
                      />
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : (
              <View style={styles.resultsContainer}>
                <Text style={[styles.resultsText, pal.text, {marginBottom: 8}]}>
                  <Trans>Featured States</Trans>
                </Text>
                <View style={{position: 'relative'}}>
                  <WebScrollControls scrollViewRef={featuredScrollRef} />
                  <ScrollView
                    ref={featuredScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{paddingRight: 16}}>
                    {['CDMX', 'Jalisco', 'Nuevo León'].map(state => (
                      <TouchableOpacity
                        accessibilityRole="button"
                        key={state}
                        style={[
                          styles.communityCard,
                          t.atoms.bg_contrast_25,
                          {
                            width: 200,
                            height: 120,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: undefined, // Override manual bg
                          },
                        ]}
                        onPress={() => setSelectedStateItem(state)}>
                        <Text
                          style={[
                            styles.cardTitle,
                            t.atoms.text,
                            {fontSize: 18},
                          ]}>
                          {state}
                        </Text>
                        <Text
                          style={[
                            styles.cardMembers,
                            t.atoms.text_contrast_medium,
                          ]}>
                          <Trans>Tap to view</Trans>
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </Layout.Center>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              t.atoms.bg,
              {height: '80%', padding: 0},
            ]}>
            {/* Height increased and padding removed to let list fill space */}

            {modalType === 'Participation' ? (
              <View style={{flex: 1, padding: 16}}>
                {/* Close handle/header visual */}
                <View
                  style={[
                    styles.modalHandle,
                    {alignSelf: 'center', marginBottom: 10},
                  ]}
                />

                <FlairSelectionList
                  selectedFlairs={
                    selectedParticipationItem &&
                    selectedParticipationItem !== 'Any'
                      ? Object.values(POST_FLAIRS).filter(
                          f => f.label === selectedParticipationItem,
                        )
                      : []
                  }
                  setSelectedFlairs={(flairs: any[]) => {
                    if (flairs.length > 0) {
                      const f = flairs[0]
                      setParticipationType(
                        f.id.startsWith('policy_') ? 'Policy' : 'Matter',
                      )
                      setSelectedParticipationItem(f.label)
                    } else {
                      setSelectedParticipationItem('Any')
                    }
                    setShowModal(false)
                  }}
                  mode={participationType.toLowerCase() as 'matter' | 'policy'}
                  onClose={() => setShowModal(false)}
                />
              </View>
            ) : (
              /* Keep existing State picker logic if modalType is State */
              <>
                <View style={styles.modalHandle} />
                <Text style={[styles.modalSubtitle, t.atoms.text]}>
                  select a state
                </Text>

                <WheelPicker
                  items={currentPickerItems}
                  selectedValue={currentSelectedValue}
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

import {COMMUNITY_DATA} from '#/lib/constants/mockData'

function CommunityCard({
  index,
  t,
  pal,
  style,
  onPress,
}: {
  index: number
  t: any
  pal: any
  style?: any
  onPress?: () => void
}) {
  const data = COMMUNITY_DATA[(index - 1) % COMMUNITY_DATA.length]

  const cardBgColor = {
    backgroundColor: t.palette.contrast_25 + '30',
    borderColor: t.palette.contrast_50 + '40',
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.communityCard,
        {
          backgroundColor: cardBgColor.backgroundColor,
          borderColor: cardBgColor.borderColor,
          borderWidth: 1,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatarPlaceholder, {backgroundColor: data.color}]}>
          <Text style={styles.avatarText}>{data.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, pal.text]} numberOfLines={1}>
            p/{data.name}
          </Text>
          <Text
            style={[
              styles.cardMembers,
              {color: t.atoms.text_contrast_medium.color},
            ]}>
            {data.members} miembros
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.joinButton, {backgroundColor: data.color}]}>
          <Text style={styles.joinButtonText}>Unirse</Text>
        </TouchableOpacity>
      </View>
      <Text
        style={[
          styles.cardDescription,
          {color: t.atoms.text_contrast_medium.color},
        ]}
        numberOfLines={2}>
        {data.desc}
      </Text>
    </TouchableOpacity>
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
  theme: any
}) {
  const scrollViewRef = useRef<ScrollView>(null)
  const initialIndex = items.findIndex(item => item === selectedValue)
  const [selectedIndex, setSelectedIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0,
  )
  const isProgrammaticScroll = useRef(false)

  // Memoized helpers for calculation
  const getOffsetForIndex = useCallback(
    (index: number) => (index + 1) * ITEM_HEIGHT,
    [],
  )
  const getIndexFromOffset = useCallback(
    (offset: number) => Math.round(offset / ITEM_HEIGHT) - 1,
    [],
  )

  // Sync scroll on mount/change
  React.useEffect(() => {
    const index = items.findIndex(item => item === selectedValue)
    const targetIndex = index >= 0 ? index : 0
    setSelectedIndex(targetIndex)
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: getOffsetForIndex(targetIndex),
        animated: false,
      })
    })
  }, [items, selectedValue, getOffsetForIndex])

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
    [items, onValueChange, selectedIndex, getOffsetForIndex],
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Fix occlusion by bottom tab bar
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24, // Main Title Size
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#1A1A1A',
  },
  recommendedSection: {
    marginTop: 8,
  },
  recommendedTitle: {
    fontSize: 18, // Subtitle Size
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  filterScroll: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonText: {
    fontWeight: '600',
  },
  cardsScroll: {
    marginBottom: 16,
  },
  communityCard: {
    width: 280,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardMembers: {
    fontSize: 12,
  },
  joinButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  seeMoreCard: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
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
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalToggles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonActive: {},
  toggleText: {
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
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
})

function RecentlyVisitedItem({
  id,
  navigation,
  onRemove,
}: {
  id: number
  navigation: NavigationProp
  onRemove: (id: number) => void
}) {
  const t = useTheme()
  const item = COMMUNITY_DATA[(id - 1) % COMMUNITY_DATA.length]

  return (
    <View style={[a.flex_row, a.align_center, a.gap_sm, a.py_2xs, t.atoms.bg]}>
      <TouchableOpacity
        accessibilityRole="button"
        style={[a.flex_row, a.align_center, a.gap_sm, a.flex_1]}
        onPress={() =>
          navigation.navigate('CommunityProfile', {
            communityId: String(id),
            communityName: `Community ${id}`,
          })
        }>
        <View
          style={[
            {
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: item.color,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}>
          <Text
            style={{
              color: t.palette.white,
              fontWeight: 'bold',
              fontSize: 12,
            }}>
            {item.name.charAt(0)}
          </Text>
        </View>
        <View style={{flex: 1}}>
          <Text
            style={[a.text_md, a.font_bold, t.atoms.text]}
            numberOfLines={1}>
            p/{item.name}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        style={[a.p_xs]}
        onPress={() => onRemove(id)}>
        <XIcon
          width={12}
          height={12}
          fill={t.atoms.text_contrast_medium.color}
        />
      </TouchableOpacity>
    </View>
  )
}
