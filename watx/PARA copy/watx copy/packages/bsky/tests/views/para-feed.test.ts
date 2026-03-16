import { AtpAgent } from '@atproto/api'
import { SeedClient, TestNetwork, usersSeed } from '@atproto/dev-env'
import { request } from 'undici'
import { ids } from '../../src/lexicon/lexicons'

type ParaStrongRef = {
  uri: string
  cid: string
}

type ParaPostView = {
  uri: string
  cid: string
  author: string
  text: string
  createdAt: string
  replyRoot?: string
  replyParent?: string
}

type ParaTimelineOutput = {
  cursor?: string
  feed: ParaPostView[]
}

type ParaPostsOutput = {
  posts: ParaPostView[]
}

type ParaThreadOutput = {
  post: ParaPostView
  parents: ParaPostView[]
  replies: ParaPostView[]
}

type ParaPostMetaOutput = {
  uri: string
  postType?: 'policy' | 'matter' | 'meme'
  official?: boolean
  party?: string
  community?: string
  category?: string
  tags?: string[]
  flairs?: string[]
  voteScore: number
  interactionMode: 'policy_ballot' | 'reddit_votes'
  createdAt?: string
}

type ParaProfileStatsOutput = {
  actor: string
  stats: {
    influence: number
    votesReceivedAllTime: number
    votesCastAllTime: number
    contributions: {
      policies: number
      matters: number
      comments: number
    }
    activeIn: string[]
    computedAt: string
  }
  status?: {
    status: string
    party?: string
    community?: string
    createdAt: string
  }
}

describe('para feed views', () => {
  let network: TestNetwork
  let agent: AtpAgent
  let sc: SeedClient
  let alice: string
  let bob: string
  let carol: string
  let dan: string

  beforeAll(async () => {
    network = await TestNetwork.create({
      dbPostgresSchema: 'bsky_views_para_feed',
    })
    agent = network.bsky.getClient()
    sc = network.getSeedClient()
    await usersSeed(sc)
    alice = sc.dids.alice
    bob = sc.dids.bob
    carol = sc.dids.carol
    dan = sc.dids.dan
    await network.processAll()
  })

  afterAll(async () => {
    await network.close()
  })

  it('returns self+follow timeline and excludes muted authors', async () => {
    await sc.follow(alice, bob)

    const alicePost = await createParaPost(sc, alice, 'alice timeline para post')
    const bobPost = await createParaPost(sc, bob, 'bob timeline para post')
    const carolPost = await createParaPost(sc, carol, 'carol timeline para post')
    await network.processAll()

    const beforeMute = await callPara<ParaTimelineOutput>(
      network,
      'com.para.feed.getTimeline',
      { limit: 50 },
      alice,
    )
    const beforeMuteUris = beforeMute.feed.map((item) => item.uri)

    expect(beforeMuteUris).toContain(alicePost.uri)
    expect(beforeMuteUris).toContain(bobPost.uri)
    expect(beforeMuteUris).not.toContain(carolPost.uri)

    await agent.api.app.bsky.graph.muteActor(
      { actor: bob },
      {
        encoding: 'application/json',
        headers: await network.serviceHeaders(alice, ids.AppBskyGraphMuteActor),
      },
    )
    await network.processAll()

    const afterMute = await callPara<ParaTimelineOutput>(
      network,
      'com.para.feed.getTimeline',
      { limit: 50 },
      alice,
    )
    const afterMuteUris = afterMute.feed.map((item) => item.uri)

    expect(afterMuteUris).toContain(alicePost.uri)
    expect(afterMuteUris).not.toContain(bobPost.uri)
  })

  it('dedupes requested uris and excludes muted authors in getPosts', async () => {
    const bobPost = await createParaPost(sc, bob, 'bob dedupe para post')
    const alicePost = await createParaPost(sc, alice, 'alice dedupe para post')
    await network.processAll()

    const beforeMute = await callPara<ParaPostsOutput>(
      network,
      'com.para.feed.getPosts',
      {
        uris: [bobPost.uri, bobPost.uri, alicePost.uri],
      },
      carol,
    )

    expect(beforeMute.posts.map((item) => item.uri)).toEqual([
      bobPost.uri,
      alicePost.uri,
    ])

    await agent.api.app.bsky.graph.muteActor(
      { actor: bob },
      {
        encoding: 'application/json',
        headers: await network.serviceHeaders(carol, ids.AppBskyGraphMuteActor),
      },
    )
    await network.processAll()

    const afterMute = await callPara<ParaPostsOutput>(
      network,
      'com.para.feed.getPosts',
      {
        uris: [bobPost.uri, alicePost.uri],
      },
      carol,
    )

    expect(afterMute.posts.map((item) => item.uri)).toEqual([alicePost.uri])
  })

  it('excludes malformed descendants from para thread output', async () => {
    const rootA = await createParaPost(sc, alice, 'para root A')
    const rootB = await createParaPost(sc, alice, 'para root B')
    const reply1 = await createParaPost(sc, bob, 'para reply 1', {
      reply: {
        root: rootA,
        parent: rootA,
      },
    })
    const badReply = await createParaPost(sc, carol, 'para bad reply', {
      reply: {
        root: rootB,
        parent: reply1,
      },
    })
    const goodReply = await createParaPost(sc, dan, 'para good reply', {
      reply: {
        root: rootA,
        parent: reply1,
      },
    })
    await network.processAll()

    const thread = await callPara<ParaThreadOutput>(
      network,
      'com.para.feed.getPostThread',
      { uri: reply1.uri, depth: 10, parentHeight: 10 },
      dan,
    )

    expect(thread.post.uri).toEqual(reply1.uri)
    expect(thread.parents.map((item) => item.uri)).toEqual([rootA.uri])
    expect(thread.replies.map((item) => item.uri)).toContain(goodReply.uri)
    expect(thread.replies.map((item) => item.uri)).not.toContain(badReply.uri)
  })

  it('returns para post meta with fallback and explicit metadata override', async () => {
    const post = await createParaPost(sc, alice, 'para post with metadata', {
      postType: 'policy',
      tags: ['fallback-tag'],
      flairs: ['fallback-flair'],
    })
    await likeParaRecord(sc, bob, post)
    await network.processAll()

    const fallback = await callPara<ParaPostMetaOutput>(
      network,
      'com.para.social.getPostMeta',
      { post: post.uri },
      alice,
    )
    expect(fallback.uri).toEqual(post.uri)
    expect(fallback.postType).toEqual('policy')
    expect(fallback.interactionMode).toEqual('policy_ballot')
    expect(fallback.voteScore).toBeGreaterThanOrEqual(1)
    expect(fallback.tags).toEqual(['fallback-tag'])
    expect(fallback.flairs).toEqual(['fallback-flair'])

    await createParaPostMeta(sc, alice, post.uri, {
      postType: 'matter',
      official: true,
      party: 'Independent',
      community: 'mx-politics',
      category: 'governance',
      tags: ['meta-tag'],
      flairs: ['meta-flair'],
      voteScore: 42,
    })
    await network.processAll()

    const explicit = await callPara<ParaPostMetaOutput>(
      network,
      'com.para.social.getPostMeta',
      { post: post.uri },
      alice,
    )
    expect(explicit.postType).toEqual('matter')
    expect(explicit.interactionMode).toEqual('reddit_votes')
    expect(explicit.voteScore).toEqual(42)
    expect(explicit.official).toEqual(true)
    expect(explicit.party).toEqual('Independent')
    expect(explicit.community).toEqual('mx-politics')
    expect(explicit.category).toEqual('governance')
    expect(explicit.tags).toEqual(['meta-tag'])
    expect(explicit.flairs).toEqual(['meta-flair'])
  })

  it('returns not found for unknown para post metadata', async () => {
    const res = await callParaRaw(
      network,
      'com.para.social.getPostMeta',
      { post: 'at://did:example:fake/com.para.post/self' },
      alice,
    )
    expect(res.status).toBe(400)
    expect((res.body as { error?: string }).error).toBe('NotFound')
  })

  it('recomputes para profile stats from para indexing signals', async () => {
    const beforeAliceStats = await network.bsky.db.db
      .selectFrom('para_profile_stats')
      .where('did', '=', alice)
      .selectAll()
      .executeTakeFirst()
    const beforeBobStats = await network.bsky.db.db
      .selectFrom('para_profile_stats')
      .where('did', '=', bob)
      .selectAll()
      .executeTakeFirst()

    const post = await createParaPost(sc, alice, 'stats post', {
      postType: 'policy',
    })
    await network.processAll()

    await createParaPostMeta(sc, alice, post.uri, {
      postType: 'policy',
      voteScore: 7,
      community: 'mx-federal',
    })
    await likeParaRecord(sc, bob, post)
    await network.processAll()

    const aliceStats = await network.bsky.db.db
      .selectFrom('para_profile_stats')
      .where('did', '=', alice)
      .selectAll()
      .executeTakeFirst()
    const bobStats = await network.bsky.db.db
      .selectFrom('para_profile_stats')
      .where('did', '=', bob)
      .selectAll()
      .executeTakeFirst()

    expect(aliceStats).toBeDefined()
    expect(aliceStats?.influence).toEqual(aliceStats?.votesReceivedAllTime)
    expect(aliceStats?.votesReceivedAllTime).toBeGreaterThanOrEqual(
      (beforeAliceStats?.votesReceivedAllTime ?? 0) + 7,
    )
    expect(aliceStats?.policies).toBeGreaterThanOrEqual(1)
    expect(aliceStats?.activeIn).toContain('mx-federal')

    expect(bobStats).toBeDefined()
    expect(bobStats?.votesCastAllTime).toBeGreaterThanOrEqual(
      (beforeBobStats?.votesCastAllTime ?? 0) + 1,
    )
  })

  it('returns para profile stats and status view for an actor', async () => {
    await createParaStatus(sc, alice, {
      status: 'Building cross-party policy drafts',
      party: 'Independent',
      community: 'mx-federal',
    })
    const post = await createParaPost(sc, alice, 'profile stats endpoint post', {
      postType: 'policy',
    })
    await createParaPostMeta(sc, alice, post.uri, {
      postType: 'policy',
      voteScore: 11,
      community: 'mx-federal',
    })
    await likeParaRecord(sc, bob, post)
    await network.processAll()

    const profile = await callPara<ParaProfileStatsOutput>(
      network,
      'com.para.actor.getProfileStats',
      { actor: alice },
      bob,
    )

    expect(profile.actor).toEqual(alice)
    expect(profile.stats.votesReceivedAllTime).toBeGreaterThanOrEqual(11)
    expect(profile.stats.votesCastAllTime).toBeGreaterThanOrEqual(0)
    expect(profile.stats.influence).toEqual(profile.stats.votesReceivedAllTime)
    expect(profile.stats.contributions.policies).toBeGreaterThanOrEqual(1)
    expect(profile.stats.activeIn).toContain('mx-federal')
    expect(profile.status).toBeDefined()
    expect(profile.status?.status).toEqual('Building cross-party policy drafts')
    expect(profile.status?.party).toEqual('Independent')
    expect(profile.status?.community).toEqual('mx-federal')
  })

  it('returns not found for unknown actor profile stats', async () => {
    const res = await callParaRaw(
      network,
      'com.para.actor.getProfileStats',
      { actor: 'did:example:missing' },
      alice,
    )
    expect(res.status).toBe(400)
    expect((res.body as { error?: string }).error).toBe('NotFound')
  })
})

const createParaPost = async (
  sc: SeedClient,
  by: string,
  text: string,
  opts?: {
    reply?: {
      root: ParaStrongRef
      parent: ParaStrongRef
    }
    postType?: 'policy' | 'matter' | 'meme'
    tags?: string[]
    flairs?: string[]
  },
): Promise<ParaStrongRef> => {
  const { data } = await sc.agent.com.atproto.repo.createRecord(
    {
      repo: by,
      collection: 'com.para.post',
      record: {
        $type: 'com.para.post',
        text,
        createdAt: new Date().toISOString(),
        reply: opts?.reply,
        postType: opts?.postType,
        tags: opts?.tags,
        flairs: opts?.flairs,
      },
    },
    {
      encoding: 'application/json',
      headers: sc.getHeaders(by),
    },
  )

  return {
    uri: data.uri,
    cid: data.cid,
  }
}

const createParaPostMeta = async (
  sc: SeedClient,
  by: string,
  post: string,
  opts: {
    postType: 'policy' | 'matter' | 'meme'
    voteScore: number
    official?: boolean
    party?: string
    community?: string
    category?: string
    tags?: string[]
    flairs?: string[]
  },
): Promise<ParaStrongRef> => {
  const { data } = await sc.agent.com.atproto.repo.createRecord(
    {
      repo: by,
      collection: 'com.para.social.postMeta',
      record: {
        $type: 'com.para.social.postMeta',
        post,
        postType: opts.postType,
        voteScore: opts.voteScore,
        official: opts.official,
        party: opts.party,
        community: opts.community,
        category: opts.category,
        tags: opts.tags,
        flairs: opts.flairs,
        createdAt: new Date().toISOString(),
      },
    },
    {
      encoding: 'application/json',
      headers: sc.getHeaders(by),
    },
  )

  return {
    uri: data.uri,
    cid: data.cid,
  }
}

const likeParaRecord = async (
  sc: SeedClient,
  by: string,
  subject: ParaStrongRef,
) => {
  await sc.agent.com.atproto.repo.createRecord(
    {
      repo: by,
      collection: 'app.bsky.feed.like',
      record: {
        $type: 'app.bsky.feed.like',
        subject,
        createdAt: new Date().toISOString(),
      },
    },
    {
      encoding: 'application/json',
      headers: sc.getHeaders(by),
    },
  )
}

const createParaStatus = async (
  sc: SeedClient,
  by: string,
  opts: {
    status: string
    party?: string
    community?: string
  },
): Promise<ParaStrongRef> => {
  const { data } = await sc.agent.com.atproto.repo.putRecord(
    {
      repo: by,
      collection: 'com.para.status',
      rkey: 'self',
      record: {
        $type: 'com.para.status',
        status: opts.status,
        party: opts.party,
        community: opts.community,
        createdAt: new Date().toISOString(),
      },
    },
    {
      encoding: 'application/json',
      headers: sc.getHeaders(by),
    },
  )

  return {
    uri: data.uri,
    cid: data.cid,
  }
}

const callPara = async <T>(
  network: TestNetwork,
  nsid: string,
  params: Record<string, string | number | string[] | undefined>,
  did?: string,
): Promise<T> => {
  const res = await callParaRaw(network, nsid, params, did)
  expect(res.status).toBe(200)
  return res.body as T
}

const callParaRaw = async (
  network: TestNetwork,
  nsid: string,
  params: Record<string, string | number | string[] | undefined>,
  did?: string,
) => {
  const url = new URL(`/xrpc/${nsid}`, network.bsky.url)
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'undefined') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item)
      }
      continue
    }
    url.searchParams.set(key, String(value))
  }

  const headers = did ? await network.serviceHeaders(did, nsid) : undefined
  const res = await request(url, { headers })
  return {
    status: res.statusCode,
    body: await res.body.json(),
  }
}
