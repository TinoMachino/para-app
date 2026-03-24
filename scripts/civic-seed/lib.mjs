import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function defaultManifestPath() {
  return path.resolve(__dirname, 'manifest.v1.json')
}

export function resolveCliConfig(argv, env = process.env) {
  const args = [...argv]
  const command = args.shift()

  if (command !== 'apply' && command !== 'reset') {
    throw new Error('First argument must be "apply" or "reset".')
  }

  const config = {
    command,
    service: env.PARA_CIVIC_SEED_SERVICE || 'http://localhost:2583',
    manifestPath: env.PARA_CIVIC_SEED_MANIFEST || defaultManifestPath(),
    credentialsPath: env.PARA_CIVIC_SEED_CREDENTIALS || null,
    createAccounts: parseBoolEnv(env.PARA_CIVIC_SEED_CREATE_ACCOUNTS, true),
    dryRun: false,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--service':
        config.service = requiredValue(args, ++i, '--service')
        break
      case '--manifest':
        config.manifestPath = requiredValue(args, ++i, '--manifest')
        break
      case '--credentials':
        config.credentialsPath = requiredValue(args, ++i, '--credentials')
        break
      case '--create-accounts':
        config.createAccounts = true
        break
      case '--no-create-accounts':
        config.createAccounts = false
        break
      case '--dry-run':
        config.dryRun = true
        break
      case '--verbose':
        config.verbose = true
        break
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  config.manifestPath = path.resolve(config.manifestPath)
  if (config.credentialsPath) {
    config.credentialsPath = path.resolve(config.credentialsPath)
  }

  return config
}

export async function loadManifest(filePath) {
  const manifest = await loadJsonFile(filePath)
  assertManifestShape(manifest)
  return manifest
}

export async function loadCredentials(filePath) {
  if (!filePath) return null
  return loadJsonFile(filePath)
}

export function buildActorInputs(manifest, credentials) {
  const overrides = credentials?.actors || {}
  const actors = manifest.actors.map((actor) => {
    const byAlias = asObject(overrides[actor.alias])
    const byHandle = asObject(overrides[actor.handle])
    const override = {...byHandle, ...byAlias}

    const identifier = override.identifier || override.handle || actor.handle
    const handle = override.handle || actor.handle
    const email = override.email || actor.email
    const password = override.password || actor.password
    const inviteCode = override.inviteCode || actor.inviteCode
    const createAccount =
      override.createAccount !== undefined
        ? Boolean(override.createAccount)
        : actor.createAccount !== undefined
          ? Boolean(actor.createAccount)
          : true

    if (!identifier) {
      throw new Error(`Actor "${actor.alias}" is missing identifier/handle.`)
    }
    if (!password) {
      throw new Error(
        `Actor "${actor.alias}" is missing password (manifest or credentials override).`,
      )
    }

    return {
      alias: actor.alias,
      identifier,
      handle,
      email,
      password,
      inviteCode,
      createAccount,
      displayName: actor.displayName,
      description: actor.description,
      roles: actor.roles || [],
      identity: actor.identity || null,
    }
  })

  return actors
}

export function buildSeedOperations({manifest, actorsByAlias}) {
  const operations = []
  const cabildeoUriByAlias = buildCabildeoUriMap(manifest, actorsByAlias)

  for (const actor of manifest.actors || []) {
    if (!actor.identity) continue
    const repoActor = getActor(actorsByAlias, actor.alias, 'identity actor')
    operations.push({
      group: 'identity',
      actorAlias: actor.alias,
      did: repoActor.did,
      collection: 'com.para.identity',
      rkey: actor.identity.rkey || 'public-figure',
      record: buildIdentityRecord(actor.identity),
    })
  }

  for (const entry of manifest.verificationRecords || []) {
    const issuer = getActor(
      actorsByAlias,
      entry.issuer,
      'verification record issuer',
    )
    operations.push({
      group: 'verification',
      actorAlias: entry.issuer,
      did: issuer.did,
      collection: 'app.bsky.graph.verification',
      rkey:
        entry.rkey ||
        `seed-verify-${sanitizeRkeyComponent(entry.subject || 'subject')}`,
      record: buildVerificationRecord(entry, actorsByAlias),
    })
  }

  for (const entry of manifest.governanceRecords || []) {
    const actor = getActor(actorsByAlias, entry.actor, 'governance record actor')
    operations.push({
      group: 'governance',
      actorAlias: entry.actor,
      did: actor.did,
      collection: 'com.para.community.governance',
      rkey: entry.rkey,
      record: buildGovernanceRecord(entry, actorsByAlias),
    })
  }

  for (const entry of manifest.cabildeos || []) {
    const actor = getActor(actorsByAlias, entry.actor, 'cabildeo actor')
    operations.push({
      group: 'cabildeo',
      actorAlias: entry.actor,
      did: actor.did,
      collection: 'com.para.civic.cabildeo',
      rkey: entry.rkey,
      record: buildCabildeoRecord(entry),
    })
  }

  for (const entry of manifest.delegations || []) {
    const actor = getActor(actorsByAlias, entry.actor, 'delegation actor')
    operations.push({
      group: 'delegation',
      actorAlias: entry.actor,
      did: actor.did,
      collection: 'com.para.civic.delegation',
      rkey: entry.rkey,
      record: buildDelegationRecord(entry, actorsByAlias, cabildeoUriByAlias),
    })
  }

  for (const entry of manifest.positions || []) {
    const actor = getActor(actorsByAlias, entry.actor, 'position actor')
    operations.push({
      group: 'position',
      actorAlias: entry.actor,
      did: actor.did,
      collection: 'com.para.civic.position',
      rkey: entry.rkey,
      record: buildPositionRecord(entry, cabildeoUriByAlias),
    })
  }

  for (const entry of manifest.votes || []) {
    const actor = getActor(actorsByAlias, entry.actor, 'vote actor')
    operations.push({
      group: 'vote',
      actorAlias: entry.actor,
      did: actor.did,
      collection: 'com.para.civic.vote',
      rkey: entry.rkey,
      record: buildVoteRecord(entry, actorsByAlias, cabildeoUriByAlias),
    })
  }

  for (const entry of manifest.openQuestionPosts || []) {
    const actor = getActor(
      actorsByAlias,
      entry.actor,
      'open question post actor',
    )
    operations.push({
      group: 'open-question-post',
      actorAlias: entry.actor,
      did: actor.did,
      collection: 'app.bsky.feed.post',
      rkey: entry.rkey,
      record: buildPostRecord(entry),
    })
  }

  for (const entry of manifest.badgePosts || []) {
    const actor = getActor(actorsByAlias, entry.actor, 'badge post actor')
    operations.push({
      group: 'badge-post',
      actorAlias: entry.actor,
      did: actor.did,
      collection: 'app.bsky.feed.post',
      rkey: entry.rkey,
      record: buildPostRecord(entry),
    })
  }

  for (const scenario of manifest.bulkScenarios || []) {
    if (scenario.type !== 'high_activity_cabildeo') {
      throw new Error(`Unsupported bulk scenario type: ${scenario.type}`)
    }
    operations.push(
      ...buildHighActivityOperations({
        scenario,
        actorsByAlias,
        cabildeoUriByAlias,
      }),
    )
  }

  return operations
}

export function toResetOperations(operations) {
  return [...operations].reverse()
}

export function summarizeOperations(operations) {
  const byCollection = {}
  const byGroup = {}
  for (const op of operations) {
    byCollection[op.collection] = (byCollection[op.collection] || 0) + 1
    byGroup[op.group] = (byGroup[op.group] || 0) + 1
  }
  return {
    total: operations.length,
    byCollection,
    byGroup,
  }
}

export async function applySeedOperations(
  operations,
  writer,
  options = {},
) {
  const dryRun = Boolean(options.dryRun)
  const verbose = Boolean(options.verbose)
  const result = {
    attempted: operations.length,
    written: 0,
    failed: 0,
    byCollection: {},
  }

  for (const op of operations) {
    if (dryRun) {
      result.written += 1
      increment(result.byCollection, op.collection)
      continue
    }

    try {
      await writer.putRecord(op)
      result.written += 1
      increment(result.byCollection, op.collection)
      if (verbose) {
        console.log(`put ${op.collection}/${op.rkey} as ${op.actorAlias}`)
      }
    } catch (err) {
      result.failed += 1
      console.error(
        `Failed put ${op.collection}/${op.rkey} (${op.actorAlias}):`,
        err?.message || err,
      )
    }
  }

  return result
}

export async function resetSeedOperations(
  operations,
  writer,
  options = {},
) {
  const dryRun = Boolean(options.dryRun)
  const verbose = Boolean(options.verbose)
  const result = {
    attempted: operations.length,
    deleted: 0,
    missing: 0,
    failed: 0,
    byCollection: {},
  }

  for (const op of operations) {
    if (dryRun) {
      result.deleted += 1
      increment(result.byCollection, op.collection)
      continue
    }

    try {
      await writer.deleteRecord(op)
      result.deleted += 1
      increment(result.byCollection, op.collection)
      if (verbose) {
        console.log(`del ${op.collection}/${op.rkey} as ${op.actorAlias}`)
      }
    } catch (err) {
      if (isMissingRecordError(err)) {
        result.missing += 1
        continue
      }
      result.failed += 1
      console.error(
        `Failed delete ${op.collection}/${op.rkey} (${op.actorAlias}):`,
        err?.message || err,
      )
    }
  }

  return result
}

export class InMemorySeedWriter {
  constructor(initialEntries = []) {
    this.store = new Map()
    for (const entry of initialEntries) {
      this.store.set(entry.key, entry.value)
    }
  }

  keyFor(op) {
    return `${op.did}/${op.collection}/${op.rkey}`
  }

  async putRecord(op) {
    const key = this.keyFor(op)
    this.store.set(key, structuredClone(op.record))
  }

  async deleteRecord(op) {
    const key = this.keyFor(op)
    if (!this.store.has(key)) {
      const err = new Error('RecordNotFound')
      err.code = 'RecordNotFound'
      throw err
    }
    this.store.delete(key)
  }

  size() {
    return this.store.size
  }

  hasKey(key) {
    return this.store.has(key)
  }
}

function buildHighActivityOperations({
  scenario,
  actorsByAlias,
  cabildeoUriByAlias,
}) {
  const operations = []
  const cabildeoUri = cabildeoUriByAlias[scenario.cabildeoAlias]
  if (!cabildeoUri) {
    throw new Error(
      `Bulk scenario references unknown cabildeo alias: ${scenario.cabildeoAlias}`,
    )
  }

  if (!Array.isArray(scenario.positionActors) || !scenario.positionActors.length) {
    throw new Error('Bulk scenario must include non-empty positionActors.')
  }
  if (!Array.isArray(scenario.voteActors) || !scenario.voteActors.length) {
    throw new Error('Bulk scenario must include non-empty voteActors.')
  }

  const stanceCycle = scenario.stanceCycle || ['for', 'against', 'amendment']
  const optionCycle = scenario.optionCycle || [0, 1, 2]
  const baseDate = scenario.startAt || new Date().toISOString()
  const textPrefix = scenario.textPrefix || 'High-activity generated content.'

  for (let i = 0; i < scenario.positionCount; i++) {
    const actorAlias = scenario.positionActors[i % scenario.positionActors.length]
    const actor = getActor(actorsByAlias, actorAlias, 'bulk position actor')
    const stance = stanceCycle[i % stanceCycle.length]
    const optionIndex = optionCycle[i % optionCycle.length]
    operations.push({
      group: 'bulk-position',
      actorAlias,
      did: actor.did,
      collection: 'com.para.civic.position',
      rkey: `seed-bulk-pos-${scenario.cabildeoAlias}-${String(i).padStart(4, '0')}`,
      record: compactObject({
        $type: 'com.para.civic.position',
        cabildeo: cabildeoUri,
        stance,
        optionIndex,
        text: `${textPrefix} Position ${i + 1} (${stance}) for option ${optionIndex + 1}.`,
        compassQuadrant: BULK_QUADRANTS[i % BULK_QUADRANTS.length],
        createdAt: plusMinutes(baseDate, i),
      }),
    })
  }

  for (let i = 0; i < scenario.voteCount; i++) {
    const actorAlias = scenario.voteActors[i % scenario.voteActors.length]
    const actor = getActor(actorsByAlias, actorAlias, 'bulk vote actor')
    const selectedOption = optionCycle[i % optionCycle.length]
    const delegatedAlias =
      i % 6 === 0
        ? scenario.voteActors[(i + 1) % scenario.voteActors.length]
        : null
    const delegatedFrom = delegatedAlias ? [getActor(actorsByAlias, delegatedAlias, 'bulk delegated actor').did] : undefined

    operations.push({
      group: 'bulk-vote',
      actorAlias,
      did: actor.did,
      collection: 'com.para.civic.vote',
      rkey: `seed-bulk-vote-${scenario.cabildeoAlias}-${String(i).padStart(4, '0')}`,
      record: compactObject({
        $type: 'com.para.civic.vote',
        cabildeo: cabildeoUri,
        selectedOption,
        isDirect: !delegatedFrom,
        delegatedFrom,
        createdAt: plusMinutes(baseDate, i + scenario.positionCount),
      }),
    })
  }

  return operations
}

function buildGovernanceRecord(entry, actorsByAlias) {
  return compactObject({
    $type: 'com.para.community.governance',
    community: entry.community,
    communityId: entry.communityId,
    slug: entry.slug,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    moderators: (entry.moderators || []).map((mod) => {
      const actor = mod.actor ? getActor(actorsByAlias, mod.actor, 'governance moderator') : null
      return compactObject({
        did: actor?.did,
        handle: actor?.handle,
        displayName: mod.displayName || actor?.displayName,
        role: mod.role,
        badge: mod.badge,
        capabilities: mod.capabilities || [],
      })
    }),
    officials: (entry.officials || []).map((official) => {
      const actor = official.actor
        ? getActor(actorsByAlias, official.actor, 'governance official')
        : null
      return compactObject({
        did: actor?.did,
        handle: actor?.handle,
        displayName: official.displayName || actor?.displayName,
        office: official.office,
        mandate: official.mandate,
      })
    }),
    deputies: (entry.deputies || []).map((role) => {
      const activeHolder = role.activeHolder
        ? getActor(actorsByAlias, role.activeHolder, 'governance deputy active holder')
        : null
      return compactObject({
        key: role.key,
        tier: role.tier,
        role: role.role,
        description: role.description,
        capabilities: role.capabilities || [],
        activeHolder: activeHolder
          ? {
              did: activeHolder.did,
              handle: activeHolder.handle,
              displayName: activeHolder.displayName,
            }
          : undefined,
        activeSince: role.activeSince,
        votes: role.votes || 0,
        applicants: (role.applicants || []).map((applicant) => {
          const actor = applicant.actor
            ? getActor(actorsByAlias, applicant.actor, 'governance applicant')
            : null
          return compactObject({
            did: actor?.did,
            handle: actor?.handle,
            displayName: applicant.displayName || actor?.displayName,
            appliedAt: applicant.appliedAt,
            status: applicant.status,
            note: applicant.note,
          })
        }),
      })
    }),
    metadata: entry.metadata || undefined,
    editHistory: (entry.editHistory || []).map((edit) => {
      const actor = edit.actor ? getActor(actorsByAlias, edit.actor, 'governance edit actor') : null
      return compactObject({
        id: edit.id,
        action: edit.action,
        actorDid: actor?.did,
        actorHandle: actor?.handle,
        createdAt: edit.createdAt,
        summary: edit.summary,
      })
    }),
  })
}

function buildIdentityRecord(entry) {
  return compactObject({
    $type: 'com.para.identity',
    createdAt: entry.createdAt,
    isVerifiedPublicFigure: Boolean(entry.isVerifiedPublicFigure),
    proofBlob: entry.proofBlob,
    verifiedAt: entry.verifiedAt,
  })
}

function buildVerificationRecord(entry, actorsByAlias) {
  const subject = getActor(
    actorsByAlias,
    entry.subject,
    'verification record subject',
  )

  return compactObject({
    $type: 'app.bsky.graph.verification',
    subject: subject.did,
    handle: entry.handle || subject.handle,
    displayName: entry.displayName || subject.displayName || subject.handle,
    createdAt: entry.createdAt,
  })
}

function buildCabildeoRecord(entry) {
  return compactObject({
    $type: 'com.para.civic.cabildeo',
    title: entry.title,
    description: entry.description,
    community: entry.community,
    communities: entry.communities,
    flairs: entry.flairs,
    region: entry.region,
    geoRestricted: entry.geoRestricted,
    options: entry.options,
    minQuorum: entry.minQuorum,
    phase: entry.phase,
    phaseDeadline: entry.phaseDeadline,
    createdAt: entry.createdAt,
  })
}

function buildPositionRecord(entry, cabildeoUriByAlias) {
  return compactObject({
    $type: 'com.para.civic.position',
    cabildeo: resolveCabildeoUri(entry.cabildeoAlias, cabildeoUriByAlias),
    stance: entry.stance,
    optionIndex: entry.optionIndex,
    text: entry.text,
    compassQuadrant: entry.compassQuadrant,
    createdAt: entry.createdAt,
  })
}

function buildVoteRecord(entry, actorsByAlias, cabildeoUriByAlias) {
  return compactObject({
    $type: 'com.para.civic.vote',
    cabildeo: resolveCabildeoUri(entry.cabildeoAlias, cabildeoUriByAlias),
    selectedOption: entry.selectedOption,
    isDirect: entry.isDirect,
    delegatedFrom: (entry.delegatedFrom || []).map((aliasOrDid) =>
      resolveDid(aliasOrDid, actorsByAlias),
    ),
    createdAt: entry.createdAt,
  })
}

function buildDelegationRecord(entry, actorsByAlias, cabildeoUriByAlias) {
  return compactObject({
    $type: 'com.para.civic.delegation',
    cabildeo: entry.cabildeoAlias
      ? resolveCabildeoUri(entry.cabildeoAlias, cabildeoUriByAlias)
      : undefined,
    delegateTo: resolveDid(entry.delegateTo, actorsByAlias),
    scopeFlairs: entry.scopeFlairs,
    reason: entry.reason,
    createdAt: entry.createdAt,
  })
}

function buildPostRecord(entry) {
  return compactObject({
    $type: 'app.bsky.feed.post',
    text: entry.text,
    tags: entry.tags || [],
    langs: entry.langs || ['es'],
    createdAt: entry.createdAt,
  })
}

function buildCabildeoUriMap(manifest, actorsByAlias) {
  const map = {}
  for (const cabildeo of manifest.cabildeos || []) {
    const actor = getActor(actorsByAlias, cabildeo.actor, 'cabildeo uri actor')
    map[cabildeo.alias] = `at://${actor.did}/com.para.civic.cabildeo/${cabildeo.rkey}`
  }
  return map
}

function resolveCabildeoUri(alias, cabildeoUriByAlias) {
  const uri = cabildeoUriByAlias[alias]
  if (!uri) {
    throw new Error(`Unknown cabildeoAlias: ${alias}`)
  }
  return uri
}

function resolveDid(aliasOrDid, actorsByAlias) {
  if (!aliasOrDid) {
    throw new Error('Expected did or actor alias.')
  }
  if (aliasOrDid.startsWith('did:')) {
    return aliasOrDid
  }
  return getActor(actorsByAlias, aliasOrDid, 'did reference').did
}

function getActor(actorsByAlias, alias, context) {
  const actor = actorsByAlias[alias]
  if (!actor) {
    throw new Error(`Unknown actor alias "${alias}" in ${context}.`)
  }
  return actor
}

function increment(target, key) {
  target[key] = (target[key] || 0) + 1
}

function plusMinutes(isoDate, minutes) {
  const at = new Date(isoDate).getTime()
  return new Date(at + minutes * 60000).toISOString()
}

function compactObject(value) {
  const output = {}
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined || item === null) continue
    output[key] = item
  }
  return output
}

function sanitizeRkeyComponent(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function parseBoolEnv(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false
  return fallback
}

function requiredValue(args, index, flag) {
  const value = args[index]
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`)
  }
  return value
}

async function loadJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

function assertManifestShape(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest must be a JSON object.')
  }
  if (!Array.isArray(manifest.actors) || manifest.actors.length === 0) {
    throw new Error('Manifest must include non-empty "actors".')
  }
  if (!Array.isArray(manifest.cabildeos) || manifest.cabildeos.length === 0) {
    throw new Error('Manifest must include non-empty "cabildeos".')
  }
}

function asObject(value) {
  return value && typeof value === 'object' ? value : {}
}

function isMissingRecordError(err) {
  const msg = String(err?.message || err || '')
  if (msg.includes('RecordNotFound')) return true
  if (msg.includes('Could not locate record')) return true
  if (msg.includes('NotFound')) return true
  return false
}

const BULK_QUADRANTS = [
  'lib-left',
  'auth-left',
  'center-left',
  'center',
  'center-right',
  'lib-right',
  'auth-right',
]
