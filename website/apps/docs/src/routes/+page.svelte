<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		architectureLayers,
		docsBase,
		landingHeroActions,
		landingHeroMetrics,
		landingFeatures,
		landingPillars
	} from '$lib/content/site';
	import GlobeAnimation from '$lib/components/GlobeAnimation.svelte';
</script>

<svelte:head>
	<title>PARA Docs</title>
	<meta
		name="description"
		content="PARA explains its political thesis through democratic friction, policy flairs, RAQ, voting, agents, anonymity, and the technical layer beneath the product."
	/>
</svelte:head>

<div class="landing-shell">
	<section class="hero">
		<div class="container hero-grid">
			<div class="hero-copy">
				<div class="eyebrow hero-eyebrow">PARA • political social network</div>
				<p class="hero-tagline">The anonymous political arena.</p>
				<p class="section-copy hero-text">
					PARA is the political social network built for communities, policy votes, RAQ flows, civic
					agents, and protected participation on top of the AT Protocol.
				</p>
				<div class="hero-cta-row">
					<a class="button button-primary docs-cta-button hero-button" href={resolve(docsBase)}
						>Browse docs</a
					>
				</div>
				<div class="hero-metric-row">
					{#each landingHeroMetrics as metric (metric.label)}
						<div class="hero-metric">
							<p class="hero-metric-value">{metric.value}</p>
							<p class="hero-metric-label">{metric.label}</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="hero-panel">
				<div class="hero-glow hero-glow-top"></div>
				<div class="hero-glow hero-glow-bottom"></div>
				<div class="hero-orb hero-orb-right"></div>
				<div class="hero-orb hero-orb-left"></div>
				<div class="globe-container">
					<GlobeAnimation lines={35} textureScale={0.86} />
				</div>
			</div>
		</div>

		<div class="container hero-action-shell">
			<div class="hero-action-grid">
				{#each landingHeroActions as action (action.title)}
					<a class="hero-action-card" href={resolve(action.href)}>
						<p class="hero-action-eyebrow">{action.eyebrow}</p>
						<h2>{action.title}</h2>
						<p>{action.copy}</p>
						<span class="hero-action-link">Learn more →</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<section class="feature-map" id="features">
		<div class="container section-stack">
			<div class="feature-map-header">
				<div>
					<div class="eyebrow">Feature map</div>
					<h2 class="section-title">Six ideas that make PARA distinct.</h2>
				</div>
				<p class="section-copy feature-map-copy">
					Each card names the surface, the friction it reduces, and the next place to read when you
					want more detail.
				</p>
			</div>
			<div class="feature-grid">
				{#each landingFeatures as feature (feature.title)}
					<article class="card feature-card">
						<div class="feature-card-top">
							<p class="feature-eyebrow">{feature.eyebrow}</p>
							<h3>{feature.title}</h3>
						</div>
						<div class="feature-problem">
							<span class="feature-problem-label">Reduces</span>
							<p>{feature.problem}</p>
						</div>
						<p class="feature-summary">{feature.copy}</p>
						<ul class="feature-points">
							{#each feature.points as point (point)}
								<li>{point}</li>
							{/each}
						</ul>
						<a class="feature-link" href={resolve(feature.href)}>{feature.cta}</a>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="thesis" id="product">
		<div class="container section-stack">
			<div class="eyebrow">Product focus</div>
			<h2 class="section-title">
				PARA is not a generic clone. The civic primitives and the democratic argument should be
				visible immediately.
			</h2>
			<p class="section-copy">
				The source app already includes routes for communities, RAQ flows, representatives,
				cabildeos, policy dashboards, messages, moderation, and verification settings. The site
				should explain that shape directly instead of falling back to abstract social-backend copy
				or generic startup language.
			</p>
			<div class="card-grid pillar-grid">
				{#each landingPillars as pillar (pillar.title)}
					<article class="card pillar-card">
						<h3>{pillar.title}</h3>
						<p>{pillar.copy}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="architecture">
		<div class="container architecture-grid">
			<div class="architecture-copy">
				<div class="eyebrow">Backend framing</div>
				<h2 class="section-title">
					watx gives PARA a contract language that the site can actually explain.
				</h2>
				<p class="section-copy">
					Developers should be able to read this site in two directions: product-first if they are
					learning what PARA does, or protocol-first if they want the records, services, and
					lexicons. The information architecture should support both without switching mental
					models.
				</p>
			</div>
			<div class="architecture-stack">
				{#each architectureLayers as layer (layer.title)}
					<article class="card architecture-card">
						<p class="diagram-title">{layer.eyebrow}</p>
						<h3>{layer.title}</h3>
						<p class="diagram-note">{layer.copy}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

</div>

<style>
	.hero {
		padding: 3rem 0 3.75rem;
	}

	.hero-grid,
	.architecture-grid {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 1.5rem;
		align-items: stretch;
	}

	.hero-copy,
	.architecture-copy {
		grid-column: span 4;
		padding: 4.6rem 0 2.75rem;
	}

	.hero-copy {
		display: grid;
		gap: 1.1rem;
		max-width: 24rem;
		position: relative;
		z-index: 1;
	}

	.eyebrow {
		font-family: var(--ps-font-mono);
		font-weight: 700;
		letter-spacing: 0.1em;
	}

	.hero-eyebrow {
		align-self: start;
		width: fit-content;
	}

	.hero-title {
		margin: 0;
		font-family: var(--ps-font-mono);
		font-size: clamp(4rem, 8vw, 6.3rem);
		font-weight: 500;
		line-height: 0.88;
		letter-spacing: -0.05em;
		text-transform: uppercase;
		color: #ffffff;
	}

	.hero-tagline {
		margin: -0.1rem 0 0;
		font-family: var(--ps-font-mono);
		font-size: clamp(1.35rem, 2.5vw, 2rem);
		line-height: 1.1;
		color: #a79cd1;
	}

	.hero-text {
		max-width: 20rem;
		font-size: 1rem;
		line-height: 1.8;
	}

	.hero-cta-row {
		padding-top: 0.3rem;
	}

	.hero-button {
		min-width: 11rem;
	}

	:global(.docs-cta-button) {
		border: 1px solid rgba(164, 162, 177, 0.22);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.01)),
			#474652;
		color: #f6f4fa;
		box-shadow:
			0 16px 34px rgba(12, 10, 18, 0.34),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	:global(.docs-cta-button:hover) {
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
			#474652;
		box-shadow:
			0 20px 40px rgba(12, 10, 18, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.hero-metric-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
		padding-top: 1rem;
	}

	.hero-metric {
		min-width: 7.4rem;
		padding-right: 1rem;
		border-right: 1px solid rgba(255, 255, 255, 0.12);
	}

	.hero-metric:last-child {
		border-right: 0;
		padding-right: 0;
	}

	.hero-metric-value {
		margin: 0;
		font-family: var(--ps-font-display);
		font-size: clamp(1.8rem, 3.2vw, 2.3rem);
		line-height: 0.95;
		letter-spacing: -0.04em;
		color: #ffffff;
	}

	.hero-metric-label {
		margin: 0.28rem 0 0;
		font-family: var(--ps-font-mono);
		font-size: 0.76rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #aba4ba;
	}

	.hero-action-shell {
		margin-top: 1rem;
	}

	.hero-action-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.9rem;
	}

	.hero-action-card {
		display: grid;
		gap: 0.7rem;
		padding: 1.35rem 1.3rem 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.11);
		border-radius: 1.1rem;
		background:
			radial-gradient(circle at top left, rgba(130, 170, 255, 0.1), transparent 42%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02)),
			rgba(255, 255, 255, 0.02);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 16px 36px rgba(0, 0, 0, 0.18);
		transition:
			border-color 0.18s ease,
			transform 0.18s ease,
			background 0.18s ease;
	}

	.hero-action-card:hover {
		transform: translateY(-2px);
		border-color: rgba(169, 199, 255, 0.24);
	}

	.hero-action-eyebrow {
		margin: 0;
		font-family: var(--ps-font-mono);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8ea7d5;
	}

	.hero-action-card h2 {
		margin: 0;
		font-family: var(--ps-font-display);
		font-size: 2rem;
		letter-spacing: -0.03em;
		line-height: 0.96;
		color: #ffffff;
	}

	.hero-action-card p {
		margin: 0;
		font-size: 0.94rem;
		line-height: 1.72;
		color: #c9c3d4;
	}

	.hero-action-link {
		padding-top: 0.15rem;
		font-family: var(--ps-font-mono);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #ffffff;
	}

	.hero-panel {
		position: relative;
		grid-column: span 8;
		min-height: 560px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
		background:
			radial-gradient(circle at top, rgba(130, 170, 255, 0.16) 0%, transparent 34%),
			radial-gradient(circle at center, rgba(72, 38, 127, 0.14) 0%, transparent 70%);
	}

	.hero-orb {
		position: absolute;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
		z-index: 2;
	}

	.hero-orb-right {
		top: 8rem;
		right: 4rem;
		width: 5rem;
		height: 5rem;
	}

	.hero-orb-left {
		left: 1.2rem;
		bottom: 9.5rem;
		width: 2.55rem;
		height: 2.55rem;
	}

	.hero-glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(28px);
		opacity: 0.55;
		pointer-events: none;
	}

	.hero-glow-top {
		top: 3rem;
		right: 2.8rem;
		width: 8rem;
		height: 8rem;
		background: rgba(112, 160, 255, 0.22);
	}

	.hero-glow-bottom {
		left: 2rem;
		bottom: 3.4rem;
		width: 7rem;
		height: 7rem;
		background: rgba(123, 92, 255, 0.18);
	}

	.globe-container {
		--ps-globe-color: #474652;
		position: relative;
		z-index: 1;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: scale(1.2);
		filter: drop-shadow(0 0 72px rgba(72, 38, 127, 0.34));
	}

	:global(.globe-ascii) {
		color: #ffffff;
		font-family: var(--ps-font-mono);
		font-weight: 900;
		line-height: 1.1;
	}

	.feature-map {
		padding: 0.5rem 0 4rem;
	}

	.feature-map-header {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(18rem, 0.9fr);
		gap: 1.5rem;
		align-items: end;
	}

	.feature-map-copy {
		max-width: 28rem;
		margin: 0;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.1rem;
		margin-top: 1.35rem;
	}

	.feature-card {
		display: grid;
		gap: 1rem;
		align-content: start;
		padding: 1.35rem;
	}

	.feature-card-top {
		display: grid;
		gap: 0.55rem;
	}

	.feature-eyebrow {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--para-accent-text);
	}

	.feature-card h3 {
		margin: 0;
		font-family: var(--ps-font-display);
		font-size: 1.35rem;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.feature-problem {
		display: grid;
		gap: 0.3rem;
		padding: 0.9rem 0.95rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
			rgba(255, 255, 255, 0.02);
	}

	.feature-problem-label {
		font-family: var(--ps-font-mono);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8ea7d5;
	}

	.feature-problem p {
		margin: 0;
		color: #f1eef8;
		line-height: 1.55;
	}

	.feature-summary {
		margin: 0;
		color: #d5cfdf;
		line-height: 1.72;
	}

	.feature-card li {
		margin: 0;
		color: #cfc9d9;
		line-height: 1.65;
	}

	.feature-points {
		display: grid;
		gap: 0.55rem;
		margin: 0;
		padding-left: 1rem;
	}

	.feature-link {
		display: inline-flex;
		align-items: center;
		font-weight: 700;
		color: #ffffff;
	}

	.feature-link:hover {
		color: var(--para-accent-text);
	}

	.diagram-title {
		margin: 0 0 1rem;
		font-size: 0.82rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a1a1aa;
	}

	.section-stack {
		padding: 2rem 0 4rem;
		display: grid;
		gap: 1rem;
	}

	.pillar-grid {
		margin-top: 1rem;
	}

	.pillar-card {
		grid-column: span 4;
	}

	.pillar-card h3,
	.architecture-card h3 {
		margin: 0 0 0.8rem;
		font-family: var(--ps-font-display);
		font-size: 1.8rem;
		letter-spacing: -0.03em;
	}

	.pillar-card p,
	.diagram-note {
		margin: 0;
		color: #a1a1aa;
		line-height: 1.7;
	}

	.architecture {
		padding: 1rem 0 4rem;
	}

	.architecture-stack {
		grid-column: span 5;
		display: grid;
		gap: 1rem;
		align-content: start;
		padding-top: 2.4rem;
	}

	.architecture-card {
		display: grid;
		align-content: start;
		gap: 0.25rem;
	}

	@media (max-width: 960px) {
		.hero-grid,
		.architecture-grid,
		.hero-action-grid,
		.feature-grid,
		.feature-map-header {
			grid-template-columns: 1fr;
		}

		.hero-copy,
		.hero-panel,
		.architecture-copy,
		.architecture-stack,
		.pillar-card {
			grid-column: 1 / -1;
		}

		.hero-copy,
		.architecture-copy {
			padding: 2.5rem 0 1rem;
		}

		.hero-panel {
			min-height: 430px;
		}

		.hero-metric {
			border-right: 0;
			padding-right: 0;
		}
	}
</style>
