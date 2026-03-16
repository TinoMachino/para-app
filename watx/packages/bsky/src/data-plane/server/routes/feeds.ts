import { ServiceImpl } from '@connectrpc/connect'
import { keyBy } from '@atproto/common'
import { Service } from '../../../proto/bsky_connect'
import { FeedType } from '../../../proto/bsky_pb'
import { Database } from '../db'
import { TimeCidKeyset, paginate } from '../db/pagination'

export default (db: Database): Partial<ServiceImpl<typeof Service>> => ({
  async getAuthorFeed(req) {
    const { actorDid, limit, cursor, feedType } = req
    const { ref } = db.db.dynamic

    // defaults to posts, reposts, and replies
    let builder = db.db
      .selectFrom('feed_item')
      .innerJoin('post', 'post.uri', 'feed_item.postUri')
      .selectAll('feed_item')
      .where('originatorDid', '=', actorDid)

    if (feedType === FeedType.POSTS_WITH_MEDIA) {
      builder = builder
        // only your own posts
        .where('type', '=', 'post')
        // only posts with media
        .whereExists((qb) =>
          qb
            .selectFrom('post_embed_image')
            .select('post_embed_image.postUri')
            .whereRef('post_embed_image.postUri', '=', 'feed_item.postUri'),
        )
    } else if (feedType === FeedType.POSTS_WITH_VIDEO) {
      builder = builder
        // only your own posts
        .where('type', '=', 'post')
        // only posts with video
        .whereExists((qb) =>
          qb
            .selectFrom('post_embed_video')
            .select('post_embed_video.postUri')
            .whereRef('post_embed_video.postUri', '=', 'feed_item.postUri'),
        )
    } else if (feedType === FeedType.POSTS_NO_REPLIES) {
      builder = builder.where((qb) =>
        qb.where('post.replyParent', 'is', null).orWhere('type', '=', 'repost'),
      )
    } else if (feedType === FeedType.POSTS_AND_AUTHOR_THREADS) {
      builder = builder.where((qb) =>
        qb
          .where('type', '=', 'repost')
          .orWhere('post.replyParent', 'is', null)
          .orWhere('post.replyRoot', 'like', `at://${actorDid}/%`),
      )
    }

    const keyset = new TimeCidKeyset(
      ref('feed_item.sortAt'),
      ref('feed_item.cid'),
    )

    builder = paginate(builder, {
      limit,
      cursor,
      keyset,
    })

    const feedItems = await builder.execute()

    return {
      items: feedItems.map(feedItemFromRow),
      cursor: keyset.packFromResult(feedItems),
    }
  },

  async getParaAuthorFeed(req) {
    const { actorDid, limit, cursor } = req
    const { ref } = db.db.dynamic

    let builder = db.db
      .selectFrom('para_post')
      .selectAll('para_post')
      .where('creator', '=', actorDid)

    const keyset = new TimeCidKeyset(
      ref('para_post.sortAt'),
      ref('para_post.cid'),
    )

    builder = paginate(builder, {
      limit,
      cursor,
      keyset,
      tryIndex: true,
    })

    const posts = await builder.execute()

    return {
      items: posts.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        author: post.creator,
        text: post.text,
        createdAt: post.createdAt,
        replyRoot: post.replyRoot ?? undefined,
        replyParent: post.replyParent ?? undefined,
        langs: post.langs ?? [],
        tags: post.tags ?? [],
        flairs: post.flairs ?? [],
        postType: post.postType ?? undefined,
      })),
      cursor: keyset.packFromResult(posts),
    }
  },

  async getParaTimeline(req) {
    const { actorDid, limit, cursor } = req
    const { ref } = db.db.dynamic

    const keyset = new TimeCidKeyset(
      ref('para_post.sortAt'),
      ref('para_post.cid'),
    )

    let followQb = db.db
      .selectFrom('para_post')
      .innerJoin('follow', 'follow.subjectDid', 'para_post.creator')
      .where('follow.creator', '=', actorDid)
      .selectAll('para_post')

    followQb = paginate(followQb, {
      limit,
      cursor,
      keyset,
      tryIndex: true,
    })

    let selfQb = db.db
      .selectFrom('para_post')
      .where('para_post.creator', '=', actorDid)
      .selectAll('para_post')

    selfQb = paginate(selfQb, {
      limit: Math.min(limit, 10),
      cursor,
      keyset,
      tryIndex: true,
    })

    const [followRes, selfRes] = await Promise.all([
      followQb.execute(),
      selfQb.execute(),
    ])

    const seen = new Set<string>()
    const feedItems = [...followRes, ...selfRes]
      .sort((a, b) => {
        if (a.sortAt > b.sortAt) return -1
        if (a.sortAt < b.sortAt) return 1
        return a.cid > b.cid ? -1 : 1
      })
      .filter((item) => {
        if (seen.has(item.uri)) return false
        seen.add(item.uri)
        return true
      })
      .slice(0, limit)

    return {
      items: feedItems.map((post) => ({
        uri: post.uri,
        cid: post.cid,
        author: post.creator,
        text: post.text,
        createdAt: post.createdAt,
        replyRoot: post.replyRoot ?? undefined,
        replyParent: post.replyParent ?? undefined,
        langs: post.langs ?? [],
        tags: post.tags ?? [],
        flairs: post.flairs ?? [],
        postType: post.postType ?? undefined,
      })),
      cursor: keyset.packFromResult(feedItems),
    }
  },

  async getParaPosts(req) {
    const { uris } = req
    const rows = uris.length
      ? await db.db.selectFrom('para_post').where('uri', 'in', uris).selectAll().execute()
      : []
    const byUri = keyBy(rows, 'uri')

    return {
      items: uris
        .map((uri) => byUri.get(uri))
        .filter((item): item is NonNullable<typeof item> => !!item)
        .map(paraFeedItemFromRow),
    }
  },

  async getParaPostMeta(req) {
    const { postUri } = req

    const row = await db.db
      .selectFrom('para_post')
      .leftJoin('para_post_meta', 'para_post_meta.postUri', 'para_post.uri')
      .leftJoin('post_agg', 'post_agg.uri', 'para_post.uri')
      .where('para_post.uri', '=', postUri)
      .select([
        'para_post.uri as uri',
        'para_post.creator as author',
        'para_post.postType as postType',
        'para_post.tags as postTags',
        'para_post.flairs as postFlairs',
        'para_post.createdAt as postCreatedAt',
        'para_post_meta.postType as metaPostType',
        'para_post_meta.official as official',
        'para_post_meta.party as party',
        'para_post_meta.community as community',
        'para_post_meta.category as category',
        'para_post_meta.tags as metaTags',
        'para_post_meta.flairs as metaFlairs',
        'para_post_meta.voteScore as metaVoteScore',
        'para_post_meta.createdAt as metaCreatedAt',
        'post_agg.likeCount as likeCount',
      ])
      .executeTakeFirst()

    if (!row) {
      return {}
    }

    const postType = row.metaPostType ?? row.postType ?? undefined
    const voteScore = row.metaVoteScore ?? row.likeCount ?? 0

    return {
      post: {
        uri: row.uri,
        author: row.author,
        postType,
        official: row.official ?? undefined,
        party: row.party ?? undefined,
        community: row.community ?? undefined,
        category: row.category ?? undefined,
        tags: row.metaTags ?? row.postTags ?? [],
        flairs: row.metaFlairs ?? row.postFlairs ?? [],
        voteScore,
        interactionMode:
          postType === 'policy' ? 'policy_ballot' : 'reddit_votes',
        createdAt: row.metaCreatedAt ?? row.postCreatedAt,
      },
    }
  },

  async getTimeline(req) {
    const { actorDid, limit, cursor } = req
    const { ref } = db.db.dynamic

    const keyset = new TimeCidKeyset(
      ref('feed_item.sortAt'),
      ref('feed_item.cid'),
    )

    let followQb = db.db
      .selectFrom('feed_item')
      .innerJoin('follow', 'follow.subjectDid', 'feed_item.originatorDid')
      .where('follow.creator', '=', actorDid)
      .selectAll('feed_item')

    followQb = paginate(followQb, {
      limit,
      cursor,
      keyset,
      tryIndex: true,
    })

    let selfQb = db.db
      .selectFrom('feed_item')
      .where('feed_item.originatorDid', '=', actorDid)
      .selectAll('feed_item')

    selfQb = paginate(selfQb, {
      limit: Math.min(limit, 10),
      cursor,
      keyset,
      tryIndex: true,
    })

    const [followRes, selfRes] = await Promise.all([
      followQb.execute(),
      selfQb.execute(),
    ])

    const feedItems = [...followRes, ...selfRes]
      .sort((a, b) => {
        if (a.sortAt > b.sortAt) return -1
        if (a.sortAt < b.sortAt) return 1
        return a.cid > b.cid ? -1 : 1
      })
      .slice(0, limit)

    return {
      items: feedItems.map(feedItemFromRow),
      cursor: keyset.packFromResult(feedItems),
    }
  },

  async getListFeed(req) {
    const { listUri, cursor, limit } = req
    const { ref } = db.db.dynamic

    let builder = db.db
      .selectFrom('post')
      .selectAll('post')
      .innerJoin('list_item', 'list_item.subjectDid', 'post.creator')
      .where('list_item.listUri', '=', listUri)

    const keyset = new TimeCidKeyset(ref('post.sortAt'), ref('post.cid'))
    builder = paginate(builder, {
      limit,
      cursor,
      keyset,
      tryIndex: true,
    })
    const feedItems = await builder.execute()

    return {
      items: feedItems.map((item) => ({ uri: item.uri, cid: item.cid })),
      cursor: keyset.packFromResult(feedItems),
    }
  },
})

// @NOTE does not support additional fields in the protos specific to author feeds
// and timelines. at the time of writing, hydration/view implementations do not rely on them.
const feedItemFromRow = (row: { postUri: string; uri: string }) => {
  return {
    uri: row.postUri,
    repost: row.uri === row.postUri ? undefined : row.uri,
  }
}

const paraFeedItemFromRow = (post: {
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
  uri: post.uri,
  cid: post.cid,
  author: post.creator,
  text: post.text,
  createdAt: post.createdAt,
  replyRoot: post.replyRoot ?? undefined,
  replyParent: post.replyParent ?? undefined,
  langs: post.langs ?? [],
  tags: post.tags ?? [],
  flairs: post.flairs ?? [],
  postType: post.postType ?? undefined,
})
