<script lang="ts">
	/**
	 * Main Booking Page
	 * Entry point for the booking engine
	 */

	import Header from '$lib/components/Header.svelte';
	import BookingStepper from '$lib/components/BookingStepper.svelte';
	import BookingDebugPanel from '$lib/components/BookingDebugPanel.svelte';
</script>

<svelte:head>
	<title>Mayan Princess Beach & Dive Resort - Booking</title>
	<meta name="description" content="Book your perfect villa at Mayan Princess Beach & Dive Resort" />
</svelte:head>

<div class="page-container" id="page-top">
	<!-- Header Navigation -->
	<Header />

	<!-- Booking Stepper -->
	<main class="main-content" id="main-content">
		<BookingStepper />
	</main>

	<!-- Debug Panel (only shows with ?debug=true in URL) -->
	<BookingDebugPanel />
</div>

<style>
	:global(:root) {
		--color-primary: #183453;
		--color-secondary: #c5a56f;
		--color-tertiary: #d6a34b;
		--color-premium: #b58e4b;
		--color-family: #2babd9;
		--color-breakfast: #2babd9;
		--color-promo: #9333ea;
	}

	.page-container {
		min-height: 100vh;
		background: linear-gradient(180deg, #f5f3f0 0%, #ffffff 40%);
		scroll-behavior: smooth;
	}

	.main-content {
		padding: 2rem 0;
	}

	/* Ensure smooth scrolling works globally */
	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		scroll-behavior: smooth;
	}
</style>
