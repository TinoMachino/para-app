import { Timestamp } from '@bufbuild/protobuf'
import { CID } from 'multiformats/cid'
import {
  LexParseOptions,
  LexValue,
  RecordSchema,
  Schema,
  ValidateOptions,
  lexParse,
} from '@atproto/lex'
import { AtUri } from '@atproto/syntax'
import { Record as RecordEntry } from '../proto/bsky_pb'

export class HydrationMap<T> extends Map<string, T | null> implements Merges {
  merge(map: HydrationMap<T>): this {
    map.forEach((val, key) => {
      this.set(key, val)
    })
    return this
  }
}

export interface Merges {
  merge<T extends this>(map: T): this
}

type UnknownRecord = { $type: string; [x: string]: unknown }

export type RecordInfo<T extends UnknownRecord> = {
  record: T
  cid: string
  sortedAt: Date
  indexedAt: Date
  takedownRef: string | undefined
}

export const mergeMaps = <V, M extends HydrationMap<V>>(
  mapA?: M,
  mapB?: M,
): M | undefined => {
  if (!mapA) return mapB
  if (!mapB) return mapA
  return mapA.merge(mapB)
}

export const mergeNestedMaps = <V, M extends HydrationMap<HydrationMap<V>>>(
  mapA?: M,
  mapB?: M,
): M | undefined => {
  if (!mapA) return mapB
  if (!mapB) return mapA

  for (const [key, map] of mapB) {
    const merged = mergeMaps(mapA.get(key) ?? undefined, map ?? undefined)
    mapA.set(key, merged ?? null)
  }

  return mapA
}

export const mergeManyMaps = <T>(...maps: HydrationMap<T>[]) => {
  return maps.reduce(mergeMaps, undefined as HydrationMap<T> | undefined)
}

export type ItemRef = { uri: string; cid?: string }

export const parseRecord = <T extends UnknownRecord>(
  recordSchema: RecordSchema,
  entry: RecordEntry,
  includeTakedowns: boolean,
): RecordInfo<T> | undefined => {
  if (!includeTakedowns && entry.takenDown) {
    return undefined
  }
  const record = parseJsonBytes<T>(recordSchema, entry.record)
  const cid = entry.cid
  const sortedAt = parseDate(entry.sortedAt) ?? new Date(0)
  const indexedAt = parseDate(entry.indexedAt) ?? new Date(0)
  if (!record || !cid) return
  return {
    record,
    cid,
    sortedAt,
    indexedAt,
    takedownRef: safeTakedownRef(entry),
  }
}

export const parseJsonBytes = <T = unknown>(
  schema: Schema<LexValue>,
  bytes: Uint8Array | undefined,
  options: LexParseOptions & ValidateOptions = { strict: false },
): T | undefined => {
  if (!bytes || bytes.byteLength === 0) return

  const jsonBuffer = Buffer.from(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  )
  const value = lexParse(jsonBuffer.toString('utf8'), options)
  return (
    schema as {
      ifMatches(input: unknown, options?: ValidateOptions): unknown
    }
  ).ifMatches(value, options) as T | undefined
}

export const parseString = (str: string | undefined): string | undefined => {
  return str && str.length > 0 ? str : undefined
}

export const parseCid = (cidStr: string | undefined): CID | undefined => {
  if (!cidStr || cidStr.length === 0) return
  try {
    return CID.parse(cidStr)
  } catch {
    return
  }
}

export const parseDate = (
  timestamp: Timestamp | undefined,
): Date | undefined => {
  if (!timestamp) return undefined
  const date = timestamp.toDate()
  // Go zero-value time.Time comes through as year 0001; treat it as absent.
  if (date.getTime() === -62135596800000) return undefined
  return date
}

export const urisByCollection = (uris: string[]): Map<string, string[]> => {
  const result = new Map<string, string[]>()
  for (const uri of uris) {
    const collection = new AtUri(uri).collection
    const items = result.get(collection) ?? []
    items.push(uri)
    result.set(collection, items)
  }
  return result
}

export const split = <T>(
  items: T[],
  predicate: (item: T) => boolean,
): [T[], T[]] => {
  const yes: T[] = []
  const no: T[] = []
  for (const item of items) {
    if (predicate(item)) {
      yes.push(item)
    } else {
      no.push(item)
    }
  }
  return [yes, no]
}

export const safeTakedownRef = (obj?: {
  takenDown: boolean
  takedownRef: string
}): string | undefined => {
  if (!obj) return
  if (obj.takedownRef) return obj.takedownRef
  if (obj.takenDown) return 'BSKY-TAKEDOWN-UNKNOWN'
}

export const isActivitySubscriptionEnabled = ({
  post,
  reply,
}: {
  post: boolean
  reply: boolean
}): boolean => post || reply
