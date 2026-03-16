import React, {useEffect, useMemo, useRef, useState} from 'react'
import {
  Alert,
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {DOCUMENTS as MOCK_DOCS, MEMES as MOCK_MEMES} from '#/lib/mock-data'
import {type Document as MediaDocument, type Meme} from '#/lib/mock-data/types'
import {type NavigationProp} from '#/lib/routes/types'
import {useBaseFilter} from '#/state/shell/base-filter'
import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {ActiveFiltersStackButton} from '#/components/BaseFilterControls'
import {SearchInput} from '#/components/forms/SearchInput'
import {
  ArrowsDiagonalOut_Stroke2_Corner2_Rounded as ExpandIcon,
} from '#/components/icons/ArrowsDiagonal'
import {Bubble_Stroke2_Corner2_Rounded as CommentIcon} from '#/components/icons/Bubble'
import {
  MagnifyingGlass_Stroke2_Corner0_Rounded as SearchIcon,
} from '#/components/icons/MagnifyingGlass'
import {
  SquareBehindSquare4_Stroke2_Corner0_Rounded as DeckIcon,
} from '#/components/icons/SquareBehindSquare4'
import * as Layout from '#/components/Layout'
import {RedditVoteButton} from '#/components/PostControls/VoteButton'

type Mode = 'Memes' | 'Documents'
type ViewStyleMode = 'board' | 'deck'

type MediaItem = Meme | MediaDocument

const DECK_CARD_HEIGHT = 315
const DECK_VISUAL_HEIGHT = 240
const DECK_OVERLAP = 110
const DECK_SECONDARY_TOP = DECK_CARD_HEIGHT - DECK_OVERLAP
const DECK_THIRD_TOP = DECK_SECONDARY_TOP + DECK_CARD_HEIGHT - DECK_OVERLAP

function matchesSearch(values: Array<string | undefined>, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return values.some(value => value?.toLowerCase().includes(normalized))
}

function matchesCompassFilter(
  item: Pick<Meme, 'community' | 'party' | 'state'>,
  selectedFilters: string[],
) {
  if (!selectedFilters.length) return true
  return selectedFilters.some(filter => {
    return (
      item.community === filter || item.party === filter || item.state === filter
    )
  })
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

export function MemesAndDocumentsScreen({
  route,
}: {
  route: {params?: {mode?: Mode; view?: ViewStyleMode}}
}) {
  const t = useTheme()
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {width} = useWindowDimensions()
  const {selectedFilters} = useBaseFilter()

  const [activeMode, setActiveMode] = useState<Mode>(
    route.params?.mode === 'Documents' ? 'Documents' : 'Memes',
  )
  const [viewStyle, setViewStyle] = useState<ViewStyleMode>(
    route.params?.view === 'deck' ? 'deck' : 'board',
  )
  const [query, setQuery] = useState('')
  const [itemVotes, setItemVotes] = useState<Record<string, 1 | -1 | 0>>({})
  const [focusedItemId, setFocusedItemId] = useState<string | undefined>()
  const [expandedItem, setExpandedItem] = useState<MediaItem | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const isSearchOpen = showSearch || Boolean(query)

  const memes = useMemo(
    () => [...MOCK_MEMES].sort((a, b) => b.votes - a.votes),
    [],
  )
  const documents = useMemo(
    () => [...MOCK_DOCS].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [],
  )

  const filteredMemes = useMemo(() => {
    return memes.filter(item => {
      return (
        matchesCompassFilter(item, selectedFilters) &&
        matchesSearch(
          [item.title, item.author, item.community, item.party, item.state],
          query,
        )
      )
    })
  }, [memes, query, selectedFilters])

  const filteredDocuments = useMemo(() => {
    return documents.filter(item => {
      return (
        matchesCompassFilter(item, selectedFilters) &&
        matchesSearch(
          [item.title, item.category, item.community, item.party, item.state],
          query,
        )
      )
    })
  }, [documents, query, selectedFilters])

  const activeItems = activeMode === 'Memes' ? filteredMemes : filteredDocuments
  const boardWidth = width > 900 ? (width - 52) / 2 : undefined

  const setNextMode = (mode: Mode) => {
    setActiveMode(mode)
    setFocusedItemId(undefined)
    navigation.setParams({mode, view: viewStyle})
  }

  const setNextView = (next: ViewStyleMode) => {
    setViewStyle(next)
    navigation.setParams({mode: activeMode, view: next})
  }

  return (
    <Layout.Screen testID="memesAndDocumentsScreen">
      <Layout.Header.Outer noBottomBorder>
        <Layout.Header.BackButton />
        {isSearchOpen ? (
          <Layout.Header.Content>
            <View style={styles.headerSearchContent}>
              <SearchInput
                value={query}
                onChangeText={setQuery}
                onClearText={() => setQuery('')}
                placeholder={
                  activeMode === 'Memes'
                    ? _(msg`Busca memes, autores o comunidades`)
                    : _(msg`Busca documentos, comunidades o estados`)
                }
              />
            </View>
          </Layout.Header.Content>
        ) : (
          <Layout.Header.Content>
            <Layout.Header.TitleText>
              <Trans>Memes & Documents</Trans>
            </Layout.Header.TitleText>
            <Layout.Header.SubtitleText>
              {viewStyle === 'deck'
                ? _(msg`Vista superpuesta`)
                : _(msg`Vista tablero`)}
            </Layout.Header.SubtitleText>
          </Layout.Header.Content>
        )}
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={_(msg`Mostrar búsqueda`)}
            accessibilityHint={_(
              msg`Abre o cierra la barra de búsqueda`,
            )}
            onPress={() => {
              if (isSearchOpen) {
                setQuery('')
                setShowSearch(false)
              } else {
                setShowSearch(true)
              }
            }}
            style={styles.headerSearchButton}>
            <SearchIcon size="lg" style={t.atoms.text} />
          </Pressable>
          <ActiveFiltersStackButton />
        </View>
      </Layout.Header.Outer>

      <View style={styles.controlsShell}>
        <View style={styles.topRow}>
          <View style={styles.segment}>
            <SegmentButton
              active={activeMode === 'Memes'}
              title={_(msg`Memes`)}
              onPress={() => setNextMode('Memes')}
            />
            <SegmentButton
              active={activeMode === 'Documents'}
              title={_(msg`Documents`)}
              onPress={() => setNextMode('Documents')}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={_(
              msg`Cambiar entre vista tablero y vista superpuesta`,
            )}
            accessibilityHint={_(
              msg`Cambia la presentación de las tarjetas`,
            )}
            onPress={() =>
              setNextView(viewStyle === 'board' ? 'deck' : 'board')
            }
            style={[
              styles.viewToggleButton,
              t.atoms.bg_contrast_25,
              viewStyle === 'deck' && styles.viewToggleButtonActive,
            ]}>
            <DeckIcon
              size="md"
              style={viewStyle === 'deck' ? {color: '#fff'} : t.atoms.text}
            />
          </Pressable>
        </View>

      </View>

      {viewStyle === 'board' ? (
        <Layout.Content
          bounces
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator>
          {activeItems.length === 0 ? (
            <EmptyState
              title={
                activeMode === 'Memes'
                  ? _(msg`No hay memes con esos filtros`)
                  : _(msg`No hay documentos con esos filtros`)
              }
              description={_(
                msg`Abre más comunidades o limpia la búsqueda para rellenar esta vista.`,
              )}
            />
          ) : (
            <View style={styles.boardGrid}>
            {activeItems.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                mode={activeMode}
                width={boardWidth}
                vote={itemVotes[item.id] ?? 0}
                onVoteChange={vote =>
                  setItemVotes(prev => ({...prev, [item.id]: vote}))
                }
              />
            ))}
            </View>
          )}
        </Layout.Content>
      ) : (
        <View style={styles.deckContentShell}>
          {activeItems.length === 0 ? (
            <View style={styles.contentContainer}>
              <EmptyState
                title={
                  activeMode === 'Memes'
                    ? _(msg`No hay memes con esos filtros`)
                    : _(msg`No hay documentos con esos filtros`)
                }
                description={_(
                  msg`Abre más comunidades o limpia la búsqueda para rellenar esta vista.`,
                )}
              />
            </View>
          ) : (
            <DeckChain
              items={activeItems}
              mode={activeMode}
              anchorId={focusedItemId}
              onFocusChange={setFocusedItemId}
              onExpandItem={setExpandedItem}
              votes={itemVotes}
              onVoteChange={(id, vote) =>
                setItemVotes(prev => ({...prev, [id]: vote}))
              }
            />
          )}
        </View>
      )}

      <ExpandedItemModal
        item={expandedItem}
        mode={activeMode}
        vote={expandedItem ? itemVotes[expandedItem.id] ?? 0 : 0}
        onClose={() => setExpandedItem(null)}
        onVoteChange={vote => {
          if (!expandedItem) return
          setItemVotes(prev => ({...prev, [expandedItem.id]: vote}))
        }}
      />
    </Layout.Screen>
  )
}

function SegmentButton({
  active,
  title,
  onPress,
}: {
  active: boolean
  title: string
  onPress: () => void
}) {
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.segmentButton,
        active
          ? {backgroundColor: t.palette.contrast_950}
          : {backgroundColor: 'transparent'},
      ]}>
      <Text
        style={[
          styles.segmentText,
          active ? {color: '#fff'} : t.atoms.text,
        ]}>
        {title}
      </Text>
    </Pressable>
  )
}

function DeckChain({
  items,
  mode,
  anchorId,
  onFocusChange,
  onExpandItem,
  votes,
  onVoteChange,
}: {
  items: MediaItem[]
  mode: Mode
  anchorId?: string
  onFocusChange: (id?: string) => void
  onExpandItem: (item: MediaItem) => void
  votes: Record<string, 1 | -1 | 0>
  onVoteChange: (id: string, vote: 1 | -1 | 0) => void
}) {
  const t = useTheme()
  const animation = useRef(new Animated.Value(0)).current
  const [startIndex, setStartIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [boundaryNotice, setBoundaryNotice] = useState<string | null>(null)
  const [topLayer, setTopLayer] = useState<'current' | 'next'>('current')
  const progressRef = useRef(0)
  const boundaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = animation.addListener(({value}) => {
      progressRef.current = value
    })
    return () => animation.removeListener(id)
  }, [animation])

  useEffect(() => {
    return () => {
      if (boundaryTimeoutRef.current) {
        clearTimeout(boundaryTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const index = anchorId
      ? Math.max(
          0,
          items.findIndex(item => item.id === anchorId),
        )
      : 0
    setStartIndex(index)
    animation.setValue(0)
  }, [anchorId, animation, items])

  const prev = items[startIndex - 1]
  const current = items[startIndex]
  const next = items[startIndex + 1]
  const third = items[startIndex + 2]

  const advance = () => {
    if (!next || isAnimating) return
    setIsAnimating(true)
    Animated.timing(animation, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setStartIndex(prev => Math.min(prev + 1, Math.max(items.length - 1, 0)))
      onFocusChange(next.id)
      animation.setValue(0)
      setIsAnimating(false)
      setTopLayer('current')
    })
  }

  const retreat = () => {
    if (!prev || isAnimating) return
    setIsAnimating(true)
    Animated.timing(animation, {
      toValue: -1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setStartIndex(prevIndex => Math.max(prevIndex - 1, 0))
      onFocusChange(prev.id)
      animation.setValue(0)
      setIsAnimating(false)
      setTopLayer('current')
    })
  }

  const resetPosition = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }

  const showBoundaryMessage = (message: string) => {
    if (boundaryTimeoutRef.current) {
      clearTimeout(boundaryTimeoutRef.current)
    }
    setBoundaryNotice(message)
    boundaryTimeoutRef.current = setTimeout(() => {
      setBoundaryNotice(null)
      boundaryTimeoutRef.current = null
    }, 1200)
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return (
          !isAnimating &&
          (Boolean(next) || Boolean(prev)) &&
          Math.abs(gestureState.dy) > 4 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        )
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !isAnimating &&
          (Boolean(next) || Boolean(prev)) &&
          Math.abs(gestureState.dy) > 4 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        )
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        const progress =
          gestureState.dy < 0 && next
            ? Math.max(0, Math.min(1, -gestureState.dy / DECK_SECONDARY_TOP))
            : gestureState.dy > 0 && prev
              ? -Math.max(
                  0,
                  Math.min(1, gestureState.dy / (DECK_SECONDARY_TOP * 0.55)),
                )
              : 0
        animation.setValue(progress)
      },
      onPanResponderRelease: (_, gestureState) => {
        if (progressRef.current > 0.18 || gestureState.vy < -0.45) {
          advance()
        } else if (progressRef.current < -0.08 || gestureState.vy > 0.18) {
          retreat()
        } else if ((gestureState.dy < -24 || gestureState.vy < -0.3) && !next) {
          showBoundaryMessage('Ya viste la ultima tarjeta')
          resetPosition()
        } else {
          resetPosition()
        }
      },
      onPanResponderTerminate: () => {
        resetPosition()
      },
      }),
    [advance, isAnimating, next, prev, resetPosition, retreat, showBoundaryMessage],
  )

  if (!current) {
    return null
  }

  const prevStyle = {
    opacity: animation.interpolate({
      inputRange: [-1, -0.12, 0, 1],
      outputRange: [1, 0.68, 0, 0],
    }),
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0, -DECK_SECONDARY_TOP, -DECK_SECONDARY_TOP],
        }),
      },
    ],
  }

  const currentStyle = {
    opacity: animation.interpolate({
      inputRange: [-1, -0.2, 0, 0.8, 1],
      outputRange: [0.16, 0.62, 1, 0.18, 0],
    }),
    transform: [
      {
        translateX: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [34, 0, 0],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [DECK_CARD_HEIGHT * 0.72, 0, -170],
        }),
      },
    ],
  }

  const nextStyle = {
    opacity: animation.interpolate({
      inputRange: [-1, -0.1, 0, 1],
      outputRange: [0.18, 0.58, 1, 1],
    }),
    transform: [
      {
        translateX: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0, 0, -10],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [DECK_SECONDARY_TOP, 0, -DECK_SECONDARY_TOP],
        }),
      },
    ],
  }

  const thirdStyle = {
    opacity: animation.interpolate({
      inputRange: [-1, 0, 0.25, 1],
      outputRange: [0, 0, 0.15, 1],
    }),
    transform: [
      {
        translateX: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0, 0, 10],
        }),
      },
      {
        translateY: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [DECK_SECONDARY_TOP, 0, -DECK_SECONDARY_TOP],
        }),
      },
    ],
  }

  const currentRailStyle = {
    opacity: animation.interpolate({
      inputRange: [-1, -0.1, 0, 0.8, 1],
      outputRange: [0, 0.2, 1, 0.45, 0],
    }),
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [18, 0, 0],
        }),
      },
    ],
  }

  const nextAccessoryStyle = {
    opacity: animation.interpolate({
      inputRange: [-1, -0.1, 0, 1],
      outputRange: [0, 0.15, 1, 1],
    }),
    transform: nextStyle.transform,
  }

  return (
    <View {...panResponder.panHandlers} style={styles.deckStage}>
      {boundaryNotice ? (
        <View style={styles.deckBoundaryNotice}>
          <Text style={styles.deckBoundaryNoticeText}>{boundaryNotice}</Text>
        </View>
      ) : null}

      {prev ? (
        <Animated.View
          style={[
            styles.deckPrevIncoming,
            t.atoms.border_contrast_low,
            prevStyle,
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tarjeta anterior"
            accessibilityHint="Toca para traer al frente"
            onPress={() => setTopLayer('current')}
            style={styles.deckCardPressable}>
            <DeckCard
              item={prev}
              mode={mode}
              showOptions={false}
              showExpand={false}
            />
          </Pressable>
        </Animated.View>
      ) : null}

      {third ? (
        <Animated.View
          style={[
            styles.deckHidden,
            t.atoms.border_contrast_low,
            thirdStyle,
          ]}>
          <DeckCard
            item={third}
            mode={mode}
            showOptions={false}
          />
        </Animated.View>
      ) : null}

      {next ? (
        <Animated.View
          style={[
            styles.deckSecondary,
            t.atoms.border_contrast_low,
            nextStyle,
            topLayer === 'next' && {zIndex: 5},
          ]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Siguiente tarjeta"
            accessibilityHint="Toca para traer al frente"
            onPress={() => setTopLayer('next')}
            style={styles.deckCardPressable}>
            <DeckCard
              item={next}
              mode={mode}
              onExpand={() => onExpandItem(next)}
              expandPlacement="top-left"
              showOptions={true}
              showExpand={true}
            />
          </Pressable>
        </Animated.View>
      ) : null}

      <Animated.View
        style={[
          styles.deckPrimary,
          t.atoms.border_contrast_low,
          currentStyle,
          topLayer === 'next' && {zIndex: 1},
        ]}>
        <DeckCard
          item={current}
          mode={mode}
          onExpand={() => onExpandItem(current)}
          expandPlacement="bottom-right"
          showOptions={true}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.deckPrimaryRail,
          currentRailStyle,
        ]}>
        <DeckEngagementRail
          align="left"
          item={current}
          vote={votes[current.id] ?? 0}
          onVoteChange={vote => onVoteChange(current.id, vote)}
        />
      </Animated.View>

      {next ? (
        <Animated.View
          style={[
            styles.deckSecondaryRail,
            nextAccessoryStyle,
          ]}>
          <DeckEngagementRail
            align="right"
            item={next}
            vote={votes[next.id] ?? 0}
            onVoteChange={vote => onVoteChange(next.id, vote)}
          />
        </Animated.View>
      ) : null}

      {!next ? (
        <View style={styles.deckEndCard}>
          <Text style={styles.deckEndTitle}>Eso es todo por hoy</Text>
          <Text style={styles.deckEndBody}>
            Regresa hacia abajo para revisar las tarjetas anteriores.
          </Text>
        </View>
      ) : null}



    </View>
  )
}

function DeckEngagementRail({
  align,
  item,
  vote,
  onVoteChange,
}: {
  align: 'left' | 'right'
  item: MediaItem
  vote: 1 | -1 | 0
  onVoteChange: (vote: 1 | -1 | 0) => void
}) {
  const score = item.votes + vote
  const voteState = vote === 1 ? 'upvote' : vote === -1 ? 'downvote' : 'none'

  return (
    <View
      style={[
        styles.deckEngagementRail,
        align === 'right' && styles.deckEngagementRailRight,
      ]}>
      <RedditVoteButton
        score={score}
        currentVote={voteState}
        hasBeenToggled={vote !== 0}
        onUpvote={() => onVoteChange(vote === 1 ? 0 : 1)}
        onDownvote={() => onVoteChange(vote === -1 ? 0 : -1)}
      />
    </View>
  )
}

function CommentChip({
  comments,
  compact,
}: {
  comments: number
  compact?: boolean
}) {
  const t = useTheme()

  return (
    <View
      style={[
        styles.commentChip,
        compact ? styles.commentChipCompact : styles.commentChipFloating,
        t.atoms.bg_contrast_25,
      ]}>
      <CommentIcon size="sm" style={{color: '#46576A'}} />
      <Text style={[styles.commentChipText, t.atoms.text]}>
        {comments}
      </Text>
    </View>
  )
}

function DeckExpandButton({
  onPress,
  placement,
}: {
  onPress: () => void
  placement: 'bottom-right' | 'top-left'
}) {
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Expandir tarjeta"
      accessibilityHint="Abre la tarjeta en vista completa"
      onPress={onPress}
      style={[
        styles.deckExpandButton,
        placement === 'bottom-right'
          ? styles.deckExpandButtonBottomRight
          : styles.deckExpandButtonTopLeft,
        t.atoms.bg,
      ]}>
      <ExpandIcon size="sm" style={t.atoms.text} />
    </Pressable>
  )
}

function DeckOptionsButton({
  onPress,
}: {
  onPress?: () => void
}) {
  const t = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Más opciones"
      accessibilityHint="Muestra acciones para esta tarjeta"
      onPress={onPress}
      style={styles.deckOptionsButton}>
      <View style={styles.deckOptionsDots}>
        <View
          style={[styles.deckOptionsDot, {backgroundColor: t.palette.contrast_900}]}
        />
        <View
          style={[styles.deckOptionsDot, {backgroundColor: t.palette.contrast_900}]}
        />
        <View
          style={[styles.deckOptionsDot, {backgroundColor: t.palette.contrast_900}]}
        />
      </View>
    </Pressable>
  )
}

function DeckCard({
  item,
  mode,
  onExpand,
  expandPlacement,
  showOptions,
  showExpand,
}: {
  item: MediaItem
  mode: Mode
  onExpand?: () => void
  expandPlacement?: 'bottom-right' | 'top-left'
  showOptions?: boolean
  showExpand?: boolean
}) {
  const t = useTheme()
  const isMeme = mode === 'Memes'
  const isTopLeftExpand = expandPlacement === 'top-left'

  return (
    <View style={styles.deckCardShell}>
      {showOptions ? (
        <View style={styles.deckOptionsPlacement}>
          <DeckOptionsButton onPress={() => Alert.alert('Opciones', 'Funcionalidad en desarrollo')} />
        </View>
      ) : null}

      <View
        style={[
          styles.deckVisual,
          isTopLeftExpand && styles.deckVisualInsetTopLeft,
          showOptions && styles.deckVisualInsetTopRight,
          {
            backgroundColor: item.color,
            minHeight: DECK_VISUAL_HEIGHT,
          },
        ]}>
        <View style={styles.cardBadgeRow}>
          <Text style={styles.cardBadge}>
            {isMeme ? (item as Meme).community : item.category}
          </Text>
        </View>
        <View style={styles.deckVisualBottom}>
          <Text style={styles.deckTitle}>{item.title}</Text>
        </View>
      </View>

      <View
        style={[
          styles.deckBody,
        ]}>
        <View style={styles.deckBodyContent}>
          <Text style={[styles.cardMeta, t.atoms.text_contrast_medium]}>
            {item.party} · {item.state}
          </Text>
          <View style={styles.deckInfoRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.cardSubmeta,
                styles.deckSubmeta,
                t.atoms.text_contrast_medium,
              ]}>
              {isMeme
                ? `${(item as Meme).author} · ${(item as Meme).category}`
                : `${(item as MediaDocument).community} · ${(
                    item as MediaDocument
                  ).size} · ${formatDateLabel((item as MediaDocument).date)}`}
            </Text>
          </View>
          <CommentChip comments={item.comments} compact />
        </View>
        <View style={styles.deckBodyGlassTail} />
      </View>

      {(showExpand ?? true) && onExpand && expandPlacement ? (
        <View
          style={[
            styles.deckExpandPlacement,
            expandPlacement === 'bottom-right'
              ? styles.deckExpandPlacementBottomRight
              : styles.deckExpandPlacementTopLeft,
          ]}>
          <View style={[
            styles.deckExpandSubpixelBleedBlocker,
            expandPlacement === 'bottom-right'
              ? { bottom: 0, right: 0 }
              : { top: 0, left: 0 },
          ]} />
          <View style={[
            styles.deckExpandInnerBody,
            expandPlacement === 'bottom-right'
              ? { borderTopLeftRadius: 36 }
              : { borderBottomRightRadius: 36 },
          ]}>
            <DeckExpandButton onPress={onExpand} placement={expandPlacement} />
          </View>
        </View>
      ) : null}
    </View>
  )
}

function MediaCard({
  item,
  mode,
  vote,
  onVoteChange,
  width,
}: {
  item: MediaItem
  mode: Mode
  vote: 1 | -1 | 0
  onVoteChange: (vote: 1 | -1 | 0) => void
  width?: number
}) {
  const t = useTheme()
  const isMeme = mode === 'Memes'
  const score = item.votes + vote
  const voteState = vote === 1 ? 'upvote' : vote === -1 ? 'downvote' : 'none'

  return (
    <View style={[styles.cardShell, width ? {width} : null]}>
      <View
        style={[
          styles.cardVisual,
          {backgroundColor: item.color, minHeight: 180},
        ]}>
        <View style={styles.cardBadgeRow}>
          <Text style={styles.cardBadge}>
            {isMeme ? (item as Meme).community : item.category}
          </Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardMeta, t.atoms.text_contrast_medium]}>
          {item.party} · {item.state}
        </Text>
        <Text style={[styles.cardSubmeta, t.atoms.text_contrast_medium]}>
          {isMeme
            ? `${(item as Meme).author} · ${(item as Meme).category}`
            : `${(item as MediaDocument).community} · ${(
                item as MediaDocument
              ).size} · ${formatDateLabel((item as MediaDocument).date)}`}
        </Text>

        <View style={styles.actionsRow}>
          <RedditVoteButton
            score={score}
            currentVote={voteState}
            hasBeenToggled={vote !== 0}
            onUpvote={() => onVoteChange(vote === 1 ? 0 : 1)}
            onDownvote={() => onVoteChange(vote === -1 ? 0 : -1)}
          />

          <ActionButton
            icon={<CommentIcon size="sm" style={{color: '#46576A'}} />}
            label={String(item.comments)}
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  )
}

function ExpandedItemModal({
  item,
  mode,
  vote,
  onClose,
  onVoteChange,
}: {
  item: MediaItem | null
  mode: Mode
  vote: 1 | -1 | 0
  onClose: () => void
  onVoteChange: (vote: 1 | -1 | 0) => void
}) {
  const t = useTheme()

  if (!item) return null

  const score = item.votes + vote
  const voteState = vote === 1 ? 'upvote' : vote === -1 ? 'downvote' : 'none'
  const isMeme = mode === 'Memes'

  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(item)}
      onRequestClose={onClose}>
      <View style={styles.expandedModalOverlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar vista expandida"
          accessibilityHint="Cierra la tarjeta expandida"
          style={styles.expandedModalDismiss}
          onPress={onClose}
        />
        <View style={[styles.expandedModalSheet, t.atoms.bg]}>
          <View style={[styles.expandedHandle, t.atoms.bg_contrast_100]} />

          <View
            style={[
              styles.expandedVisual,
              {backgroundColor: item.color},
            ]}>
            <View style={styles.cardBadgeRow}>
              <Text style={styles.cardBadge}>
                {isMeme ? (item as Meme).community : item.category}
              </Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </View>

          <View style={styles.expandedBody}>
            <Text style={[styles.cardMeta, t.atoms.text_contrast_medium]}>
              {item.party} · {item.state}
            </Text>
            <Text style={[styles.cardSubmeta, t.atoms.text_contrast_medium]}>
              {isMeme
                ? `${(item as Meme).author} · ${(item as Meme).category}`
                : `${(item as MediaDocument).community} · ${(
                    item as MediaDocument
                  ).size} · ${formatDateLabel((item as MediaDocument).date)}`}
            </Text>

            <View style={styles.actionsRow}>
              <RedditVoteButton
                score={score}
                currentVote={voteState}
                hasBeenToggled={vote !== 0}
                onUpvote={() => onVoteChange(vote === 1 ? 0 : 1)}
                onDownvote={() => onVoteChange(vote === -1 ? 0 : -1)}
              />

              <ActionButton
                icon={<CommentIcon size="sm" style={{color: '#46576A'}} />}
                label={String(item.comments)}
                onPress={() => {}}
              />

              <ActionButton
                icon={<ExpandIcon size="sm" style={{color: '#46576A'}} />}
                label="Cerrar"
                onPress={onClose}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  onPress?: () => void
}) {
  const t = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.actionButton, t.atoms.bg_contrast_25]}>
      {icon}
      <Text style={[styles.actionButtonText, t.atoms.text]}>{label}</Text>
    </Pressable>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const t = useTheme()
  return (
    <View style={[styles.emptyState, t.atoms.border_contrast_low]}>
      <Text style={[styles.emptyTitle, t.atoms.text]}>{title}</Text>
      <Text style={[styles.emptyDescription, t.atoms.text_contrast_medium]}>
        {description}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: 16,
    padding: 16,
    paddingBottom: 48,
    paddingTop: 14,
  },
  deckContentShell: {
    flex: 1,
    paddingBottom: 48,
    paddingHorizontal: 0,
    paddingTop: 14,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerSearchContent: {
    paddingRight: 8,
    width: '100%',
  },
  headerSearchButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  controlsShell: {
    backgroundColor: '#F8FAFD',
    bottom: -1,
    gap: 2,
    paddingBottom: 0,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  deckExpandSubpixelBleedBlocker: {
    backgroundColor: '#FFFFFF',
    height: 24,
    position: 'absolute',
    width: 24,
    zIndex: 0,
  },
  deckExpandInnerBody: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
    zIndex: 1,
  },
  deckCardPressable: {
    flex: 1,
  },
  segment: {
    backgroundColor: '#E8EDF4',
    borderRadius: 22,
    flexDirection: 'row',
    flex: 1,
    padding: 3,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewToggleButton: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  viewToggleButtonActive: {
    backgroundColor: '#1E293B',
  },
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardShell: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
  },
  cardVisual: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    justifyContent: 'space-between',
    padding: 18,
  },
  cardBadgeRow: {
    flexDirection: 'row',
  },
  cardBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#121212',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
    width: '85%',
  },
  cardBody: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardMeta: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubmeta: {
    fontSize: 14,
    lineHeight: 19,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deckColumn: {
    gap: 6,
  },
  deckStage: {
    marginTop: 2,
    minHeight: DECK_CARD_HEIGHT + DECK_SECONDARY_TOP + 28,
    position: 'relative',
  },
  deckBoundaryNotice: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    borderRadius: 999,
    left: '50%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
    top: -4,
    transform: [{translateX: -92}],
    zIndex: 20,
  },
  deckBoundaryNoticeText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  deckEndCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    left: 34,
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'absolute',
    right: 34,
    top: DECK_SECONDARY_TOP + DECK_CARD_HEIGHT + 14,
    zIndex: 2,
  },
  deckEndTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  deckEndBody: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  deckPrimary: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    borderWidth: 1,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 52,
    top: 0,
    zIndex: 3,
  },
  deckPrevIncoming: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    borderWidth: 1,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 34,
    top: 0,
    zIndex: 5,
  },
  deckSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    borderWidth: 1,
    left: 52,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: DECK_SECONDARY_TOP,
    zIndex: 2,
  },
  deckHidden: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    borderWidth: 1,
    left: 52,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: DECK_THIRD_TOP,
    zIndex: 1,
  },
  deckCardShell: {
    minHeight: DECK_CARD_HEIGHT,
    position: 'relative',
  },
  deckVisual: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    justifyContent: 'space-between',
    padding: 15,
  },
  deckVisualInsetTopLeft: {
    paddingLeft: 54,
    paddingTop: 14,
  },
  deckVisualInsetTopRight: {
    paddingRight: 56,
  },
  deckVisualBottom: {
    paddingTop: 8,
    gap: 8,
  },
  deckBody: {
    overflow: 'hidden',
    position: 'relative',
  },

  deckBodyContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 2,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 1,
  },
  deckBodyGlassTail: {
    display: 'none',
  },
  deckInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deckSubmeta: {
    flex: 1,
  },
  deckTitle: {
    color: '#121212',
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 26,
    width: '84%',
  },
  deckPrimaryRail: {
    left: 8,
    position: 'absolute',
    top: DECK_VISUAL_HEIGHT + 58,
    zIndex: 7,
  },
  deckSecondaryRail: {
    position: 'absolute',
    right: 8,
    top: DECK_SECONDARY_TOP + DECK_VISUAL_HEIGHT + 58,
    zIndex: 6,
  },
  deckEngagementRail: {
    alignItems: 'center',
    gap: 10,
  },
  deckEngagementRailRight: {
    alignItems: 'center',
  },
  commentChip: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    height: 38,
    justifyContent: 'center',
    minWidth: 68,
    paddingHorizontal: 12,
  },
  commentChipFloating: {
    minWidth: 68,
  },
  commentChipCompact: {
    height: 26,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  commentChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  deckOptionsPlacement: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 9,
  },
  deckOptionsButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  deckOptionsDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  deckOptionsDot: {
    borderRadius: 999,
    height: 4,
    width: 4,
  },
  deckExpandPlacement: {
    position: 'absolute',
    zIndex: 8,
  },
  deckSecondaryExpandOverlay: {
    height: 50,
    left: 52,
    position: 'absolute',
    top: DECK_SECONDARY_TOP,
    width: 50,
    zIndex: 10,
  },
  deckSecondaryOptionsOverlay: {
    height: 38,
    position: 'absolute',
    right: 12,
    top: DECK_SECONDARY_TOP + 12,
    width: 38,
    zIndex: 11,
  },
  deckExpandPlacementBottomRight: {
    bottom: 0,
    height: 52,
    right: 0,
    width: 52,
  },
  deckExpandPlacementTopLeft: {
    height: 52,
    left: 0,
    top: 0,
    width: 52,
  },
  deckExpandButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  deckExpandButtonBottomRight: {
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    height: 50,
    paddingLeft: 4,
    paddingTop: 4,
    width: 50,
  },
  deckExpandButtonTopLeft: {
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 22,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    height: 50,
    paddingBottom: 4,
    paddingRight: 4,
    width: 50,
  },
  expandedModalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  expandedModalDismiss: {
    flex: 1,
  },
  expandedModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 34,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  expandedHandle: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 5,
    marginBottom: 14,
    width: 44,
  },
  expandedVisual: {
    borderRadius: 28,
    justifyContent: 'space-between',
    minHeight: 236,
    padding: 18,
  },
  expandedBody: {
    gap: 10,
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 28,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 320,
    textAlign: 'center',
  },
})
