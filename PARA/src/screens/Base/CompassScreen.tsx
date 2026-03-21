import {useMemo, useRef, useState} from 'react'
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'

import {type CommonNavigatorParams} from '#/lib/routes/types'
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
import {Header, Screen} from '#/components/Layout'
import {Text} from '#/components/Typography'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Compass'>

type Quadrant = {
  id: string
  label: string
  color: string
  row: number
  col: number
}

// Define the 9 quadrants with their colors and labels
const QUADRANTS_9: Quadrant[] = [
  // Top row (Authoritarian)
  {id: 'auth-left', label: 'Auth Left', color: '#C22020', row: 0, col: 0},
  {id: 'auth-center', label: 'Auth Center', color: '#7A2855', row: 0, col: 1},
  {id: 'auth-right', label: 'Auth Right', color: '#465FC4', row: 0, col: 2},
  // Middle row
  {id: 'center-left', label: 'Center Left', color: '#6B6B30', row: 1, col: 0},
  {id: 'center', label: 'Centrist', color: '#E8E8E8', row: 1, col: 1},
  {id: 'center-right', label: 'Center Right', color: '#C87730', row: 1, col: 2},
  // Bottom row (Libertarian)
  {id: 'lib-left', label: 'Lib Left', color: '#00C864', row: 2, col: 0},
  {id: 'lib-center', label: 'Lib Center', color: '#FF80FF', row: 2, col: 1},
  {id: 'lib-right', label: 'Lib Right', color: '#FFFF64', row: 2, col: 2},
]

// Generate random color
const randomColor = () => {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 60%, 50%)`
}

// Build 25ths grid (5x5) with original 9 colors at center positions
const buildQuadrants25 = (): Quadrant[] => {
  const quadrants: Quadrant[] = []

  // Mapping from 5x5 to center positions (0,2,4 map to original 0,1,2)
  const centerMapping: Record<string, Quadrant> = {}
  QUADRANTS_9.forEach(q => {
    const key = `${q.row * 2}-${q.col * 2}`
    centerMapping[key] = q
  })

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const key = `${row}-${col}`
      const existing = centerMapping[key]

      if (existing) {
        quadrants.push({
          ...existing,
          row,
          col,
        })
      } else {
        // Generate a random color for non-center positions
        quadrants.push({
          id: `pos-${row}-${col}`,
          label: '',
          color: randomColor(),
          row,
          col,
        })
      }
    }
  }

  return quadrants
}

const INITIAL_SCALE = 1
const MIN_SCALE = 0.5
const MAX_SCALE = 3

export function CompassScreen({navigation: _}: Props) {
  const {_: translate} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const {gtMobile} = useBreakpoints()

  // Custom darker background for cards to match user preference
  // Assuming hex colors for palette, adding alpha for transparency
  // 40 = 25% opacity, 80 = 50% opacity
  const cardBgColor = {
    backgroundColor: t.palette.contrast_25 + '30', // Very subtle dark background
    borderWidth: 1,
    borderColor: t.palette.contrast_50 + '40',
  }

  const [is25ths, setIs25ths] = useState(false)
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant | null>(
    null,
  )
  const [selectedQuadrantStats, setSelectedQuadrantStats] = useState<{
    users: number
    active: number
  } | null>(null)

  // Memoize 25ths quadrants so random colors don't change on re-render
  const quadrants25 = useMemo(() => buildQuadrants25(), [])

  const currentQuadrants = is25ths ? quadrants25 : QUADRANTS_9
  const gridDimension = is25ths ? 5 : 3

  // Animated values for pan and zoom
  const pan = useRef(new Animated.ValueXY()).current
  const scale = useRef(new Animated.Value(INITIAL_SCALE)).current

  // Track current scale for gesture calculations
  const currentScale = useRef(INITIAL_SCALE)
  scale.addListener(({value}) => {
    currentScale.current = value
  })

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any).__getValue(),
          y: (pan.y as any).__getValue(),
        })
        pan.setValue({x: 0, y: 0})
      },
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset()
      },
    }),
  ).current

  const handleZoom = (factor: number) => {
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, currentScale.current * factor),
    )
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false,
    }).start()
  }

  const handleRecenter = () => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: {x: 0, y: 0},
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: INITIAL_SCALE,
        useNativeDriver: false,
      }),
    ]).start()
    setSelectedQuadrant(null)
    setSelectedQuadrantStats(null)
  }

  const handleQuadrantPress = (quadrant: Quadrant) => {
    setSelectedQuadrant(quadrant)
    setSelectedQuadrantStats({
      users: Math.floor(Math.random() * 20) + 5,
      active: Math.floor(Math.random() * 500) + 50,
    })

    // Zoom to the selected quadrant
    const {width} = Dimensions.get('window')
    const gridSize = Math.min(width - 40, 350)
    const cellSize = gridSize / gridDimension
    const centerCol = (gridDimension - 1) / 2
    const centerRow = (gridDimension - 1) / 2
    const centerX = (centerCol - quadrant.col) * cellSize
    const centerY = (centerRow - quadrant.row) * cellSize

    Animated.parallel([
      Animated.spring(pan, {
        toValue: {x: centerX, y: centerY},
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: is25ths ? 2.5 : 2,
        useNativeDriver: false,
      }),
    ]).start()
  }

  const webLeftMargin = {
    marginLeft: 'calc(50% - 300px)',
    minHeight: '100%',
  }

  const {width} = Dimensions.get('window')
  const gridSize = Math.min(width - 40, 350)
  const cellSize = gridSize / gridDimension

  return (
    <Screen hideBorders>
      <Header.Outer noBottomBorder>
        <Header.BackButton />
        <Header.Content>
          <Header.TitleText>
            {translate(msg`Political Compass`)}
          </Header.TitleText>
        </Header.Content>
        <Header.Slot />
      </Header.Outer>

      <View style={[a.flex_1, gtMobile && web(webLeftMargin)]}>
        <View style={[a.flex_1, a.relative, a.overflow_hidden]}>
          {/* Toggle Button */}
          <View
            style={[
              a.absolute,
              {left: 20, top: 20, zIndex: 10},
              gtMobile && {left: 80},
            ]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => {
                setIs25ths(!is25ths)
                setSelectedQuadrant(null)
                handleRecenter()
              }}
              style={[cardBgColor, a.px_md, a.py_sm]}>
              <Text style={[a.font_bold, t.atoms.text]}>
                {is25ths ? <Trans>9ths</Trans> : <Trans>25ths</Trans>}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Axis Labels */}
          <Text
            style={[
              styles.axisLabel,
              t.atoms.text_contrast_medium,
              {top: 10, alignSelf: 'center'},
            ]}>
            <Trans>Authoritarian</Trans>
          </Text>
          <Text
            style={[
              styles.axisLabel,
              t.atoms.text_contrast_medium,
              {bottom: 60 + insets.bottom, alignSelf: 'center'},
            ]}>
            <Trans>Libertarian</Trans>
          </Text>
          <Text
            style={[
              styles.axisLabel,
              t.atoms.text_contrast_medium,
              {left: 10, top: '50%'},
            ]}>
            Left
          </Text>
          <Text
            style={[
              styles.axisLabel,
              t.atoms.text_contrast_medium,
              {right: 10, top: '50%'},
            ]}>
            Right
          </Text>

          {/* Draggable Grid Container */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.gridContainer,
              {
                transform: [
                  {translateX: pan.x},
                  {translateY: pan.y},
                  {scale: scale},
                ],
              },
            ]}>
            <View style={[styles.grid, {width: gridSize, height: gridSize}]}>
              {currentQuadrants.map(quadrant => (
                <TouchableOpacity
                  key={quadrant.id}
                  accessibilityRole="button"
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: quadrant.color,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleQuadrantPress(quadrant)}>
                  {quadrant.label ? (
                    <Text
                      style={[
                        styles.cellLabel,
                        {
                          color: quadrant.id === 'center' ? '#333' : '#fff',
                          fontSize: is25ths ? 8 : 12,
                        },
                      ]}>
                      {quadrant.label}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Zoom Controls */}
          {!gtMobile && (
            <View
              style={[
                a.absolute,
                {right: 20, bottom: 60 + insets.bottom},
                a.gap_md,
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom(1.5)}
                style={[
                  cardBgColor,
                  web({backdropFilter: 'blur(10px)'}),
                  a.rounded_full,
                  a.shadow_md,
                  a.border,
                  t.atoms.border_contrast_low,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleZoom(0.67)}
                style={[
                  cardBgColor,
                  web({backdropFilter: 'blur(10px)'}),
                  a.rounded_full,
                  a.shadow_md,
                  a.align_center,
                  a.justify_center,
                  {width: 44, height: 44},
                ]}>
                <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>-</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Recenter Button */}
          <View
            style={[a.absolute, {right: 20, top: 20}, gtMobile && {right: 40}]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleRecenter}
              style={[
                cardBgColor,
                a.align_center,
                a.justify_center,
                {width: 44, height: 44},
              ]}>
              <Text style={[a.text_md, a.font_bold, t.atoms.text]}>⌖</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Quadrant Overlay */}
          {selectedQuadrant && (
            <View
              style={[
                a.absolute,
                {bottom: gtMobile ? 40 : 60 + insets.bottom, left: 20},
                gtMobile && {left: 40, width: 350},
                !gtMobile && {right: 20},
                a.p_lg,
                a.rounded_xl,
                t.atoms.bg_contrast_25, // Fallback? No, replace with cardBgColor?
                // Wait, in previous step I did NOT apply cardBgColor to Overlay!
                // Line 393 shows `t.atoms.bg_contrast_25`.
                // I need to replace it with cardBgColor AND remove border.
                cardBgColor,
                web({backdropFilter: 'blur(12px)'}),
                a.shadow_lg,
              ]}>
              <View
                style={[
                  a.flex_row,
                  a.justify_between,
                  a.align_center,
                  a.mb_md,
                ]}>
                <View style={[a.flex_row, a.align_center, a.gap_sm]}>
                  <View
                    style={[
                      {
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: selectedQuadrant.color,
                      },
                    ]}
                  />
                  <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
                    {selectedQuadrant.label ||
                      `Position ${selectedQuadrant.row}-${selectedQuadrant.col}`}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setSelectedQuadrant(null)}>
                  <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[a.text_md, t.atoms.text_contrast_high, a.mb_sm]}>
                <Trans>Top Parties:</Trans>{' '}
                <Text style={[a.font_bold]}>
                  PAN, PRI, Movimiento Ciudadano
                </Text>
              </Text>
              <Text style={[a.text_md, t.atoms.text_contrast_high, a.mb_sm]}>
                <Trans>Top Communities:</Trans>{' '}
                <Text style={[a.font_bold]}>r/Libertarios, r/CentroMX</Text>
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
                    {selectedQuadrantStats?.users}%
                  </Text>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    <Trans>of Users</Trans>
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
                    {selectedQuadrantStats?.active}
                  </Text>
                  <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
                    <Trans>Active</Trans>
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  axisLabel: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  cellLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
})
