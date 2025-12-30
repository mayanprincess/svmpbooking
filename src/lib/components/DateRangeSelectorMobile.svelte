<script lang="ts">
	/**
	 * Mobile-First Date Range Selector
	 * Simple, clean, and works perfectly on all devices
	 * Uses native inputs with beautiful styling - NO dependencies
	 */

	interface Props {
		checkIn: string;
		checkOut: string;
		onchange?: (checkIn: string, checkOut: string) => void;
		minDate?: string;
		disabled?: boolean;
	}

	let {
		checkIn = $bindable(''),
		checkOut = $bindable(''),
		onchange,
		minDate = new Date().toISOString().split('T')[0],
		disabled = false
	}: Props = $props();

	// Update check-out min date when check-in changes
	let checkOutMinDate = $derived(checkIn || minDate);

	// Validate dates when they change
	$effect(() => {
		if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
			checkOut = '';
		}
		if (onchange && checkIn && checkOut) {
			onchange(checkIn, checkOut);
		}
	});

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { 
			weekday: 'short',
			month: 'short', 
			day: 'numeric'
		});
	}

	let nights = $derived(
		checkIn && checkOut
			? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
			: 0
	);
</script>

<div class="date-range-mobile">
	<!-- Check-in -->
	<div class="date-field">
		<label for="checkin-mobile" class="field-label">
			<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect x="3" y="5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="2" />
				<path d="M3 9H17" stroke="currentColor" stroke-width="2" />
				<path d="M7 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<path d="M13 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			Check-in
		</label>
		
		<div class="input-wrapper">
			<input
				id="checkin-mobile"
				type="date"
				class="date-input"
				bind:value={checkIn}
				min={minDate}
				{disabled}
				required
			/>
			<div class="date-display" class:empty={!checkIn}>
				{#if checkIn}
					{formatDate(checkIn)}
				{:else}
					<span class="placeholder">Select date</span>
				{/if}
			</div>
			<div class="calendar-icon">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="3" y="5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="2" />
					<path d="M3 9H17" stroke="currentColor" stroke-width="2" />
				</svg>
			</div>
		</div>
	</div>

	<!-- Arrow -->
	<div class="arrow-divider">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
		</svg>
	</div>

	<!-- Check-out -->
	<div class="date-field">
		<label for="checkout-mobile" class="field-label">
			<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect x="3" y="5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="2" />
				<path d="M3 9H17" stroke="currentColor" stroke-width="2" />
				<path d="M7 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<path d="M13 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			Check-out
		</label>
		
		<div class="input-wrapper">
			<input
				id="checkout-mobile"
				type="date"
				class="date-input"
				bind:value={checkOut}
				min={checkOutMinDate}
				{disabled}
				required
			/>
			<div class="date-display" class:empty={!checkOut}>
				{#if checkOut}
					{formatDate(checkOut)}
				{:else}
					<span class="placeholder">Select date</span>
				{/if}
			</div>
			<div class="calendar-icon">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="3" y="5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="2" />
					<path d="M3 9H17" stroke="currentColor" stroke-width="2" />
				</svg>
			</div>
		</div>
	</div>

	<!-- Nights Display -->
	{#if nights > 0}
		<div class="nights-display">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M10 2L12.09 6.26L17 7.27L13.5 10.97L14.18 16L10 13.77L5.82 16L6.5 10.97L3 7.27L7.91 6.26L10 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<span><strong>{nights}</strong> {nights === 1 ? 'Night' : 'Nights'}</span>
		</div>
	{/if}
</div>

<style>
	.date-range-mobile {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		margin-bottom: var(--spacing-lg);
	}

	.date-field {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.field-label {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.date-input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		z-index: 2;
	}

	/* Force the calendar picker to cover the entire area */
	.date-input::-webkit-calendar-picker-indicator {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		cursor: pointer;
		opacity: 0;
	}

	.date-display {
		flex: 1;
		padding: var(--spacing-lg);
		background: var(--color-white);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary);
		transition: all var(--transition-fast);
		min-height: 56px;
		display: flex;
		align-items: center;
		pointer-events: none;
		position: relative;
		z-index: 1;
	}

	.date-display.empty {
		font-weight: 400;
	}

	.date-display .placeholder {
		color: var(--color-gray);
		font-weight: 400;
	}

	/* Hover state */
	.input-wrapper:hover .date-display {
		border-color: var(--color-secondary);
		box-shadow: var(--shadow-md);
	}

	/* Focus state - triggered when date input opens */
	.date-input:focus + .date-display {
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.15);
		background: var(--color-beige-light);
	}

	.calendar-icon {
		position: absolute;
		right: var(--spacing-md);
		color: var(--color-secondary);
		pointer-events: none;
		z-index: 1;
	}

	.arrow-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-secondary);
		padding: var(--spacing-sm) 0;
	}

	.nights-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
		color: var(--color-white);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		box-shadow: var(--shadow-md);
		margin-top: var(--spacing-sm);
	}

	.nights-display strong {
		font-size: 1.5rem;
		font-weight: 700;
	}

	/* Desktop: side by side */
	@media (min-width: 640px) {
		.date-range-mobile {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
			grid-template-rows: auto auto;
			gap: var(--spacing-md);
			align-items: start;
		}

		.date-field:first-child {
			grid-column: 1;
			grid-row: 1;
		}

		.arrow-divider {
			grid-column: 2;
			grid-row: 1;
			padding-top: 2rem;
		}

		.date-field:nth-child(3) {
			grid-column: 3;
			grid-row: 1;
		}

		.nights-display {
			grid-column: 1 / -1;
			grid-row: 2;
			margin-top: 0;
		}
	}

	/* Ensure touch targets are at least 44px on mobile */
	@media (max-width: 639px) {
		.date-display {
			min-height: 52px;
			font-size: 1rem;
		}

		.arrow-divider {
			padding: var(--spacing-xs) 0;
		}
	}
</style>

