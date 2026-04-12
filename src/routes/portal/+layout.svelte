<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="portal-app">
	{@render children()}
</div>

<style>
	.portal-app {
		--pd-serif: 'Spectral', Georgia, 'Times New Roman', serif;
		--pd-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
		--pd-navy: #183453;
		--pd-navy-deep: #0f1f33;
		--pd-gold: #c5a56f;
		--pd-cream: #f7f4ef;
		--pd-cream-dark: #ede8e0;
		--pd-ink: #1a2f47;
		--pd-muted: #5c6b7a;
		min-height: 100vh;
		font-family: var(--pd-sans);
		background: var(--pd-cream-dark);
		color: var(--pd-ink);
	}
</style>
