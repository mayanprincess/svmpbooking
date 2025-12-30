<script lang="ts">
	/**
	 * Main Booking Page
	 * Entry point for the booking engine
	 */

	import Header from '$lib/components/Header.svelte';
	import BookingForm from '$lib/components/BookingFormPremium.svelte';
	import RoomCard from '$lib/components/RoomCardPremium.svelte';
	import type { EnrichedRoomAvailability } from '$lib/types/opera';

	let searchResults = $state<EnrichedRoomAvailability[]>([]);
	let showResults = $state(false);

	function handleSearch(results: EnrichedRoomAvailability[]) {
		searchResults = results;
		showResults = true;

		// Scroll to results on mobile
		if (window.innerWidth < 768) {
			setTimeout(() => {
				const resultsSection = document.getElementById('results-section');
				if (resultsSection) {
					resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}, 100);
		}
	}
</script>

<svelte:head>
	<title>Mayan Princess Beach & Dive Resort - Booking</title>
	<meta name="description" content="Book your perfect villa at Mayan Princess Beach & Dive Resort" />
</svelte:head>

<div class="page-container">
	<!-- Header Navigation -->
	<Header />

	<!-- Booking Section -->
	<main class="main-content">
		<section class="booking-section">
			<div class="container container-narrow">
				<BookingForm onSearch={handleSearch} />
			</div>
		</section>

		<!-- Results Section -->
		{#if showResults}
			<section id="results-section" class="results-section">
				<div class="container">
					{#if searchResults.length > 0}
						<div class="results-header">
							<h2>Available Villas</h2>
							<p class="results-count">
								{searchResults.length}
								{searchResults.length === 1 ? 'villa' : 'villas'} match your search
							</p>
						</div>

						<div class="rooms-grid">
							{#each searchResults as room (room.roomTypeCode)}
								<RoomCard {room} language="en" />
							{/each}
						</div>
					{:else}
						<div class="no-results">
							<svg
								width="64"
								height="64"
								viewBox="0 0 64 64"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="4" />
								<path d="M32 20V32" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
								<circle cx="32" cy="44" r="2" fill="currentColor" />
							</svg>
							<h3>No Rooms Available</h3>
							<p>We couldn't find any available rooms for your selected dates.</p>
							<p>Please try different dates or adjust your search criteria.</p>
						</div>
					{/if}
				</div>
			</section>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="footer">
		<div class="container">
			<p class="footer-text">© 2025 Mayan Princess Beach & Dive Resort. All rights reserved.</p>
			<p class="footer-links">
				<a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a>
			</p>
		</div>
	</footer>
</div>

<style>
	.page-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Main Content */
	.main-content {
		flex: 1;
	}

	.booking-section {
		padding: var(--spacing-3xl) var(--spacing-lg);
		margin-top: calc(var(--spacing-2xl) * -1);
		position: relative;
		z-index: 10;
	}

	.results-section {
		padding: var(--spacing-3xl) var(--spacing-lg);
		background-color: var(--color-beige-light);
	}

	.results-header {
		text-align: center;
		margin-bottom: var(--spacing-2xl);
	}

	.results-header h2 {
		font-size: 2rem;
		color: var(--color-primary);
		margin-bottom: var(--spacing-sm);
	}

	.results-count {
		color: var(--color-gray);
		font-size: 1rem;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: var(--spacing-2xl);
	}

	.no-results {
		text-align: center;
		padding: var(--spacing-3xl);
		color: var(--color-gray);
	}

	.no-results svg {
		margin-bottom: var(--spacing-lg);
		color: var(--color-secondary);
	}

	.no-results h3 {
		font-size: 1.5rem;
		color: var(--color-primary);
		margin-bottom: var(--spacing-md);
	}

	.no-results p {
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: var(--spacing-sm);
	}

	/* Footer */
	.footer {
		background-color: var(--color-primary);
		color: var(--color-white);
		padding: var(--spacing-xl) var(--spacing-lg);
		text-align: center;
		margin-top: auto;
	}

	.footer-text {
		margin-bottom: var(--spacing-sm);
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.footer-links {
		font-size: 0.875rem;
	}

	.footer-links a {
		color: var(--color-secondary);
	}

	.footer-links a:hover {
		color: var(--color-tertiary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.booking-section {
			padding: var(--spacing-2xl) var(--spacing-lg);
		}

		.results-section {
			padding: var(--spacing-2xl) var(--spacing-lg);
		}

		.rooms-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}
	}

	@media (max-width: 480px) {
		.rooms-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
