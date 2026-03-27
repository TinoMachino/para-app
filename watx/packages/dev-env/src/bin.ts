import './env'
import path from 'node:path'
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

const envMaybe = (name: string): string | undefined => {
  const val = process.env[name]
  return val && val.length > 0 ? val : undefined
}

const expandHome = (value: string): string => {
  if (!value.startsWith('~/')) return value
  const home = process.env.HOME
  return home ? path.join(home, value.slice(2)) : value
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
  const persistentMode = envBool('DEV_ENV_PERSISTENT', false)
  // Mock setup is now idempotent — always run it so accounts are available
  const skipMockSetup = envBool('DEV_ENV_SKIP_MOCK_SETUP', false)
  const storageRoot = expandHome(
    envStr('DEV_ENV_STORAGE_ROOT', '~/.paramx-demo'),
  )
  const plcDbUrl =
    envMaybe('DEV_ENV_PLC_DB_POSTGRES_URL') ||
    (persistentMode ? process.env.DB_POSTGRES_URL : undefined)
  const plcDbSchema =
    envMaybe('DEV_ENV_PLC_DB_SCHEMA') ||
    (persistentMode ? 'plc_demo' : undefined)
  const pdsDataDirectory =
    envMaybe('DEV_ENV_PDS_DATA_DIRECTORY') ||
    (persistentMode ? path.join(storageRoot, 'pds') : undefined)
  const pdsBlobstoreDirectory =
    envMaybe('DEV_ENV_PDS_BLOBSTORE_DIRECTORY') ||
    (persistentMode ? path.join(storageRoot, 'blobstore') : undefined)
  const bskyDbSchema = envStr(
    'DEV_ENV_BSKY_DB_SCHEMA',
    persistentMode ? 'bsky_demo' : 'bsky',
  )
  const ozoneDbSchema = envStr(
    'DEV_ENV_OZONE_DB_SCHEMA',
    persistentMode ? 'ozone_demo' : 'ozone_db',
  )
  const bskyDisplayUrl = bskyPublicUrl
  const chatPublicUrl =
    envMaybe('DEV_ENV_CHAT_PUBLIC_URL') ??
    envStr('DEV_ENV_OZONE_CHAT_URL', `http://localhost:${chatPort}`)

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
      dataDirectory: pdsDataDirectory,
      blobstoreDiskLocation: pdsBlobstoreDirectory,
    },
    plc: {
      port: plcPort,
      ...(plcDbUrl ? {dbUrl: plcDbUrl, dbSchema: plcDbSchema} : {}),
    },
    bsky: {
      dbPostgresSchema: bskyDbSchema,
      port: bskyPort,
      publicUrl: bskyPublicUrl,
    },
    ozone: {
      port: ozonePort,
      dbMaterializedViewRefreshIntervalMs: 30_000,
      dbPostgresSchema: ozoneDbSchema,
    },
    chat: {
      port: chatPort,
      publicUrl: chatPublicUrl,
    },
    introspect: { port: introspectPort },
  })
  mockMailer(network.pds)
  if (!skipMockSetup) {
    await generateMockSetup(network)
  }

  if (network.introspect) {
    console.log(`🔍 Dev-env introspection server http://localhost:${introspectPort}`)
  }
  console.log(`👤 DID Placeholder server http://localhost:${plcPort}`)
  if (plcDbUrl) {
    console.log(`👤 PLC Postgres schema ${plcDbSchema}`)
  }
  console.log(`🌞 Main PDS ${pdsDisplayUrl}`)
  if (pdsDataDirectory) {
    console.log(`🌞 PDS data ${pdsDataDirectory}`)
  }
  if (pdsBlobstoreDirectory) {
    console.log(`🌞 PDS blobs ${pdsBlobstoreDirectory}`)
  }
  console.log(
    `🔨 Lexicon authority DID ${network.pds.ctx.cfg.lexicon.didAuthority}`,
  )
  console.log(`🗼 Ozone server http://localhost:${ozonePort}`)
  console.log(`🗼 Ozone service DID ${network.ozone.ctx.cfg.service.did}`)
  console.log(`💬 Chat service ${network.chat.url}`)
  if (network.chatPublicUrl !== network.chat.url) {
    console.log(`💬 Chat public URL ${network.chatPublicUrl}`)
  }
  console.log(`💬 Chat service DID ${network.chat.did}`)
  console.log(`🌅 Bsky Appview ${bskyDisplayUrl}`)
  console.log(`🌅 Bsky schema ${bskyDbSchema}`)
  console.log(`🗼 Ozone schema ${ozoneDbSchema}`)
  console.log(`🌅 Bsky Appview DID ${network.bsky.serverDid}`)
  for (const fg of network.feedGens) {
    console.log(`🤖 Feed Generator (${fg.did}) http://localhost:${fg.port}`)
  }
}

run()
