<script lang="ts">
	import '@parasocial/ui/tokens.css';
	import favicon from '$lib/assets/favicon.png';
	import '$lib/styles/app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{@render children()}
