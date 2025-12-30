<script lang="ts">
	/**
	 * Premium Booking Form Component
	 * Luxury design inspired by Booking.com, Expedia, and high-end hotels
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
	let searchAttempted = $state(false);

	// Form validation
	let isValid = $derived(checkIn && checkOut && adults >= 1);

	// Calculate nights
	let nights = $derived(
		checkIn && checkOut
			? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
			: 0
	);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		searchAttempted = true;

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
		searchAttempted = false;
	}
</script>

<div class="premium-booking-container">
	<!-- Header Section -->
	<div class="booking-header">
		<div class="header-badge">
			<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M10 2L12.09 6.26L17 7.27L13.5 10.97L14.18 16L10 13.77L5.82 16L6.5 10.97L3 7.27L7.91 6.26L10 2Z" fill="currentColor"/>
			</svg>
			<span>Best Rate Guarantee</span>
		</div>
		<h2 class="booking-title">Find Your Perfect Stay</h2>
		<p class="booking-subtitle">Luxury beachfront villas with all-inclusive packages</p>
	</div>

	<!-- Booking Form Card -->
	<form onsubmit={handleSubmit} class="booking-form-card">
		<div class="form-grid">
			<!-- Dates Section -->
			<div class="form-section dates-section">
				<div class="section-header">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect x="3" y="5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="2" />
						<path d="M3 9H17" stroke="currentColor" stroke-width="2" />
						<path d="M7 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						<path d="M13 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					</svg>
					<span class="section-title">When</span>
				</div>
				<DateRangeSelector bind:checkIn bind:checkOut disabled={loading} />
			</div>

			<!-- Guests Section -->
			<div class="form-section guests-section">
				<div class="section-header">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="2" />
						<path d="M5 17C5 13.6863 7.68629 11 11 11C14.3137 11 17 13.6863 17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
					<span class="section-title">Who</span>
				</div>
				<GuestSelector bind:adults bind:children disabled={loading} />
			</div>

			<!-- Promo Code Section -->
			<div class="form-section promo-section">
				<PromoCodeInput bind:promoCode disabled={loading} />
			</div>
		</div>

		<!-- Summary Bar (shows when dates selected) -->
		{#if checkIn && checkOut}
			<div class="booking-summary">
				<div class="summary-item">
					<span class="summary-label">Check-in</span>
					<span class="summary-value">{new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
				</div>
				<div class="summary-divider">→</div>
				<div class="summary-item">
					<span class="summary-label">Check-out</span>
					<span class="summary-value">{new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
				</div>
				<div class="summary-divider">•</div>
				<div class="summary-item">
					<span class="summary-label">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
					<span class="summary-value">{adults + children} {adults + children === 1 ? 'Guest' : 'Guests'}</span>
				</div>
			</div>
		{/if}

		<!-- Error Message -->
		{#if error}
			<div class="error-banner">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" />
					<path d="M10 6V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					<circle cx="10" cy="14" r="1" fill="currentColor" />
				</svg>
				<span>{error}</span>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="form-actions">
			<button type="submit" class="btn-search" disabled={!isValid || loading}>
				{#if loading}
					<span class="btn-spinner"></span>
					<span>Searching...</span>
				{:else}
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="2" />
						<path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
					<span>Search Available Rooms</span>
				{/if}
			</button>

			{#if searchAttempted && results.length > 0}
				<button type="button" class="btn-reset" onclick={resetForm}>
					<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
					New Search
				</button>
			{/if}
		</div>

		<!-- Trust Indicators -->
		<div class="trust-indicators">
			<div class="trust-item">
				<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M10 2L13 8L19 9L14.5 13.5L15.5 19.5L10 16.5L4.5 19.5L5.5 13.5L1 9L7 8L10 2Z" fill="currentColor"/>
				</svg>
				<span>Lowest Price Guaranteed</span>
			</div>
			<div class="trust-item">
				<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M10 1L3 5V9C3 14 6.5 18 10 19C13.5 18 17 14 17 9V5L10 1Z" stroke="currentColor" stroke-width="2" fill="none"/>
					<path d="M7 10L9 12L13 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span>Secure Booking</span>
			</div>
			<div class="trust-item">
				<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
					<path d="M10 6V10L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
				<span>Instant Confirmation</span>
			</div>
		</div>
	</form>

	<!-- Results Count -->
	{#if results.length > 0}
		<div class="results-badge">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<span><strong>{results.length}</strong> {results.length === 1 ? 'villa' : 'villas'} available for your dates</span>
		</div>
	{/if}
</div>

<style>
	.premium-booking-container {
		max-width: 1000px;
		margin: 0 auto;
	}

	/* Header */
	.booking-header {
		text-align: center;
		margin-bottom: var(--spacing-2xl);
	}

	.header-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
		color: var(--color-white);
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--spacing-md);
		box-shadow: 0 4px 12px rgba(197, 165, 111, 0.3);
	}

	.booking-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: var(--spacing-sm);
		letter-spacing: -0.02em;
	}

	.booking-subtitle {
		font-size: 1.125rem;
		color: var(--color-gray-dark);
		font-weight: 400;
	}

	/* Form Card */
	.booking-form-card {
		background: var(--color-white);
		border-radius: var(--radius-xl);
		padding: var(--spacing-2xl);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03);
		border: 1px solid rgba(197, 165, 111, 0.1);
	}

	.form-grid {
		display: grid;
		gap: var(--spacing-xl);
	}

	.form-section {
		background: var(--color-beige-light);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		border: 2px solid transparent;
		transition: all var(--transition-base);
	}

	.form-section:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 8px 24px rgba(197, 165, 111, 0.15);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		color: var(--color-primary);
	}

	.section-header svg {
		color: var(--color-secondary);
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* Summary Bar */
	.booking-summary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-lg);
		padding: var(--spacing-lg);
		background: linear-gradient(135deg, rgba(197, 165, 111, 0.1) 0%, rgba(214, 163, 75, 0.05) 100%);
		border-radius: var(--radius-lg);
		margin-top: var(--spacing-xl);
		border: 2px dashed var(--color-secondary);
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.summary-label {
		font-size: 0.75rem;
		color: var(--color-gray);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.summary-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.summary-divider {
		color: var(--color-secondary);
		font-weight: 700;
		font-size: 1.25rem;
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
		border: 2px solid var(--color-error);
		border-radius: var(--radius-lg);
		color: var(--color-error);
		margin-top: var(--spacing-xl);
		font-weight: 500;
	}

	.error-banner svg {
		flex-shrink: 0;
	}

	/* Action Buttons */
	.form-actions {
		display: flex;
		gap: var(--spacing-md);
		margin-top: var(--spacing-xl);
	}

	.btn-search {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg) var(--spacing-2xl);
		background: linear-gradient(135deg, var(--color-primary) 0%, #1a3d5d 100%);
		color: var(--color-white);
		border: none;
		border-radius: var(--radius-lg);
		font-size: 1.125rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: 0 10px 30px rgba(24, 52, 83, 0.3);
		position: relative;
		overflow: hidden;
	}

	.btn-search::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	.btn-search:hover:not(:disabled)::before {
		left: 100%;
	}

	.btn-search:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 15px 40px rgba(24, 52, 83, 0.4);
	}

	.btn-search:active:not(:disabled) {
		transform: translateY(0);
	}

	.btn-search:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-spinner {
		display: inline-block;
		width: 18px;
		height: 18px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: var(--color-white);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.btn-reset {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg) var(--spacing-xl);
		background: var(--color-white);
		color: var(--color-primary);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-reset:hover {
		border-color: var(--color-secondary);
		background: var(--color-beige-light);
	}

	/* Trust Indicators */
	.trust-indicators {
		display: flex;
		justify-content: center;
		gap: var(--spacing-xl);
		margin-top: var(--spacing-xl);
		padding-top: var(--spacing-xl);
		border-top: 1px solid var(--color-gray-light);
	}

	.trust-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.875rem;
		color: var(--color-gray-dark);
		font-weight: 500;
	}

	.trust-item svg {
		color: var(--color-secondary);
		flex-shrink: 0;
	}

	/* Results Badge */
	.results-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg) var(--spacing-2xl);
		background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
		color: var(--color-white);
		border-radius: var(--radius-lg);
		margin-top: var(--spacing-xl);
		font-size: 1rem;
		box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
		animation: slideIn 0.5s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.results-badge strong {
		font-size: 1.25rem;
		font-weight: 700;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.booking-title {
			font-size: 1.875rem;
		}

		.booking-subtitle {
			font-size: 1rem;
		}

		.booking-form-card {
			padding: var(--spacing-lg);
		}

		.booking-summary {
			flex-wrap: wrap;
			gap: var(--spacing-md);
		}

		.trust-indicators {
			flex-direction: column;
			align-items: center;
			gap: var(--spacing-md);
		}

		.form-actions {
			flex-direction: column;
		}

		.btn-search {
			font-size: 1rem;
		}
	}
</style>

