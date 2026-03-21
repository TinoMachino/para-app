import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'

export function formatUserDisplayName({
  displayName,
  handle,
  isFigure,
  moderation,
}: {
  displayName?: string | null
  handle: string
  isFigure: boolean
  moderation?: Parameters<typeof sanitizeDisplayName>[1]
}) {
  const baseName = sanitizeDisplayName(
    displayName || sanitizeHandle(handle),
    moderation,
  )
  const prefix = isFigure ? 'f/' : 'i/'
  return `${prefix}${baseName}`
}
