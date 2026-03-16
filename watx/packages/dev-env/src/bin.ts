import './env'
import { generateMockSetup } from './mock'
import { TestNetwork } from './network'
import { mockMailer } from './util'

const envInt = (name: string, fallback: number): number => {
  const val = process.env[name]
  if (!val) return fallback
  const parsed = Number.parseInt(val, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const envStr = (name: string, fallback: string): string => {
  const val = process.env[name]
  return val && val.length > 0 ? val : fallback
}

const envBool = (name: string, fallback: boolean): boolean => {
  const val = process.env[name]
  if (!val) return fallback
  return val === 'true'
}

const run = async () => {
  const introspectPort = envInt('DEV_ENV_INTROSPECT_PORT', 2581)
  const plcPort = envInt('DEV_ENV_PLC_PORT', 2582)
  const pdsPort = envInt('DEV_ENV_PDS_PORT', 2583)
  const bskyPort = envInt('DEV_ENV_BSKY_PORT', 2584)
  const ozonePort = envInt('DEV_ENV_OZONE_PORT', 2587)
  const chatPort = envInt('DEV_ENV_CHAT_PORT', 2590)

  const pdsHostname = envStr('DEV_ENV_PDS_HOSTNAME', 'localhost')
  const pdsDisplayUrl =
    pdsHostname === 'localhost'
      ? `http://localhost:${pdsPort}`
      : `https://${pdsHostname}`
  const bskyPublicUrl = envStr(
    'DEV_ENV_BSKY_PUBLIC_URL',
    `http://localhost:${bskyPort}`,
  )
  const enableDidDocWithSession = envBool(
    'DEV_ENV_ENABLE_DID_DOC_WITH_SESSION',
    true,
  )
  const bskyDisplayUrl = bskyPublicUrl
  const chatUrl = envStr('DEV_ENV_OZONE_CHAT_URL', `http://localhost:${chatPort}`)

  console.log(`
██████╗
██╔═══██╗
██║██╗██║
██║██║██║
╚█║████╔╝
 ╚╝╚═══╝  protocol

[ created by Bluesky ]`)

  const network = await TestNetwork.create({
    pds: {
      port: pdsPort,
      hostname: pdsHostname,
      enableDidDocWithSession,
    },
    bsky: {
      dbPostgresSchema: 'bsky',
      port: bskyPort,
      publicUrl: bskyPublicUrl,
    },
    plc: { port: plcPort },
    ozone: {
      port: ozonePort,
      chatUrl, // must run separate chat service
      chatDid: 'did:example:chat',
      dbMaterializedViewRefreshIntervalMs: 30_000,
    },
    introspect: { port: introspectPort },
  })
  mockMailer(network.pds)
  await generateMockSetup(network)

  if (network.introspect) {
    console.log(`🔍 Dev-env introspection server http://localhost:${introspectPort}`)
  }
  console.log(`👤 DID Placeholder server http://localhost:${plcPort}`)
  console.log(`🌞 Main PDS ${pdsDisplayUrl}`)
  console.log(
    `🔨 Lexicon authority DID ${network.pds.ctx.cfg.lexicon.didAuthority}`,
  )
  console.log(`🗼 Ozone server http://localhost:${ozonePort}`)
  console.log(`🗼 Ozone service DID ${network.ozone.ctx.cfg.service.did}`)
  console.log(`🌅 Bsky Appview ${bskyDisplayUrl}`)
  console.log(`🌅 Bsky Appview DID ${network.bsky.serverDid}`)
  for (const fg of network.feedGens) {
    console.log(`🤖 Feed Generator (${fg.did}) http://localhost:${fg.port}`)
  }
}

run()
