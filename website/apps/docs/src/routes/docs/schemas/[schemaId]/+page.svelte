<script lang="ts">
	import StatusPill from '$lib/components/StatusPill.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.schema.title} • PARA Docs</title>
</svelte:head>

<div class="docs-prose">
	<div class="page-head">
		<div>
			<p class="eyebrow">Schema reference</p>
			<h1>{data.schema.title}</h1>
		</div>
		<StatusPill status={data.schema.status} />
	</div>
	<p>{data.schema.summary}</p>
</div>

<section class="detail-grid">
	<div class="docs-panel detail-card">
		<h2>Fields</h2>
		<div class="field-list">
			{#each data.schema.fields as field (field.name)}
				<article class="field-row">
					<div class="field-head">
						<div>
							<h3>{field.name}</h3>
							<p>{field.type}</p>
						</div>
						<span>{field.required ? 'Required' : 'Optional'}</span>
					</div>
					<p>{field.description}</p>
				</article>
			{/each}
		</div>
	</div>

	<div class="meta-column">
		<div class="docs-panel detail-card">
			<h2>Metadata</h2>
			<dl>
				<div>
					<dt>Schema ID</dt>
					<dd>{data.schema.id}</dd>
				</div>
				<div>
					<dt>Lexicon source</dt>
					<dd>{data.schema.backendOwner ?? 'TBD'}</dd>
				</div>
				<div>
					<dt>Website source path</dt>
					<dd><code>{data.schema.sourcePath ?? 'TBD'}</code></dd>
				</div>
			</dl>
		</div>

		<div class="docs-panel detail-card">
			<h2>Constraints</h2>
			{#if data.schema.constraints?.length}
				<ul>
					{#each data.schema.constraints as constraint (constraint)}
						<li>{constraint}</li>
					{/each}
				</ul>
			{:else}
				<p class="empty">No published constraints yet.</p>
			{/if}
		</div>

		<div class="docs-panel detail-card">
			<h2>Relationships</h2>
			{#if data.schema.relationships?.length}
				<ul>
					{#each data.schema.relationships as relationship (relationship)}
						<li>{relationship}</li>
					{/each}
				</ul>
			{:else}
				<p class="empty">No published relationships yet.</p>
			{/if}
		</div>
	</div>
</section>

<section class="docs-panel detail-card examples-card">
	<h2>Examples</h2>
	{#if data.schema.examples?.length}
		{#each data.schema.examples as example (example)}
			<pre><code>{example}</code></pre>
		{/each}
	{:else}
		<p class="empty">No example payloads exported yet.</p>
	{/if}
</section>

<style>
	.page-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.2rem;
	}

	.eyebrow {
		margin: 0 0 0.6rem;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ps-color-ink-soft);
	}

	.detail-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.9fr);
		gap: 1.15rem;
	}

	.detail-card {
		padding: 1.35rem;
	}

	.field-list {
		display: grid;
		gap: 0.9rem;
	}

	.field-row {
		padding: 1.05rem;
		border-radius: 1rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.03)),
			rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.field-head {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
		margin-bottom: 0.55rem;
	}

	h2,
	h3,
	p,
	dl,
	dd,
	dt {
		margin: 0;
	}

	h3 {
		font-size: 1rem;
		color: #ffffff;
	}

	.field-head p,
	.field-row > p,
	.empty,
	li,
	dd {
		color: #cdc8d8;
		line-height: 1.7;
	}

	.field-head span {
		font-size: 0.78rem;
		font-weight: 700;
		color: #f4f7ff;
	}

	.meta-column {
		display: grid;
		gap: 1rem;
	}

	dl,
	ul {
		display: grid;
		gap: 0.7rem;
		padding-left: 1rem;
	}

	dl div {
		display: grid;
		gap: 0.2rem;
	}

	dt {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9e97ae;
	}

	.examples-card {
		margin-top: 1rem;
	}

	@media (max-width: 920px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
