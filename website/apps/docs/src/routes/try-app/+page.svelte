<script lang="ts">
	import { resolve } from '$app/paths';

	type CopyState = 'idle' | 'done' | 'failed';

	const sharedDemoUrl = 'https://appview.paramx.social';
	const sharedPdsUrl = 'https://pds.paramx.social';
	const waitlistTemplate = `Hi PARA team,

I'd like access to the current build link.

Name or team:
Platform:
How I want to test PARA:
Preferred turnaround:
Who should receive the build:

Thanks.`;
	const buildRequestDraft = `mailto:?subject=${encodeURIComponent('PARA build link request')}&body=${encodeURIComponent(waitlistTemplate)}`;
	const accessPaths = [
		{
			label: 'Shared host',
			title: 'Open the live public build now',
			copy: 'Best when you want to inspect the current civic surfaces without waiting for a new package.'
		},
		{
			label: 'Build link waitlist',
			title: 'Ask for a direct build link',
			copy: 'Best when you need a packaged build, a newer binary, or a link you can hand to a tester.'
		},
		{
			label: 'Run locally',
			title: 'Bring the stack up from source',
			copy: 'Best when you need full control over the app client, AppView, and PDS while testing.'
		}
	] as const;
	const requestChecklist = [
		'Which platform you need: web, iOS, Android, or all three.',
		'Whether you want the current shared build or a newer internal package.',
		'Who should receive the link and what team or use case it supports.',
		'How quickly you need it so the handoff can be prioritized.'
	] as const;
	const runtimeNotes = [
		{
			label: 'Shared demo host',
			value: sharedDemoUrl
		},
		{
			label: 'Shared PDS host',
			value: sharedPdsUrl
		},
		{
			label: 'Workspace split',
			value: 'Expo client in PARA, backend stack in watx, docs site in website.'
		},
		{
			label: 'Fastest path',
			value:
				'Open the shared host or send the build-link request draft if you need something newer.'
		}
	] as const;

	let linkCopyState = $state<CopyState>('idle');
	let templateCopyState = $state<CopyState>('idle');

	async function copyText(value: string, target: 'link' | 'template') {
		try {
			await navigator.clipboard.writeText(value);
			if (target === 'link') {
				linkCopyState = 'done';
			} else {
				templateCopyState = 'done';
			}
		} catch {
			if (target === 'link') {
				linkCopyState = 'failed';
			} else {
				templateCopyState = 'failed';
			}
		}

		setTimeout(() => {
			if (target === 'link') {
				linkCopyState = 'idle';
			} else {
				templateCopyState = 'idle';
			}
		}, 2000);
	}
</script>

<svelte:head>
	<title>Try App • PARA</title>
	<meta
		name="description"
		content="Open the current PARA host, request a build link, or run the app and backend stack locally."
	/>
</svelte:head>

<div class="docs-page try-app-page">
	<section class="try-app-hero">
		<div class="hero-copy">
			<p class="docs-hero-kicker">Try app</p>
			<h1>Pick the fastest path into PARA.</h1>
			<p class="try-app-lead">
				Use the live public host when you want immediate access, request a build link when you need
				a handoff package, or bring the whole stack up locally when you need full control.
			</p>
			<p class="hero-detail">
				This page gathers the practical ways to get into PARA: open the current experience, ask for
				a build link, or understand the local setup without hunting through scattered notes.
			</p>

			<div class="try-app-cta-row">
				<a
					class="app-button app-button-primary"
					href={sharedDemoUrl}
					rel="noreferrer"
					target="_blank"
				>
					Open shared host
				</a>
				<a class="app-button app-button-accent" href={buildRequestDraft}>Request build link</a>
				<button
					class="app-button app-button-secondary"
					onclick={() => copyText(sharedDemoUrl, 'link')}
					type="button"
				>
					{linkCopyState === 'done'
						? 'Host copied'
						: linkCopyState === 'failed'
							? 'Copy failed'
							: 'Copy host link'}
				</button>
			</div>

			<div class="hero-chip-row">
				<span class="hero-chip">Shared host ready</span>
				<span class="hero-chip">Build request draft included</span>
				<span class="hero-chip">Local stack commands below</span>
			</div>
		</div>

		<div class="hero-panel">
			<div class="hero-panel-card">
				<p class="panel-kicker">Access paths</p>
				<div class="access-path-grid">
					{#each accessPaths as path (path.label)}
						<article class="access-card">
							<p class="access-label">{path.label}</p>
							<h2>{path.title}</h2>
							<p>{path.copy}</p>
						</article>
					{/each}
				</div>
			</div>

			<div class="hero-panel-card hero-meta-card">
				<p class="panel-kicker">Current runtime</p>
				<div class="docs-meta-grid">
					{#each runtimeNotes as note (note.label)}
						<div class="docs-meta-card">
							<span class="docs-meta-label">{note.label}</span>
							<div class="docs-meta-value">
								{#if note.value.startsWith('https://')}
									<code>{note.value}</code>
								{:else}
									{note.value}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section class="waitlist-section">
		<div class="waitlist-copy docs-section-card">
			<p class="docs-section-kicker">Build link waitlist</p>
			<h2>Need a build link? Use the request draft.</h2>
			<p>
				If the shared host is not enough, this is the next-best operational path. The draft below
				lets you ask for a build link with the details someone on the PARA side will actually need.
			</p>
			<ul>
				{#each requestChecklist as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		</div>

		<div class="waitlist-card">
			<p class="panel-kicker">Ready-to-send request</p>
			<h2>Prepare the message before you ask for access.</h2>
			<pre><code>{waitlistTemplate}</code></pre>
			<p class="waitlist-note">
				The request draft opens your mail client without assuming a fixed public inbox.
			</p>
			<div class="try-app-cta-row">
				<a class="app-button app-button-primary" href={buildRequestDraft}>Open request draft</a>
				<button
					class="app-button app-button-secondary"
					onclick={() => copyText(waitlistTemplate, 'template')}
					type="button"
				>
					{templateCopyState === 'done'
						? 'Template copied'
						: templateCopyState === 'failed'
							? 'Copy failed'
							: 'Copy request template'}
				</button>
			</div>
		</div>
	</section>

	<section class="docs-section-card">
		<p class="docs-section-kicker">Run from source</p>
		<h2>Bring up the docs site and the PARA app separately.</h2>
		<p>
			The public site and the app client live in different workspaces, so they start separately even
			though they support the same demo story.
		</p>

		<div class="docs-meta-grid">
			<div class="docs-meta-card">
				<span class="docs-meta-label">Docs site</span>
				<div class="docs-meta-value">SvelteKit site in <code>website</code></div>
			</div>
			<div class="docs-meta-card">
				<span class="docs-meta-label">App client</span>
				<div class="docs-meta-value">Expo web client in <code>PARA</code></div>
			</div>
			<div class="docs-meta-card">
				<span class="docs-meta-label">Backend</span>
				<div class="docs-meta-value">PDS and AppView stack in <code>watx</code></div>
			</div>
		</div>

		<div class="docs-split-grid">
			<div class="docs-note-panel">
				<h3>Docs site</h3>
				<pre><code
						>cd /Users/mlv/Desktop/MASTER/website
pnpm install
pnpm dev</code
					></pre>
			</div>
			<div class="docs-note-panel">
				<h3>PARA app client</h3>
				<pre><code
						>cd /Users/mlv/Desktop/MASTER/PARA
yarn
yarn web</code
					></pre>
			</div>
		</div>

		<div class="docs-callout">
			<p>
				<strong>Why this split exists:</strong> the website repo serves the public docs and marketing
				site. The PARA repo is the actual app client.
			</p>
		</div>
	</section>

	<section class="docs-section-card">
		<p class="docs-section-kicker">Backend path</p>
		<h2>Bring up the backend the way the current runbooks describe it.</h2>
		<p>
			The backend development flow in <code>watx</code> is the part that expects Docker. This is the short
			path that matches the repo runbook.
		</p>

		<pre><code
				>cd /Users/mlv/Desktop/MASTER/watx
make nvm-setup
make deps
make build
make run-dev-env</code
			></pre>

		<div class="docs-meta-grid">
			<div class="docs-meta-card">
				<span class="docs-meta-label">PLC</span>
				<div class="docs-meta-value"><code>http://localhost:2582</code></div>
			</div>
			<div class="docs-meta-card">
				<span class="docs-meta-label">PDS</span>
				<div class="docs-meta-value"><code>http://localhost:2583</code></div>
			</div>
			<div class="docs-meta-card">
				<span class="docs-meta-label">AppView</span>
				<div class="docs-meta-value"><code>http://localhost:2584</code></div>
			</div>
		</div>

		<h3>Persistent shared demo</h3>
		<pre><code
				>cd /Users/mlv/Desktop/MASTER/watx
cp -n .env.shared-demo.example .env.shared-demo
make run-dev-env-persistent</code
			></pre>

		<p>
			The shared-demo runbook advertises the public identities as
			<code>https://pds.paramx.social</code> and <code>https://appview.paramx.social</code>.
		</p>
	</section>

	<section class="docs-section-card">
		<p class="docs-section-kicker">Production-style serve</p>
		<h2>Build and serve the web app bundle from source.</h2>
		<p>
			The PARA repo also documents a production-style web bundle flow through the Go server that
			serves the built app.
		</p>

		<pre><code
				>cd /Users/mlv/Desktop/MASTER/PARA
yarn
yarn build-web
cd bskyweb
go mod tidy
go build -v -tags timetzdata -o bskyweb ./cmd/bskyweb
./bskyweb serve --appview-host=http://localhost:2584</code
			></pre>

		<p>
			For the current shared demo host instead of the local AppView port, swap the final flag to
			<code>--appview-host=https://appview.paramx.social</code>.
		</p>
	</section>

	<section class="docs-section-card">
		<p class="docs-section-kicker">Read next</p>
		<div class="docs-link-grid">
			<a class="docs-link-card" href={resolve('/about')}>
				<strong>About</strong>
				<span>Return to the political thesis behind the app and the network model.</span>
			</a>
			<a class="docs-link-card" href={resolve('/trust-and-safety')}>
				<strong>Trust and safety</strong>
				<span
					>See how identity, moderation, verification, and account control shape participation.</span
				>
			</a>
			<a class="docs-link-card" href={resolve('/docs/schemas')}>
				<strong>Schema reference</strong>
				<span>Browse the schema reference and the technical notes behind the product.</span>
			</a>
		</div>
	</section>
</div>

<style>
	h1,
	h2,
	h3 {
		margin: 0;
	}

	.try-app-page {
		display: grid;
		gap: 1.5rem;
	}

	.try-app-hero,
	.waitlist-section {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
		gap: 1.25rem;
	}

	.try-app-hero {
		padding: clamp(1.6rem, 2vw, 2rem);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 2rem;
		background:
			radial-gradient(circle at top right, rgba(72, 38, 127, 0.24), transparent 36%),
			radial-gradient(circle at bottom left, rgba(157, 133, 209, 0.14), transparent 30%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.025)),
			rgba(255, 255, 255, 0.02);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			0 20px 48px rgba(0, 0, 0, 0.34);
	}

	.hero-copy,
	.hero-panel,
	.hero-panel-card,
	.waitlist-card {
		display: grid;
		gap: 1rem;
	}

	.hero-copy {
		align-content: start;
	}

	.try-app-page h1 {
		font-family: var(--ps-font-display);
		font-size: clamp(3rem, 6vw, 5.4rem);
		line-height: 0.93;
		letter-spacing: -0.04em;
		color: #ffffff;
		max-width: 10ch;
	}

	.try-app-lead {
		margin: 0;
		max-width: 36rem;
		font-size: 1.12rem;
		line-height: 1.88;
		color: #f2edf9;
	}

	.hero-detail {
		margin: 0;
		color: #d7d2df;
		line-height: 1.84;
	}

	.try-app-cta-row,
	.hero-chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}

	.app-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.95rem;
		padding: 0.8rem 1.15rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		font-weight: 700;
		line-height: 1;
		transition:
			transform 0.18s ease,
			background 0.18s ease,
			color 0.18s ease,
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}

	.app-button:hover {
		transform: translateY(-1px);
	}

	.app-button-primary {
		background: var(--para-primary-600);
		border-color: var(--para-primary-600);
		color: #ffffff;
		box-shadow: 0 14px 30px rgba(72, 38, 127, 0.32);
	}

	.app-button-accent {
		background: rgba(200, 182, 239, 0.12);
		border-color: rgba(200, 182, 239, 0.24);
		color: #f7f2ff;
	}

	.app-button-secondary {
		background: rgba(255, 255, 255, 0.04);
		color: #ffffff;
	}

	.hero-chip {
		padding: 0.5rem 0.78rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #d8d1e5;
		font-size: 0.84rem;
		font-weight: 600;
	}

	.hero-panel-card,
	.waitlist-card {
		padding: 1.2rem 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.45rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.025)),
			rgba(255, 255, 255, 0.025);
	}

	.hero-meta-card .docs-meta-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.panel-kicker {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--para-accent-text);
	}

	.access-path-grid {
		display: grid;
		gap: 0.8rem;
	}

	.access-card {
		padding: 1rem;
		border-radius: 1.1rem;
		background: rgba(255, 255, 255, 0.035);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.access-label {
		margin: 0 0 0.45rem;
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #bba4e6;
	}

	.access-card h2 {
		font-size: 1.2rem;
		line-height: 1.1;
	}

	.access-card p,
	.waitlist-card p {
		margin: 0.55rem 0 0;
		color: #d5d0de;
		line-height: 1.75;
	}

	.waitlist-section {
		align-items: stretch;
	}

	.waitlist-copy,
	.waitlist-card {
		height: 100%;
	}

	.waitlist-copy p,
	.waitlist-copy li,
	.waitlist-note {
		color: #d2ccdd;
		line-height: 1.8;
	}

	.waitlist-note {
		margin: 0;
		font-size: 0.94rem;
	}

	@media (max-width: 960px) {
		.try-app-hero,
		.waitlist-section,
		.hero-meta-card .docs-meta-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
