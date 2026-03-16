import {BskyAgent, RichText} from '@atproto/api'

// We need to use relative imports because ts-node with paths can be tricky without extra config
// Assuming this script is run from project root: ts-node scripts/seed_highlights.ts
import {MOCK_HIGHLIGHTS} from '../src/lib/mock-highlights'

const SERVICE = 'http://localhost:2583'
// Default local dev credentials (replace if you have different ones)
const HANDLE = 'bob.test'
const PASSWORD = 'hunter2'

async function main() {
  const agent = new BskyAgent({service: SERVICE})

  console.log(`Connecting to ${SERVICE}...`)
  try {
    await agent.login({identifier: HANDLE, password: PASSWORD})
    console.log(`Logged in as ${HANDLE}`)
  } catch (e) {
    console.error(
      'Failed to login. Make sure your local PDS is running at http://localhost:2583 and you have the default "bob.test" account.',
    )
    console.error(e)
    process.exit(1)
  }

  console.log(`Seeding ${MOCK_HIGHLIGHTS.length} highlights...`)

  for (const h of MOCK_HIGHLIGHTS) {
    // Construct text with hashtags for metadata
    const cleanState = h.state ? `#${h.state.replace(/\s+/g, '')}` : ''
    const cleanCommunity = `#${h.community.replace(/\s+/g, '')}`
    const text = `${h.text}\n\n${cleanState} ${cleanCommunity}`

    const rt = new RichText({text})
    await rt.detectFacets(agent)

    try {
      const res = await agent.post({
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
      })
      console.log(`Posted: ${h.text.substring(0, 20)}... -> ${res.uri}`)
    } catch (e) {
      console.error(`Failed to post: ${h.text}`, e)
    }

    // Small delay to prevent rate limits or overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('Seeding complete!')
}

main().catch(console.error)
