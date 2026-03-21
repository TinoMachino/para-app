<script lang="ts">
	import { resolve } from '$app/paths';
	import GlobeAnimation from '$lib/components/GlobeAnimation.svelte';
	import {
		aboutBase,
		heroPrimaryAction,
		heroSecondaryAction,
		docsBase,
		developerPromises,
		landingFeatures,
		landingPillars,
		landingSignals
	} from '$lib/content/site';
</script>

<svelte:head>
	<title>PARA | Civic Product and Docs</title>
	<meta
		name="description"
		content="PARA is a political social network for democratic friction reduction, plural identity, policy flairs, RAQ, voting, agents, anonymity, and Bluesky-based civic infrastructure."
	/>
</svelte:head>

<div class="landing-shell dark-theme">
	<div class="ambient-glow bg-blur"></div>
	<div class="ambient-glow bg-blur2"></div>

	<section class="hero">
		<div class="container hero-grid">
			<div class="hero-copy">
				<div class="eyebrow fade-in">
					<span class="eyebrow-dot"></span> PARA • one site, product + docs
				</div>
				<h1 class="section-title slide-up">
					A political network for
					<span class="gradient-text">policy voting and plural identity.</span>
				</h1>
				<p class="section-copy hero-text fade-in-delay">
					PARA started from a dream of a more plural democracy in Mexico. The problem is not a lack
					of opinions, but how little of them becomes material. PARA turns political identity,
					#POLICY|| and #MATTER| flairs, RAQ questioning, -3 to +3 policy votes, agents, search, and
					anonymity into one product story instead of leaving politics trapped inside party branding
					and generic feeds.
				</p>
				<div class="cta-row fade-in-delay-2">
					<a class="button button-primary" href={resolve(heroPrimaryAction.href)}>
						{heroPrimaryAction.label}
					</a>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="button button-secondary" href={heroSecondaryAction.href} rel="external">
						{heroSecondaryAction.label}
					</a>
				</div>
				<div class="chip-list fade-in-delay-3">
					<span class="chip">#POLICY||</span>
					<span class="chip">#MATTER|</span>
					<span class="chip">RAQ</span>
					<span class="chip">Quadratic voting</span>
					<span class="chip">Collective agents</span>
					<span class="chip">Anonymity + validation</span>
				</div>
				<div class="signal-grid fade-in-delay-3">
					{#each landingSignals as signal (signal.label)}
						<article class="signal-card">
							<p class="signal-value">{signal.value}</p>
							<h2>{signal.label}</h2>
							<p>{signal.copy}</p>
						</article>
					{/each}
				</div>
			</div>

			<div class="hero-panel glass-card slide-left">
				<div class="globe-container">
					<GlobeAnimation lines={36} globeScale={0.84} textureScale={0.68} />
				</div>
				<div class="glass-orb orb-1"></div>
				<div class="glass-orb orb-2"></div>
			</div>
		</div>
	</section>

	<section class="company-thesis">
		<div class="container section-stack">
			<div class="eyebrow">Company</div>
			<h2 class="section-title">
				A political social network born from Mexico's democratic frustration.
			</h2>
			<p class="section-copy">
				PARA takes the energy of political compass memes and Democracy 4 and turns it into a serious
				civic layer. The idea is simple: if democracy is too thin, reduce the friction between
				thought and consequence with #POLICY|| and #MATTER| flairs, RAQ questioning, -3 to +3 policy
				voting, collective agents, anonymity with validation, and search/API relevance that can
				classify political content in text and images.
			</p>
			<div class="card-grid pillar-grid">
				{#each landingPillars as pillar (pillar.title)}
					<article class="glass-card pillar-card hover-lift">
						<h3>{pillar.title}</h3>
						<p>{pillar.copy}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="feature-map" id="features">
		<div class="container section-stack">
			<div class="eyebrow">Feature map</div>
			<h2 class="section-title">
				Show people the mechanics: policies, matters, voting, RAQ, agents, and anonymity.
			</h2>
			<p class="section-copy">
				Each feature card explains a concrete surface area and points to the matching part of the
				public docs. No external docs domain, no generic political-brand copy, no dead-end CTA.
			</p>
			<div class="feature-grid">
				{#each landingFeatures as feature (feature.title)}
					<article class="glass-card feature-card">
						<p class="feature-eyebrow">{feature.eyebrow}</p>
						<h3>{feature.title}</h3>
						<p>{feature.copy}</p>
						<ul>
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

	<section class="thesis">
		<div class="container section-stack">
			<div class="eyebrow">Why it matters</div>
			<h2 class="section-title">
				Mexico is plural, but politics still pushes people into package deals.
			</h2>
			<p class="section-copy">
				PARA should not read like a generic social network with political adjectives on top. It is a
				second-layer civic network for people who agree with a party on some things, reject it on
				others, want to vote on actual policies, and need tools to publish, search, compare, and
				learn without exposing every opinion under their legal identity.
			</p>
		</div>
	</section>

	<section class="developers" id="join">
		<div class="container developer-grid">
			<div class="glass-card developer-card">
				<div class="eyebrow">For developers</div>
				<h2>Keep the public story aligned with the real contracts.</h2>
				<ul>
					{#each developerPromises as promise (promise)}
						<li>{promise}</li>
					{/each}
				</ul>
			</div>
			<div class="glass-card developer-card accent-card">
				<p class="panel-label">Next step</p>
				<h3>Move from the landing page into `/docs`, `/docs/schemas`, and `/docs/roadmap`.</h3>
				<p>
					The practical fix is simple: use the local docs routes that already exist, and make the
					homepage explain the democratic problem, the second-layer model, and the civic mechanics
					before the reader opens the reference pages.
				</p>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="button button-primary" href={`${docsBase}/schemas`} rel="external">
					Browse schema reference
				</a>
			</div>
		</div>
	</section>

	<footer class="footer">
		<div class="container footer-row">
			<div>
				<p class="footer-mark gradient-text">PARA</p>
				<p class="footer-copy">
					One same-origin path from the homepage into product framing, roadmap, and schema docs.
				</p>
			</div>
			<div class="footer-links">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={docsBase} class="hover-link" rel="external">Docs</a>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={aboutBase} class="hover-link" rel="external">About</a>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={`${docsBase}/schemas`} class="hover-link" rel="external">Schemas</a>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={`${docsBase}/roadmap`} class="hover-link" rel="external">Roadmap</a>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		background-color: #0f0a14;
		color: #ffffff;
		font-family: var(--ps-font-body);
		overflow-x: hidden;
	}

	.dark-theme {
		--bg-color: #0f0a14;
		--text-main: #fcfcfc;
		--text-muted: #a1a1aa;
		--accent-1: #48267f;
		--accent-2: #474652;
		--glass-bg: rgba(255, 255, 255, 0.03);
		--glass-border: rgba(255, 255, 255, 0.08);

		background-color: var(--bg-color);
		position: relative;
		overflow: hidden;
		min-height: 100vh;
	}

	.ambient-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
		z-index: 0;
		opacity: 0.4;
		animation: float 10s ease-in-out infinite alternate;
	}

	.bg-blur {
		background: var(--accent-1);
		width: 600px;
		height: 600px;
		top: -200px;
		right: -100px;
	}

	.bg-blur2 {
		background: var(--accent-2);
		width: 500px;
		height: 500px;
		bottom: 90px;
		left: -200px;
		animation-delay: -5s;
	}

	@keyframes float {
		0% {
			transform: translate(0, 0) scale(1);
		}

		100% {
			transform: translate(-30px, 50px) scale(1.1);
		}
	}

	.container {
		width: min(1200px, calc(100% - 2rem));
		margin: 0 auto;
		position: relative;
		z-index: 10;
	}

	.hero,
	.company-thesis,
	.feature-map,
	.thesis,
	.developers {
		padding: 4.5rem 0;
	}

	.hero-grid,
	.developer-grid {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 1.5rem;
		align-items: stretch;
	}

	.hero-copy,
	.hero-panel {
		grid-column: span 6;
	}

	.hero-copy {
		display: grid;
		gap: 1.4rem;
		align-content: start;
		padding-top: 1.2rem;
	}

	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--glass-border);
		border-radius: 999px;
		background: var(--glass-bg);
		backdrop-filter: blur(12px);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		width: fit-content;
	}

	.eyebrow-dot {
		width: 8px;
		height: 8px;
		background: #a78bfa;
		border-radius: 50%;
		box-shadow: 0 0 10px #a78bfa;
	}

	.section-title {
		margin: 0;
		font-family: var(--ps-font-display);
		font-size: clamp(2.6rem, 5.5vw, 4.9rem);
		line-height: 0.98;
		letter-spacing: -0.04em;
		color: var(--text-main);
	}

	.section-copy {
		margin: 0;
		max-width: 42rem;
		font-size: 1.08rem;
		line-height: 1.8;
		color: var(--text-muted);
	}

	.gradient-text {
		background: linear-gradient(135deg, #d4d4d8, #a78bfa, #f472b6);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
	}

	.cta-row,
	.chip-list,
	.footer-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.95rem 1.4rem;
		border-radius: 999px;
		font-weight: 700;
		text-decoration: none;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease,
			background 180ms ease;
	}

	.button:hover,
	.feature-link:hover {
		transform: translateY(-2px);
	}

	.button-primary {
		background: #ffffff;
		color: #050505;
		box-shadow: 0 10px 30px rgba(255, 255, 255, 0.15);
	}

	.button-secondary {
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		color: var(--text-main);
		backdrop-filter: blur(12px);
	}

	.chip {
		padding: 0.5rem 0.8rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.signal-grid,
	.feature-grid,
	.card-grid {
		display: grid;
		gap: 1rem;
	}

	.signal-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.signal-card,
	.glass-card {
		background: var(--glass-bg);
		border: 1px solid var(--glass-border);
		border-radius: 24px;
		backdrop-filter: blur(20px);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
	}

	.signal-card {
		padding: 1rem;
	}

	.signal-value {
		margin: 0;
		font-family: var(--ps-font-display);
		font-size: 1.65rem;
		letter-spacing: -0.04em;
		color: #ffffff;
	}

	.signal-card h2 {
		margin: 0.3rem 0 0.5rem;
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #d4d4d8;
	}

	.signal-card p,
	.feature-card p,
	.feature-card li,
	.pillar-card p,
	.developer-card p,
	.developer-card li,
	.footer-copy {
		margin: 0;
		color: var(--text-muted);
		line-height: 1.72;
	}

	.hero-panel {
		min-height: 520px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
		background: radial-gradient(circle at center, rgba(72, 38, 127, 0.15) 0%, transparent 70%);
		border: none;
		box-shadow: none;
	}

	.globe-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: scale(1);
		filter: drop-shadow(0 0 50px rgba(72, 38, 127, 0.3));
	}

	:global(.globe-ascii) {
		color: rgba(255, 255, 255, 0.86) !important;
		text-shadow: 0 0 5px rgba(255, 255, 255, 0.25);
	}

	.glass-orb {
		position: absolute;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(71, 70, 82, 0.4), rgba(71, 70, 82, 0.1));
		border: 1px solid rgba(255, 255, 255, 0.18);
		backdrop-filter: blur(10px);
	}

	.orb-1 {
		width: 96px;
		height: 96px;
		top: -20px;
		right: -10px;
		animation: float 6s ease-in-out infinite;
	}

	.orb-2 {
		width: 56px;
		height: 56px;
		bottom: 40px;
		left: -20px;
		animation: float 8s ease-in-out infinite reverse;
	}

	.section-stack {
		display: grid;
		gap: 1rem;
	}

	.feature-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-top: 0.8rem;
	}

	.feature-card,
	.developer-card {
		padding: 1.45rem;
		display: grid;
		gap: 0.9rem;
		align-content: start;
	}

	.feature-eyebrow,
	.panel-label {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a9c7ff;
	}

	.feature-card h3,
	.pillar-card h3,
	.developer-card h2,
	.developer-card h3 {
		margin: 0;
		font-family: var(--ps-font-display);
		font-size: 1.55rem;
		letter-spacing: -0.03em;
		color: #ffffff;
	}

	.feature-card ul,
	.developer-card ul {
		display: grid;
		gap: 0.65rem;
		margin: 0;
		padding-left: 1rem;
	}

	.feature-link,
	.hover-link {
		display: inline-flex;
		align-items: center;
		font-weight: 700;
		color: #ffffff;
		text-decoration: none;
		transition:
			transform 180ms ease,
			color 180ms ease;
	}

	.feature-link:hover,
	.hover-link:hover {
		color: #a9c7ff;
	}

	.card-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-top: 1rem;
	}

	.pillar-card {
		padding: 1.45rem;
	}

	.developer-card {
		grid-column: span 6;
	}

	.accent-card {
		background: rgba(255, 255, 255, 0.05);
	}

	.footer {
		border-top: 1px solid var(--glass-border);
		padding: 2.5rem 0 3rem;
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(20px);
	}

	.footer-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.footer-mark {
		margin: 0 0 0.5rem;
		font-family: var(--ps-font-display);
		font-size: 2rem;
		font-weight: 800;
	}

	.fade-in {
		animation: fadeIn 1s ease forwards;
		opacity: 0;
	}

	.slide-up {
		animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		opacity: 0;
		transform: translateY(30px);
	}

	.slide-left {
		animation: slideLeft 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		opacity: 0;
		transform: translateX(30px);
	}

	.fade-in-delay {
		animation: fadeIn 1s ease 0.2s forwards;
		opacity: 0;
	}

	.fade-in-delay-2 {
		animation: fadeIn 1s ease 0.4s forwards;
		opacity: 0;
	}

	.fade-in-delay-3 {
		animation: fadeIn 1s ease 0.6s forwards;
		opacity: 0;
	}

	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideLeft {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (max-width: 960px) {
		.hero-grid,
		.developer-grid,
		.signal-grid,
		.feature-grid,
		.card-grid {
			grid-template-columns: 1fr;
		}

		.hero-copy,
		.hero-panel,
		.developer-card {
			grid-column: 1 / -1;
		}

		.hero,
		.feature-map,
		.thesis,
		.developers {
			padding: 3rem 0;
		}

		.hero-panel {
			min-height: 340px;
		}

		.globe-container {
			transform: scale(1);
		}

		.footer-row {
			flex-direction: column;
		}
	}
</style>
