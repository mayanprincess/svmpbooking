<script lang="ts">
	/**
	 * Main Booking Form Component
	 * Combines all form elements and handles availability search
	 */

	import DateRangeSelector from './DateRangeSelectorMobile.svelte';
	import GuestSelector from './GuestSelector.svelte';
	import PromoCodeInput from './PromoCodeInput.svelte';
	import type { EnrichedRoomAvailability } from '$lib/types/opera';
	

	interface Props {
		onSearch?: (results: EnrichedRoomAvailability[]) => void;
	}

	let { onSearch }: Props = $props();

	// Form state
	let checkIn = $state('');
	let checkOut = $state('');
	let adults = $state(2);
	let children = $state(0);
	let promoCode = $state('');

	// UI state
	let loading = $state(false);
	let error = $state<string | null>(null);
	let results = $state<EnrichedRoomAvailability[]>([]);

	// Form validation
	let isValid = $derived(checkIn && checkOut && adults >= 1);

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!isValid) {
			error = 'Please fill in all required fields';
			return;
		}

		loading = true;
		error = null;
		results = [];

		try {
			const params = new URLSearchParams({
				checkIn,
				checkOut,
				adults: adults.toString(),
				children: children.toString()
			});

			if (promoCode) {
				params.append('promoCode', promoCode);
			}

			const response = await fetch(`/api/availability?${params.toString()}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to fetch availability');
			}

			const data = await response.json();

			if (data.success) {
				results = data.data.rooms;
				if (onSearch) {
					onSearch(results);
				}

				if (results.length === 0) {
					error = 'No rooms available for the selected dates. Please try different dates.';
				}
			} else {
				throw new Error('Unexpected response format');
			}
		} catch (err) {
			console.error('Search error:', err);
			error = err instanceof Error ? err.message : 'An error occurred while searching';
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		checkIn = '';
		checkOut = '';
		adults = 2;
		children = 0;
		promoCode = '';
		error = null;
		results = [];
	}
</script>

<div class="booking-form">
	<div class="form-header">
		<h2>Find Your Perfect Villa</h2>
		<p class="form-subtitle">Select your dates and number of guests to begin</p>
	</div>

	<form onsubmit={handleSubmit}>
		<div class="form-content">
			<DateRangeSelector bind:checkIn bind:checkOut disabled={loading} />

			<GuestSelector bind:adults bind:children disabled={loading} />

			<PromoCodeInput bind:promoCode disabled={loading} />

			{#if error}
				<div class="error-message">
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" />
						<path d="M10 6V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						<circle cx="10" cy="14" r="1" fill="currentColor" />
					</svg>
					{error}
				</div>
			{/if}

			<div class="form-actions">
				<button type="submit" class="btn btn-primary btn-search" disabled={!isValid || loading}>
					{#if loading}
						<span class="spinner"></span>
						Searching...
					{:else}
						<svg
							width="20"
							height="20"
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
							<path
								d="M13.5 13.5L17 17"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
						Search Availability
					{/if}
				</button>

				{#if results.length > 0}
					<button type="button" class="btn btn-outline" onclick={resetForm}>Reset Search</button>
				{/if}
			</div>
		</div>
	</form>

	{#if results.length > 0}
		<div class="results-summary">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<div>
				<strong>{results.length}</strong>
				{results.length === 1 ? 'villa' : 'villas'} available for your dates
			</div>
		</div>
	{/if}
</div>

<style>
	.booking-form {
		background-color: var(--color-white);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		padding: var(--spacing-2xl);
		max-width: 600px;
		margin: 0 auto;
	}

	.form-header {
		text-align: center;
		margin-bottom: var(--spacing-xl);
	}

	.form-header h2 {
		font-size: 1.875rem;
		color: var(--color-primary);
		margin-bottom: var(--spacing-sm);
	}

	.form-subtitle {
		color: var(--color-gray);
		font-size: 0.9375rem;
	}

	.form-content {
		display: flex;
		flex-direction: column;
	}

	.form-actions {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-top: var(--spacing-md);
	}

	.btn-search {
		width: 100%;
		font-size: 1.125rem;
		padding: var(--spacing-lg) var(--spacing-xl);
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background-color: rgba(239, 68, 68, 0.1);
		border: 2px solid var(--color-error);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: 0.875rem;
		margin-bottom: var(--spacing-md);
	}

	.error-message svg {
		flex-shrink: 0;
	}

	.results-summary {
		margin-top: var(--spacing-xl);
		padding-top: var(--spacing-xl);
		border-top: 2px solid var(--color-gray-light);
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		color: var(--color-success);
		font-size: 1rem;
	}

	.results-summary svg {
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.booking-form {
			padding: var(--spacing-lg);
		}

		.form-header h2 {
			font-size: 1.5rem;
		}

		.form-actions {
			position: sticky;
			bottom: 0;
			background-color: var(--color-white);
			padding: var(--spacing-md) 0;
			margin-left: calc(var(--spacing-lg) * -1);
			margin-right: calc(var(--spacing-lg) * -1);
			padding-left: var(--spacing-lg);
			padding-right: var(--spacing-lg);
			box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1);
		}
	}
</style>

