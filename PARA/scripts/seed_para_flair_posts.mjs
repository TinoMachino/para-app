import {AtUri, BskyAgent} from '@atproto/api'

const SERVICE = process.env.PARA_PDS_URL || 'http://localhost:2583'
const PASSWORD = process.env.PARA_TEST_PASSWORD || 'hunter2'

const ACCOUNTS = [
  {handle: 'alice.test', password: PASSWORD, party: 'Morena', community: 'Morena'},
  {handle: 'bob.test', password: PASSWORD, party: 'PAN', community: 'PAN'},
]

function withCommunityLabel(text, community) {
  return `${text} (p/${community})`
}

const POSTS = [
  {
    visibility: 'private',
    account: 'alice.test',
    text: withCommunityLabel(
      '[Seed] Official transit policy rollout for CDMX budget review.',
      'Morena',
    ),
    flairs: ['||#TransportePublico'],
    tags: ['||#TransportePublico'],
    postType: 'policy',
    official: true,
    party: 'Morena',
    community: 'Morena',
    createMeta: true,
  },
  {
    visibility: 'private',
    account: 'alice.test',
    text: withCommunityLabel(
      '[Seed] Community inflation report from neighborhood assemblies this week.',
      'Morena',
    ),
    flairs: ['|#Inflacion'],
    tags: ['|#Inflacion'],
    postType: 'matter',
    party: 'Morena',
    community: 'Morena',
    createMeta: true,
  },
  {
    visibility: 'private',
    account: 'alice.test',
    text: withCommunityLabel(
      '[Seed] Meme draft about how every transit debate ends in another committee.',
      'Morena',
    ),
    flairs: ['|#Pobreza'],
    tags: ['|#Pobreza', '#Meme'],
    postType: 'meme',
    party: 'Morena',
    community: 'Morena',
    createMeta: true,
  },
  {
    visibility: 'private',
    account: 'bob.test',
    text: withCommunityLabel(
      '[Seed] RAQ note clarifying the democracy thread before voting closes.',
      'PAN',
    ),
    flairs: ['|#Democracia'],
    tags: ['|#Democracia', '|#!RAQ'],
    postType: 'raq',
    party: 'PAN',
    community: 'PAN',
  },
  {
    visibility: 'private',
    account: 'bob.test',
    text: withCommunityLabel(
      '[Seed] Open question on whether the energy industry should be scoped as a local matter first.',
      'PAN',
    ),
    flairs: ['|#IndustriaEnergetica'],
    tags: ['|#IndustriaEnergetica', '|#?OpenQuestion'],
    postType: 'open_question',
    party: 'PAN',
    community: 'PAN',
  },
  {
    visibility: 'private',
    account: 'bob.test',
    text: withCommunityLabel(
      '[Seed] Meta post about badge rollout, moderation labels, and community posting rules.',
      'PAN',
    ),
    flairs: ['|#Tecnologia'],
    tags: ['|#Tecnologia', '#META'],
    postType: 'meta',
    party: 'PAN',
    community: 'PAN',
  },
  {
    visibility: 'private',
    account: 'alice.test',
    text: withCommunityLabel(
      '[Seed] Competition entry for the tourism messaging sprint.',
      'Morena',
    ),
    flairs: ['|#Turismo'],
    tags: ['|#Turismo', '#Competition'],
    postType: 'competition',
    party: 'Morena',
    community: 'Morena',
  },
  {
    visibility: 'private',
    account: 'alice.test',
    text: withCommunityLabel(
      '[Seed] Fake article simulation about a sudden crime-policy turnaround.',
      'Morena',
    ),
    flairs: ['|#Delincuencia'],
    tags: ['|#Delincuencia', '#FakeArticle'],
    postType: 'fake_article',
    party: 'Morena',
    community: 'Morena',
  },
  {
    visibility: 'public',
    account: 'alice.test',
    text: withCommunityLabel(
      '[Seed] Public mirror for community badge testing: official transit policy post.',
      'Morena',
    ),
    tags: ['||#TransportePublico'],
    party: 'Morena',
    community: 'Morena',
  },
  {
    visibility: 'public',
    account: 'alice.test',
    text: withCommunityLabel(
      '[Seed] Public mirror for community badge testing: inflation matter post.',
      'Morena',
    ),
    tags: ['|#Inflacion'],
    party: 'Morena',
    community: 'Morena',
  },
  {
    visibility: 'public',
    account: 'bob.test',
    text: withCommunityLabel(
      '[Seed] Public mirror for community badge testing: poverty matter post.',
      'PAN',
    ),
    tags: ['|#Pobreza'],
    party: 'PAN',
    community: 'PAN',
  },
  {
    visibility: 'public',
    account: 'bob.test',
    text: withCommunityLabel(
      '[Seed] Public mirror for community badge testing: official schools policy post.',
      'PAN',
    ),
    tags: ['||#EscuelasPublicas'],
    party: 'PAN',
    community: 'PAN',
  },
]

async function listRecords(agent, collection) {
  const records = []
  let cursor

  do {
    const res = await agent.api.com.atproto.repo.listRecords({
      repo: agent.assertDid,
      collection,
      limit: 100,
      cursor,
      reverse: true,
    })
    records.push(...res.data.records)
    cursor = res.data.cursor
  } while (cursor)

  return records
}

async function cleanupSeedRecords(agent) {
  const privatePosts = await listRecords(agent, 'com.para.post')
  const publicPosts = await listRecords(agent, 'app.bsky.feed.post')

  const deletions = []

  for (const record of [...privatePosts, ...publicPosts]) {
    const text = record.value?.text
    if (typeof text !== 'string' || !text.includes('[Seed]')) {
      continue
    }

    deletions.push({
      collection: record.uri.split('/')[3],
      rkey: new AtUri(record.uri).rkey,
    })

    if (record.uri.includes('/com.para.post/')) {
      deletions.push({
        collection: 'com.para.social.postMeta',
        rkey: new AtUri(record.uri).rkey,
      })
    }
  }

  for (const deletion of deletions) {
    try {
      await agent.api.com.atproto.repo.deleteRecord({
        repo: agent.assertDid,
        collection: deletion.collection,
        rkey: deletion.rkey,
      })
    } catch (err) {
      if (!String(err).includes('Could not locate record')) {
        throw err
      }
    }
  }
}

async function createPost(agent, post) {
  const record = {
    $type:
      post.visibility === 'private' ? 'com.para.post' : 'app.bsky.feed.post',
    text: post.text,
    createdAt: new Date().toISOString(),
    langs: ['en'],
    tags: post.tags,
    ...(post.visibility === 'private'
      ? {
          flairs: post.flairs,
          postType: post.postType,
        }
      : {}),
  }

  const res = await agent.api.com.atproto.repo.createRecord({
    repo: agent.assertDid,
    collection:
      post.visibility === 'private' ? 'com.para.post' : 'app.bsky.feed.post',
    record,
  })

  if (post.visibility === 'private' && post.createMeta && post.postType) {
    const rkey = new AtUri(res.data.uri).rkey
    await agent.api.com.atproto.repo.createRecord({
      repo: agent.assertDid,
      collection: 'com.para.social.postMeta',
      rkey,
      record: {
        $type: 'com.para.social.postMeta',
        post: res.data.uri,
        postType: post.postType,
        official: post.official || undefined,
        party: post.party,
        community: post.community,
        flairs: post.flairs,
        voteScore: 0,
        createdAt: new Date().toISOString(),
      },
    })
  }

  return res.data.uri
}

async function login(account) {
  const agent = new BskyAgent({service: SERVICE})
  await agent.login({
    identifier: account.handle,
    password: account.password,
  })
  return agent
}

async function main() {
  const agents = new Map()

  for (const account of ACCOUNTS) {
    const agent = await login(account)
    agents.set(account.handle, agent)
    await cleanupSeedRecords(agent)
    console.log(`Logged in and cleaned seed records for ${account.handle}`)
  }

  const created = []

  for (const post of POSTS) {
    const agent = agents.get(post.account)
    if (!agent) {
      throw new Error(`Missing logged-in agent for ${post.account}`)
    }

    const uri = await createPost(agent, post)
    created.push({
      account: post.account,
      party: post.party,
      visibility: post.visibility,
      uri,
      text: post.text,
    })
    console.log(
      `Created ${post.visibility} post for ${post.account} (${post.party}): ${post.text} -> ${uri}`,
    )
  }

  console.log('\nSeed complete.\n')
  for (const item of created) {
    console.log(`[${item.visibility}] ${item.party} ${item.account} ${item.uri}`)
  }
}

main().catch(err => {
  console.error('Failed to seed flair posts:', err)
  process.exit(1)
})
