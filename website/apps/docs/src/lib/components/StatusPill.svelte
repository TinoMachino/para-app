<script lang="ts">
	type Status = 'draft' | 'experimental' | 'stable' | 'active' | 'planned' | 'deprecated';

	let { status }: { status: Status } = $props();
</script>

<span class="status-pill" data-status={status}>{status}</span>
