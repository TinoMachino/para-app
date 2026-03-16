import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {useRequireAuth} from '#/state/session'
import {useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import {useTheme} from '#/alf'
import {Pencil_Stroke2_Corner0_Rounded as PencilIcon} from '#/components/icons/Pencil'
import {CloseQuote_Stroke2_Corner1_Rounded as QuoteIcon} from '#/components/icons/Quote'
import * as Menu from '#/components/Menu'
import {
  PostControlButton,
  PostControlButtonIcon,
  PostControlButtonText,
} from './PostControlButton'
import {useFormatPostStatCount} from './util'

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

export const QuoteButton = ({
  isReposted,
  repostCount,
  onQuote,
  onHighlight,
  onRemoveAllHighlights,
  hasHighlights,
  big,
  embeddingDisabled,
}: Props) => {
  const t = useTheme()
  const {_} = useLingui()
  const {hasSession} = useSession()
  const requireAuth = useRequireAuth()
  const formatPostStatCount = useFormatPostStatCount()

  return hasSession ? (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={_(msg`Highlight or quote post`)}>
          {({props}) => {
            return (
              <PostControlButton
                testID="highlightBtn"
                active={isReposted}
                activeColor={t.palette.positive_500}
                label={props.accessibilityLabel}
                big={big}
                {...props}>
                <PostControlButtonIcon icon={QuoteIcon} />
                {typeof repostCount !== 'undefined' && repostCount > 0 && (
                  <PostControlButtonText testID="repostCount">
                    {formatPostStatCount(repostCount)}
                  </PostControlButtonText>
                )}
              </PostControlButton>
            )
          }}
        </Menu.Trigger>
        <Menu.Outer style={{minWidth: 170}}>
          <Menu.Item
            label={
              hasHighlights
                ? _(msg`Remove all highlights`)
                : _(msg({message: `Highlight`, context: `action`}))
            }
            testID="highlightDropdownHighlightBtn"
            onPress={hasHighlights ? onRemoveAllHighlights : onHighlight}>
            <Menu.ItemText>
              {hasHighlights
                ? _(msg`Remove highlights`)
                : _(msg({message: `Highlight`, context: `action`}))}
            </Menu.ItemText>
            <Menu.ItemIcon icon={PencilIcon} position="right" />
          </Menu.Item>
          <Menu.Item
            disabled={embeddingDisabled}
            label={
              embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)
            }
            testID="repostDropdownQuoteBtn"
            onPress={onQuote}>
            <Menu.ItemText>
              {embeddingDisabled
                ? _(msg`Quote posts disabled`)
                : _(msg`Quote post`)}
            </Menu.ItemText>
            <Menu.ItemIcon icon={QuoteIcon} position="right" />
          </Menu.Item>
        </Menu.Outer>
      </Menu.Root>
    </EventStopper>
  ) : (
    <PostControlButton
      onPress={() => requireAuth(() => {})}
      active={isReposted}
      activeColor={t.palette.positive_500}
      label={_(msg`Highlight or quote post`)}
      big={big}>
      <PostControlButtonIcon icon={QuoteIcon} />
      {typeof repostCount !== 'undefined' && repostCount > 0 && (
        <PostControlButtonText testID="highlightCount">
          {formatPostStatCount(repostCount)}
        </PostControlButtonText>
      )}
    </PostControlButton>
  )
}
