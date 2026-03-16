import {useMemo, useState} from 'react'
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type CabildeoPhase} from '#/lib/api/para-lexicons'
import {MOCK_CABILDEOS} from '#/lib/constants/mockData'
import {type NavigationProp} from '#/lib/routes/types'
import {useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

const PHASE_CONFIG: Record<
  CabildeoPhase,
  {label: string; color: string; icon: string}
> = {
  draft: {label: 'Borrador', color: '#8E8E93', icon: '📝'},
  open: {label: 'Abierto', color: '#007AFF', icon: '📖'},
  deliberating: {label: 'Deliberando', color: '#FF9500', icon: '🗣️'},
  voting: {label: 'Votación', color: '#34C759', icon: '🗳️'},
  resolved: {label: 'Resuelto', color: '#AF52DE', icon: '✅'},
}

export function CabildeoListScreen() {
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()
  const [activeFilter, setActiveFilter] = useState<CabildeoPhase | 'all'>(
    'all',
  )

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return MOCK_CABILDEOS
    return MOCK_CABILDEOS.filter(c => c.phase === activeFilter)
  }, [activeFilter])

  const filters: Array<{key: CabildeoPhase | 'all'; label: string}> = [
    {key: 'all', label: 'Todos'},
    {key: 'voting', label: '🗳️ Votación'},
    {key: 'deliberating', label: '🗣️ Deliberando'},
    {key: 'resolved', label: '✅ Resueltos'},
  ]

  return (
    <Layout.Screen testID="cabildeoListScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>Cabildeo</Trans>
          </Layout.Header.TitleText>
          <Layout.Header.SubtitleText>
            Deliberación Cívica
          </Layout.Header.SubtitleText>
        </Layout.Header.Content>
      </Layout.Header.Outer>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}>
        <Layout.Center style={styles.center}>
          {/* Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {filters.map(f => (
              <TouchableOpacity
                accessibilityRole="button"
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                style={[
                  styles.filterPill,
                  activeFilter === f.key
                    ? {backgroundColor: t.palette.primary_500}
                    : t.atoms.bg_contrast_25,
                ]}>
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === f.key
                      ? {color: '#fff'}
                      : t.atoms.text_contrast_medium,
                  ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Stats Bar */}
          <View style={[styles.statsBar, t.atoms.bg_contrast_25]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, t.atoms.text]}>
                {MOCK_CABILDEOS.filter(c => c.phase === 'voting').length}
              </Text>
              <Text style={[styles.statLabel, t.atoms.text_contrast_medium]}>
                En votación
              </Text>
            </View>
            <View style={[styles.statDivider, {backgroundColor: t.palette.contrast_100}]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, t.atoms.text]}>
                {MOCK_CABILDEOS.filter(c => c.phase === 'deliberating').length}
              </Text>
              <Text style={[styles.statLabel, t.atoms.text_contrast_medium]}>
                Deliberando
              </Text>
            </View>
            <View style={[styles.statDivider, {backgroundColor: t.palette.contrast_100}]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, t.atoms.text]}>
                {MOCK_CABILDEOS.filter(c => c.phase === 'resolved').length}
              </Text>
              <Text style={[styles.statLabel, t.atoms.text_contrast_medium]}>
                Resueltos
              </Text>
            </View>
          </View>

          {/* Cabildeo Cards */}
          <View style={styles.cardList}>
            {filtered.map((cabildeo, index) => {
              const phase = PHASE_CONFIG[cabildeo.phase]
              const isMultiCommunity =
                cabildeo.communities && cabildeo.communities.length > 0

              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={index}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('CabildeoDetail', {index})
                  }
                  style={[
                    styles.card,
                    t.atoms.bg_contrast_25,
                    {borderLeftColor: phase.color, borderLeftWidth: 4},
                  ]}>
                  {/* Phase Badge + Region */}
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.phaseBadge,
                        {backgroundColor: phase.color + '20'},
                      ]}>
                      <Text style={[styles.phaseBadgeText, {color: phase.color}]}>
                        {phase.icon} {phase.label}
                      </Text>
                    </View>
                    {cabildeo.region && (
                      <Text
                        style={[
                          styles.regionTag,
                          t.atoms.text_contrast_medium,
                        ]}>
                        📍 {cabildeo.region}
                      </Text>
                    )}
                  </View>

                  {/* Title */}
                  <Text
                    style={[styles.cardTitle, t.atoms.text]}
                    numberOfLines={2}>
                    {cabildeo.title}
                  </Text>

                  {/* Description */}
                  <Text
                    style={[styles.cardDesc, t.atoms.text_contrast_medium]}
                    numberOfLines={2}>
                    {cabildeo.description}
                  </Text>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.communityTag, {color: t.palette.primary_500}]}>
                      {cabildeo.community}
                    </Text>
                    {isMultiCommunity && (
                      <View
                        style={[
                          styles.quadraticBadge,
                          {backgroundColor: '#FF9500' + '20'},
                        ]}>
                        <Text style={[styles.quadraticText, {color: '#FF9500'}]}>
                          √ Cuadrático
                        </Text>
                      </View>
                    )}
                    {cabildeo.geoRestricted && (
                      <View
                        style={[
                          styles.quadraticBadge,
                          {backgroundColor: '#FF3B30' + '15'},
                        ]}>
                        <Text style={[styles.quadraticText, {color: '#FF3B30'}]}>
                          🔒 Solo {cabildeo.region}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.optionCount, t.atoms.text_contrast_medium]}>
                      {cabildeo.options.length} opciones
                    </Text>
                  </View>

                  {/* Resolved outcome preview */}
                  {cabildeo.outcome && (
                    <View style={[styles.outcomePreview, {borderTopColor: t.palette.contrast_100}]}>
                      <Text style={[styles.outcomeLabel, t.atoms.text_contrast_medium]}>
                        Resultado:
                      </Text>
                      <Text style={[styles.outcomeWinner, {color: phase.color}]}>
                        {cabildeo.options[cabildeo.outcome.winningOption]?.label}
                      </Text>
                      <Text style={[styles.outcomeParticipants, t.atoms.text_contrast_medium]}>
                        · {cabildeo.outcome.totalParticipants} participantes
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </Layout.Center>
      </ScrollView>
    </Layout.Screen>
  )
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingBottom: 80},
  center: {paddingHorizontal: 16, paddingTop: 8},
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {fontSize: 13, fontWeight: '700'},
  statsBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  statItem: {flex: 1, alignItems: 'center'},
  statValue: {fontSize: 24, fontWeight: '900'},
  statLabel: {fontSize: 11, fontWeight: '600', marginTop: 2},
  statDivider: {width: 1, height: 32},
  cardList: {gap: 14},
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseBadgeText: {fontSize: 12, fontWeight: '800'},
  regionTag: {fontSize: 12, fontWeight: '600'},
  cardTitle: {fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 6},
  cardDesc: {fontSize: 13, lineHeight: 18, marginBottom: 12},
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  communityTag: {fontSize: 12, fontWeight: '800'},
  quadraticBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  quadraticText: {fontSize: 10, fontWeight: '800'},
  optionCount: {fontSize: 12, fontWeight: '600'},
  outcomePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  outcomeLabel: {fontSize: 12, fontWeight: '600'},
  outcomeWinner: {fontSize: 12, fontWeight: '900'},
  outcomeParticipants: {fontSize: 11},
})
