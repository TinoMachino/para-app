import {useMemo, useState} from 'react'
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {POST_FLAIRS} from '#/lib/tags'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeftIcon} from '#/components/icons/Arrow'
import {ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon} from '#/components/icons/Chevron'
import {Clock_Stroke2_Corner0_Rounded as ClockIcon} from '#/components/icons/Clock'
import {MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon} from '#/components/icons/MagnifyingGlass'
import {TimesLarge_Stroke2_Corner0_Rounded as TimesIcon} from '#/components/icons/Times'
import * as Layout from '#/components/Layout'
import {IS_WEB} from '#/env'

const {width} = Dimensions.get('window')

// --- Mock Data ---
// Using similar mock data structure but adapted for the new UI
// --- Mock Data ---
// OLD DATA REMOVED

const CATEGORIES = [
  'SocialIssues',
  'Economy',
  'PublicServices',
  'InternalReveServ',
  'InternalAffairs',
  'ExternalAffairs',
]

// --- Components ---

const FilterPill = ({
  label,
  icon,
  active,
  hasDropdown,
  labelStyle,
}: {
  label?: string
  icon?: React.ReactNode
  active?: boolean
  hasDropdown?: boolean
  labelStyle?: any
}) => {
  const t = useTheme()
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.filterPill,
        active
          ? {
              backgroundColor: t.palette.contrast_800,
              borderColor: t.palette.contrast_800,
            }
          : {
              backgroundColor: t.palette.contrast_50,
              borderColor: t.palette.contrast_50,
            },
      ]}>
      {icon}
      {label && (
        <Text
          style={[
            styles.filterPillText,
            active ? {color: t.palette.white} : t.atoms.text_contrast_medium,
            labelStyle,
          ]}>
          {label}
        </Text>
      )}
      {hasDropdown && (
        <ChevronDownIcon
          size="xs"
          style={
            active ? {color: t.palette.white} : t.atoms.text_contrast_medium
          }
        />
      )}
    </TouchableOpacity>
  )
}

// HeaderParty component - moved outside to avoid creating during render
const HeaderParty = ({
  name,
  align,
}: {
  name: string
  align: 'left' | 'right'
}) => {
  const t = useTheme()
  const approvalVal = 75
  const voterVal = 45

  return (
    <View style={styles.headerPartyCol}>
      <View
        style={[
          styles.largeCircle,
          {
            backgroundColor: t.palette.contrast_50,
            borderColor: t.palette.contrast_25,
          },
        ]}
      />
      <Text style={[styles.headerPartyName, t.atoms.text, {marginTop: 8}]}>
        {name}
      </Text>

      {/* APPROVAL bar with inward percentage */}
      <View
        style={[
          styles.headerBarContainer,
          {flexDirection: 'row', alignItems: 'center'},
        ]}>
        {align === 'right' && (
          <Text
            style={[
              {fontSize: 10, fontWeight: '700', marginRight: 4},
              t.atoms.text,
            ]}>
            {approvalVal}%
          </Text>
        )}
        <View style={{flex: 1}}>
          <ProgressBar
            label="APPROVAL"
            progress={approvalVal / 100}
            fillColor={t.palette.contrast_800}
            trackColor={t.palette.contrast_50}
            textColor={t.palette.white}
          />
        </View>
        {align === 'left' && (
          <Text
            style={[
              {fontSize: 10, fontWeight: '700', marginLeft: 4},
              t.atoms.text,
            ]}>
            {approvalVal}%
          </Text>
        )}
      </View>

      {/* VOTER bar with inward percentage */}
      <View
        style={[
          styles.headerBarContainer,
          {flexDirection: 'row', alignItems: 'center'},
        ]}>
        {align === 'right' && (
          <Text
            style={[
              {fontSize: 10, fontWeight: '700', marginRight: 4},
              t.atoms.text,
            ]}>
            {voterVal}%
          </Text>
        )}
        <View style={{flex: 1}}>
          <ProgressBar
            label="VOTER"
            progress={voterVal / 100}
            fillColor={t.palette.contrast_100}
            trackColor={t.palette.contrast_25}
            textColor={t.atoms.text_contrast_medium.color}
          />
        </View>
        {align === 'left' && (
          <Text
            style={[
              {fontSize: 10, fontWeight: '700', marginLeft: 4},
              t.atoms.text,
            ]}>
            {voterVal}%
          </Text>
        )}
      </View>
    </View>
  )
}

const ComparisonHeader = ({
  p1,
  p2,
}: {
  p1: {name: string; color: string}
  p2: {name: string; color: string}
}) => {
  const t = useTheme()

  return (
    <View style={styles.vsHeader}>
      <HeaderParty name={p1.name} align="left" />

      <View style={styles.vsCenter}>
        <View style={{flexDirection: 'row', gap: 24, marginBottom: 8}}>
          <ChevronDownIcon size="md" style={t.atoms.text_contrast_low} />
          <ChevronDownIcon size="md" style={t.atoms.text_contrast_low} />
        </View>
        <Text
          style={[
            styles.vsText,
            t.atoms.text_contrast_medium,
            {marginVertical: 4},
          ]}>
          vs
        </Text>
        <View
          style={{
            width: 1,
            flex: 1,
            backgroundColor: t.palette.contrast_100,
            marginTop: 4,
            marginBottom: 20,
          }}
        />
      </View>

      <HeaderParty name={p2.name} align="right" />
    </View>
  )
}

const ComparisonCard = ({
  item,
  index,
}: {
  item: (typeof MOCK_COMPARISONS)[0]
  index: number
}) => {
  const t = useTheme()
  const isRightColumn = index % 2 !== 0

  return (
    <View
      style={[
        styles.card,
        t.atoms.bg,
        {
          borderColor: t.palette.contrast_25,
          borderWidth: 1,
          shadowColor: t.palette.black,
          shadowOpacity: 0.04,
        },
      ]}>
      {/* Row 1: Avatar + Party Name + Votes (mirrored for right column) */}
      <View style={styles.cardHeader}>
        {!isRightColumn && (
          <>
            <View
              style={[styles.cardCircle, {backgroundColor: item.partyColor}]}
            />
            <Text
              style={[styles.cardPartyName, t.atoms.text]}
              numberOfLines={1}>
              {item.party.replace('\n', ' ')}
            </Text>
            <View style={{flex: 1}} />
            <Text style={[styles.voteCount, t.atoms.text]}>{item.votes}</Text>
            <Text style={[styles.voteLabel, t.atoms.text_contrast_medium]}>
              votes
            </Text>
          </>
        )}
        {isRightColumn && (
          <>
            <Text style={[styles.voteCount, t.atoms.text]}>{item.votes}</Text>
            <Text style={[styles.voteLabel, t.atoms.text_contrast_medium]}>
              votes
            </Text>
            <View style={{flex: 1}} />
            <Text
              style={[styles.cardPartyName, t.atoms.text, {textAlign: 'right'}]}
              numberOfLines={1}>
              {item.party.replace('\n', ' ')}
            </Text>
            <View
              style={[
                styles.cardCircle,
                {backgroundColor: item.partyColor, marginLeft: 6},
              ]}
            />
          </>
        )}
      </View>

      {/* Row 2: Stats (single line) */}
      <View style={styles.statsRowSmall}>
        <Text style={[styles.statTextSmall, t.atoms.text_contrast_medium]}>
          -Avg:{' '}
          <Text style={{fontWeight: '700', color: t.atoms.text.color}}>
            {item.avg}
          </Text>
        </Text>
        <Text style={[styles.statTextSmall, t.atoms.text_contrast_medium]}>
          Avg:{' '}
          <Text style={{fontWeight: '700', color: t.atoms.text.color}}>
            {item.against}
          </Text>
        </Text>
        <Text style={[styles.statTextSmall, t.atoms.text_contrast_medium]}>
          +Avg:{' '}
          <Text style={{fontWeight: '700', color: t.atoms.text.color}}>
            {item.neutral}
          </Text>
        </Text>
      </View>

      {/* Bar Graph */}
      <View style={styles.barGraphContainer}>
        <View
          style={[
            styles.mainBarTrack,
            {backgroundColor: t.palette.contrast_100},
          ]}>
          <View
            style={[
              styles.mainBarFill,
              {
                width: `${item.barValue * 100}%`,
                backgroundColor: '#34C759',
                marginLeft: `${(1 - item.barValue) * 50}%`,
              },
            ]}
          />
          <View
            style={[
              styles.sliderThumb,
              {left: '50%', height: 12, width: 2, backgroundColor: '#000'},
            ]}
          />
        </View>
        <View style={styles.barLabelsBottom}>
          <Text style={[styles.barLabelSmall, t.atoms.text_contrast_low]}>
            -3
          </Text>
          <Text style={[styles.barLabelSmall, t.atoms.text_contrast_low]}>
            +3
          </Text>
        </View>
      </View>

      {/* Progress Bars */}
      <View style={styles.statusRow}>
        <ProgressBar
          label="APPROVE"
          progress={item.approvalRate}
          fillColor={t.palette.contrast_800}
          trackColor={t.palette.contrast_50}
          textColor={t.palette.white}
        />
      </View>
      <View style={styles.statusRow}>
        <ProgressBar
          label="VOTER"
          progress={item.voterRate}
          fillColor={t.palette.contrast_100}
          trackColor={t.palette.contrast_25}
          textColor={t.atoms.text.color}
        />
      </View>
    </View>
  )
}

export function VSScreen() {
  useLingui()
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const _insets = useSafeAreaInsets()

  // Extract policy items (tags starting with ||# from the flairs)
  const POLICY_ITEMS = useMemo(() => {
    return Object.values(POST_FLAIRS)
      .filter(f => f.tag.startsWith('||#'))
      .map(f => f.tag)
  }, [])

  const [selectedPolicy, setSelectedPolicy] =
    useState<string>('||#ArmasLegales')
  const [isPolicyOpen, setPolicyOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const togglePolicy = () => setPolicyOpen(!isPolicyOpen)

  return (
    <Layout.Screen testID="vsScreenV2">
      <View
        style={[
          styles.headerContainer,
          t.atoms.bg,
          {borderBottomColor: t.palette.contrast_50},
        ]}>
        <View style={styles.appBar}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <ArrowLeftIcon size="md" style={t.atoms.text} />
          </TouchableOpacity>
          <Text style={[t.atoms.text, styles.headerTitle]}>VS</Text>
          <View style={{width: 40}} />
        </View>

        {/* Top Filters Row */}
        <View style={styles.topFilterRow}>
          {/* Removed old chevron back button */}

          {/* Time Filter with Clock Icon - Smaller Size */}
          <FilterPill
            icon={<ClockIcon size="sm" style={t.atoms.text_contrast_medium} />}
            label="1W"
            active={false}
            hasDropdown
          />

          {/* Unified Search Bar */}
          <View
            style={[
              styles.searchBar,
              {backgroundColor: t.palette.contrast_50},
            ]}>
            <SearchIcon size="md" style={t.atoms.text_contrast_medium} />

            <Text
              style={[
                t.atoms.text_contrast_low,
                {fontSize: 18, fontWeight: '400', marginLeft: 6, flex: 1},
              ]}>
              ||#
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              style={[
                styles.policyPill,
                {backgroundColor: t.palette.contrast_100},
              ]}
              onPress={() => setSelectedPolicy('')}
              disabled={!selectedPolicy}>
              <Text
                style={[
                  t.atoms.text,
                  {fontSize: 13, fontWeight: '700', marginRight: 4},
                ]}
                numberOfLines={1}>
                {selectedPolicy ? selectedPolicy.replace('||#', '') : 'Select'}
              </Text>
              {!!selectedPolicy && <TimesIcon size="sm" style={t.atoms.text} />}
            </TouchableOpacity>
          </View>

          <View style={{width: 8}} />

          <TouchableOpacity accessibilityRole="button" onPress={togglePolicy}>
            <ChevronDownIcon size="md" style={t.atoms.text_contrast_medium} />
          </TouchableOpacity>
        </View>

        {/* Policy Dropdown Overlay */}
        {isPolicyOpen && (
          <View
            style={[
              styles.policyDropdown,
              t.atoms.bg,
              {borderColor: t.palette.contrast_100},
            ]}>
            <ScrollView style={{maxHeight: 300}}>
              {POLICY_ITEMS.map(p => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={p}
                  style={styles.policyItem}
                  onPress={() => {
                    setSelectedPolicy(p)
                    setPolicyOpen(false)
                  }}>
                  <Text
                    style={[
                      t.atoms.text,
                      {fontWeight: p === selectedPolicy ? '800' : '400'},
                    ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* VS Header */}
        <ComparisonHeader
          p1={{name: 'p/PRI', color: '#CE1126'}}
          p2={{name: 'p/PAN', color: '#005595'}}
        />

        {/* Category Tabs Grid - 3x2 Layout */}
        <View style={styles.categoryContent}>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat, i) => {
              const isSelected = selectedCategory === cat
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={i}
                  onPress={() => setSelectedCategory(isSelected ? null : cat)}
                  style={[
                    styles.categoryTab,
                    {
                      borderColor: isSelected
                        ? t.palette.contrast_800
                        : t.palette.contrast_100,
                      backgroundColor: isSelected
                        ? t.palette.contrast_800
                        : t.atoms.bg.backgroundColor,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: isSelected
                          ? t.palette.white
                          : t.atoms.text.color,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit>
                    {cat}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>

      <ScrollView
        style={[styles.scrollContainer, t.atoms.bg_contrast_25]}
        contentContainerStyle={styles.scrollContent}>
        <Layout.Center style={{paddingHorizontal: 8}}>
          {/* Recientes Section */}
          <Text style={[styles.sectionHeader, t.atoms.text]}>Recientes</Text>
          <View style={styles.gridContainer}>
            {MOCK_COMPARISONS.map((item, index) => (
              <ComparisonCard
                key={`rec-${item.id}`}
                item={item}
                index={index}
              />
            ))}
          </View>

          {/* Populares Section */}
          <Text style={[styles.sectionHeader, t.atoms.text, {marginTop: 24}]}>
            Populares
          </Text>
          <View style={styles.gridContainer}>
            {MOCK_COMPARISONS.map((item, index) => (
              <ComparisonCard
                key={`pop-${item.id}`}
                item={item}
                index={index}
              />
            ))}
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

// --- Mock Data Updates ---
import {VS_MOCK_COMPARISONS as MOCK_COMPARISONS} from '#/lib/constants/mockData'

// --- New Component: ProgressBar (Updated) ---
const ProgressBar = ({
  label,
  progress, // 0 to 1
  fillColor,
  trackColor,
  textColor,
  height = 24,
  isLabelPill = false,
  pillColor = 'rgba(0,0,0,0.1)',
}: {
  label: string
  progress: number
  fillColor: string
  trackColor: string
  textColor: string
  height?: number
  isLabelPill?: boolean
  pillColor?: string
}) => {
  return (
    <View
      style={{
        height,
        backgroundColor: trackColor,
        borderRadius: height / 2,
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center', // Center content (the label/pill)
      }}>
      {/* Fill */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${progress * 100}%`,
          backgroundColor: fillColor,
          borderRadius: height / 2,
        }}
      />

      {/* Label Overlay */}
      <View
        style={
          isLabelPill
            ? {
                backgroundColor: pillColor,
                paddingHorizontal: 12,
                paddingVertical: 2,
                borderRadius: 12,
              }
            : undefined
        }>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '900',
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: textColor,
          }}>
          {label}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8, // Reduced from 16
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  topFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.03)', // Subtle background for the row
    marginHorizontal: 8, // Reduced from 16
    borderRadius: 24, // Rounded container look
    marginTop: 8,
    zIndex: 10, // Ensure dropdown flows over
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 8, // Increased from 4 for bigger touch target
    borderRadius: 20,
    gap: 0,
  },
  policyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    maxWidth: '60%',
  },
  policyDropdown: {
    position: 'absolute',
    top: 60,
    left: 100, // Align with search bar approx
    right: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  policyItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    backgroundColor: '#E5E5EA', // Light gray background for inactive state pill feel
    borderWidth: 0, // Remove border
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000', // Ensure high contrast
  },
  vsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 24,
  },
  headerPartyCol: {
    flex: 1,
    alignItems: 'center',
  },
  largeCircle: {
    width: 72, // Larger per screenshot
    height: 72,
    borderRadius: 36,
    marginBottom: -14,
    zIndex: 1,
    borderWidth: 4,
    borderColor: 'transparent', // Will be overridden
  },
  downArrowContainer: {
    marginBottom: 6,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  headerPartyName: {
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  headerBarContainer: {
    width: '100%',
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  vsCenter: {
    justifyContent: 'flex-start',
    paddingTop: 0, // Reset padding
    alignItems: 'center',
    width: 40, // Fixed width for center column
  },
  vsIcon: {
    marginBottom: 40, // More space
  },
  vsText: {
    fontSize: 16, // Larger
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#8E8E93', // Distinct gray
    marginTop: -10, // Pull up closer to line center
  },
  categoryContent: {
    paddingHorizontal: 8, // Reduced from 16
    paddingBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6, // Slightly tighter gap
    justifyContent: 'space-between',
  },
  categoryTab: {
    width: '32%', // Slightly wider
    paddingHorizontal: 2,
    paddingVertical: 6, // Reduce vertical padding for tighter look
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: {
    fontSize: 9, // Smaller font for grid density
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
    paddingBottom: 100, // Increased for footer visibility
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // Tighter gap to allow wider cards
  },
  card: {
    width: IS_WEB ? '48%' : (width - 24) / 2,
    borderRadius: 12, // Slightly smaller radius
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardPartyName: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  cardCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },

  cardVotes: {
    alignItems: 'flex-end',
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 4,
  },
  voteLabel: {
    fontSize: 9,
    marginLeft: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 8,
  },
  statText: {
    fontSize: 9,
    fontWeight: '600',
  },
  expandIcon: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  barGraphContainer: {
    marginTop: 0,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  barLabelsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  barLabelSmall: {
    fontSize: 9,
    fontWeight: '800',
  },
  mainBarTrack: {
    height: 8, // Smaller bar
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  mainBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  sliderThumb: {
    width: 2, // Line marker
    height: 14,
    backgroundColor: '#000', // Black line
    position: 'absolute',
    top: -2,
    zIndex: 10,
  },
  statusRow: {
    marginTop: 4, // Tighter spacing
  },
  statusPillContainer: {
    flex: 1,
  },
  trendText: {
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
    minWidth: 30,
    textAlign: 'right',
  },
  votesContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 40,
    marginRight: 8,
  },
  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyInfoCol: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  statsRowSmall: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statTextSmall: {
    fontSize: 9,
  },
})
