import { ServiceImpl } from '@connectrpc/connect'
import { sql } from 'kysely'
import { Service } from '../../../proto/bsky_connect'
import { Database } from '../db'
import { DatabaseSchema } from '../db/database-schema'
import { getAncestorsAndSelfQb, getDescendentsQb } from '../util'

export default (db: Database): Partial<ServiceImpl<typeof Service>> => ({
  async getThread(req) {
    const { postUri, above, below } = req
    const [ancestors, descendents] = await Promise.all([
      getAncestorsAndSelfQb(db.db, {
        uri: postUri,
        parentHeight: above,
      })
        .selectFrom('ancestor')
        .selectAll()
        .execute(),
      getDescendentsQb(db.db, {
        uri: postUri,
        depth: below,
      })
        .selectFrom('descendent')
        .innerJoin('post', 'post.uri', 'descendent.uri')
        .orderBy('post.sortAt', 'desc')
        .selectAll()
        .execute(),
    ])
    const uris = [
      ...ancestors.map((p) => p.uri),
      ...descendents.map((p) => p.uri),
    ]
    return { uris }
  },

  async getParaThread(req) {
    const { postUri, above, below } = req
    const [ancestors, descendents] = await Promise.all([
      getParaAncestorsAndSelfQb(db.db, {
        uri: postUri,
        parentHeight: above,
      })
        .selectFrom('ancestor')
        .innerJoin('para_post', 'para_post.uri', 'ancestor.uri')
        .selectAll('para_post')
        .select('ancestor.height')
        .execute(),
      getParaDescendentsQb(db.db, {
        uri: postUri,
        depth: below,
      })
        .selectFrom('descendent')
        .innerJoin('para_post', 'para_post.uri', 'descendent.uri')
        .orderBy('para_post.sortAt', 'desc')
        .selectAll('para_post')
        .select('descendent.depth')
        .execute(),
    ])

    const post = ancestors.find((row) => row.height === 0)
    if (!post) {
      return {
        parents: [],
        replies: [],
      }
    }

    const parents = ancestors
      .filter((row) => row.height > 0)
      .sort((a, b) => b.height - a.height)

    return {
      post: paraPostFromRow(post),
      parents: parents.map(paraPostFromRow),
      replies: descendents.map(paraPostFromRow),
    }
  },
})

const paraPostFromRow = (row: {
  uri: string
  cid: string
  creator: string
  text: string
  createdAt: string
  replyRoot: string | null
  replyParent: string | null
  langs: string[] | null
  tags: string[] | null
  flairs: string[] | null
  postType: string | null
}) => ({
  uri: row.uri,
  cid: row.cid,
  author: row.creator,
  text: row.text,
  createdAt: row.createdAt,
  replyRoot: row.replyRoot ?? undefined,
  replyParent: row.replyParent ?? undefined,
  langs: row.langs ?? [],
  tags: row.tags ?? [],
  flairs: row.flairs ?? [],
  postType: row.postType ?? undefined,
})

const getParaDescendentsQb = (
  db: DatabaseSchema,
  opts: {
    uri: string
    depth: number
  },
) => {
  const { uri, depth } = opts
  return db.withRecursive('descendent(uri, depth)', (cte) => {
    return cte
      .selectFrom('para_post')
      .select(['para_post.uri as uri', sql<number>`1`.as('depth')])
      .where(sql`1`, '<=', depth)
      .where('replyParent', '=', uri)
      .unionAll(
        cte
          .selectFrom('para_post')
          .innerJoin('descendent', 'descendent.uri', 'para_post.replyParent')
          .where('descendent.depth', '<', depth)
          .select([
            'para_post.uri as uri',
            sql<number>`descendent.depth + 1`.as('depth'),
          ]),
      )
  })
}

const getParaAncestorsAndSelfQb = (
  db: DatabaseSchema,
  opts: {
    uri: string
    parentHeight: number
  },
) => {
  const { uri, parentHeight } = opts
  return db.withRecursive('ancestor(uri, ancestorUri, height)', (cte) => {
    return cte
      .selectFrom('para_post')
      .select([
        'para_post.uri as uri',
        'para_post.replyParent as ancestorUri',
        sql<number>`0`.as('height'),
      ])
      .where('uri', '=', uri)
      .unionAll(
        cte
          .selectFrom('para_post')
          .innerJoin('ancestor', 'ancestor.ancestorUri', 'para_post.uri')
          .where('ancestor.height', '<', parentHeight)
          .select([
            'para_post.uri as uri',
            'para_post.replyParent as ancestorUri',
            sql<number>`ancestor.height + 1`.as('height'),
          ]),
      )
  })
}
