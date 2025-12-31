<script lang="ts">
	/**
	 * Premium Room Card Component
	 * Luxury design inspired by high-end hotel booking platforms
	 */

	import type { EnrichedRoomAvailability } from '$lib/types/opera';
	import { formatCurrency } from '$lib/services/availability-service';

	interface Props {
		room: EnrichedRoomAvailability;
		nights?: number;
		language?: 'en' | 'es';
		onSelect?: () => void;
	}

	let { room, nights = 1, language = 'en', onSelect }: Props = $props();

	let selectedRateIndex = $state(0);
	let selectedRate = $derived(room.rates[selectedRateIndex]);
	let showAllRates = $state(false);
	let displayedRates = $derived(showAllRates ? room.rates : room.rates.slice(0, 2));
</script>

<div class="premium-room-card">
	<!-- Room Header -->
	<div class="room-header">
		<div class="room-title-section">
			<h3 class="room-title">
				{language === 'en' ? room.roomTypeName.en : room.roomTypeName.es}
			</h3>
			<div class="room-meta">
				<span class="room-view">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="10" cy="8" r="3" stroke="currentColor" stroke-width="2"/>
						<path d="M2 14C2 10.6863 4.68629 8 8 8H12C15.3137 8 18 10.6863 18 14V18H2V14Z" stroke="currentColor" stroke-width="2"/>
					</svg>
					{language === 'en' ? room.viewLabel.en : room.viewLabel.es}
				</span>
				<span class="room-location">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M10 2C6.68629 2 4 4.68629 4 8C4 12 10 18 10 18C10 18 16 12 16 8C16 4.68629 13.3137 2 10 2Z" stroke="currentColor" stroke-width="2"/>
						<circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="2"/>
					</svg>
					{room.location}
				</span>
			</div>
		</div>
		
		{#if selectedRate}
			<div class="room-price-badge">
				<div class="price-label">From</div>
				<div class="price-value">{formatCurrency(selectedRate.amountAfterTax, selectedRate.currencyCode)}</div>
				<div class="price-period">total stay</div>
			</div>
		{/if}
	</div>

	<!-- Room Details Grid -->
	<div class="room-details-grid">
		<div class="detail-item">
			<div class="detail-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="3" y="9" width="18" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
					<path d="M7 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					<path d="M17 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					<path d="M3 12L5 7H19L21 12" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
				</svg>
			</div>
			<div class="detail-content">
				<div class="detail-label">Bedrooms</div>
				<div class="detail-value">{room.bedrooms} {room.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</div>
			</div>
		</div>

		<div class="detail-item">
			<div class="detail-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
					<path d="M6 21V19C6 15.6863 8.68629 13 12 13C15.3137 13 18 15.6863 18 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			</div>
			<div class="detail-content">
				<div class="detail-label">Capacity</div>
				<div class="detail-value">{room.maxAdults} Adults, {room.maxChildren} Children</div>
			</div>
		</div>

		<div class="detail-item">
			<div class="detail-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
					<path d="M8 8V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					<path d="M16 8V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
				</svg>
			</div>
			<div class="detail-content">
				<div class="detail-label">Beds</div>
				<div class="detail-value">{room.beds.join(', ')}</div>
			</div>
		</div>
	</div>

	<!-- Rate Plans -->
	{#if room.rates.length > 0}
		<div class="rates-section">
			<div class="rates-header">
				<h4 class="rates-title">Available Packages</h4>
				{#if room.rates.length > 2}
					<button type="button" class="view-all-btn" onclick={() => (showAllRates = !showAllRates)}>
						{showAllRates ? 'Show Less' : `View All (${room.rates.length})`}
						<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class:rotated={showAllRates}>
							<path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				{/if}
			</div>

			<div class="rates-list">
				{#each displayedRates as rate, index}
					<button
						type="button"
						class="rate-card"
						class:selected={index === selectedRateIndex}
						onclick={() => (selectedRateIndex = index)}
					>
						<div class="rate-header">
							<div class="rate-left">
								<div class="rate-name">{language === 'en' ? rate.ratePlanName.en : rate.ratePlanName.es}</div>
								<span class="rate-badge" class:premium={rate.package === 'premium'}>
									{language === 'en' ? rate.packageLabel.en : rate.packageLabel.es}
								</span>
							</div>
							<div class="rate-right">
								<div class="rate-price">{formatCurrency(rate.amountAfterTax, rate.currencyCode)}</div>
								<div class="rate-total">total stay</div>
							</div>
						</div>

						<div class="rate-includes">
							{#each (language === 'en' ? rate.includesLabels.en : rate.includesLabels.es).slice(0, 4) as amenity}
								<span class="amenity-badge">
									<svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M16 6L8 14L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									{amenity}
								</span>
							{/each}
						</div>

						{#if index === selectedRateIndex}
							<div class="rate-selected-indicator">
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<circle cx="10" cy="10" r="9" fill="currentColor"/>
									<path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								Selected
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<!-- Book Button -->
		{#if selectedRate}
			<div class="room-actions">
				<button type="button" class="btn-book-now" onclick={onSelect}>
					<span>Reserve Now</span>
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M7 10H13M13 10L10 7M13 10L10 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				<div class="booking-note">
					<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M10 1L3 5V9C3 14 6.5 18 10 19C13.5 18 17 14 17 9V5L10 1Z" stroke="currentColor" stroke-width="2"/>
						<path d="M7 10L9 12L13 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Free cancellation · Pay later · Instant confirmation
				</div>
			</div>
		{/if}
	{:else}
		<div class="no-rates">
			<p>No rates available for this room type.</p>
		</div>
	{/if}
</div>

<style>
	.premium-room-card {
		background: var(--color-white);
		border-radius: var(--radius-xl);
		overflow: hidden;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
		border: 1px solid rgba(197, 165, 111, 0.15);
		transition: all var(--transition-base);
	}

	.premium-room-card:hover {
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		transform: translateY(-4px);
		border-color: var(--color-secondary);
	}

	/* Room Header */
	.room-header {
		padding: var(--spacing-2xl);
		background: linear-gradient(135deg, var(--color-beige-light) 0%, var(--color-white) 100%);
		border-bottom: 2px solid var(--color-beige);
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--spacing-lg);
	}

	.room-title-section {
		flex: 1;
	}

	.room-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 var(--spacing-md) 0;
		line-height: 1.2;
	}

	.room-meta {
		display: flex;
		gap: var(--spacing-md);
		flex-wrap: wrap;
	}

	.room-view,
	.room-location {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		background: var(--color-white);
		border: 1px solid var(--color-secondary);
		border-radius: 100px;
		font-size: 0.875rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.room-view svg,
	.room-location svg {
		color: var(--color-secondary);
	}

	.room-price-badge {
		text-align: right;
		padding: var(--spacing-md) var(--spacing-lg);
		background: var(--color-white);
		border-radius: var(--radius-md);
		border: 2px solid var(--color-secondary);
	}

	.price-label {
		font-size: 0.75rem;
		color: var(--color-gray);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}

	.price-value {
		font-size: 1.875rem;
		font-weight: 800;
		color: var(--color-primary);
		line-height: 1;
		margin: var(--spacing-xs) 0;
	}

	.price-period {
		font-size: 0.75rem;
		color: var(--color-gray-dark);
	}

	/* Room Details Grid */
	.room-details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-lg);
		padding: var(--spacing-2xl);
		background: var(--color-white);
	}

	.detail-item {
		display: flex;
		gap: var(--spacing-md);
		align-items: center;
	}

	.detail-icon {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-md);
		background: var(--color-beige-light);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-secondary);
		flex-shrink: 0;
	}

	.detail-content {
		flex: 1;
	}

	.detail-label {
		font-size: 0.75rem;
		color: var(--color-gray);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
		margin-bottom: var(--spacing-xs);
	}

	.detail-value {
		font-size: 1rem;
		color: var(--color-primary);
		font-weight: 700;
	}

	/* Rates Section */
	.rates-section {
		padding: var(--spacing-2xl);
		background: var(--color-beige-light);
	}

	.rates-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--spacing-lg);
	}

	.rates-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.view-all-btn {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-sm) var(--spacing-md);
		background: transparent;
		border: none;
		color: var(--color-secondary);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.view-all-btn:hover {
		background: var(--color-white);
	}

	.view-all-btn svg {
		transition: transform var(--transition-fast);
	}

	.view-all-btn svg.rotated {
		transform: rotate(180deg);
	}

	.rates-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.rate-card {
		position: relative;
		padding: var(--spacing-lg);
		background: var(--color-white);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-base);
		text-align: left;
		width: 100%;
	}

	.rate-card:hover {
		border-color: var(--color-secondary);
		box-shadow: 0 8px 24px rgba(197, 165, 111, 0.2);
		transform: translateY(-2px);
	}

	.rate-card.selected {
		border-color: var(--color-secondary);
		background: linear-gradient(135deg, rgba(197, 165, 111, 0.05) 0%, var(--color-white) 100%);
		box-shadow: 0 8px 24px rgba(197, 165, 111, 0.25);
	}

	.rate-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-md);
	}

	.rate-left {
		flex: 1;
	}

	.rate-name {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: var(--spacing-sm);
	}

	.rate-badge {
		display: inline-block;
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-gray-light);
		color: var(--color-gray-dark);
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.rate-badge.premium {
		background: linear-gradient(135deg, var(--color-tertiary) 0%, var(--color-secondary) 100%);
		color: var(--color-white);
	}

	.rate-right {
		text-align: right;
	}

	.rate-price {
		font-size: 1.5rem;
		font-weight: 800;
		color: var(--color-primary);
		line-height: 1;
		margin-bottom: var(--spacing-xs);
	}

	.rate-total {
		font-size: 0.75rem;
		color: var(--color-gray);
	}

	.rate-includes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
	}

	.amenity-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-sm);
		background: var(--color-beige-light);
		border-radius: 100px;
		font-size: 0.75rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.amenity-badge svg {
		color: var(--color-success);
		flex-shrink: 0;
	}

	.rate-selected-indicator {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: var(--spacing-xs) var(--spacing-md);
		background: var(--color-success);
		color: var(--color-white);
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	/* Room Actions */
	.room-actions {
		padding: var(--spacing-2xl);
		background: var(--color-white);
	}

	.btn-book-now {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg) var(--spacing-2xl);
		background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
		color: var(--color-white);
		border: none;
		border-radius: var(--radius-lg);
		font-size: 1.25rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--transition-base);
		box-shadow: 0 8px 24px rgba(197, 165, 111, 0.4);
	}

	.btn-book-now:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(197, 165, 111, 0.5);
	}

	.btn-book-now:active {
		transform: translateY(0);
	}

	.booking-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		font-size: 0.875rem;
		color: var(--color-gray-dark);
		font-weight: 500;
	}

	.booking-note svg {
		color: var(--color-success);
	}

	.no-rates {
		padding: var(--spacing-2xl);
		text-align: center;
		color: var(--color-gray);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.room-header {
			flex-direction: column;
		}

		.room-price-badge {
			width: 100%;
			text-align: center;
		}

		.room-details-grid {
			grid-template-columns: 1fr;
		}

		.room-title {
			font-size: 1.5rem;
		}

		.rate-header {
			flex-direction: column;
		}

		.rate-right {
			text-align: left;
		}

		.btn-book-now {
			font-size: 1.125rem;
		}
	}
</style>

