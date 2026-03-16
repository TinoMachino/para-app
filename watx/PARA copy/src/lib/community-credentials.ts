import {type AppBskyFeedDefs} from '@atproto/api'

export type ParaStatusView = {
  status?: string
  party?: string
  community?: string
  createdAt?: string
}

export type ParaProfileStats = {
  influence?: number
  votesReceivedAllTime?: number
  votesCastAllTime?: number
  contributions?: {
    policies?: number
    matters?: number
    comments?: number
  }
  activeIn?: string[]
}

export type CommunityMemberSignal = {
  did: string
  author: AppBskyFeedDefs.PostView['author']
  postCount: number
  policyPosts: number
  matterPosts: number
  latestIndexedAt: string
  status?: ParaStatusView
  stats?: ParaProfileStats
}

export type CredentialLevel = 'governance' | 'stewardship' | 'contributor'

export type CommunityCredential = {
  id: string
  label: string
  description: string
  level: CredentialLevel
  color: string
  bgColor: string
}

const CREDENTIALS: CommunityCredential[] = [
  {
    id: 'community_representative',
    label: 'Community Representative',
    description:
      'Represents a recognized group or party while actively participating in this community.',
    level: 'governance',
    color: '#4C1D95',
    bgColor: '#EDE9FE',
  },
  {
    id: 'community_steward',
    label: 'Community Steward',
    description:
      'Sustains day-to-day civic participation and discussion continuity in this community.',
    level: 'stewardship',
    color: '#0C4A6E',
    bgColor: '#E0F2FE',
  },
  {
    id: 'policy_steward',
    label: 'Policy Steward',
    description:
      'Maintains policy-oriented contribution responsibility in community deliberation.',
    level: 'stewardship',
    color: '#14532D',
    bgColor: '#DCFCE7',
  },
  {
    id: 'matter_steward',
    label: 'Matter Steward',
    description:
      'Maintains matter/case-oriented contribution responsibility in community deliberation.',
    level: 'stewardship',
    color: '#7C2D12',
    bgColor: '#FFEDD5',
  },
  {
    id: 'trusted_contributor',
    label: 'Trusted Contributor',
    description:
      'Has sustained participation and influence, indicating reliable civic contribution.',
    level: 'contributor',
    color: '#1E3A8A',
    bgColor: '#DBEAFE',
  },
  {
    id: 'active_member',
    label: 'Active Member',
    description:
      'Currently active in community discussions and visible in ongoing participation.',
    level: 'contributor',
    color: '#374151',
    bgColor: '#F3F4F6',
  },
]

function normalizeCommunityName(value: string) {
  return value.trim().replace(/^p\//i, '').toLowerCase()
}

function belongsToCommunity(signal: CommunityMemberSignal, communityName: string) {
  const target = normalizeCommunityName(communityName)
  const statusCommunity = signal.status?.community
  if (!statusCommunity) return false
  return normalizeCommunityName(statusCommunity) === target
}

export function getCredentialCatalog() {
  return CREDENTIALS
}

export function deriveCommunityCredentials(
  signal: CommunityMemberSignal,
  communityName: string,
): CommunityCredential[] {
  const inCommunity = belongsToCommunity(signal, communityName)
  const influence = signal.stats?.influence ?? 0
  const votesCast = signal.stats?.votesCastAllTime ?? 0
  const policies = signal.stats?.contributions?.policies ?? 0
  const matters = signal.stats?.contributions?.matters ?? 0
  const hasParty = Boolean(signal.status?.party?.trim())

  const out: CommunityCredential[] = []

  if (inCommunity && hasParty) {
    out.push(CREDENTIALS[0])
  }

  if (inCommunity && (votesCast >= 25 || signal.postCount >= 8)) {
    out.push(CREDENTIALS[1])
  }

  if (policies >= 10 || signal.policyPosts >= 5) {
    out.push(CREDENTIALS[2])
  }

  if (matters >= 10 || signal.matterPosts >= 5) {
    out.push(CREDENTIALS[3])
  }

  if (influence >= 100 || signal.postCount >= 12) {
    out.push(CREDENTIALS[4])
  }

  if (signal.postCount > 0) {
    out.push(CREDENTIALS[5])
  }

  return out
}
