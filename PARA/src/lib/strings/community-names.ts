export type CommunityNameParts = {
  displayName: string
  plainName: string
  slug: string
  searchName: string
}

function stripCommunityPrefix(value: string) {
  return value.trim().replace(/^p\s*\/\s*/i, '')
}

export function normalizeCommunityPlainName(value: string | null | undefined) {
  const stripped = stripCommunityPrefix(value || '')
  return stripped.replace(/\s+/g, ' ').trim()
}

export function normalizeCommunitySearchName(value: string | null | undefined) {
  const plainName = normalizeCommunityPlainName(value)
  return plainName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
}

export function normalizeCommunitySlug(value: string | null | undefined) {
  const plainName = normalizeCommunityPlainName(value)
  return plainName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatCommunityName(
  value: string | null | undefined,
): CommunityNameParts {
  const plainName = normalizeCommunityPlainName(value) || 'Community'

  return {
    displayName: `p/${plainName}`,
    plainName,
    slug: normalizeCommunitySlug(plainName),
    searchName: normalizeCommunitySearchName(plainName),
  }
}

export function buildCommunitySearchQuery(
  communityName: string,
  governanceCommunity?: string,
) {
  const source = governanceCommunity?.trim()
    ? governanceCommunity
    : communityName
  const formatted = formatCommunityName(source)
  return formatted.searchName || formatted.plainName
}
