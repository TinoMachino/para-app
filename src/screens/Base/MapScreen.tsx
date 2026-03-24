import {useRef, useState} from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import MapView, {Polygon} from 'react-native-maps'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {MEXICO_CITY_DATA} from '#/lib/constants/mexicoCityData'
import * as MexicoGeoJSON from '#/lib/constants/mexicoGeoJSON.json'
import {MOCK_CABILDEOS} from '#/lib/constants/mockData'
import {
  type CommonNavigatorParams,
  type NavigationProp,
} from '#/lib/routes/types'
import {POST_FLAIRS} from '#/lib/tags'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {FlairSelectionList} from '#/components/FlairSelectionList'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {Header, Screen} from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Map'>

const INITIAL_REGION = {
  latitude: 23.6345,
  longitude: -102.5528,
  latitudeDelta: 25,
  longitudeDelta: 25,
}

import {useSafeAreaInsets} from 'react-native-safe-area-context'

export function MapScreen({navigation: _}: Props) {
  const {_: translate} = useLingui()
  const t = useTheme()
  const mapRef = useRef<MapView>(null)
  const insets = useSafeAreaInsets()
  const navRef = useNavigation<NavigationProp>()

  // State for selected geographic state (e.g. Jalisco)
  const [selectedState, setSelectedState] = useState<{
    name: string
  } | null>(null)

  // State to toggle the city list view
  const [showCities, setShowCities] = useState(false)

  // State for Discourse Filtering
  const [showDiscourseModal, setShowDiscourseModal] = useState(false)
  const [discourseType, setDiscourseType] = useState<'Matter' | 'Policy'>(
    'Matter',
  )
  const [selectedDiscourseItem, setSelectedDiscourseItem] = useState<string>('')

  const handleZoom = (factor: number) => {
    if (!mapRef.current) return

    mapRef.current
      .getCamera()
      .then((camera: any) => {
        if (camera) {
          if (typeof camera.zoom === 'number') {
            const newZoom = camera.zoom + (factor < 1 ? 1 : -1)
            mapRef.current?.animateCamera({zoom: newZoom})
          } else if (typeof camera.altitude === 'number') {
            const newAlt = camera.altitude * factor
            mapRef.current?.animateCamera({altitude: newAlt})
          }
        }
      })
      .catch(e => {
        console.warn('Zoom not supported or failed', e)
      })
  }

  const handleStatePress = (name: string, feature: any) => {
    setSelectedState({name})
    setShowCities(false)
    setSelectedDiscourseItem('')

    if (feature && feature.geometry) {
      let coords: {latitude: number; longitude: number}[] = []

      // Helper to extract outer ring coordinates
      const extractCoords = (rings: any[]) => {
        return rings[0].map((c: number[]) => ({
          longitude: c[0],
          latitude: c[1],
        }))
      }

      if (feature.geometry.type === 'Polygon') {
        coords = extractCoords(feature.geometry.coordinates)
      } else if (feature.geometry.type === 'MultiPolygon') {
        // Focus on the first polygon of the multipolygon set
        coords = extractCoords(feature.geometry.coordinates[0])
      }

      if (coords.length > 0) {
        // Calculate centroid
        const total = coords.reduce(
          (acc, curr) => ({
            latitude: acc.latitude + curr.latitude,
            longitude: acc.longitude + curr.longitude,
          }),
          {latitude: 0, longitude: 0},
        )

        const centroid = {
          latitude: total.latitude / coords.length,
          longitude: total.longitude / coords.length,
        }

        mapRef.current?.animateCamera({
          center: centroid,
          zoom: 7,
        })
      }
    }
  }

  const handleRecenter = () => {
    mapRef.current?.animateToRegion(INITIAL_REGION, 1000)
    setSelectedState(null)
    setShowCities(false)
    setSelectedDiscourseItem('')
  }

  const {gtMobile} = useBreakpoints()
  // 300px is the standard left-shift for the content column in the shell layout
  const webLeftMargin = {
    marginLeft: 'calc(50% - 300px)',
    minHeight: '100%',
  }

  // Pre-process polygons to avoid re-calculation on every render
  const renderedPolygons = (MexicoGeoJSON as any).features.map(
    (feature: any, index: number) => {
      const {geometry, properties} = feature
      const name = properties.state_name || properties.name || 'Unknown'
      const isSelected = selectedState?.name === name

      let fillColor = isSelected
        ? t.palette.primary_500 + '66' // Darker when selected
        : t.palette.primary_500 + '33'

      if (selectedDiscourseItem && selectedDiscourseItem !== 'Any') {
        const stringVal = name + selectedDiscourseItem
        let hash = 0
        for (let i = 0; i < stringVal.length; i++) {
          hash = stringVal.charCodeAt(i) + ((hash << 5) - hash)
        }
        const intensity = Math.abs(hash) / 2147483647
        const alpha = Math.floor(intensity * 155 + 100)
          .toString(16)
          .padStart(2, '0')
        // Hot color: #FF3B30
        fillColor = `#FF3B30${alpha}`
      }

      const strokeColor = isSelected
        ? t.palette.primary_500
        : t.palette.primary_500

      const strokeWidth = isSelected ? 1.5 : 0.5
      const zIndex = isSelected ? 10 : 1

      if (geometry.type === 'Polygon') {
        const coordinates = geometry.coordinates[0].map((c: number[]) => ({
          longitude: c[0],
          latitude: c[1],
        }))

        return (
          <Polygon
            key={`${name}-${index}`}
            coordinates={coordinates}
            fillColor={fillColor}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            tappable={true}
            zIndex={zIndex}
            onPress={() => handleStatePress(name, feature)}
          />
        )
      } else if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.map(
          (polygonCoords: any[], pIndex: number) => {
            const coordinates = polygonCoords[0].map((c: number[]) => ({
              longitude: c[0],
              latitude: c[1],
            }))

            return (
              <Polygon
                key={`${name}-${index}-${pIndex}`}
                coordinates={coordinates}
                fillColor={fillColor}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                tappable={true}
                zIndex={zIndex}
                onPress={() => handleStatePress(name, feature)}
              />
            )
          },
        )
      }
      return null
    },
  )

  const cityData = selectedState ? MEXICO_CITY_DATA[selectedState.name] : []

  return (
    <Screen hideBorders>
      <Header.Outer noBottomBorder>
        <Header.BackButton />
        <Header.Content>
          <Header.TitleText>{translate(msg`Mexico Map`)}</Header.TitleText>
        </Header.Content>
        <Header.Slot />
      </Header.Outer>
      <View style={[a.flex_1, gtMobile && web(webLeftMargin)]}>
        <View style={[a.flex_1, a.relative]}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={INITIAL_REGION}
            provider={web('google')}
            onPress={() => setSelectedState(null)}>
            {renderedPolygons}
          </MapView>

          {/* Zoom Buttons - Hidden on Desktop/Web per request */}
          {!gtMobile && (
            <View
              style={[
                a.absolute,
                {right: 20, bottom: 60 + insets.bottom},
                a.gap_md,
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom(0.5)}
                style={[
                  t.atoms.bg_contrast_25,
                  web({backdropFilter: 'blur(10px)'}),
                  a.rounded_full,
                  a.shadow_md,
                  a.border,
                  t.atoms.border_contrast_low,
                  a.overflow_hidden,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <Text
                  style={[
                    a.text_2xl,
                    a.font_bold,
                    t.atoms.text,
                    a.text_center,
                    {marginTop: -4},
                  ]}>
                  +
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom(2)}
                style={[
                  t.atoms.bg_contrast_25,
                  web({backdropFilter: 'blur(10px)'}),
                  a.rounded_full,
                  a.shadow_md,
                  a.border,
                  t.atoms.border_contrast_low,
                  a.overflow_hidden,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <Text
                  style={[
                    a.text_2xl,
                    a.font_bold,
                    t.atoms.text,
                    a.text_center,
                    {marginTop: -6},
                  ]}>
                  -
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Recenter Button */}
          <View
            style={[
              a.absolute,
              {right: 20, top: 20},
              gtMobile && {left: 20, top: 20, right: 'auto'},
              a.gap_sm,
            ]}>
            <View
              style={[
                t.atoms.bg_contrast_25,
                web({backdropFilter: 'blur(10px)'}),
                a.rounded_full,
                a.shadow_md,
                a.border,
                t.atoms.border_contrast_low,
                a.overflow_hidden,
                a.align_center,
                a.justify_center,
                {width: 44, height: 44},
              ]}>
              <Text
                style={[a.text_md, a.font_bold, t.atoms.text, a.text_center]}
                onPress={handleRecenter}>
                ⌖
              </Text>
            </View>
            {/* Discourse Filter Toggle */}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowDiscourseModal(true)}
              style={[
                t.atoms.bg_contrast_25,
                web({backdropFilter: 'blur(10px)'}),
                a.rounded_full,
                a.shadow_md,
                a.border,
                selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                  ? {borderColor: '#FF3B30'}
                  : t.atoms.border_contrast_low,
                a.overflow_hidden,
                a.align_center,
                a.justify_center,
                {width: 44, height: 44},
              ]}>
              <FilterIcon
                width={20}
                height={20}
                fill={
                  selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                    ? '#FF3B30'
                    : t.atoms.text.color
                }
              />
            </TouchableOpacity>
          </View>

          {/* Selected State Overlay */}
          {selectedState && !showCities && (
            <View
              style={[
                a.absolute,
                {bottom: gtMobile ? 40 : 60 + insets.bottom, left: 20},
                gtMobile && {left: 40, width: 350},
                !gtMobile && {right: 20},
                a.p_lg,
                a.rounded_xl,
                t.atoms.bg_contrast_25,
                web({backdropFilter: 'blur(12px)'}),
                a.border,
                t.atoms.border_contrast_low,
                a.shadow_lg,
              ]}>
              <View
                style={[
                  a.flex_row,
                  a.justify_between,
                  a.align_center,
                  a.mb_md,
                ]}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                  {selectedState.name}
                </Text>
                <Text
                  style={[a.text_sm, t.atoms.text_contrast_medium, a.p_xs]}
                  onPress={() => setSelectedState(null)}>
                  ✕
                </Text>
              </View>

              <Text
                style={[a.text_md, t.atoms.text_contrast_high, a.mb_sm]}
                numberOfLines={3}>
                Dominant Party: <Text style={[a.font_bold]}>Morena</Text>
                {'\n'}
                Leading Community: <Text style={[a.font_bold]}>r/Mexico</Text>
              </Text>

              <View style={[a.flex_row, a.gap_sm, a.mt_sm]}>
                <View
                  style={[
                    a.flex_1,
                    a.p_sm,
                    t.atoms.bg_contrast_100,
                    a.rounded_md,
                    a.align_center,
                  ]}>
                  <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                    42%
                  </Text>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    Approval
                  </Text>
                </View>
                <View
                  style={[
                    a.flex_1,
                    a.p_sm,
                    t.atoms.bg_contrast_100,
                    a.rounded_md,
                    a.align_center,
                  ]}>
                  <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                    1.2M
                  </Text>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    Active
                  </Text>
                </View>
              </View>

              <View style={[a.mt_lg]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setShowCities(true)}
                  style={[
                    t.atoms.bg,
                    a.py_sm,
                    a.rounded_full,
                    a.align_center,
                    a.border,
                    t.atoms.border_contrast_low,
                    a.shadow_sm,
                  ]}>
                  <Text style={[a.font_bold, t.atoms.text]}>
                    View Big Cities Data ↗
                  </Text>
                </TouchableOpacity>

                {/* Cabildeo indicator */}
                {(() => {
                  const activeCabildeos = MOCK_CABILDEOS.filter(
                    c =>
                      c.region === selectedState.name && c.phase !== 'resolved',
                  )
                  if (activeCabildeos.length === 0) return null
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => navRef.navigate('CabildeoList')}
                      style={[
                        a.mt_sm,
                        a.py_sm,
                        a.px_md,
                        a.rounded_full,
                        a.align_center,
                        a.flex_row,
                        a.justify_center,
                        a.gap_xs,
                        {
                          backgroundColor: '#34C759' + '18',
                          borderWidth: 1,
                          borderColor: '#34C759' + '40',
                        },
                      ]}>
                      <Text style={{fontSize: 14}}>🗳️</Text>
                      <Text
                        style={[a.font_bold, {color: '#34C759', fontSize: 13}]}>
                        {activeCabildeos.length} Cabildeo
                        {activeCabildeos.length > 1 ? 's' : ''} activo
                        {activeCabildeos.length > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  )
                })()}
              </View>
            </View>
          )}

          {/* Big Cities Data View */}
          {selectedState && showCities && (
            <View
              style={[
                a.absolute,
                {top: 20, bottom: 20, right: 20},
                gtMobile ? {width: 400} : {left: 20},
                a.p_lg,
                a.rounded_xl,
                t.atoms.bg, // Solid background for text readability
                a.border,
                t.atoms.border_contrast_low,
                a.shadow_lg,
                a.overflow_hidden,
              ]}>
              <View
                style={[
                  a.flex_row,
                  a.justify_between,
                  a.align_center,
                  a.mb_lg,
                ]}>
                <View>
                  <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                    {selectedState.name}
                  </Text>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    <Trans>Major Cities Data</Trans>
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[a.p_xs, a.rounded_full, t.atoms.bg_contrast_25]}
                  onPress={() => setShowCities(false)}>
                  <Text style={[a.text_md, t.atoms.text]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={[a.gap_md, a.pb_xl]}>
                {cityData && cityData.length > 0 ? (
                  cityData.map((city, i) => (
                    <View
                      key={i}
                      style={[
                        a.p_md,
                        t.atoms.bg_contrast_25,
                        a.rounded_lg,
                        a.border,
                        t.atoms.border_contrast_low,
                      ]}>
                      <View
                        style={[
                          a.flex_row,
                          a.justify_between,
                          a.align_baseline,
                          a.mb_xs,
                        ]}>
                        <Text style={[a.text_lg, a.font_bold, t.atoms.text]}>
                          {city.name}
                        </Text>
                        <View
                          style={[
                            a.px_sm,
                            a.py_xs,
                            a.rounded_full,
                            t.atoms.bg_contrast_100,
                          ]}>
                          <Text style={[a.text_xs, a.font_bold, t.atoms.text]}>
                            {city.dominantParty}
                          </Text>
                        </View>
                      </View>
                      <Text style={[a.text_sm, t.atoms.text_contrast_high]}>
                        Pop:{' '}
                        <Text style={[a.font_bold]}>{city.population}</Text>
                      </Text>
                      <Text
                        style={[
                          a.text_sm,
                          t.atoms.text_contrast_medium,
                          a.mt_xs,
                        ]}>
                        Mayor: {city.governing_mayor}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={[a.p_xl, a.align_center]}>
                    <Text style={[t.atoms.text_contrast_medium]}>
                      <Trans>No city data available for this state.</Trans>
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Discourse Filter Info Overlay */}
          {selectedDiscourseItem && selectedDiscourseItem !== 'Any' && (
            <View
              style={[
                a.absolute,
                {top: 20, right: 80},
                gtMobile && {left: 80, right: 'auto'},
                a.p_md,
                a.rounded_full,
                t.atoms.bg_contrast_25,
                web({backdropFilter: 'blur(12px)'}),
                a.border,
                {borderColor: '#FF3B30'},
                a.shadow_sm,
                a.flex_row,
                a.align_center,
                a.gap_sm,
              ]}>
              <Text style={[a.text_sm, a.font_bold, t.atoms.text]}>
                Heatmap: {selectedDiscourseItem}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setSelectedDiscourseItem('')}>
                <Text
                  style={[
                    a.text_md,
                    a.font_bold,
                    t.atoms.text_contrast_medium,
                  ]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showDiscourseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDiscourseModal(false)}>
        <View
          style={[
            a.flex_1,
            a.justify_end,
            {backgroundColor: 'rgba(0, 0, 0, 0.4)'},
          ]}>
          <View
            style={[
              a.w_full,
              t.atoms.bg,
              {borderTopLeftRadius: 24, borderTopRightRadius: 24},
              a.p_lg,
              {height: '80%', padding: 0},
            ]}>
            <View style={{flex: 1, padding: 16}}>
              <View
                style={[
                  a.rounded_full,
                  t.atoms.bg_contrast_200,
                  {width: 40, height: 4, alignSelf: 'center', marginBottom: 10},
                ]}
              />

              <FlairSelectionList
                selectedFlairs={
                  selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                    ? Object.values(POST_FLAIRS).filter(
                        (f: any) => f.label === selectedDiscourseItem,
                      )
                    : []
                }
                setSelectedFlairs={(flairs: any[]) => {
                  if (flairs.length > 0) {
                    const f = flairs[0]
                    setDiscourseType(
                      f.id.startsWith('policy_') ? 'Policy' : 'Matter',
                    )
                    setSelectedDiscourseItem(f.label)
                  } else {
                    setSelectedDiscourseItem('Any')
                  }
                  setShowDiscourseModal(false)
                }}
                mode={discourseType.toLowerCase() as 'matter' | 'policy'}
                onClose={() => setShowDiscourseModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  )
}
