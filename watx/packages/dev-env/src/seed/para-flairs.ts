import { SeedClient } from './client'

export default async (sc: SeedClient) => {
  const createdAt = () => new Date().toISOString()
  const login = async (identifier: string, password: string) => {
    const agent = sc.network.pds.getClient()
    await agent.login({ identifier, password })
    return agent
  }

  const alice = await login('alice.test', 'hunter2')
  const bob = await login('bob.test', 'hunter2')
  const carla = await login('carla.test', 'hunter2')
  const mirrorToBsky = async (agent: Awaited<ReturnType<typeof login>>, text: string) => {
    await agent.app.bsky.feed.post.create(
      { repo: agent.assertDid },
      { text, createdAt: createdAt() },
    )
  }

  await alice.com.atproto.repo.createRecord(
    {
      repo: alice.assertDid,
      collection: 'com.para.post',
      record: {
        $type: 'com.para.post',
        text: 'Housing reform thread with community context',
        createdAt: createdAt(),
        postType: 'meme',
        tags: ['housing', 'cabildo-abierto'],
        flairs: ['||#LeyDeAborto', '|#Sanidad'],
      },
    },
  )
  await mirrorToBsky(
    alice,
    '[PARA] Housing reform thread ||#LeyDeAborto |#Sanidad',
  )

  const bobPost = await bob.com.atproto.repo.createRecord(
    {
      repo: bob.assertDid,
      collection: 'com.para.post',
      record: {
        $type: 'com.para.post',
        text: 'Transit budget proposal from the neighborhood assembly',
        createdAt: createdAt(),
        postType: 'matter',
        tags: ['transit', 'budget'],
        flairs: ['||#TransportePublico', '|#SubvencionesDeViajesEnBus'],
      },
    },
  )
  await mirrorToBsky(
    bob,
    '[PARA] Transit budget proposal ||#TransportePublico |#SubvencionesDeViajesEnBus',
  )

  const bobUri = bobPost.data.uri
  const bobRkey = bobUri.split('/').pop()
  if (bobRkey) {
    await bob.com.atproto.repo.createRecord(
      {
        repo: bob.assertDid,
        collection: 'com.para.social.postMeta',
        rkey: bobRkey,
        record: {
          $type: 'com.para.social.postMeta',
          post: bobUri,
          postType: 'meme',
          party: 'PAN',
          community: 'Jalisco',
          flairs: ['||#TransportePublico', '|#SubvencionesDeViajesEnBus'],
          voteScore: 42,
          createdAt: createdAt(),
        },
      },
    )
  }

  await carla.com.atproto.repo.createRecord(
    {
      repo: carla.assertDid,
      collection: 'com.para.post',
      record: {
        $type: 'com.para.post',
        text: 'Parks committee update after the weekend vote',
        createdAt: createdAt(),
        postType: 'policy',
        tags: ['parks', 'community'],
        flairs: ['||#EscuelasPublicas', '|#Educacion'],
      },
    },
  )
  await mirrorToBsky(
    carla,
    '[PARA] Parks committee update ||#EscuelasPublicas |#Educacion',
  )

  await sc.network.processAll()
}
