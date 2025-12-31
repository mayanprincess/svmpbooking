<script lang="ts">
	/**
	 * Compact Room Card Component
	 * Space-efficient design with image carousel
	 */

	import type { EnrichedRoomAvailability } from '$lib/types/opera';
	import { formatCurrency } from '$lib/services/availability-service';
	import { getRoomImages } from '$lib/utils/room-images';
	import ImageCarousel from './ImageCarousel.svelte';
	import Tooltip from './shared/Tooltip.svelte';

	interface Props {
		room: EnrichedRoomAvailability;
		nights?: number;
		language?: 'en' | 'es';
		onSelect?: (room: EnrichedRoomAvailability, rateIndex: number) => void;
	}

	let { room, nights = 1, language = 'en', onSelect }: Props = $props();

	let selectedRateIndex = $state(0);
	let selectedRate = $derived(room.rates[selectedRateIndex]);
	let images = $derived(getRoomImages(room.roomTypeCode));
</script>

<article class="room-card">
	<!-- Image Carousel -->
	<div class="room-image">
		<ImageCarousel {images} />
		
		<!-- Room Badge -->
		<div class="room-badge">
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
			</svg>
			{room.bedrooms} {room.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
		</div>
	</div>

	<!-- Room Content -->
	<div class="room-content">
		<!-- Header -->
		<div class="room-header">
			<h3 class="room-title">
				{language === 'en' ? room.roomTypeName.en : room.roomTypeName.es}
			</h3>
			<div class="room-meta">
				<span class="meta-item">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
					</svg>
					{room.maxAdults} adults, {room.maxChildren} children
				</span>
				<span class="meta-item view-badge">
					{language === 'en' ? room.viewLabel.en : room.viewLabel.es}
				</span>
			</div>
		</div>

		<!-- Beds Info -->
		<div class="room-beds">
			{#each room.beds as bed}
				<span class="bed-tag">{bed}</span>
			{/each}
		</div>

		<!-- Rate Plans -->
		<div class="room-rates">
			{#each room.rates.slice(0, 3) as rate, index}
				<button
					class="rate-option"
					class:selected={index === selectedRateIndex}
					onclick={() => selectedRateIndex = index}
				>
					<div class="rate-info">
						<Tooltip position="top" maxWidth="220px">
							{#snippet children()}
								<div class="rate-badge" style="background-color: {rate.packageColor}">
									{language === 'en' ? rate.packageLabel.en : rate.packageLabel.es}
								</div>
							{/snippet}
							{#snippet content()}
								<div class="tooltip-content">
									<div class="tooltip-title">Includes:</div>
									<ul class="tooltip-list">
										{#each rate.includesLabels[language] as amenity}
											<li>
												<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
													<path d="M20 6L9 17l-5-5"/>
												</svg>
												{amenity}
											</li>
										{/each}
									</ul>
								</div>
							{/snippet}
						</Tooltip>
						<div class="rate-name">{language === 'en' ? rate.ratePlanName.en : rate.ratePlanName.es}</div>
					</div>
					<div class="rate-price">
						<div class="price-amount">{formatCurrency(rate.amountAfterTax, rate.currencyCode)}</div>
						<div class="price-label">total</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Book Button -->
		<button class="book-button" onclick={() => onSelect?.(room, selectedRateIndex)}>
			<span>Select Room</span>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M5 12h14M12 5l7 7-7 7"/>
			</svg>
		</button>
	</div>
</article>

<style>
	.room-card {
		display: flex;
		flex-direction: column;
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		transition: all 0.3s;
		height: 100%;
	}

	.room-card:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px);
	}

	/* Image Section */
	.room-image {
		position: relative;
		height: 240px;
		overflow: hidden;
	}

	.room-badge {
		position: absolute;
		top: 12px;
		left: 12px;
		background: white;
		padding: 6px 12px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		z-index: 10;
	}

	/* Content Section */
	.room-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 1;
	}

	.room-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.room-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
		line-height: 1.3;
	}

	.room-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.view-badge {
		background: rgba(197, 165, 111, 0.1);
		color: var(--color-secondary);
		padding: 4px 8px;
		border-radius: 4px;
		font-weight: 600;
	}

	/* Beds */
	.room-beds {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.bed-tag {
		font-size: 0.75rem;
		padding: 4px 8px;
		background: #f3f4f6;
		border-radius: 4px;
		color: #4b5563;
		font-weight: 500;
	}

	/* Rates */
	.room-rates {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.rate-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border: 2px solid transparent;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.rate-option:hover {
		background: #f3f4f6;
		border-color: var(--color-secondary);
	}

	.rate-option.selected {
		background: rgba(197, 165, 111, 0.1);
		border-color: var(--color-secondary);
	}

	.rate-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		align-items: flex-start;
	}

	.rate-badge {
		font-size: 0.625rem;
		padding: 2px 8px;
		border-radius: 10px;
		color: white;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		cursor: help;
		transition: all 0.2s;
	}

	.rate-badge:hover {
		transform: scale(1.05);
		filter: brightness(1.1);
	}

	.rate-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.rate-price {
		text-align: right;
	}

	.price-amount {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.price-label {
		font-size: 0.625rem;
		color: #9ca3af;
		text-transform: uppercase;
	}

	/* Tooltip Content Styles */
	:global(.tooltip-content) {
		font-weight: 400;
	}

	:global(.tooltip-title) {
		font-weight: 700;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
		color: #e5e7eb;
	}

	:global(.tooltip-list) {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	:global(.tooltip-list li) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		line-height: 1.4;
	}

	:global(.tooltip-list li svg) {
		flex-shrink: 0;
		color: #10b981;
	}

	/* Book Button */
	.book-button {
		width: 100%;
		padding: 0.875rem;
		background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: auto;
	}

	.book-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 16px rgba(197, 165, 111, 0.3);
	}

	/* Responsive */
	@media (min-width: 768px) {
		.room-image {
			height: 260px;
		}

		.room-title {
			font-size: 1.25rem;
		}
	}

	@media (min-width: 1024px) {
		.room-image {
			height: 280px;
		}
	}
</style>

