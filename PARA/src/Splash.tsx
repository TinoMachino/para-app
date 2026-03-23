import {type PropsWithChildren, useCallback, useEffect, useState} from 'react'
import {AccessibilityInfo, StyleSheet, useColorScheme, View} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as SplashScreen from 'expo-splash-screen'

import {Logotype} from '#/view/icons/Logotype'

type Props = {
  isReady: boolean
}

export function Splash(props: PropsWithChildren<Props>) {
  'use no memo'
  const outroAppOpacity = useSharedValue(0)
  const colorScheme = useColorScheme()
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const [isLayoutReady, setIsLayoutReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState<boolean | undefined>(false)
  const isReady = props.isReady && isLayoutReady && reduceMotion !== undefined
  const isDarkMode = colorScheme === 'dark'
  const splashBackground = isDarkMode ? '#101924' : '#EAF2F8'
  const splashCardBackground = isDarkMode ? '#172332' : 'rgba(255,255,255,0.72)'
  const splashBorder = isDarkMode ? 'rgba(138, 162, 190, 0.2)' : 'rgba(53, 67, 88, 0.1)'
  const splashWordmark = isDarkMode ? '#F5F8FC' : '#354358'

  const appAnimation = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        outroAppOpacity.get(),
        [0, 0.1, 0.2, 1],
        [0, 0, 1, 1],
        'clamp',
      ),
    }
  })

  const onFinish = useCallback(() => setIsAnimationComplete(true), [])
  const onLayout = useCallback(() => setIsLayoutReady(true), [])

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
        .then(() => {
          outroAppOpacity.set(() =>
            withTiming(1, {
              duration: 1200,
              easing: Easing.in(Easing.cubic),
            }),
          )
        })
        .catch(() => {})
    }
  }, [onFinish, outroAppOpacity, isReady])

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
  }, [])

  return (
    <View style={{flex: 1}} onLayout={onLayout}>
      {!isAnimationComplete && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: splashBackground,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}>
          <View
            style={{
              minWidth: 180,
              paddingHorizontal: 28,
              paddingVertical: 20,
              borderRadius: 999,
              backgroundColor: splashCardBackground,
              borderWidth: 1,
              borderColor: splashBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Logotype width={132} fill={splashWordmark} />
          </View>
        </View>
      )}

      {isReady && (
        <>
          <Animated.View style={[{flex: 1}, appAnimation]}>
            {props.children}
          </Animated.View>
        </>
      )}
    </View>
  )
}
