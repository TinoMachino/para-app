import {useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'

import {useBaseFilter} from '#/state/shell/base-filter'
import {Text} from '#/view/com/util/text/Text'
import {atoms as a, useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {type PolicyItem} from './types'

export function PolicyDetailsScreen({
  route,
}: {
  route: {params: {item: PolicyItem}}
}) {
  const {item} = route.params
  const t = useTheme()
  const {activeFilters, activeState} = useBaseFilter()

  const [activeView, setActiveView] = useState('General')

  // Available views: General + Global Selected Filters + Selected State
  const viewOptions = useMemo(() => {
    const opts = ['General']
    activeFilters.forEach(f => opts.push(f))
    if (activeState && activeState !== 'None') {
      opts.push(activeState)
    }
    // Dedupe just in case
    return Array.from(new Set(opts))
  }, [activeFilters, activeState])

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Details</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <Layout.Center>
          <View style={[styles.headerSection, t.atoms.bg_contrast_25]}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <Text style={[styles.category, t.atoms.text_contrast_medium]}>
                {item.category.toUpperCase()}
              </Text>
              {item.verified && (
                <View
                  style={[
                    a.px_sm,
                    a.py_xs,
                    a.rounded_full,
                    {backgroundColor: '#474652'},
                  ]}>
                  <Text style={[a.font_bold, {color: 'white', fontSize: 10}]}>
                    Verified
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.title, t.atoms.text]}>{item.title}</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{
                marginTop: 16,
                marginHorizontal: -24,
                paddingHorizontal: 24,
              }}>
              {viewOptions.map(viewName => (
                <TagPill
                  key={viewName}
                  label={viewName}
                  t={t}
                  active={activeView === viewName}
                  onPress={() => setActiveView(viewName)}
                />
              ))}
            </ScrollView>
          </View>

          <StatisticsSection item={item} activeView={activeView} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>Description</Text>
            <Text style={[styles.bodyText, t.atoms.text]}>
              This is a placeholder description for {item.title}. In a real app,
              this would include the full text of the policy proposal or the key
              talking points regarding this matter.
            </Text>
            <View
              style={{
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text
                style={[
                  t.atoms.text_contrast_medium,
                  {fontWeight: 'bold', fontSize: 16},
                ]}>
                Total Votes:{' '}
                {Math.floor((item.support || 50) * 12.5 + 430).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, t.atoms.text]}>
              Related Content
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginHorizontal: -24, paddingHorizontal: 24}}>
              {[1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[
                    styles.infoCard,
                    t.atoms.bg_contrast_25,
                    {
                      marginRight: 12,
                      width: 200,
                      height: 120,
                      justifyContent: 'center',
                    },
                  ]}>
                  <Text style={[t.atoms.text, {fontWeight: 'bold'}]}>
                    Related Policy #{i}
                  </Text>
                  <Text style={t.atoms.text_contrast_medium}>
                    More on {item.category}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

function StatisticsSection({
  item,
  activeView,
}: {
  item: PolicyItem
  activeView: string
}) {
  // Policy = Spectrum, Matter = Binary
  const isPolicy = item.type === 'Policy'

  if (isPolicy) {
    return (
      <View>
        <SpectrumStats item={item} activeView={activeView} />
      </View>
    )
  }

  return (
    <View>
      <BinaryStats item={item} activeView={activeView} />
    </View>
  )
}

function BinaryStats({
  item,
  activeView,
}: {
  item: PolicyItem
  activeView: string
}) {
  const t = useTheme()
  const support = item.support || 50
  const oppose = 100 - support

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, t.atoms.text]}>
        Voting Statistics ({activeView})
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
        <Text style={t.atoms.text_contrast_medium}>
          Measure of Support vs Opposition
        </Text>
      </View>
      <View style={styles.binaryBarContainer}>
        <View
          style={[
            styles.binaryBarSegment,
            {backgroundColor: '#34C759', flex: support},
          ]}>
          {support > 15 && (
            <Text style={styles.binaryBarLabel}>{support}%</Text>
          )}
        </View>
        <View
          style={[
            styles.binaryBarSegment,
            {backgroundColor: '#FF3B30', flex: oppose},
          ]}>
          {oppose > 15 && <Text style={styles.binaryBarLabel}>{oppose}%</Text>}
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 8,
        }}>
        <Text style={{color: '#34C759', fontWeight: 'bold'}}>Support</Text>
        <Text style={{color: '#FF3B30', fontWeight: 'bold'}}>Oppose</Text>
      </View>
    </View>
  )
}

// Generate deterministic bell-curve-ish distribution based on support value
function getMockDistribution(support: number, viewSeed: string) {
  // Support 0-100 maps to mean roughly -3 to +3
  let shift = 0
  if (viewSeed !== 'General') {
    // Deterministic shift based on view name length to make it look different
    shift = (viewSeed.length % 2 === 0 ? 1 : -1) * (viewSeed.length % 3)
  }

  const normalizedMean = (support / 100) * 6 - 3 + shift

  const bins = [-3, -2, -1, 0, 1, 2, 3]
  const data = bins.map(bin => {
    // Simple Gaussian-ish distance
    const dist = Math.abs(bin - normalizedMean)
    const val = Math.max(5, 100 * Math.exp(-(dist * dist) / 2)) // rudimentary bell curve
    return {bin, val}
  })

  // Normalize to 100% total roughly for display height
  const maxVal = Math.max(...data.map(d => d.val))
  return data.map(d => ({...d, heightPercent: (d.val / maxVal) * 100}))
}

function SpectrumStats({
  item,
  activeView,
}: {
  item: PolicyItem
  activeView: string
}) {
  const t = useTheme()
  const support = item.support || 50
  const distribution = getMockDistribution(support, activeView)

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, t.atoms.text]}>
        Opinion Spectrum ({activeView})
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
        <Text style={t.atoms.text_contrast_medium}>
          Distribution from Strongly Disagree (-3) to Strongly Agree (+3)
        </Text>
      </View>

      <View style={styles.spectrumContainer}>
        {distribution.map(d => (
          <View key={d.bin} style={styles.spectrumBarWrapper}>
            <View
              style={[
                styles.spectrumBar,
                {
                  height: `${d.heightPercent}%`,
                  backgroundColor:
                    d.bin < 0 ? '#FF3B30' : d.bin > 0 ? '#34C759' : '#8E8E93',
                },
              ]}
            />
            <Text style={[t.atoms.text_contrast_medium, styles.spectrumLabel]}>
              {d.bin > 0 ? `+${d.bin}` : d.bin}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.spectrumAxisRaw} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  contentContainer: {paddingBottom: 40},
  headerSection: {padding: 24, marginBottom: 24},
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  title: {fontSize: 28, fontWeight: '800', lineHeight: 34},
  section: {paddingHorizontal: 24, marginBottom: 32},
  sectionTitle: {fontSize: 20, fontWeight: '800', marginBottom: 8},
  infoCard: {padding: 16, borderRadius: 12, borderWidth: 1},
  bodyText: {fontSize: 16, lineHeight: 24, opacity: 0.8},

  // Binary Stats
  binaryBarContainer: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  binaryBarSegment: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  binaryBarLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Spectrum Stats
  spectrumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: 8,
  },
  spectrumBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  spectrumBar: {
    width: 20,
    borderRadius: 4,
    minHeight: 4,
    marginBottom: 8,
  },
  spectrumLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  spectrumAxisRaw: {
    height: 1,
    backgroundColor: '#C7C7CC',
    marginBottom: 8,
  },
  tagPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
})

function TagPill({
  label,
  t,
  active,
  onPress,
}: {
  label: string
  t: any
  active?: boolean
  onPress?: () => void
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.tagPill,
        active
          ? {
              backgroundColor: t.palette.primary_500,
              borderColor: t.palette.primary_500,
            }
          : {
              borderColor: t.atoms.border_contrast_low.borderColor,
              backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
            },
      ]}>
      <Text
        style={{
          color: active ? 'white' : t.atoms.text.color,
          fontWeight: '600',
          fontSize: 12,
        }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}
