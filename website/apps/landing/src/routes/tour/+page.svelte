<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		architectureNotes,
		developerPromises,
		docsBase,
		landingFeatures
	} from '$lib/content/site';
</script>

<svelte:head>
	<title>PARA Product Tour</title>
	<meta
		name="description"
		content="Take a product tour through PARA's communities, cabildeos, representation, trust surfaces, and docs-backed implementation story."
	/>
</svelte:head>

<div class="tour-shell">
	<div class="tour-glow glow-a"></div>
	<div class="tour-glow glow-b"></div>

	<section class="tour-hero">
		<div class="container hero-stack">
			<div class="eyebrow">Product tour • six concrete stops</div>
			<h1 class="section-title">See the civic surfaces before you read the protocol.</h1>
			<p class="section-copy">
				PARA needs a first-click experience that shows what the product actually does. This tour
				walks through the named feature areas already shaping the platform, then hands directly into
				the local docs.
			</p>
			<div class="cta-row">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="button button-primary" href={docsBase} rel="external">Open Docs Overview</a>
				<a class="button button-secondary" href={resolve('/')}>Back to Landing</a>
			</div>
			<div class="chip-list">
				<span class="chip">Communities</span>
				<span class="chip">Cabildeos</span>
				<span class="chip">Representatives</span>
				<span class="chip">Messaging</span>
				<span class="chip">Trust</span>
				<span class="chip">Schemas</span>
			</div>
		</div>
	</section>

	<section class="tour-section">
		<div class="container">
			<div class="section-heading">
				<div class="eyebrow">Tour stops</div>
				<h2>Every stop points to an actual route or docs surface.</h2>
			</div>
			<div class="feature-grid">
				{#each landingFeatures as feature (feature.title)}
					<article class="feature-card">
						<p class="feature-eyebrow">{feature.eyebrow}</p>
						<h3>{feature.title}</h3>
						<p class="feature-copy">{feature.copy}</p>
						<ul class="feature-points">
							{#each feature.points as point (point)}
								<li>{point}</li>
							{/each}
						</ul>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a class="feature-link" href={feature.href} rel="external">{feature.cta}</a>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="tour-section">
		<div class="container summary-grid">
			<article class="summary-card">
				<div class="eyebrow">What this proves</div>
				<h2>The product has a visible shape, not just a slogan.</h2>
				<ul class="summary-list">
					{#each architectureNotes as note (note)}
						<li>{note}</li>
					{/each}
				</ul>
			</article>
			<article class="summary-card accent-card">
				<div class="eyebrow">Next step</div>
				<h2>Move from the tour into the implementation handoff.</h2>
				<ul class="summary-list">
					{#each developerPromises as promise (promise)}
						<li>{promise}</li>
					{/each}
				</ul>
				<div class="cta-row">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="button button-primary" href={docsBase} rel="external">Docs Overview</a>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="button button-secondary" href={`${docsBase}/schemas`} rel="external">
						Browse Schemas
					</a>
				</div>
			</article>
		</div>
	</section>
</div>

<style>
	:global(body) {
		background:
			radial-gradient(circle at top left, rgba(72, 38, 127, 0.3), transparent 32%),
			linear-gradient(180deg, #0d0913 0%, #140d1d 100%);
		color: #ffffff;
		font-family:
			'Inter',
			-apple-system,
			sans-serif;
		overflow-x: hidden;
	}

	.tour-shell {
		position: relative;
		min-height: 100vh;
		padding-bottom: 4rem;
	}

	.tour-glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(120px);
		opacity: 0.35;
		pointer-events: none;
	}

	.glow-a {
		top: 2rem;
		left: -6rem;
		width: 20rem;
		height: 20rem;
		background: rgba(168, 85, 247, 0.4);
	}

	.glow-b {
		right: -3rem;
		bottom: 8rem;
		width: 18rem;
		height: 18rem;
		background: rgba(244, 114, 182, 0.22);
	}

	.container {
		width: min(1120px, calc(100% - 2rem));
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}

	.tour-hero {
		padding: 5rem 0 2rem;
	}

	.hero-stack,
	.section-heading {
		display: grid;
		gap: 1.2rem;
	}

	.eyebrow {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		padding: 0.55rem 0.95rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(16px);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.72);
	}

	.section-title {
		margin: 0;
		font-size: clamp(3rem, 7vw, 5.4rem);
		line-height: 0.98;
		letter-spacing: -0.04em;
		max-width: 12ch;
	}

	.section-copy {
		margin: 0;
		max-width: 42rem;
		font-size: 1.06rem;
		line-height: 1.75;
		color: rgba(255, 255, 255, 0.72);
	}

	.cta-row,
	.chip-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.95rem 1.35rem;
		border-radius: 999px;
		font-weight: 700;
		text-decoration: none;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background 180ms ease;
	}

	.button:hover {
		transform: translateY(-2px);
	}

	.button-primary {
		background: #ffffff;
		color: #100a18;
		box-shadow: 0 18px 36px rgba(0, 0, 0, 0.25);
	}

	.button-secondary {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #ffffff;
	}

	.chip {
		padding: 0.5rem 0.8rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: rgba(255, 255, 255, 0.68);
		font-size: 0.82rem;
		font-weight: 600;
	}

	.tour-section {
		padding-top: 1.5rem;
	}

	.tour-section h2 {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3rem);
		line-height: 1.05;
		letter-spacing: -0.03em;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.feature-card,
	.summary-card {
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
			rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(20px);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.feature-card {
		padding: 1.45rem;
		display: grid;
		gap: 0.85rem;
	}

	.feature-eyebrow {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #d6bcff;
	}

	.feature-card h3 {
		margin: 0;
		font-size: 1.45rem;
		line-height: 1.15;
	}

	.feature-copy {
		margin: 0;
		color: rgba(255, 255, 255, 0.72);
		line-height: 1.65;
	}

	.feature-points,
	.summary-list {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.55rem;
		color: rgba(255, 255, 255, 0.78);
	}

	.feature-link {
		width: fit-content;
		color: #ffffff;
		font-weight: 700;
		text-decoration: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.26);
		padding-bottom: 0.1rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.summary-card {
		padding: 1.55rem;
		display: grid;
		gap: 1rem;
	}

	.accent-card {
		background:
			linear-gradient(180deg, rgba(72, 38, 127, 0.38), rgba(255, 255, 255, 0.04)),
			rgba(255, 255, 255, 0.04);
	}

	@media (max-width: 860px) {
		.container {
			width: min(1120px, calc(100% - 1.25rem));
		}

		.feature-grid,
		.summary-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
