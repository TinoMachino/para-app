import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import * as VideoThumbnails from 'expo-video-thumbnails'
import {msg} from '@lingui/core/macro'
import {Trans} from '@lingui/react/macro'
import { useLingui } from '@lingui/react'

import {
  FALLBACK_ANDROID,
  FALLBACK_IOS,
  FALLBACK_WEB,
} from '#/lib/deviceName'
import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name'
import { sanitizeHandle } from '#/lib/strings/handles'
import { useCurrentAccountProfile } from '#/state/queries/useCurrentAccountProfile'
import { logger } from '#/view/com/composer/drafts/state/logger'
import { TimeElapsed } from '#/view/com/util/TimeElapsed'
import { UserAvatar } from '#/view/com/util/UserAvatar'
import { atoms as a, useTheme } from '#/alf'
import { Button, ButtonIcon } from '#/components/Button'
import { DotGrid_Stroke2_Corner0_Rounded as DotsIcon } from '#/components/icons/DotGrid'
import { Reply as ReplyIcon } from '#/components/icons/Reply'
import * as MediaPreview from '#/components/MediaPreview'
import * as Prompt from '#/components/Prompt'
import { RichText } from '#/components/RichText'
import { Text } from '#/components/Typography'
import { IS_WEB } from '#/env'
import { type DraftPostDisplay, type DraftSummary } from './state/schema'
import * as storage from './state/storage'

export function DraftItem({
  draft,
  onSelect,
  onDelete,
}: {
  draft: DraftSummary
  onSelect: (draft: DraftSummary) => void
  onDelete: (draft: DraftSummary) => void
}) {
  const { _ } = useLingui()
  const t = useTheme()
  const discardPromptControl = Prompt.usePromptControl()

  const handleDelete = useCallback(() => {
    onDelete(draft)
  }, [onDelete, draft])

  const isUnknownDevice = useMemo(() => {
    const raw = draft.draft.deviceName
    switch (raw) {
      case FALLBACK_IOS:
      case FALLBACK_ANDROID:
      case FALLBACK_WEB:
        return true
      default:
        return false
    }
  }, [draft])

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={_(msg`Open draft`)}
        accessibilityHint={_(msg`Opens this draft in the composer`)}
        onPress={() => onSelect(draft)}
        style={({ pressed, hovered }) => [
          a.rounded_md,
          a.overflow_hidden,
          a.border,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          t.atoms.shadow_sm,
          (pressed || hovered) && t.atoms.bg_contrast_25,
        ]}>
        <View style={[a.p_md, a.gap_sm]}>
          <View style={[a.flex_row, a.justify_between, a.align_center]}>
            <View style={[a.flex_row, a.gap_xs, a.align_center, a.flex_1]}>
              {draft.meta.isOriginatingDevice === false && (
                <View
                  style={[
                    a.rounded_xs,
                    a.px_xs,
                    a.py_2xs,
                    t.atoms.bg_contrast_25,
                  ]}>
                  <Text style={[a.text_xs, a.font_bold]}>
                    {isUnknownDevice ? (
                      <Trans>From another device</Trans>
                    ) : (
                      <Trans>From {draft.draft.deviceName}</Trans>
                    )}
                  </Text>
                </View>
              )}
              {draft.hasMissingMedia && (
                <View
                  style={[
                    a.rounded_xs,
                    a.px_xs,
                    a.py_2xs,
                    t.atoms.bg_contrast_25,
                  ]}>
                  <Text style={[a.text_xs, a.font_bold]}>
                    <Trans>Missing media</Trans>
                  </Text>
                </View>
              )}
            </View>

            <Button
              label={_(msg`More options`)}
              variant="ghost"
              color="secondary"
              shape="round"
              size="tiny"
              onPress={e => {
                e.stopPropagation()
                discardPromptControl.open()
              }}>
              <ButtonIcon icon={DotsIcon} />
            </Button>
          </View>

          {draft.posts.map((post, index) => (
            <DraftPostRow
              key={post.id}
              post={post}
              isFirst={index === 0}
              isLast={index === draft.posts.length - 1}
              timestamp={draft.updatedAt}
            />
          ))}

          <DraftMeta draft={draft} />
        </View>
      </Pressable>

      <Prompt.Basic
        control={discardPromptControl}
        title={_(msg`Discard draft ? `)}
        description={_(msg`This draft will be permanently deleted.`)}
        onConfirm={handleDelete}
        confirmButtonCta={_(msg`Discard`)}
        confirmButtonColor="negative"
      />
    </>
  )
}

function DraftMeta({ draft }: { draft: DraftSummary }) {
  const t = useTheme()
  const { meta } = draft

  if (
    meta.threadSize === 1 &&
    meta.images === 0 &&
    !meta.video &&
    !meta.gif &&
    !meta.quote
  ) {
    return null
  }

  const parts = []

  if (meta.threadSize > 1) {
    parts.push(
      <Trans key="thread">
        <Text style={[a.font_bold]}>{meta.threadSize}</Text> posts
      </Trans>,
    )
  }
  if (meta.images > 0) {
    parts.push(
      <Trans key="images">
        <Text style={[a.font_bold]}>{meta.images}</Text> images
      </Trans>,
    )
  }
  if (meta.video) {
    parts.push(<Trans key="video">Video</Trans>)
  }
  if (meta.gif) {
    parts.push(<Trans key="gif">GIF</Trans>)
  }
  if (meta.quote) {
    parts.push(<Trans key="quote">Quote</Trans>)
  }

  return (
    <View style={[a.flex_row, a.gap_sm, a.align_center, a.flex_wrap]}>
      {parts.map((p, i) => (
        <View key={i} style={[a.flex_row, a.gap_sm, a.align_center]}>
          <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>{p}</Text>
          {i < parts.length - 1 && (
            <View
              style={[
                {
                  width: 3,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: t.palette.contrast_200,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  )
}

function DraftPostRow({
  post,
  isFirst,
  isLast,
  timestamp,
}: {
  post: DraftPostDisplay
  isFirst: boolean
  isLast: boolean
  timestamp: string
}) {
  const profile = useCurrentAccountProfile()
  const t = useTheme()

  return (
    <View style={[a.flex_row, a.gap_md]}>
      <View style={[a.align_center]}>
        <UserAvatar type="user" size={36} avatar={profile?.avatar} />
        {!isLast && (
          <View
            style={[
              a.flex_1,
              a.mt_xs,
              {
                width: 2,
                backgroundColor: t.palette.contrast_100,
                minHeight: 8,
              },
            ]}
          />
        )}
      </View>

      <View style={[a.flex_1, a.pb_sm]}>
        {isFirst && (
          <View style={[a.flex_row, a.align_center, a.gap_xs, a.mb_2xs]}>
            {profile && (
              <>
                <Text
                  style={[
                    a.text_md,
                    a.font_semi_bold,
                    t.atoms.text,
                    a.leading_snug,
                  ]}
                  numberOfLines={1}>
                  {createSanitizedDisplayName(profile)}
                </Text>
                <Text
                  style={[
                    a.text_md,
                    t.atoms.text_contrast_medium,
                    a.leading_snug,
                  ]}
                  numberOfLines={1}>
                  {sanitizeHandle(profile.handle)}
                </Text>
                <Text
                  style={[
                    a.text_md,
                    t.atoms.text_contrast_medium,
                    a.leading_snug,
                  ]}>
                  &middot;
                </Text>
              </>
            )}
            <TimeElapsed timestamp={timestamp}>
              {({ timeElapsed }) => (
                <Text
                  style={[
                    a.text_md,
                    t.atoms.text_contrast_medium,
                    a.leading_snug,
                  ]}
                  numberOfLines={1}>
                  {timeElapsed}
                </Text>
              )}
            </TimeElapsed>
          </View>
        )}

        {post.replyTo && (
          <View style={[a.flex_row, a.align_center, a.gap_xs, a.mb_xs]}>
            <ReplyIcon size="xs" fill={t.palette.contrast_500} />
            <Text
              style={[
                a.text_sm,
                t.atoms.text_contrast_medium,
                a.leading_snug,
              ]}
              numberOfLines={1}>
              Replying to{' '}
              <Text style={[a.font_medium, t.atoms.text]}>
                {post.replyTo.displayName || post.replyTo.handle}
              </Text>
            </Text>
          </View>
        )}

        {post.text.trim().length > 0 ? (
          <RichText
            style={[a.text_md, a.leading_snug, t.atoms.text]}
            value={post.richtext}
            numberOfLines={10}
            disableLinks
            disableMentionFacetValidation
          />
        ) : (
          <Text
            style={[
              a.text_md,
              a.leading_snug,
              t.atoms.text_contrast_medium,
              a.italic,
            ]}>
            <Trans>(No text)</Trans>
          </Text>
        )}

        <DraftMediaPreview post={post} />
      </View>
    </View>
  )
}

type LoadedImage = {
  url: string
  alt: string
}

function DraftMediaPreview({ post }: { post: DraftPostDisplay }) {
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([])
  const [videoThumbnail, setVideoThumbnail] = useState<string | undefined>()

  useEffect(() => {
    async function loadMedia() {
      if (post.images && post.images.length > 0) {
        const loaded: LoadedImage[] = []
        for (const image of post.images) {
          try {
            const url = await storage.loadMediaFromLocal(image.localPath)
            loaded.push({ url, alt: image.altText || '' })
          } catch (e) {
            // Image doesn't exist locally, skip it
          }
        }
        setLoadedImages(loaded)
      }

      if (post.video?.exists && post.video.localPath) {
        try {
          const url = await storage.loadMediaFromLocal(post.video.localPath)
          if (IS_WEB) {
            // can't generate thumbnails on web
            setVideoThumbnail("yep, there's a video")
          } else {
            logger.debug('generating thumbnail of ', { url })
            const thumbnail = await VideoThumbnails.getThumbnailAsync(url, {
              time: 0,
              quality: 0.2,
            })
            logger.debug('thumbnail generated', { thumbnail })
            setVideoThumbnail(thumbnail.uri)
          }
        } catch (e) {
          // Video doesn't exist locally
        }
      }
    }

    void loadMedia()
  }, [post.images, post.video])

  // Nothing to show
  if (loadedImages.length === 0 && !post.gif && !post.video) {
    return null
  }

  return (
    <MediaPreview.Outer style={[a.pt_xs]}>
      {loadedImages.map((image, i) => (
        <MediaPreview.ImageItem key={i} thumbnail={image.url} alt={image.alt} />
      ))}
      {post.gif && (
        <MediaPreview.GifItem thumbnail={post.gif.url} alt={post.gif.alt} />
      )}
      {post.video && videoThumbnail && (
        <MediaPreview.VideoItem
          thumbnail={IS_WEB ? undefined : videoThumbnail}
          alt={post.video.altText}
        />
      )}
    </MediaPreview.Outer>
  )
}
