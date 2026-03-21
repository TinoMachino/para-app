<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import StatusPill from '$lib/components/StatusPill.svelte';

	let { children, data } = $props();
</script>

<div class="docs-shell">
	<div class="docs-layout">
		<aside class="docs-panel sidebar">
			<div class="sidebar-block">
				<p class="sidebar-kicker">Docs</p>
				<a class="brand" href={resolve('/docs')}>PARA Docs</a>
				<p class="sidebar-copy">
					Product context at the surface, schema reference and technical framing nearby.
				</p>
			</div>

			<nav class="sidebar-block">
				<p class="sidebar-title">Sections</p>
				<div class="nav-list">
					{#each data.primaryNav as item (item.href)}
						<a class:active={page.url.pathname === item.href} href={resolve(item.href)}>
							{item.label}
						</a>
					{/each}
				</div>
			</nav>

			<div class="sidebar-block">
				<p class="sidebar-title">Schemas</p>
				<div class="nav-list compact">
					{#each data.schemaIndex as schema (schema.id)}
						<a
							class:active={page.url.pathname === `/docs/schemas/${schema.id}`}
							href={resolve(`/docs/schemas/${schema.id}`)}
						>
							{schema.title}
						</a>
					{/each}
				</div>
			</div>

			<div class="sidebar-block architecture-notes">
				<p class="sidebar-title">Implementation notes</p>
				{#each data.architectureNotes as note (note.id)}
					<div class="note-row">
						<div>
							<strong>{note.title}</strong>
							<p>{note.summary}</p>
						</div>
						<StatusPill status={note.status} />
					</div>
				{/each}
			</div>
		</aside>

		<main class="docs-panel docs-content">
			<div class="docs-prose">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<style>
	.sidebar {
		padding: 1.55rem;
		position: sticky;
		top: 5.4rem;
		align-self: start;
	}

	.sidebar-block + .sidebar-block {
		margin-top: 1.45rem;
		padding-top: 1.2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}

	.sidebar-kicker {
		margin: 0 0 0.55rem;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--para-accent-text);
	}

	.brand {
		font-family: var(--ps-font-display);
		font-size: 1.85rem;
		letter-spacing: -0.03em;
		color: #ffffff;
	}

	.sidebar-copy,
	.note-row p {
		margin: 0.55rem 0 0;
		color: #c6c0d2;
		line-height: 1.72;
	}

	.sidebar-title {
		margin: 0 0 0.85rem;
		font-size: 0.82rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #918ba0;
	}

	.nav-list {
		display: grid;
		gap: 0.45rem;
	}

	.nav-list a {
		padding: 0.7rem 0.8rem;
		border-radius: 0.9rem;
		font-weight: 600;
		color: #d6d0df;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid transparent;
	}

	.nav-list a.active,
	.nav-list a:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: var(--para-primary-300);
		color: #ffffff;
	}

	.compact a {
		font-size: 0.92rem;
	}

	.architecture-notes {
		display: grid;
		gap: 0.8rem;
	}

	.note-row {
		display: grid;
		gap: 0.6rem;
		padding: 0.95rem;
		border-radius: 1rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03)),
			rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.note-row strong {
		font-size: 0.96rem;
		color: #ffffff;
	}

	@media (max-width: 960px) {
		.sidebar {
			position: static;
		}
	}
</style>
