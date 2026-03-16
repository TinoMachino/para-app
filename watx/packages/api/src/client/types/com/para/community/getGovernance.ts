/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util'
import type * as ComParaCommunityDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.para.community.getGovernance'

export type QueryParams = {
  /** Community identifier or label (for example: mx-federal or p/mx-federal). */
  community: string
  /** Maximum number of candidate members considered for role assignment. */
  limit?: number
}
export type InputSchema = undefined

export interface OutputSchema {
  community: string
  summary: ComParaCommunityDefs.Summary
  moderators: ComParaCommunityDefs.Moderator[]
  officials: ComParaCommunityDefs.Official[]
  deputies: ComParaCommunityDefs.DeputyRole[]
  computedAt: string
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
