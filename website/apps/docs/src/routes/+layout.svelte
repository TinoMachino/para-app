<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import '@parasocial/ui/tokens.css';
	import favicon from '$lib/assets/favicon.png';
	import logomark from '$lib/assets/logomark.svg';
	import '$lib/styles/app.css';

	let { children } = $props();

	const topNav = [
		{ href: '/about', label: 'About' },
		{ href: '/docs/product', label: 'Product' },
		{ href: '/trust-and-safety', label: 'Trust and safety' },
		{ href: '/docs', label: 'Docs' },
		{ href: '/try-app', label: 'Try app' }
	] as const;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="site-shell">
	<header class="site-header">
		<div class="site-header-inner">
			<a class="site-header-mark" href={resolve('/')} aria-label="PARA home">
				<span class="site-header-lockup">
					<span class="site-header-motif-layer">
						<img class="site-header-motif" src={logomark} alt="" />
					</span>
					<span class="site-header-wordmark-shell">
						<span class="site-header-rhombus-layer">
							<span class="site-header-rhombus"></span>
						</span>
						<span class="site-header-lockup-text">PARA</span>
					</span>
				</span>
			</a>
			<nav class="site-nav">
				{#each topNav as item (item.href)}
					<a class:active={page.url.pathname === item.href} href={resolve(item.href)}>
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="site-footer">
		<div class="site-footer-inner">
			<div>
				<p class="footer-mark">
					<span class="site-mark-shell">
						<img class="site-mark" src={favicon} alt="" />
					</span>
					<span class="site-brand-text">PARA</span>
				</p>
				<p class="footer-copy">
					Browse the thesis, product surfaces, trust model, app access, and schema reference from
					any entry point.
				</p>
			</div>
			<div class="footer-links">
				<a href={resolve('/docs')}>Docs</a>
				<a href={resolve('/about')}>About</a>
				<a href={resolve('/trust-and-safety')}>Trust and safety</a>
				<a href={resolve('/try-app')}>Try app</a>
				<a href={resolve('/docs/schemas')}>Schemas</a>
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		background: #0f0a14 !important;
		color: #ffffff !important;
		font-family:
			'Inter',
			-apple-system,
			sans-serif;
	}

	.site-header {
		position: sticky;
		top: 0;
		z-index: 20;
		backdrop-filter: blur(18px);
		background: rgba(255, 255, 255, 0.94);
		border-bottom: 1px solid rgba(71, 70, 82, 0.14);
	}

	.site-header-inner,
	.site-footer-inner {
		width: min(var(--ps-max-width-docs), calc(100% - 2rem));
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.site-header-inner {
		position: relative;
		min-height: 4rem;
		padding: 0.7rem 0;
	}

	.site-header-mark,
	.site-nav {
		flex: 1 1 0;
	}

	.site-header-mark {
		display: inline-flex;
		align-items: center;
		justify-content: flex-start;
		text-decoration: none;
	}

	.site-header-lockup {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 52px;
		padding: 0 0.2rem;
		z-index: 1;
	}

	.site-header-motif-layer {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
		filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.05));
	}

	.site-header-motif {
		display: block;
		width: 69px;
		height: 69px;
	}

	.site-header-wordmark-shell {
		position: absolute;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 6px;
		z-index: 2;
	}

	.site-header-rhombus-layer {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transform: scaleX(3.15) scaleY(0.65);
	}

	.site-header-rhombus {
		width: 24px;
		height: 24px;
		background: rgba(255, 255, 255, 0.9);
		transform: rotate(45deg);
	}

	.site-header-lockup-text {
		position: relative;
		z-index: 3;
		font-family: var(--ps-font-display);
		font-size: 1.65rem;
		letter-spacing: -0.04em;
		line-height: 1;
		color: #474652;
		text-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
	}

	.site-brand,
	.footer-mark {
		display: inline-flex;
		align-items: center;
		gap: 0.7rem;
		font-family: var(--ps-font-display);
		font-size: 1.65rem;
		letter-spacing: -0.03em;
	}

	.site-brand-text {
		color: #474652;
	}

	.site-mark-shell {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.85rem;
		height: 1.85rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.14);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 8px 20px rgba(0, 0, 0, 0.18);
		flex: 0 0 auto;
	}

	.site-mark {
		width: 1.08rem;
		height: 1.08rem;
		filter: brightness(0) invert(1);
	}

	.site-nav,
	.footer-links {
		display: flex;
		flex-wrap: wrap;
		gap: 1.2rem;
	}

	.site-nav {
		justify-content: flex-end;
	}

	.site-nav a,
	.footer-links a {
		padding: 0.3rem 0;
		border-radius: 0;
		font-weight: 500;
		color: #5b5a66;
		transition: all 0.2s ease;
	}

	.site-nav a.active,
	.site-nav a:hover {
		background: transparent;
		color: #2e2033;
	}

	.site-footer {
		padding: 2rem 0;
	}

	.site-footer-inner {
		padding-top: 1.2rem;
		border-top: 1px solid rgba(71, 70, 82, 0.14);
		align-items: flex-start;
	}

	.footer-copy {
		margin: 0.45rem 0 0;
		color: #a1a1aa;
		line-height: 1.65;
	}

	@media (max-width: 960px) {
		.site-header-inner,
		.site-footer-inner {
			width: min(var(--ps-max-width-docs), calc(100% - 1.25rem));
			flex-direction: column;
			align-items: stretch;
		}

		.site-header-mark,
		.site-nav {
			flex: 0 0 auto;
		}

		.site-nav {
			justify-content: flex-start;
		}
	}
</style>
