<script lang="ts">
	/**
	 * Enhanced Date Range Selector Component
	 * Modern styling with native inputs for best mobile/desktop UX
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

	function formatDateDisplay(dateStr: string): string {
		if (!dateStr) return 'Select date';
		const date = new Date(dateStr);
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		};
		return date.toLocaleDateString('en-US', options);
	}

	function getDayOfWeek(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { weekday: 'long' });
	}

	function getMonthDay(dateStr: string): { month: string; day: string } {
		if (!dateStr) return { month: '', day: '' };
		const date = new Date(dateStr);
		return {
			month: date.toLocaleDateString('en-US', { month: 'short' }),
			day: date.getDate().toString()
		};
	}

	let checkInFocused = $state(false);
	let checkOutFocused = $state(false);
</script>

<div class="date-range-selector-enhanced">
	<div class="date-inputs-wrapper">
		<!-- Check-in Date -->
		<div class="date-input-container" class:focused={checkInFocused} class:has-value={checkIn}>
			<label for="check-in-enhanced" class="date-label">Check-in</label>

			<div class="date-display">
				{#if checkIn}
					{@const { month, day } = getMonthDay(checkIn)}
					<div class="date-visual">
						<span class="date-month">{month}</span>
						<span class="date-day">{day}</span>
					</div>
					<div class="date-text">
						<div class="date-full">{formatDateDisplay(checkIn)}</div>
						<div class="date-weekday">{getDayOfWeek(checkIn)}</div>
					</div>
				{:else}
					<div class="date-placeholder">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" stroke-width="2" />
							<path d="M3 10H21" stroke="currentColor" stroke-width="2" />
							<path d="M7 3V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
							<path d="M17 3V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
						<span>Select check-in date</span>
					</div>
				{/if}
			</div>

			<input
				id="check-in-enhanced"
				type="date"
				class="date-input-native"
				bind:value={checkIn}
				min={minDate}
				{disabled}
				required
				onfocus={() => (checkInFocused = true)}
				onblur={() => (checkInFocused = false)}
			/>
		</div>

		<!-- Arrow Separator -->
		<div class="date-separator">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M5 12H19M19 12L12 5M19 12L12 19"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>

		<!-- Check-out Date -->
		<div class="date-input-container" class:focused={checkOutFocused} class:has-value={checkOut}>
			<label for="check-out-enhanced" class="date-label">Check-out</label>

			<div class="date-display">
				{#if checkOut}
					{@const { month, day } = getMonthDay(checkOut)}
					<div class="date-visual">
						<span class="date-month">{month}</span>
						<span class="date-day">{day}</span>
					</div>
					<div class="date-text">
						<div class="date-full">{formatDateDisplay(checkOut)}</div>
						<div class="date-weekday">{getDayOfWeek(checkOut)}</div>
					</div>
				{:else}
					<div class="date-placeholder">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" stroke-width="2" />
							<path d="M3 10H21" stroke="currentColor" stroke-width="2" />
							<path d="M7 3V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
							<path d="M17 3V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
						<span>Select check-out date</span>
					</div>
				{/if}
			</div>

			<input
				id="check-out-enhanced"
				type="date"
				class="date-input-native"
				bind:value={checkOut}
				min={checkOutMinDate}
				{disabled}
				required
				onfocus={() => (checkOutFocused = true)}
				onblur={() => (checkOutFocused = false)}
			/>
		</div>
	</div>

	<!-- Nights Display -->
	{#if checkIn && checkOut}
		{@const nights = Math.ceil(
			(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
		)}
		<div class="nights-badge">
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M10 2L12.09 6.26L17 7.27L13.5 10.97L14.18 16L10 13.77L5.82 16L6.5 10.97L3 7.27L7.91 6.26L10 2Z"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="nights-text">
				<strong>{nights}</strong>
				{nights === 1 ? 'Night' : 'Nights'}
			</span>
		</div>
	{/if}
</div>

<style>
	.date-range-selector-enhanced {
		margin-bottom: var(--spacing-lg);
	}

	.date-inputs-wrapper {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--spacing-md);
		align-items: stretch;
	}

	.date-input-container {
		position: relative;
		background: var(--color-white);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-lg);
		padding: var(--spacing-md);
		transition: all var(--transition-base);
		cursor: pointer;
		min-height: 100px;
		display: flex;
		flex-direction: column;
	}

	.date-input-container:hover {
		border-color: var(--color-secondary);
		box-shadow: var(--shadow-md);
	}

	.date-input-container.focused {
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.1);
		background: var(--color-beige-light);
	}

	.date-input-container.has-value {
		background: linear-gradient(135deg, var(--color-beige-light) 0%, var(--color-white) 100%);
	}

	.date-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-primary);
		margin-bottom: var(--spacing-sm);
	}

	.date-display {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.date-visual {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 60px;
		height: 60px;
		background: var(--color-primary);
		border-radius: var(--radius-md);
		color: var(--color-white);
		flex-shrink: 0;
	}

	.date-month {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		opacity: 0.9;
	}

	.date-day {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1;
	}

	.date-text {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.date-full {
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.date-weekday {
		font-size: 0.875rem;
		color: var(--color-gray);
	}

	.date-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		color: var(--color-gray);
		text-align: center;
		width: 100%;
		padding: var(--spacing-md);
	}

	.date-placeholder svg {
		opacity: 0.5;
	}

	.date-placeholder span {
		font-size: 0.875rem;
	}

	.date-input-native {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		z-index: 2;
	}

	/* Make sure the input is on top and clickable */
	.date-input-native::-webkit-calendar-picker-indicator {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: auto;
		height: auto;
		color: transparent;
		background: transparent;
		cursor: pointer;
	}

	.date-separator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-secondary);
		font-size: 1.5rem;
		font-weight: bold;
		padding-top: 2rem;
	}

	.nights-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
		color: var(--color-white);
		border-radius: var(--radius-lg);
		font-size: 1rem;
		box-shadow: var(--shadow-md);
	}

	.nights-text strong {
		font-size: 1.25rem;
		font-weight: 700;
	}

	@media (max-width: 768px) {
		.date-inputs-wrapper {
			grid-template-columns: 1fr;
			gap: var(--spacing-sm);
		}

		.date-separator {
			display: none;
		}

		.date-input-container {
			min-height: 80px;
		}

		.date-visual {
			width: 50px;
			height: 50px;
		}

		.date-day {
			font-size: 1.25rem;
		}

		.date-full {
			font-size: 0.875rem;
		}
	}
</style>

