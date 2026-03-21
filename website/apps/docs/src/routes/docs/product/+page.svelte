<script lang="ts">
	type GalleryShot = {
		src: string;
		title: string;
		copy: string;
	};

	const interfaceShots: GalleryShot[] = [
		{
			src: '/product/value-prop-1.webp',
			title: 'Entry and orientation',
			copy: 'The opening product language is closer to a guided civic app than to an infinite-scroll feed.'
		},
		{
			src: '/product/value-prop-2.webp',
			title: 'Reading and exploration',
			copy: 'The product teaches a reading mode with guided steps and explicit context, not just velocity.'
		},
		{
			src: '/product/value-prop-3.webp',
			title: 'Participation framing',
			copy: 'The app keeps steering users toward civic surfaces, community context, and structured participation.'
		}
	];

	const postShots: GalleryShot[] = [
		{
			src: '/product/bookmarks.webp',
			title: 'Saved and reading layers',
			copy: 'Saved content and highlights support slower political reading instead of just boosting the fastest take.'
		},
		{
			src: '/product/notifications.webp',
			title: 'Post and response loops',
			copy: 'The notification layer keeps the social graph visible, but the product still reads more like a threaded community system than a broadcast timeline.'
		},
		{
			src: '/product/verification-1.png',
			title: 'Identity and civic trust',
			copy: 'Verification and account-legibility surfaces already sit inside the product experience instead of being hidden in a purely backend story.'
		},
		{
			src: '/product/verification-2.png',
			title: 'Profile-adjacent authority',
			copy: 'Trust signals are shown as a product concern, not just as a support concern.'
		}
	];

	const mapExamples = [
		{
			title: 'National political trends',
			route: '/map',
			copy: 'A country-level reading of where policies, parties, or nonants are clustering.'
		},
		{
			title: 'State and local discourse',
			route: '/base, /communities, /my-base',
			copy: 'Filters and local civic entry points should make state and city discourse feel first-class.'
		},
		{
			title: 'Community overlays',
			route: '/communities/profile/:communityId',
			copy: 'Community-specific maps can turn ideological, regional, and issue-based alignment into something spatially legible.'
		}
	];
</script>

<svelte:head>
	<title>Product • PARA Docs</title>
	<meta
		name="description"
		content="Visual product gallery for PARA: interface shots, post surfaces, and map-oriented civic product examples."
	/>
</svelte:head>

<section class="docs-hero-card">
	<p class="docs-hero-kicker">Product</p>
	<h1>See the product before reading the contract.</h1>
	<p>
		PARA reads more like Reddit than X. Communities matter more than a single universal timeline,
		reading matters more than velocity, and the product keeps returning to civic spaces like RAQ,
		cabildeo, maps, highlights, and local participation.
	</p>

	<div class="docs-meta-grid">
		<div class="docs-meta-card">
			<span class="docs-meta-label">Primary feel</span>
			<div class="docs-meta-value">Community-first, threaded, and civic.</div>
		</div>
		<div class="docs-meta-card">
			<span class="docs-meta-label">Closer to</span>
			<div class="docs-meta-value">Reddit-style spaces, archives, and topical participation.</div>
		</div>
		<div class="docs-meta-card">
			<span class="docs-meta-label">Not mainly</span>
			<div class="docs-meta-value">
				A single algorithmic shout-stream optimized for constant broadcast.
			</div>
		</div>
	</div>
</section>

<div class="docs-editorial-block">
	<section class="docs-section-card">
		<p class="docs-section-kicker">UI gallery</p>
		<h2>Interface frames</h2>
		<p>
			These product images come from the PARA app assets already present in the adjacent source
			repo. They are useful because they show the product tone directly instead of forcing the docs
			to describe the UI abstractly.
		</p>

		<div class="product-gallery-grid">
			{#each interfaceShots as shot (shot.src)}
				<article class="gallery-card">
					<div class="gallery-frame">
						<img class="gallery-image" src={shot.src} alt={shot.title} loading="lazy" />
					</div>
					<div class="gallery-copy">
						<h3>{shot.title}</h3>
						<p>{shot.copy}</p>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="docs-section-card">
		<p class="docs-section-kicker">Posts and other stuff</p>
		<h2>Posts, saved content, trust surfaces, and reading loops</h2>
		<p>
			The app does have posts, notifications, and identity surfaces, but they are wrapped in slower
			product patterns like saved reading, civic organization, and follow-up context.
		</p>

		<div class="product-gallery-grid product-gallery-grid-wide">
			{#each postShots as shot (shot.src)}
				<article class="gallery-card">
					<div class="gallery-frame">
						<img class="gallery-image" src={shot.src} alt={shot.title} loading="lazy" />
					</div>
					<div class="gallery-copy">
						<h3>{shot.title}</h3>
						<p>{shot.copy}</p>
					</div>
				</article>
			{/each}
		</div>

		<div class="wide-shot">
			<div class="wide-shot-frame">
				<img src="/product/social-card-default.png" alt="PARA social card surface" loading="lazy" />
			</div>
			<div class="wide-shot-copy">
				<h3>Public social layer</h3>
				<p>
					PARA still has shareable public surfaces, but the product framing is not “post first,
					everything else later.” It is closer to discussion spaces, saved reading, and structured
					context.
				</p>
			</div>
		</div>
	</section>

	<section class="docs-section-card">
		<p class="docs-section-kicker">Why it feels different</p>
		<h2>More like Reddit than X</h2>

		<div class="docs-split-grid">
			<div class="docs-note-panel">
				<h3>Communities are structural</h3>
				<p>
					Communities, community profiles, badges, RAQ subroutes, cabildeo, and local discussion
					make the app feel organized by spaces and belief clusters rather than by one global feed.
				</p>
			</div>
			<div class="docs-note-panel">
				<h3>Reading is slower and more cumulative</h3>
				<p>
					Highlights, bookmarks, policy dashboards, representatives, and RAQ results make PARA feel
					more like a political reading system than a hot-take conveyor belt.
				</p>
			</div>
		</div>
	</section>

	<section class="docs-section-card">
		<p class="docs-section-kicker">Maps</p>
		<h2>Map functionality deserves its own subsection</h2>
		<p>
			The source app already reserves a real <code>/map</code> surface and sits next to local civic
			routing like <code>/base</code>, <code>/my-base</code>, and community profile views. That
			makes geographic political trends part of the product thesis, not just a line in the pitch.
		</p>

		<div class="map-gallery-shell">
			<div class="map-hero-frame">
				<img
					src="/product/social-card-gradient.png"
					alt="PARA map and civic exploration backdrop"
					loading="lazy"
				/>
			</div>
			<div class="map-grid">
				{#each mapExamples as example (example.title)}
					<article class="map-card">
						<p class="map-card-route">{example.route}</p>
						<h3>{example.title}</h3>
						<p>{example.copy}</p>
					</article>
				{/each}
			</div>
		</div>
	</section>
</div>

<style>
	h1,
	h2,
	h3,
	p {
		margin: 0;
	}

	.product-gallery-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.product-gallery-grid-wide {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.gallery-card,
	.wide-shot,
	.map-card {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1.2rem;
		background: rgba(255, 255, 255, 0.035);
		overflow: hidden;
	}

	.gallery-frame,
	.wide-shot-frame,
	.map-hero-frame {
		padding: 0.9rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.015)),
			rgba(255, 255, 255, 0.02);
	}

	.gallery-image,
	.wide-shot-frame img,
	.map-hero-frame img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 0.9rem;
	}

	.gallery-copy,
	.wide-shot-copy,
	.map-card {
		padding: 1rem 1.05rem 1.1rem;
	}

	.gallery-copy {
		display: grid;
		gap: 0.45rem;
	}

	.gallery-copy h3,
	.wide-shot-copy h3,
	.map-card h3 {
		font-size: 1.1rem;
		color: #ffffff;
	}

	.gallery-copy p,
	.wide-shot-copy p,
	.map-card p {
		color: #d0cad9;
		line-height: 1.72;
	}

	.wide-shot {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
		margin-top: 1rem;
	}

	.map-gallery-shell {
		display: grid;
		gap: 1rem;
	}

	.map-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.map-card {
		display: grid;
		gap: 0.55rem;
		background:
			linear-gradient(180deg, rgba(72, 38, 127, 0.18), rgba(46, 32, 51, 0.34)),
			rgba(255, 255, 255, 0.03);
	}

	.map-card-route {
		font-family: var(--ps-font-mono);
		font-size: 0.8rem;
		letter-spacing: 0.04em;
		color: var(--para-accent-text);
	}

	@media (max-width: 960px) {
		.product-gallery-grid,
		.product-gallery-grid-wide,
		.map-grid,
		.wide-shot {
			grid-template-columns: 1fr;
		}
	}
</style>
