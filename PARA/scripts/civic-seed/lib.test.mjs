import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {fileURLToPath} from 'node:url'

import {
  InMemorySeedWriter,
  applySeedOperations,
  buildActorInputs,
  buildSeedOperations,
  loadManifest,
  resetSeedOperations,
  resolveCliConfig,
  toResetOperations,
} from './lib.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const MANIFEST_PATH = path.resolve(__dirname, 'manifest.v1.json')

test('resolveCliConfig supports env defaults and cli override', () => {
  const env = {
    PARA_CIVIC_SEED_SERVICE: 'https://demo.example',
    PARA_CIVIC_SEED_MANIFEST: '/tmp/manifest.json',
    PARA_CIVIC_SEED_CREATE_ACCOUNTS: 'false',
  }

  const fromEnv = resolveCliConfig(['apply'], env)
  assert.equal(fromEnv.command, 'apply')
  assert.equal(fromEnv.service, 'https://demo.example')
  assert.equal(fromEnv.createAccounts, false)
  assert.equal(fromEnv.manifestPath, '/tmp/manifest.json')

  const fromCli = resolveCliConfig(
    ['reset', '--service', 'http://localhost:3000', '--create-accounts'],
    env,
  )
  assert.equal(fromCli.command, 'reset')
  assert.equal(fromCli.service, 'http://localhost:3000')
  assert.equal(fromCli.createAccounts, true)
})

test('apply is idempotent and reset removes only managed records', async () => {
  const manifest = await loadManifest(MANIFEST_PATH)
  const actorInputs = buildActorInputs(manifest, null)
  const actorsByAlias = {}
  for (const actor of actorInputs) {
    const slug = actor.alias.replace(/_/g, '-')
    actorsByAlias[actor.alias] = {
      did: `did:plc:${slug}`,
      handle: actor.handle,
      displayName: actor.displayName || actor.handle,
    }
  }

  const operations = buildSeedOperations({manifest, actorsByAlias})
  assert.ok(operations.length > 0)
  assert.ok(operations.some(op => op.collection === 'com.para.identity'))
  assert.ok(
    operations.some(op => op.collection === 'app.bsky.graph.verification'),
  )
  assert.ok(operations.some(op => op.collection === 'app.bsky.feed.post'))
  assert.ok(operations.some(op => op.collection === 'app.bsky.feed.like'))
  assert.ok(operations.some(op => op.collection === 'app.bsky.feed.repost'))
  assert.ok(operations.some(op => op.group === 'demo-reply-post'))
  assert.ok(operations.some(op => op.recordBuilder))
  assert.ok(operations.some(op => op.refKey))

  const writer = new InMemorySeedWriter([
    {
      key: 'did:plc:foreign/app.bsky.feed.post/foreign-rkey',
      value: {$type: 'app.bsky.feed.post', text: 'foreign'},
    },
  ])
  const foreignKey = 'did:plc:foreign/app.bsky.feed.post/foreign-rkey'

  const first = await applySeedOperations(operations, writer, {dryRun: false})
  assert.equal(first.failed, 0)
  const records = writer.dumpValues()
  assert.ok(records.some(record => record.$type === 'app.bsky.feed.like'))
  assert.ok(records.some(record => record.$type === 'app.bsky.feed.repost'))
  assert.ok(
    records.some(
      record => record.$type === 'app.bsky.feed.post' && record.reply,
    ),
  )
  const firstSize = writer.size()

  const second = await applySeedOperations(operations, writer, {dryRun: false})
  assert.equal(second.failed, 0)
  assert.equal(writer.size(), firstSize)

  const resetOps = toResetOperations(operations)
  const reset = await resetSeedOperations(resetOps, writer, {dryRun: false})
  assert.equal(reset.failed, 0)
  assert.equal(writer.hasKey(foreignKey), true)
  assert.equal(writer.size(), 1)
})

test('buildActorInputs preserves optional identity metadata', async () => {
  const manifest = await loadManifest(MANIFEST_PATH)
  const actorInputs = buildActorInputs(manifest, null)

  const official = actorInputs.find(actor => actor.alias === 'official_jalisco')
  assert.ok(official)
  assert.equal(official.identity?.isVerifiedPublicFigure, true)
  assert.equal(
    official.identity?.proofBlob,
    'manual-review://mx/jalisco/carlos-ramirez',
  )
})

test('demo_social_graph resolves reply, like, and repost refs in memory', async () => {
  const manifest = {
    seedId: 'demo-social-graph-test',
    version: '1.0.0',
    actors: [
      {
        alias: 'alpha',
        handle: 'alpha.test',
        email: 'alpha@test.com',
        password: 'hunter2',
      },
      {
        alias: 'beta',
        handle: 'beta.test',
        email: 'beta@test.com',
        password: 'hunter2',
      },
      {
        alias: 'gamma',
        handle: 'gamma.test',
        email: 'gamma@test.com',
        password: 'hunter2',
      },
    ],
    bulkScenarios: [
      {
        type: 'demo_social_graph',
        alias: 'micro-social',
        startAt: '2026-03-25T10:00:00.000Z',
        anchorActor: 'alpha',
        bridgeActors: ['beta'],
        actors: ['alpha', 'beta', 'gamma'],
        followsPerActor: 2,
        postsPerActor: 2,
        replyCount: 3,
        likesPerPost: 1,
        repostEvery: 2,
      },
    ],
  }
  const actorsByAlias = {
    alpha: {did: 'did:plc:alpha', handle: 'alpha.test', displayName: 'Alpha'},
    beta: {did: 'did:plc:beta', handle: 'beta.test', displayName: 'Beta'},
    gamma: {did: 'did:plc:gamma', handle: 'gamma.test', displayName: 'Gamma'},
  }

  const operations = buildSeedOperations({manifest, actorsByAlias})
  assert.ok(operations.some(op => op.group === 'demo-post'))
  assert.ok(operations.some(op => op.group === 'demo-reply-post'))
  assert.ok(operations.some(op => op.collection === 'app.bsky.feed.like'))
  assert.ok(operations.some(op => op.collection === 'app.bsky.feed.repost'))

  const writer = new InMemorySeedWriter()
  const applied = await applySeedOperations(operations, writer, {dryRun: false})
  assert.equal(applied.failed, 0)

  const storedRecords = writer.dumpValues()
  assert.ok(
    storedRecords.some(
      record =>
        record.$type === 'app.bsky.feed.post' &&
        record.reply?.root?.uri &&
        record.reply?.parent?.uri,
    ),
  )
  assert.ok(storedRecords.some(record => record.$type === 'app.bsky.feed.like'))
  assert.ok(
    storedRecords.some(record => record.$type === 'app.bsky.feed.repost'),
  )
})
