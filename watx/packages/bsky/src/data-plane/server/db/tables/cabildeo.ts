import { GeneratedAlways } from 'kysely'

export const cabildeoTableName = 'cabildeo_cabildeo'
export const positionTableName = 'cabildeo_position'
export const delegationTableName = 'cabildeo_delegation'
export const voteTableName = 'cabildeo_vote'

export interface CabildeoCabildeo {
  uri: string
  cid: string
  creator: string
  title: string
  description: string
  community: string
  communities: string[] | null
  flairs: string[] | null
  region: string | null
  geoRestricted: 0 | 1 | null
  options: unknown // JSON array of options
  minQuorum: number | null
  phase: string
  phaseDeadline: string | null
  createdAt: string
  indexedAt: string
  sortAt: GeneratedAlways<string>
}

export interface CabildeoPosition {
  uri: string
  cid: string
  creator: string
  cabildeo: string
  stance: string
  optionIndex: number | null
  text: string
  compassQuadrant: string | null
  createdAt: string
  indexedAt: string
  sortAt: GeneratedAlways<string>
}

export interface CabildeoDelegation {
  uri: string
  cid: string
  creator: string
  cabildeo: string | null
  delegateTo: string
  scopeFlairs: string[] | null
  reason: string | null
  createdAt: string
  indexedAt: string
}

export interface CabildeoVote {
  uri: string
  cid: string
  creator: string
  cabildeo: string
  selectedOption: number | null
  isDirect: 0 | 1
  delegatedFrom: string[] | null
  createdAt: string
  indexedAt: string
  sortAt: GeneratedAlways<string>
}

export type PartialDB = {
  [cabildeoTableName]: CabildeoCabildeo
  [positionTableName]: CabildeoPosition
  [delegationTableName]: CabildeoDelegation
  [voteTableName]: CabildeoVote
}
