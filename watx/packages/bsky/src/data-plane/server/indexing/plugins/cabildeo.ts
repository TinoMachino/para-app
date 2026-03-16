import { Selectable, sql } from 'kysely'
import { CID } from 'multiformats/cid'
import { AtUri, normalizeDatetimeAlways } from '@atproto/syntax'
import { BackgroundQueue } from '../../background'
import { Database } from '../../db'
import { DatabaseSchema, DatabaseSchemaType } from '../../db/database-schema'
import { RecordProcessor } from '../processor'

interface CabildeoRecord {
  title: string
  description: string
  community: string
  communities?: string[]
  flairs?: string[]
  region?: string
  geoRestricted?: boolean
  options: unknown
  minQuorum?: number
  phase: string
  phaseDeadline?: string
  createdAt: string
}

type CabildeoCabildeo = Selectable<DatabaseSchemaType['cabildeo_cabildeo']>
type IndexedCabildeo = {
  record: CabildeoCabildeo
}

const lexId = 'com.para.civic.cabildeo'

const insertFn = async (
  db: DatabaseSchema,
  uri: AtUri,
  cid: CID,
  obj: CabildeoRecord,
  timestamp: string,
): Promise<IndexedCabildeo | null> => {
  const record = {
    uri: uri.toString(),
    cid: cid.toString(),
    creator: uri.host,
    title: obj.title,
    description: obj.description,
    community: obj.community,
    communities: obj.communities?.length
      ? sql<string[]>`${JSON.stringify(obj.communities)}`
      : null,
    flairs: obj.flairs?.length
      ? sql<string[]>`${JSON.stringify(obj.flairs)}`
      : null,
    region: obj.region || null,
    geoRestricted: obj.geoRestricted ? (1 as const) : (0 as const),
    options: sql`${JSON.stringify(obj.options)}`,
    minQuorum: obj.minQuorum || null,
    phase: obj.phase,
    phaseDeadline: obj.phaseDeadline || null,
    createdAt: normalizeDatetimeAlways(obj.createdAt),
    indexedAt: timestamp,
  }

  const inserted = await db
    .insertInto('cabildeo_cabildeo')
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
): Promise<IndexedCabildeo | null> => {
  const deleted = await db
    .deleteFrom('cabildeo_cabildeo')
    .where('uri', '=', uri.toString())
    .returningAll()
    .executeTakeFirst()

  return deleted ? { record: deleted } : null
}

const notifsForDelete = (
  deleted: IndexedCabildeo,
  _replacedBy: IndexedCabildeo | null,
) => {
  return { notifs: [], toDelete: [deleted.record.uri] }
}

const updateAggregates = async () => {}

export type PluginType = RecordProcessor<CabildeoRecord, IndexedCabildeo>

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
