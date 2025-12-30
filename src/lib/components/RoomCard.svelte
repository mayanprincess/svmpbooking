<script lang="ts">
	/**
	 * Room Card Component
	 * Displays room information with available rates
	 */

	import type { EnrichedRoomAvailability } from '$lib/types/opera';
	import { formatCurrency } from '$lib/services/availability-service';

	interface Props {
		room: EnrichedRoomAvailability;
		language?: 'en' | 'es';
	}

	let { room, language = 'en' }: Props = $props();

	let selectedRateIndex = $state(0);
	let selectedRate = $derived(room.rates[selectedRateIndex]);
</script>

<div class="room-card">
	<div class="room-header">
		<div class="room-title-section">
			<h3 class="room-title">
				{language === 'en' ? room.roomTypeName.en : room.roomTypeName.es}
			</h3>
			<span class="room-view">
				{language === 'en' ? room.viewLabel.en : room.viewLabel.es}
			</span>
		</div>
	</div>

	<div class="room-details">
		<div class="room-detail-item">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M3 9C3 7.89543 3.89543 7 5 7H15C16.1046 7 17 7.89543 17 9V15H3V9Z"
					stroke="currentColor"
					stroke-width="2"
				/>
				<path d="M7 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<path d="M13 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<path d="M3 9L5 5H15L17 9" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
			</svg>
			<span>{room.bedrooms} {room.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
		</div>

		<div class="room-detail-item">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="2" />
				<path
					d="M5 17C5 13.6863 7.68629 11 11 11C14.3137 11 17 13.6863 17 17"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
			<span>Up to {room.maxAdults} Adults, {room.maxChildren} Children</span>
		</div>

		<div class="room-detail-item">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect x="3" y="6" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" />
				<path d="M7 6V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<path d="M13 6V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			<span>{room.beds.join(', ')}</span>
		</div>
	</div>

	{#if room.rates.length > 0}
		<div class="rates-section">
			<div class="rates-label">Available Packages</div>

			<div class="rates-list">
				{#each room.rates as rate, index}
					<button
						type="button"
						class="rate-option"
						class:selected={index === selectedRateIndex}
						onclick={() => (selectedRateIndex = index)}
					>
						<div class="rate-header">
							<div class="rate-name">
								{language === 'en' ? rate.ratePlanName.en : rate.ratePlanName.es}
							</div>
							<span class="rate-badge" class:premium={rate.package === 'premium'}>
								{language === 'en' ? rate.packageLabel.en : rate.packageLabel.es}
							</span>
						</div>

						<div class="rate-price">
							{formatCurrency(rate.amountAfterTax, rate.currencyCode)}
							<span class="rate-period">total</span>
						</div>

						<div class="rate-includes">
							{#each (language === 'en' ? rate.includesLabels.en : rate.includesLabels.es) as amenity, i}
								{#if i < 3}
									<span class="amenity-item">• {amenity}</span>
								{/if}
							{/each}
							{#if rate.includes.length > 3}
								<span class="amenity-item">+ {rate.includes.length - 3} more</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>

		{#if selectedRate}
			<div class="room-actions">
				<button type="button" class="btn btn-primary btn-book">
					Book Now · {formatCurrency(selectedRate.amountAfterTax, selectedRate.currencyCode)}
				</button>
			</div>
		{/if}
	{:else}
		<div class="no-rates">
			<p>No rates available for this room type.</p>
		</div>
	{/if}
</div>

<style>
	.room-card {
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		padding: var(--spacing-xl);
		transition: all var(--transition-base);
		border: 2px solid transparent;
	}

	.room-card:hover {
		box-shadow: var(--shadow-xl);
		border-color: var(--color-secondary);
	}

	.room-header {
		margin-bottom: var(--spacing-lg);
		padding-bottom: var(--spacing-lg);
		border-bottom: 2px solid var(--color-beige);
	}

	.room-title-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.room-title {
		font-size: 1.5rem;
		color: var(--color-primary);
		margin: 0;
	}

	.room-view {
		display: inline-flex;
		align-items: center;
		padding: var(--spacing-xs) var(--spacing-md);
		background-color: var(--color-beige);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: var(--color-secondary);
		font-weight: 500;
		width: fit-content;
	}

	.room-details {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-xl);
	}

	.room-detail-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		color: var(--color-gray-dark);
		font-size: 0.9375rem;
	}

	.room-detail-item svg {
		color: var(--color-secondary);
		flex-shrink: 0;
	}

	.rates-section {
		margin-bottom: var(--spacing-lg);
	}

	.rates-label {
		font-weight: 600;
		color: var(--color-primary);
		margin-bottom: var(--spacing-md);
		text-transform: uppercase;
		font-size: 0.875rem;
		letter-spacing: 0.05em;
	}

	.rates-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.rate-option {
		padding: var(--spacing-lg);
		background-color: var(--color-beige-light);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: left;
		width: 100%;
	}

	.rate-option:hover {
		border-color: var(--color-secondary);
		background-color: var(--color-white);
	}

	.rate-option.selected {
		border-color: var(--color-secondary);
		background-color: var(--color-white);
		box-shadow: var(--shadow-md);
	}

	.rate-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-sm);
	}

	.rate-name {
		font-weight: 600;
		color: var(--color-primary);
		font-size: 1rem;
	}

	.rate-badge {
		padding: var(--spacing-xs) var(--spacing-md);
		background-color: var(--color-gray-light);
		color: var(--color-gray-dark);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.rate-badge.premium {
		background-color: var(--color-tertiary);
		color: var(--color-white);
	}

	.rate-price {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: var(--spacing-sm);
	}

	.rate-period {
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--color-gray);
		margin-left: var(--spacing-xs);
	}

	.rate-includes {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		font-size: 0.875rem;
		color: var(--color-gray-dark);
	}

	.amenity-item {
		display: inline-block;
	}

	.room-actions {
		margin-top: var(--spacing-lg);
		padding-top: var(--spacing-lg);
		border-top: 2px solid var(--color-beige);
	}

	.btn-book {
		width: 100%;
		font-size: 1.125rem;
	}

	.no-rates {
		padding: var(--spacing-lg);
		text-align: center;
		color: var(--color-gray);
	}

	@media (max-width: 768px) {
		.room-card {
			padding: var(--spacing-lg);
		}

		.room-title {
			font-size: 1.25rem;
		}

		.rate-header {
			flex-direction: column;
			gap: var(--spacing-sm);
		}
	}
</style>

