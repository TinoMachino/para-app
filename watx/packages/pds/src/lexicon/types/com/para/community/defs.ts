/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.para.community.defs'

export interface Summary {
  $type?: 'com.para.community.defs#summary'
  members: number
  visiblePosters: number
  policyPosts: number
  matterPosts: number
  badgeHolders: number
}

const hashSummary = 'summary'

export function isSummary<V>(v: V) {
  return is$typed(v, id, hashSummary)
}

export function validateSummary<V>(v: V) {
  return validate<Summary & V>(v, id, hashSummary)
}

export interface Member {
  $type?: 'com.para.community.defs#member'
  did: string
  handle?: string
  displayName?: string
  avatar?: string
  party?: string
  influence: number
  votesReceivedAllTime: number
  votesCastAllTime: number
  policyPosts: number
  matterPosts: number
}

const hashMember = 'member'

export function isMember<V>(v: V) {
  return is$typed(v, id, hashMember)
}

export function validateMember<V>(v: V) {
  return validate<Member & V>(v, id, hashMember)
}

export interface Moderator {
  $type?: 'com.para.community.defs#moderator'
  member: Member
  role: string
  badge: string
}

const hashModerator = 'moderator'

export function isModerator<V>(v: V) {
  return is$typed(v, id, hashModerator)
}

export function validateModerator<V>(v: V) {
  return validate<Moderator & V>(v, id, hashModerator)
}

export interface Official {
  $type?: 'com.para.community.defs#official'
  member: Member
  office: string
  mandate: string
}

const hashOfficial = 'official'

export function isOfficial<V>(v: V) {
  return is$typed(v, id, hashOfficial)
}

export function validateOfficial<V>(v: V) {
  return validate<Official & V>(v, id, hashOfficial)
}

export interface DeputyRole {
  $type?: 'com.para.community.defs#deputyRole'
  tier: string
  role: string
  activeHolder: Member
  votesBackingRole: number
  applicants: string[]
}

const hashDeputyRole = 'deputyRole'

export function isDeputyRole<V>(v: V) {
  return is$typed(v, id, hashDeputyRole)
}

export function validateDeputyRole<V>(v: V) {
  return validate<DeputyRole & V>(v, id, hashDeputyRole)
}
