#!/usr/bin/env node
import {BskyAgent} from '@atproto/api'

import {
  applySeedOperations,
  buildActorInputs,
  buildSeedOperations,
  loadCredentials,
  loadManifest,
  resetSeedOperations,
  resolveCliConfig,
  summarizeOperations,
  toResetOperations,
} from './lib.mjs'

async function main() {
  const config = resolveCliConfig(process.argv.slice(2))
  const manifest = await loadManifest(config.manifestPath)
  const credentials = await loadCredentials(config.credentialsPath)
  const service = credentials?.service || config.service

  const actorInputs = buildActorInputs(manifest, credentials)
  const actorsByAlias = {}
  const clientsByAlias = {}

  console.log(`Civic seed command: ${config.command}`)
  console.log(`Service: ${service}`)
  console.log(`Manifest: ${config.manifestPath}`)
  if (config.credentialsPath) {
    console.log(`Credentials: ${config.credentialsPath}`)
  }
  if (config.dryRun) {
    console.log('Mode: dry-run')
  }

  if (config.dryRun) {
    for (const actor of actorInputs) {
      actorsByAlias[actor.alias] = {
        did: fakeDidFromAlias(actor.alias),
        handle: actor.handle,
        displayName: actor.displayName || actor.handle,
      }
    }
  } else {
    for (const actor of actorInputs) {
      const session = await ensureActorSession({
        service,
        actor,
        createAccounts: config.createAccounts,
        verbose: config.verbose,
      })
      actorsByAlias[actor.alias] = {
        did: session.did,
        handle: session.handle || actor.handle,
        displayName: actor.displayName || session.handle,
      }
      clientsByAlias[actor.alias] = session
    }
  }

  const operations = buildSeedOperations({manifest, actorsByAlias})
  const summary = summarizeOperations(operations)

  console.log(`Planned operations: ${summary.total}`)
  for (const [collection, count] of Object.entries(summary.byCollection)) {
    console.log(`  ${collection}: ${count}`)
  }

  const writer = {
    async putRecord(op) {
      const client = clientsByAlias[op.actorAlias]
      if (!client) {
        throw new Error(`No client for actor alias "${op.actorAlias}"`)
      }
      const response = await client.agent.com.atproto.repo.putRecord({
        repo: client.did,
        collection: op.collection,
        rkey: op.rkey,
        record: op.record,
      })
      return response.data
    },
    async deleteRecord(op) {
      const client = clientsByAlias[op.actorAlias]
      if (!client) {
        throw new Error(`No client for actor alias "${op.actorAlias}"`)
      }
      await client.agent.com.atproto.repo.deleteRecord({
        repo: client.did,
        collection: op.collection,
        rkey: op.rkey,
      })
    },
  }

  if (config.command === 'apply') {
    const result = await applySeedOperations(operations, writer, config)
    console.log(
      `Apply done. attempted=${result.attempted} written=${result.written} failed=${result.failed}`,
    )
  } else {
    const resetOps = toResetOperations(operations)
    const result = await resetSeedOperations(resetOps, writer, config)
    console.log(
      `Reset done. attempted=${result.attempted} deleted=${result.deleted} missing=${result.missing} failed=${result.failed}`,
    )
  }
}

async function ensureActorSession({service, actor, createAccounts, verbose}) {
  const agent = new BskyAgent({service})
  const identifier = actor.identifier || actor.handle

  try {
    await agent.login({identifier, password: actor.password})
    if (!agent.session) {
      throw new Error(`No session after login for ${identifier}`)
    }
    if (verbose) {
      console.log(`login ok: ${actor.alias} (${agent.session.did})`)
    }
    return {
      agent,
      did: agent.session.did,
      handle: agent.session.handle,
    }
  } catch (loginErr) {
    if (!createAccounts || actor.createAccount === false) {
      throw new Error(
        `Failed login for "${actor.alias}" (${identifier}) and account creation disabled: ${
          loginErr?.message || loginErr
        }`,
      )
    }
  }

  if (!actor.handle || !actor.email) {
    throw new Error(
      `Actor "${actor.alias}" cannot be auto-created without handle and email.`,
    )
  }

  try {
    await agent.createAccount({
      handle: actor.handle,
      email: actor.email,
      password: actor.password,
      inviteCode: actor.inviteCode,
    })
    if (verbose) {
      console.log(`account created: ${actor.alias} (${actor.handle})`)
    }
  } catch (createErr) {
    const msg = String(createErr?.message || createErr || '')
    const alreadyExists =
      msg.includes('Handle already taken') ||
      msg.includes('already exists') ||
      msg.includes('InvalidHandle')
    if (!alreadyExists) {
      throw new Error(
        `Failed to create account for "${actor.alias}" (${actor.handle}): ${msg}`,
      )
    }
    if (verbose) {
      console.log(`account exists: ${actor.alias} (${actor.handle})`)
    }
  }

  await agent.login({identifier, password: actor.password})
  if (!agent.session) {
    throw new Error(`No session after create/login for ${identifier}`)
  }
  if (verbose) {
    console.log(`login after create ok: ${actor.alias} (${agent.session.did})`)
  }
  return {
    agent,
    did: agent.session.did,
    handle: agent.session.handle,
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

function fakeDidFromAlias(alias) {
  const slug = alias.replace(/[^a-z0-9]+/gi, '').slice(0, 20).toLowerCase()
  return `did:plc:${slug || 'seedactor'}`
}
