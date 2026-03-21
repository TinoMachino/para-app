import {memo, useCallback} from 'react'
import {View} from 'react-native'
import {msg, plural} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {useHaptics} from '#/lib/haptics'
import {useRequireAuth} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Pencil_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import {useFormatPostStatCount} from '#/components/PostControls/util'
import {Text} from '#/components/Typography'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from './PostControlButton'
interface Props {
  isReposted: boolean
  repostCount?: number
  onRepost: () => void
  onQuote: () => void
  onHighlight: () => void
  onRemoveAllHighlights: () => void
  hasHighlights: boolean
  big?: boolean
  embeddingDisabled: boolean
}

let QuoteButton = ({
  isReposted,
  repostCount,
  onQuote,
  onHighlight,
  onRemoveAllHighlights,
  hasHighlights,
  big,
  embeddingDisabled,
}: Props): React.ReactNode => {
  const isHighlighted = isReposted
  const highlightCount = repostCount
  const t = useTheme()
  const {_} = useLingui()
  const requireAuth = useRequireAuth()
  const dialogControl = Dialog.useDialogControl()
  const formatPostStatCount = useFormatPostStatCount()

  const onPress = () => requireAuth(() => dialogControl.open())

  const onLongPress = () =>
    requireAuth(() => {
      if (embeddingDisabled) {
        dialogControl.open()
      } else {
        onQuote()
      }
    })

  return (
    <>
      <PostControlButton
        testID="highlightBtn"
        active={isHighlighted}
        activeColor={t.palette.positive_500}
        big={big}
        onPress={onPress}
        onLongPress={onLongPress}
        label={
          isHighlighted
            ? _(
                msg({
                  message: `Remove highlight (${plural(highlightCount || 0, {
                    one: '# highlight',
                    other: '# highlights',
                  })})`,
                  comment:
                    'Accessibility label for the highlight button when the post has been highlighted',
                }),
              )
            : _(
                msg({
                  message: `Highlight (${plural(highlightCount || 0, {
                    one: '# highlight',
                    other: '# highlights',
                  })})`,
                  comment:
                    'Accessibility label for the highlight button when the post has not been highlighted',
                }),
              )
        }>
        <PostControlButtonIcon icon={QuoteIcon} />
        {typeof highlightCount !== 'undefined' && highlightCount > 0 && (
          <PostControlButtonText testID="highlightCount">
            {formatPostStatCount(highlightCount)}
          </PostControlButtonText>
        )}
      </PostControlButton>
      <Dialog.Outer
        control={dialogControl}
        nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <QuoteButtonDialogInner
          onQuote={onQuote}
          onHighlight={onHighlight}
          onRemoveAllHighlights={onRemoveAllHighlights}
          hasHighlights={hasHighlights}
          embeddingDisabled={embeddingDisabled}
        />
      </Dialog.Outer>
    </>
  )
}
QuoteButton = memo(QuoteButton)
export {QuoteButton}

let QuoteButtonDialogInner = ({
  onQuote,
  onHighlight,
  onRemoveAllHighlights,
  hasHighlights,
  embeddingDisabled,
}: {
  onQuote: () => void
  onHighlight: () => void
  onRemoveAllHighlights: () => void
  hasHighlights: boolean
  embeddingDisabled: boolean
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const playHaptic = useHaptics()
  const control = Dialog.useDialogContext()

  const onPressHighlight = useCallback(() => {
    playHaptic()
    control.close(() => {
      onHighlight()
    })
  }, [control, onHighlight, playHaptic])

  const onPressRemoveHighlights = useCallback(() => {
    playHaptic()
    control.close(() => {
      onRemoveAllHighlights()
    })
  }, [control, onRemoveAllHighlights, playHaptic])

  const onPressQuote = useCallback(() => {
    playHaptic()
    control.close(() => {
      onQuote()
    })
  }, [control, onQuote, playHaptic])

  const onPressClose = useCallback(() => control.close(), [control])

  return (
    <Dialog.ScrollableInner label={_(msg`Highlight or quote post`)}>
      <View style={a.gap_xl}>
        <View style={a.gap_xs}>
          <Button
            style={[a.justify_start, a.px_md, a.gap_sm]}
            label={
              hasHighlights
                ? _(msg`Remove all highlights`)
                : _(msg`Highlight this post`)
            }
            onPress={hasHighlights ? onPressRemoveHighlights : onPressHighlight}
            size="large"
            variant="ghost"
            color="primary">
            <PencilIcon size="lg" fill={t.palette.primary_500} />
            <Text style={[a.font_semi_bold, a.text_xl]}>
              {hasHighlights ? (
                <Trans>Remove highlights</Trans>
              ) : (
                <Trans>Highlight</Trans>
              )}
            </Text>
          </Button>
          <Button
            disabled={embeddingDisabled}
            testID="quoteBtn"
            style={[a.justify_start, a.px_md, a.gap_sm]}
            label={
              embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)
            }
            onPress={onPressQuote}
            size="large"
            variant="ghost"
            color="primary">
            <QuoteIcon
              size="lg"
              fill={
                embeddingDisabled
                  ? t.atoms.text_contrast_low.color
                  : t.palette.primary_500
              }
            />
            <Text
              style={[
                a.font_semi_bold,
                a.text_xl,
                embeddingDisabled && t.atoms.text_contrast_low,
              ]}>
              {embeddingDisabled ? (
                <Trans>Quote posts disabled</Trans>
              ) : (
                <Trans>Quote post</Trans>
              )}
            </Text>
          </Button>
        </View>
        <Button
          label={_(msg`Cancel`)}
          onPress={onPressClose}
          size="large"
          color="secondary">
          <ButtonText>
            <Trans>Cancel</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}
QuoteButtonDialogInner = memo(QuoteButtonDialogInner)
export {QuoteButtonDialogInner}
