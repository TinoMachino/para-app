import {useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import {Text} from '#/view/com/util/text/Text'
import {useTheme} from '#/alf'
import {ArrowLeft_Stroke2_Corner0_Rounded as ArrowLeft} from '#/components/icons/Arrow'
import {ArrowRight_Stroke2_Corner0_Rounded as ArrowRight} from '#/components/icons/Arrow'

interface VotingButtonHorizontalProps {
  initialVote?: number
  onVoteChange?: (vote: number) => void
}

export function VotingButtonHorizontal({
  initialVote = 0,
  onVoteChange,
}: VotingButtonHorizontalProps) {
  const t = useTheme()
  const [currentVote, setCurrentVote] = useState(initialVote)
  const translationX = useSharedValue(0)
  const scale = useSharedValue(1)
  const isActive = useSharedValue(false)

  const pan = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true
      scale.value = withSpring(1.05)
    })
    .onUpdate(event => {
      const clampedTranslation = Math.max(
        -120,
        Math.min(120, event.translationX),
      )
      translationX.value = clampedTranslation

      const step = 35
      let newVote = Math.round(clampedTranslation / step)
      newVote = Math.max(-3, Math.min(3, newVote))

      if (newVote !== currentVote) {
        runOnJS(setCurrentVote)(newVote)
      }
    })
    .onFinalize(() => {
      isActive.value = false
      translationX.value = withSpring(0)
      scale.value = withSpring(1)

      if (onVoteChange) {
        runOnJS(onVoteChange)(currentVote)
      }
    })

  const controlStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: translationX.value}, {scale: scale.value}],
      backgroundColor: t.atoms.bg_contrast_25.backgroundColor,
      borderColor: t.atoms.border_contrast_low.borderColor,
    }
  })

  const trackStyle = useAnimatedStyle(() => {
    // Dynamically change track color based on swipe direction
    const backgroundColor = interpolateColor(
      translationX.value,
      [-100, 0, 100],
      [
        'rgba(255, 68, 68, 0.1)',
        'rgba(0, 0, 0, 0.05)',
        'rgba(76, 175, 80, 0.1)',
      ],
    )
    return {backgroundColor}
  })

  const voteTextStyle = useAnimatedStyle(() => {
    const color =
      currentVote > 0
        ? '#4CAF50'
        : currentVote < 0
          ? '#FF4444'
          : t.atoms.text.color
    return {
      color: withTiming(color as string),
    }
  })

  const leftArrowStyle = useAnimatedStyle(() => {
    const active = currentVote < 0
    return {
      opacity: withTiming(active ? 1 : 0.3),
      transform: [{scale: withSpring(active ? 1.3 : 1)}],
    }
  })

  const rightArrowStyle = useAnimatedStyle(() => {
    const active = currentVote > 0
    return {
      opacity: withTiming(active ? 1 : 0.3),
      transform: [{scale: withSpring(active ? 1.3 : 1)}],
    }
  })

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.track, trackStyle]} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.control, controlStyle]}>
          <Animated.View style={leftArrowStyle}>
            <ArrowLeft
              size="sm"
              style={{color: currentVote < 0 ? '#FF4444' : t.atoms.text.color}}
            />
          </Animated.View>

          <View style={styles.textWrapper}>
            <Animated.Text style={[styles.voteText, voteTextStyle]}>
              {currentVote > 0 ? `+${currentVote}` : currentVote}
            </Animated.Text>
            {currentVote === 0 && (
              <Text style={[styles.neutralLabel, t.atoms.text_contrast_low]}>
                NEUTRAL
              </Text>
            )}
          </View>

          <Animated.View style={rightArrowStyle}>
            <ArrowRight
              size="sm"
              style={{color: currentVote > 0 ? '#4CAF50' : t.atoms.text.color}}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: 280,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  track: {
    position: 'absolute',
    width: '100%',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 140,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 32,
  },
  neutralLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: -2,
  },
})
