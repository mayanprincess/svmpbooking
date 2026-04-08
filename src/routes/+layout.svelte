<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { initLocale } from '$lib/i18n';

	let { children } = $props();

	onMount(() => {
		initLocale();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="dns-prefetch" href="https://www.mayanprincess.com" />
	<link rel="preconnect" href="https://www.mayanprincess.com" crossorigin="" />
	<meta name="theme-color" content="#183453" />
	<meta name="application-name" content="Mayan Princess Booking" />
</svelte:head>

{@render children()}
