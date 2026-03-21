<script lang="ts">
	import { resolve } from '$app/paths';
	import { architectureLayers } from '$lib/content/site';
	import StatusPill from '$lib/components/StatusPill.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Schemas • PARA Docs</title>
</svelte:head>

<section class="docs-panel schema-intro">
	<div class="docs-prose">
		<p class="intro-kicker">Schemas</p>
		<h1>Schema reference</h1>
		<p>
			Use this section when you want the technical shape behind PARA's public surfaces. These
			pages curate the `com.para.*` lexicons in watx so the records and views are easier to read in
			the context of the product.
		</p>
	</div>
</section>

<div class="schema-grid">
	{#each data.schemas as schema (schema.id)}
		<a class="schema-card docs-panel" href={resolve(`/docs/schemas/${schema.id}`)}>
			<div class="schema-card-head">
				<h2>{schema.title}</h2>
				<StatusPill status={schema.status} />
			</div>
			<p>{schema.summary}</p>
			<div class="schema-tags">
				{#each schema.tags as tag (tag)}
					<span>{tag}</span>
				{/each}
			</div>
		</a>
	{/each}
</div>

<section class="docs-panel schema-appendix">
	<div class="docs-prose appendix-prose">
		<p class="intro-kicker">Implementation appendix</p>
		<h2>How the schemas fit the backend</h2>
		<p>
			Schema reference is where the technical layer becomes concrete. The notes below connect the
			records and views to the product surfaces they support.
		</p>
	</div>
	<div class="appendix-grid">
		{#each architectureLayers as layer (layer.title)}
			<article class="appendix-card">
				<p class="appendix-kicker">{layer.eyebrow}</p>
				<h3>{layer.title}</h3>
				<p>{layer.copy}</p>
			</article>
		{/each}
	</div>
</section>

<style>
	.schema-intro {
		margin-bottom: 1.4rem;
		padding: 1.4rem 1.55rem;
	}

	.intro-kicker {
		margin: 0 0 0.55rem;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--para-accent-text);
	}

	.schema-grid {
		display: grid;
		gap: 1.15rem;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	}

	.schema-appendix {
		margin-top: 1.4rem;
		padding: 1.4rem 1.55rem;
	}

	.appendix-prose {
		max-width: 42rem;
	}

	.appendix-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 1.25rem;
	}

	.appendix-card {
		padding: 1.1rem;
		border-radius: 1.1rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.04);
	}

	.appendix-kicker {
		margin: 0 0 0.45rem;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a9c7ff;
	}

	.schema-card {
		padding: 1.4rem;
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			box-shadow 160ms ease;
	}

	.schema-card:hover {
		transform: translateY(-3px);
		border-color: var(--para-primary-300);
		box-shadow: 0 24px 50px rgba(0, 0, 0, 0.28);
	}

	.schema-card-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.8rem;
		margin-bottom: 0.9rem;
	}

	h2 {
		margin: 0;
		font-size: 1.28rem;
		line-height: 1.15;
		color: #ffffff;
	}

	h3 {
		margin: 0 0 0.65rem;
		font-size: 1.08rem;
		line-height: 1.2;
		color: #ffffff;
	}

	p {
		margin: 0 0 1.1rem;
		line-height: 1.8;
		color: #cdc8d8;
	}

	.schema-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
	}

	.schema-tags span {
		padding: 0.42rem 0.68rem;
		border-radius: var(--ps-radius-pill);
		background: rgba(255, 255, 255, 0.09);
		color: #f3f6ff;
		font-size: 0.82rem;
		font-weight: 600;
	}

	@media (max-width: 960px) {
		.appendix-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
