import { Selectable, sql } from 'kysely'
import { CID } from 'multiformats/cid'
import { AtUri, normalizeDatetimeAlways } from '@atproto/syntax'
import { BackgroundQueue } from '../../background'
import { Database } from '../../db'
import { DatabaseSchema, DatabaseSchemaType } from '../../db/database-schema'
import { RecordProcessor } from '../processor'
import { recomputeCabildeoAggregates } from './recompute-cabildeo-aggregates'

interface VoteRecord {
  cabildeo: string
  selectedOption?: number
  isDirect: boolean
  delegatedFrom?: string[]
  createdAt: string
}

type CabildeoVote = Selectable<DatabaseSchemaType['cabildeo_vote']>
type IndexedVote = {
  record: CabildeoVote
}

const lexId = 'com.para.civic.vote'

const insertFn = async (
  db: DatabaseSchema,
  uri: AtUri,
  cid: CID,
  obj: VoteRecord,
  timestamp: string,
): Promise<IndexedVote | null> => {
  const record = {
    uri: uri.toString(),
    cid: cid.toString(),
    creator: uri.host,
    cabildeo: obj.cabildeo,
    selectedOption: obj.selectedOption ?? null,
    isDirect: obj.isDirect ? (1 as const) : (0 as const),
    delegatedFrom: obj.delegatedFrom?.length
      ? sql<string[]>`${JSON.stringify(obj.delegatedFrom)}`
      : null,
    createdAt: normalizeDatetimeAlways(obj.createdAt),
    indexedAt: timestamp,
  }

  const inserted = await db
    .insertInto('cabildeo_vote')
    .values(record)
    .onConflict((oc) => oc.doNothing())
    .returningAll()
    .executeTakeFirst()

  if (!inserted) {
    return null
  }

  return { record: inserted }
}

const findDuplicate = async (): Promise<AtUri | null> => {
  return null
}

const notifsForInsert = () => {
  return []
}

const deleteFn = async (
  db: DatabaseSchema,
  uri: AtUri,
): Promise<IndexedVote | null> => {
  const deleted = await db
    .deleteFrom('cabildeo_vote')
    .where('uri', '=', uri.toString())
    .returningAll()
    .executeTakeFirst()

  return deleted ? { record: deleted } : null
}

const notifsForDelete = (
  deleted: IndexedVote,
  _replacedBy: IndexedVote | null,
) => {
  return { notifs: [], toDelete: [deleted.record.uri] }
}

const updateAggregates = async (
  db: DatabaseSchema,
  indexed: IndexedVote,
) => {
  await recomputeCabildeoAggregates(db, indexed.record.cabildeo)
}

export type PluginType = RecordProcessor<VoteRecord, IndexedVote>

export const makePlugin = (
  db: Database,
  background: BackgroundQueue,
): PluginType => {
  return new RecordProcessor(db, background, {
    lexId,
    insertFn,
    findDuplicate,
    deleteFn,
    notifsForInsert,
    notifsForDelete,
    updateAggregates,
  })
}

export default makePlugin
