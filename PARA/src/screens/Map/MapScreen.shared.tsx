import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {buildSearchIndex, computeCentroid, filterSearchIndex} from '#/lib/constants/mapHelpers'
import {normalizeMexicoStateName} from '#/lib/constants/mexico'
import * as MexicoGeoJSON from '#/lib/constants/mexicoGeoJSON.json'
import {type CommonNavigatorParams} from '#/lib/routes/types'
import {POST_FLAIRS} from '#/lib/tags'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {FlairSelectionList} from '#/components/FlairSelectionList'
import {Filter_Stroke2_Corner0_Rounded as FilterIcon} from '#/components/icons/Filter'
import {Header, Screen} from '#/components/Layout'
import {Text} from '#/components/Typography'
import {
  BigCitiesDataOverlay,
  DistrictsDataOverlay,
  type MapLayer,
  MapLayersPanel,
  MapSearchControls,
  SelectedStateOverlay,
} from './MapComponents'

export type Props = NativeStackScreenProps<CommonNavigatorParams, 'Map'>

export const INITIAL_REGION = {
  latitude: 23.6345,
  longitude: -102.5528,
  latitudeDelta: 25,
  longitudeDelta: 25,
}

type Coordinate = {
  latitude: number
  longitude: number
}

type GeoFeature = {
  geometry?: {
    type?: string
    coordinates?: any[]
  }
  properties: {
    state_name?: string
    name?: string
  }
}

type MapScreenImplProps = Props & {
  MapViewComponent?: any
  PolygonComponent?: any
  unavailableMessage?: string
}

function featureName(feature: GeoFeature) {
  return feature.properties.state_name || feature.properties.name || 'Unknown'
}

function getFeatureCoordinates(feature: GeoFeature): Coordinate[][] {
  const geometry = feature.geometry
  if (!geometry?.coordinates) return []

  if (geometry.type === 'Polygon') {
    return [
      geometry.coordinates[0].map((c: number[]) => ({
        longitude: c[0],
        latitude: c[1],
      })),
    ]
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygonCoords: number[][][]) =>
      polygonCoords[0].map((c: number[]) => ({
        longitude: c[0],
        latitude: c[1],
      })),
    )
  }

  return []
}

function getLayerFillColor({
  activeLayer,
  isSelected,
  selectedDiscourseItem,
  stateName,
  theme,
}: {
  activeLayer: MapLayer
  isSelected: boolean
  selectedDiscourseItem: string
  stateName: string
  theme: ReturnType<typeof useTheme>
}) {
  if (selectedDiscourseItem && selectedDiscourseItem !== 'Any') {
    const seed = `${stateName}:${selectedDiscourseItem}:${activeLayer}`
    let hash = 0

    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }

    const intensity = Math.abs(hash) % 140
    const alpha = (95 + intensity).toString(16).padStart(2, '0')
    return `#FF5A36${alpha}`
  }

  if (isSelected) {
    return `${theme.palette.primary_500}7A`
  }

  if (activeLayer === 'districts') {
    return `${theme.palette.primary_500}24`
  }

  if (activeLayer === 'cities') {
    return `${theme.palette.primary_500}20`
  }

  return `${theme.palette.primary_500}3A`
}

function MapUnavailable({
  message,
}: {
  message: string
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.flex_1,
        a.align_center,
        a.justify_center,
        a.px_xl,
        t.atoms.bg_contrast_25,
      ]}>
      <View
        style={[
          a.w_full,
          a.p_lg,
          a.rounded_xl,
          a.border,
          t.atoms.border_contrast_low,
          t.atoms.bg,
          {maxWidth: 520},
        ]}>
        <Text style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}>
          MAP UNAVAILABLE
        </Text>
        <Text style={[a.text_2xl, a.font_bold, t.atoms.text, a.mt_sm]}>
          <Trans>The native map binary is not available in this build.</Trans>
        </Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_md]}>
          {message}
        </Text>
      </View>
    </View>
  )
}

export function MapScreenImpl({
  MapViewComponent,
  PolygonComponent,
  unavailableMessage,
}: MapScreenImplProps) {
  const {_: translate} = useLingui()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const insets = useSafeAreaInsets()
  const mapRef = useRef<any>(null)

  const [selectedState, setSelectedState] = useState<{name: string} | null>(null)
  const [showCities, setShowCities] = useState(false)
  const [showDistricts, setShowDistricts] = useState(false)
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLayer, setActiveLayer] = useState<MapLayer>('states')
  const [showDiscourseModal, setShowDiscourseModal] = useState(false)
  const [discourseType, setDiscourseType] = useState<'Matter' | 'Policy'>(
    'Matter',
  )
  const [selectedDiscourseItem, setSelectedDiscourseItem] = useState('')

  const geoFeatures = useMemo(
    () => ((MexicoGeoJSON as any).features || []) as GeoFeature[],
    [],
  )

  const searchIndex = useMemo(() => buildSearchIndex(geoFeatures), [geoFeatures])
  const searchResults = useMemo(
    () => filterSearchIndex(searchIndex, searchQuery, 10),
    [searchIndex, searchQuery],
  )

  const stateFeaturesByName = useMemo(() => {
    const map = new Map<string, GeoFeature>()

    for (const feature of geoFeatures) {
      map.set(normalizeMexicoStateName(featureName(feature)), feature)
    }

    return map
  }, [geoFeatures])

  const focusState = useCallback(
    (
      stateName: string,
      options: {
        openLayer?: MapLayer
        districtId?: number | null
      } = {},
    ) => {
      const feature = stateFeaturesByName.get(normalizeMexicoStateName(stateName))
      const nextLayer = options.openLayer ?? activeLayer
      setSelectedState({name: stateName})
      setShowCities(nextLayer === 'cities')
      setShowDistricts(nextLayer === 'districts')
      setSelectedDistrictId(nextLayer === 'districts' ? options.districtId ?? null : null)

      if (!feature) return

      const centroid = computeCentroid(feature)
      mapRef.current?.animateCamera?.({
        center: centroid,
        zoom: nextLayer === 'cities' ? 8 : 6.5,
      })
    },
    [activeLayer, stateFeaturesByName],
  )

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!mapRef.current?.getCamera) return

    mapRef.current
      .getCamera()
      .then((camera: any) => {
        if (typeof camera?.zoom === 'number') {
          mapRef.current?.animateCamera?.({
            zoom: direction === 'in' ? camera.zoom + 1 : camera.zoom - 1,
          })
          return
        }

        if (typeof camera?.altitude === 'number') {
          mapRef.current?.animateCamera?.({
            altitude:
              direction === 'in' ? camera.altitude * 0.6 : camera.altitude * 1.6,
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleRecenter = useCallback(() => {
    mapRef.current?.animateToRegion?.(INITIAL_REGION, 800)
    setActiveLayer('states')
    setSelectedState(null)
    setShowCities(false)
    setShowDistricts(false)
    setSelectedDistrictId(null)
    setSearchQuery('')
    setSearchExpanded(false)
  }, [])

  const renderedPolygons = useMemo(() => {
    if (!PolygonComponent) return null

    return geoFeatures.flatMap((feature, index) => {
      const name = featureName(feature)
      const isSelected = selectedState?.name === name
      const coordinatesList = getFeatureCoordinates(feature)
      const fillColor = getLayerFillColor({
        activeLayer,
        isSelected,
        selectedDiscourseItem,
        stateName: name,
        theme: t,
      })
      const strokeColor = isSelected ? t.palette.primary_500 : `${t.palette.primary_500}CC`
      const strokeWidth = isSelected ? 1.6 : activeLayer === 'states' ? 0.8 : 0.6

      return coordinatesList.map((coordinates, polygonIndex) => (
        <PolygonComponent
          key={`${name}-${index}-${polygonIndex}`}
          coordinates={coordinates}
          fillColor={fillColor}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          tappable
          zIndex={isSelected ? 12 : 1}
          onPress={() => focusState(name, {openLayer: activeLayer})}
        />
      ))
    })
  }, [
    PolygonComponent,
    activeLayer,
    focusState,
    geoFeatures,
    selectedDiscourseItem,
    selectedState?.name,
    t,
  ])

  const webLeftMargin = {
    marginLeft: 'calc(50% - 300px)',
    minHeight: '100%',
  }

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
          {MapViewComponent && PolygonComponent ? (
            <MapViewComponent
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={INITIAL_REGION}
              onPress={() => {
                setSelectedState(null)
                setShowCities(false)
                setShowDistricts(false)
                setSelectedDistrictId(null)
              }}>
              {renderedPolygons}
            </MapViewComponent>
          ) : (
            <MapUnavailable
              message={
                unavailableMessage ||
                'Map support is missing from the current build.'
              }
            />
          )}

          <MapSearchControls
            searchExpanded={searchExpanded}
            setSearchExpanded={setSearchExpanded}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              onSelect={result => {
                if (result.type === 'district') {
                  setActiveLayer('districts')
                  focusState(result.stateName, {
                    openLayer: 'districts',
                    districtId: result.districtId || null,
                  })
                } else {
                  const nextLayer = result.type === 'city' ? 'cities' : activeLayer
                  if (result.type === 'city') {
                    setActiveLayer('cities')
                  }
                  focusState(result.stateName, {openLayer: nextLayer})
                  if (result.type === 'city') {
                    setSelectedDistrictId(null)
                  }
                }
                setSearchExpanded(false)
              setSearchQuery('')
            }}
          />

          <MapLayersPanel
            activeLayer={activeLayer}
            onSelectLayer={layer => {
              setActiveLayer(layer)
              if (selectedState) {
                setShowDistricts(layer === 'districts')
                setShowCities(layer === 'cities')
              } else {
                setShowDistricts(false)
                setShowCities(false)
              }
              if (layer !== 'districts') {
                setSelectedDistrictId(null)
              }
            }}
          />

          {!gtMobile && MapViewComponent && (
            <View
              style={[
                a.absolute,
                {right: 20, bottom: 60 + insets.bottom},
                a.gap_md,
                {zIndex: 20},
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom('in')}
                style={styles.floatingButton(t)}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom('out')}
                style={styles.floatingButton(t)}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>-</Text>
              </TouchableOpacity>
            </View>
          )}

          <View
            style={[
              a.absolute,
              {right: 20, top: 20},
              a.gap_sm,
              {zIndex: 20},
            ]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleRecenter}
              style={styles.floatingButton(t)}>
              <Text style={[a.text_md, a.font_bold, t.atoms.text]}>⌖</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowDiscourseModal(true)}
              style={[
                styles.floatingButton(t),
                selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                  ? {borderColor: '#FF5A36'}
                  : null,
              ]}>
              <FilterIcon
                width={20}
                height={20}
                fill={
                  selectedDiscourseItem && selectedDiscourseItem !== 'Any'
                    ? '#FF5A36'
                    : t.atoms.text.color
                }
              />
            </TouchableOpacity>
          </View>

          {!searchExpanded && selectedDiscourseItem && selectedDiscourseItem !== 'Any' && (
            <View
              style={[
                a.absolute,
                {top: 20, right: 76},
                a.p_md,
                a.rounded_full,
                t.atoms.bg_contrast_25,
                web({backdropFilter: 'blur(12px)'}),
                a.border,
                {borderColor: '#FF5A36'},
                a.shadow_sm,
                a.flex_row,
                a.align_center,
                a.gap_sm,
                {maxWidth: gtMobile ? 240 : 180},
                {zIndex: 20},
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

          <SelectedStateOverlay
            selectedState={selectedState}
            visible={!!selectedState && activeLayer === 'states' && !showCities && !showDistricts}
            insets={insets}
            onClose={() => {
              setSelectedState(null)
              setShowCities(false)
              setShowDistricts(false)
              setSelectedDistrictId(null)
            }}
            onShowCities={() => {
              setActiveLayer('cities')
              setShowCities(true)
              setShowDistricts(false)
              setSelectedDistrictId(null)
            }}
            onShowDistricts={() => {
              setActiveLayer('districts')
              setShowDistricts(true)
              setShowCities(false)
              setSelectedDistrictId(null)
            }}
          />

          <BigCitiesDataOverlay
            selectedState={selectedState}
            showCities={showCities}
            onClose={() => {
              setActiveLayer('states')
              setShowCities(false)
            }}
          />

          <DistrictsDataOverlay
            selectedState={selectedState}
            showDistricts={showDistricts}
            selectedDistrictId={selectedDistrictId}
            onSelectDistrict={setSelectedDistrictId}
            onClose={() => {
              setActiveLayer('states')
              setShowDistricts(false)
              setSelectedDistrictId(null)
            }}
            onBackToState={() => {
              setActiveLayer('states')
              setShowDistricts(false)
              setSelectedDistrictId(null)
            }}
          />
        </View>
      </View>

      <Modal
        visible={showDiscourseModal}
        transparent
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
            <ScrollView contentContainerStyle={{padding: 16}}>
              <View
                style={[
                  a.rounded_full,
                  t.atoms.bg_contrast_200,
                  {
                    width: 40,
                    height: 4,
                    alignSelf: 'center',
                    marginBottom: 10,
                  },
                ]}
              />

              <View style={[a.mb_md]}>
                <Text style={[a.text_xs, a.font_bold, t.atoms.text_contrast_medium]}>
                  DISCUSSION HEAT
                </Text>
                <Text style={[a.text_lg, a.font_bold, t.atoms.text, a.mt_xs]}>
                  <Trans>Choose a discourse lens</Trans>
                </Text>
                <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_xs]}>
                  <Trans>
                    This is a visual layer only. It changes how states are tinted
                    across the map.
                  </Trans>
                </Text>
              </View>

              <View style={[a.flex_row, a.gap_sm, a.mb_md]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setDiscourseType('Matter')}
                  style={[
                    styles.pillButton(t),
                    discourseType === 'Matter'
                      ? styles.pillButtonActive(t)
                      : null,
                  ]}>
                  <Text
                    style={[
                      a.text_sm,
                      discourseType === 'Matter'
                        ? [a.font_bold, {color: t.palette.primary_500}]
                        : t.atoms.text_contrast_medium,
                    ]}>
                    Matter
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setDiscourseType('Policy')}
                  style={[
                    styles.pillButton(t),
                    discourseType === 'Policy'
                      ? styles.pillButtonActive(t)
                      : null,
                  ]}>
                  <Text
                    style={[
                      a.text_sm,
                      discourseType === 'Policy'
                        ? [a.font_bold, {color: t.palette.primary_500}]
                        : t.atoms.text_contrast_medium,
                    ]}>
                    Policy
                  </Text>
                </TouchableOpacity>
              </View>

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
                    const flair = flairs[0]
                    setDiscourseType(
                      flair.id.startsWith('policy_') ? 'Policy' : 'Matter',
                    )
                    setSelectedDiscourseItem(flair.label)
                  } else {
                    setSelectedDiscourseItem('Any')
                  }
                  setShowDiscourseModal(false)
                }}
                mode={discourseType.toLowerCase() as 'matter' | 'policy'}
                onClose={() => setShowDiscourseModal(false)}
              />

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setSelectedDiscourseItem('')
                  setShowDiscourseModal(false)
                }}
                style={[a.mt_md, a.align_center]}>
                <Text style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                  <Trans>Clear heatmap</Trans>
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const styles = {
  floatingButton: (t: ReturnType<typeof useTheme>) => [
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
  ],
  pillButton: (t: ReturnType<typeof useTheme>) => [
    a.px_md,
    a.py_sm,
    a.rounded_full,
    a.border,
    t.atoms.border_contrast_low,
  ],
  pillButtonActive: (t: ReturnType<typeof useTheme>) => [
    {borderColor: t.palette.primary_500, backgroundColor: '#ffffff10'},
  ],
}
