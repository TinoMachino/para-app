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
const id = 'com.para.civic.defs'

export interface CabildeoOption {
  $type?: 'com.para.civic.defs#cabildeoOption'
  label: string
  description?: string
  isConsensus?: boolean
}

const hashCabildeoOption = 'cabildeoOption'

export function isCabildeoOption<V>(v: V) {
  return is$typed(v, id, hashCabildeoOption)
}

export function validateCabildeoOption<V>(v: V) {
  return validate<CabildeoOption & V>(v, id, hashCabildeoOption)
}

export interface OptionSummary {
  $type?: 'com.para.civic.defs#optionSummary'
  optionIndex: number
  label: string
  votes: number
  positions: number
}

const hashOptionSummary = 'optionSummary'

export function isOptionSummary<V>(v: V) {
  return is$typed(v, id, hashOptionSummary)
}

export function validateOptionSummary<V>(v: V) {
  return validate<OptionSummary & V>(v, id, hashOptionSummary)
}

export interface PositionCounts {
  $type?: 'com.para.civic.defs#positionCounts'
  total: number
  for: number
  against: number
  amendment: number
  byOption: OptionSummary[]
}

const hashPositionCounts = 'positionCounts'

export function isPositionCounts<V>(v: V) {
  return is$typed(v, id, hashPositionCounts)
}

export function validatePositionCounts<V>(v: V) {
  return validate<PositionCounts & V>(v, id, hashPositionCounts)
}

export interface VoteTotals {
  $type?: 'com.para.civic.defs#voteTotals'
  total: number
  direct: number
  delegated: number
}

const hashVoteTotals = 'voteTotals'

export function isVoteTotals<V>(v: V) {
  return is$typed(v, id, hashVoteTotals)
}

export function validateVoteTotals<V>(v: V) {
  return validate<VoteTotals & V>(v, id, hashVoteTotals)
}

export interface OutcomeSummary {
  $type?: 'com.para.civic.defs#outcomeSummary'
  winningOption?: number
  totalParticipants: number
  effectiveTotalPower: number
  tie: boolean
  breakdown: OptionSummary[]
}

const hashOutcomeSummary = 'outcomeSummary'

export function isOutcomeSummary<V>(v: V) {
  return is$typed(v, id, hashOutcomeSummary)
}

export function validateOutcomeSummary<V>(v: V) {
  return validate<OutcomeSummary & V>(v, id, hashOutcomeSummary)
}

export interface ViewerContext {
  $type?: 'com.para.civic.defs#viewerContext'
  currentVoteOption?: number
  currentVoteIsDirect?: boolean
  activeDelegation?: string
  delegateHasVoted?: boolean
  delegatedVoteOption?: number
  delegatedVotedAt?: string
  gracePeriodEndsAt?: string
  delegateVoteDismissed?: boolean
}

const hashViewerContext = 'viewerContext'

export function isViewerContext<V>(v: V) {
  return is$typed(v, id, hashViewerContext)
}

export function validateViewerContext<V>(v: V) {
  return validate<ViewerContext & V>(v, id, hashViewerContext)
}

export interface CabildeoView {
  $type?: 'com.para.civic.defs#cabildeoView'
  uri: string
  cid: CID
  creator: string
  indexedAt: string
  title: string
  description: string
  community: string
  communities?: string[]
  flairs?: string[]
  region?: string
  geoRestricted?: boolean
  options: CabildeoOption[]
  minQuorum?: number
  phase:
    | 'draft'
    | 'open'
    | 'deliberating'
    | 'voting'
    | 'resolved'
    | (string & {})
  phaseDeadline?: string
  createdAt: string
  optionSummary: OptionSummary[]
  positionCounts: PositionCounts
  voteTotals: VoteTotals
  outcomeSummary?: OutcomeSummary
  viewerContext?: ViewerContext
}

const hashCabildeoView = 'cabildeoView'

export function isCabildeoView<V>(v: V) {
  return is$typed(v, id, hashCabildeoView)
}

export function validateCabildeoView<V>(v: V) {
  return validate<CabildeoView & V>(v, id, hashCabildeoView)
}

export interface PositionView {
  $type?: 'com.para.civic.defs#positionView'
  uri: string
  cid: CID
  creator: string
  indexedAt: string
  cabildeo: string
  stance: 'for' | 'against' | 'amendment' | (string & {})
  optionIndex?: number
  text: string
  compassQuadrant?: string
  createdAt: string
}

const hashPositionView = 'positionView'

export function isPositionView<V>(v: V) {
  return is$typed(v, id, hashPositionView)
}

export function validatePositionView<V>(v: V) {
  return validate<PositionView & V>(v, id, hashPositionView)
}
