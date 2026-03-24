import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {LayoutAnimation, Platform} from 'react-native'
import {getLocales} from 'expo-localization'
import {type TranslationTaskResult} from '@bsky.app/expo-translate-text/build/ExpoTranslateText.types'
import {useLingui} from '@lingui/react/macro'
import {useFocusEffect} from '@react-navigation/native'

import {useGoogleTranslate} from '#/lib/hooks/useGoogleTranslate'
import {logger} from '#/logger'
import {useAnalytics} from '#/analytics'
import {IS_ANDROID, IS_IOS} from '#/env'
import {
  type TranslationFunctionParams,
  type TranslationOptions,
  type TranslationState,
} from './types'
import {guessLanguage} from './utils'

export * from './types'
export * from './utils'

const translationStateStore: Record<string, TranslationState> = {}
const refCountsStore: Record<string, number> = {}
const subscribers = new Set<() => void>()

function emitStoreUpdate() {
  subscribers.forEach(subscriber => subscriber())
}

function setTranslationStateForKey(key: string, state?: TranslationState) {
  if (state) {
    translationStateStore[key] = state
  } else {
    delete translationStateStore[key]
  }
  emitStoreUpdate()
}

function acquireTranslation(key: string) {
  refCountsStore[key] = (refCountsStore[key] ?? 0) + 1

  return () => {
    const newCount = (refCountsStore[key] ?? 1) - 1
    if (newCount <= 0) {
      delete refCountsStore[key]
      if (translationStateStore[key]) {
        delete translationStateStore[key]
        emitStoreUpdate()
      }
      return
    }
    refCountsStore[key] = newCount
  }
}

/**
 * Attempts on-device translation via @bsky.app/expo-translate-text.
 * Uses a lazy import to avoid crashing if the native module isn't linked into
 * the current build.
 */
async function attemptTranslation(
  input: string,
  targetLangCodeOriginal: string,
  sourceLangCodeOriginal?: string,
): Promise<{
  translatedText: string
  targetLanguage: TranslationTaskResult['targetLanguage']
  sourceLanguage: TranslationTaskResult['sourceLanguage']
}> {
  let targetLangCode = IS_ANDROID
    ? targetLangCodeOriginal.split('-')[0]
    : targetLangCodeOriginal
  const sourceLangCode = IS_ANDROID
    ? sourceLangCodeOriginal?.split('-')[0]
    : sourceLangCodeOriginal

  if (IS_IOS) {
    const deviceLocales = getLocales()
    const primaryLanguageTag = deviceLocales[0]?.languageTag
    switch (targetLangCodeOriginal) {
      case 'en':
      case 'es':
      case 'pt':
      case 'zh':
        if (
          primaryLanguageTag &&
          primaryLanguageTag.startsWith(targetLangCodeOriginal)
        ) {
          targetLangCode = primaryLanguageTag
        }
        break
    }
  }

  const {onTranslateTask} = await import('@bsky.app/expo-translate-text')
  const result = await onTranslateTask({
    input,
    targetLangCode,
    sourceLangCode,
  })

  const translatedText =
    typeof result.translatedTexts === 'string' ? result.translatedTexts : ''

  if (translatedText === input) {
    throw new Error('Translation result is the same as the source text.')
  }

  if (translatedText === '') {
    throw new Error('Translation result is empty.')
  }

  return {
    translatedText,
    targetLanguage: result.targetLanguage,
    sourceLanguage:
      result.sourceLanguage ?? sourceLangCode ?? guessLanguage(input),
  }
}

async function isOnDeviceTranslationSupported() {
  const {isTranslationSupported} = await import('@bsky.app/expo-translate-text')
  return isTranslationSupported()
}

export function useTranslate({
  key,
  forceGoogleTranslate = false,
}: TranslationOptions) {
  const [, setVersion] = useState(0)
  const ax = useAnalytics()
  const {t: l} = useLingui()
  const googleTranslate = useGoogleTranslate()

  useEffect(() => {
    const onStoreUpdate = () => {
      setVersion(version => version + 1)
    }
    subscribers.add(onStoreUpdate)
    return () => {
      subscribers.delete(onStoreUpdate)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      return acquireTranslation(key)
    }, [key]),
  )

  const translate = useCallback(
    async ({
      text,
      expectedTargetLanguage,
      expectedSourceLanguage,
      possibleSourceLanguages,
      forceGoogleTranslate: forceGoogleTranslateOverride,
    }: TranslationFunctionParams) => {
      const shouldForceGoogleTranslate = Boolean(
        forceGoogleTranslateOverride ?? forceGoogleTranslate,
      )

      ax.metric('translate', {
        os: Platform.OS,
        possibleSourceLanguages,
        expectedTargetLanguage,
        textLength: text.length,
        googleTranslate: shouldForceGoogleTranslate,
      })

      if (
        shouldForceGoogleTranslate ||
        !(await isOnDeviceTranslationSupported())
      ) {
        await googleTranslate(
          text,
          expectedTargetLanguage,
          expectedSourceLanguage,
        )
        return
      }

      if (!IS_ANDROID) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      }
      setTranslationStateForKey(key, {status: 'loading'})

      try {
        const result = await attemptTranslation(
          text,
          expectedTargetLanguage,
          expectedSourceLanguage,
        )

        ax.metric('translate:result', {
          success: true,
          os: Platform.OS,
          possibleSourceLanguages,
          expectedSourceLanguage: expectedSourceLanguage ?? null,
          expectedTargetLanguage,
          resultSourceLanguage: result.sourceLanguage,
          resultTargetLanguage: result.targetLanguage,
          textLength: text.length,
        })

        if (!IS_ANDROID) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        }

        setTranslationStateForKey(key, {
          status: 'success',
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage,
          postLanguages: possibleSourceLanguages,
        })
      } catch (e) {
        logger.error('Failed to translate text on device', {safeMessage: e})

        ax.metric('translate:result', {
          success: false,
          os: Platform.OS,
          possibleSourceLanguages,
          expectedSourceLanguage: expectedSourceLanguage ?? null,
          expectedTargetLanguage,
          resultSourceLanguage: null,
          resultTargetLanguage: null,
          textLength: text.length,
        })

        const errorMessage = l`Device failed to translate :(`

        if (!IS_ANDROID) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        }

        setTranslationStateForKey(key, {
          status: 'error',
          message: errorMessage,
        })
      }
    },
    [ax, forceGoogleTranslate, googleTranslate, key, l],
  )

  const clearTranslation = useCallback(() => {
    if (!IS_ANDROID) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }
    setTranslationStateForKey(key)
  }, [key])

  return {
    translationState: translationStateStore[key] ?? {
      status: 'idle',
    },
    translate,
    clearTranslation,
  }
}

export function Provider({children}: PropsWithChildren<unknown>) {
  return children
}
