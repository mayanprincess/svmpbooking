<script lang="ts">
	/**
	 * Date Range Selector with Flatpickr
	 * Advanced date picker with calendar UI, range selection, and mobile support
	 * 
	 * Installation: npm install flatpickr
	 */

	import { onMount } from 'svelte';
	import type flatpickr from 'flatpickr';

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

	let flatpickrInstance: flatpickr.Instance | null = null;
	let inputElement: HTMLInputElement;
	let isOpen = $state(false);

	onMount(async () => {
		// Dynamically import Flatpickr (code splitting)
		const Flatpickr = (await import('flatpickr')).default;
		
		// Import Flatpickr CSS
		await import('flatpickr/dist/flatpickr.min.css');

		// Initialize Flatpickr
		flatpickrInstance = Flatpickr(inputElement, {
			mode: 'range',
			minDate: minDate,
			dateFormat: 'Y-m-d',
			altInput: true,
			altFormat: 'M j, Y',
			showMonths: window.innerWidth > 768 ? 2 : 1,
			inline: false,
			disable: disabled ? [() => true] : [],
			onChange: (selectedDates) => {
				if (selectedDates.length === 2) {
					checkIn = Flatpickr.formatDate(selectedDates[0], 'Y-m-d');
					checkOut = Flatpickr.formatDate(selectedDates[1], 'Y-m-d');
					
					if (onchange) {
						onchange(checkIn, checkOut);
					}
				}
			},
			onOpen: () => {
				isOpen = true;
			},
			onClose: () => {
				isOpen = false;
			},
			locale: {
				firstDayOfWeek: 0, // Sunday
				rangeSeparator: ' → '
			}
		});

		// Set initial dates if provided
		if (checkIn && checkOut) {
			flatpickrInstance.setDate([checkIn, checkOut]);
		}

		return () => {
			flatpickrInstance?.destroy();
		};
	});

	// Update Flatpickr when props change externally
	$effect(() => {
		if (flatpickrInstance && checkIn && checkOut) {
			const current = flatpickrInstance.selectedDates;
			const newCheckIn = new Date(checkIn).getTime();
			const newCheckOut = new Date(checkOut).getTime();
			
			if (
				current.length !== 2 ||
				current[0].getTime() !== newCheckIn ||
				current[1].getTime() !== newCheckOut
			) {
				flatpickrInstance.setDate([checkIn, checkOut]);
			}
		}
	});

	function formatDateDisplay(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function getDayOfWeek(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { weekday: 'long' });
	}

	let nights = $derived(
		checkIn && checkOut
			? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
			: 0
	);
</script>

<div class="date-range-flatpickr">
	<div class="date-picker-wrapper" class:is-open={isOpen}>
		<label for="date-range-input" class="picker-label">
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<rect x="3" y="5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="2" />
				<path d="M3 9H17" stroke="currentColor" stroke-width="2" />
				<path d="M7 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				<path d="M13 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			Select Dates
		</label>

		<input
			bind:this={inputElement}
			id="date-range-input"
			type="text"
			class="date-input-flatpickr"
			placeholder="Check-in → Check-out"
			readonly
			{disabled}
		/>

		{#if checkIn && checkOut}
			<div class="selected-dates-display">
				<div class="date-info">
					<div class="date-card check-in">
						<span class="date-type">Check-in</span>
						<span class="date-value">{formatDateDisplay(checkIn)}</span>
						<span class="date-weekday">{getDayOfWeek(checkIn)}</span>
					</div>

					<div class="nights-indicator">
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
						<span class="nights-text">
							<strong>{nights}</strong>
							{nights === 1 ? 'Night' : 'Nights'}
						</span>
					</div>

					<div class="date-card check-out">
						<span class="date-type">Check-out</span>
						<span class="date-value">{formatDateDisplay(checkOut)}</span>
						<span class="date-weekday">{getDayOfWeek(checkOut)}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.date-range-flatpickr {
		margin-bottom: var(--spacing-lg);
	}

	.date-picker-wrapper {
		position: relative;
	}

	.picker-label {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		font-weight: 600;
		color: var(--color-primary);
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.date-input-flatpickr {
		width: 100%;
		padding: var(--spacing-lg);
		font-size: 1rem;
		font-family: var(--font-sans);
		color: var(--color-black);
		background-color: var(--color-white);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all var(--transition-fast);
		text-align: center;
		font-weight: 500;
	}

	.date-input-flatpickr:hover:not(:disabled) {
		border-color: var(--color-secondary);
		box-shadow: var(--shadow-md);
	}

	.date-input-flatpickr:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.1);
	}

	.date-input-flatpickr:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.date-picker-wrapper.is-open .date-input-flatpickr {
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.1);
	}

	.selected-dates-display {
		margin-top: var(--spacing-lg);
		padding: var(--spacing-lg);
		background: linear-gradient(135deg, var(--color-beige-light) 0%, var(--color-white) 100%);
		border-radius: var(--radius-lg);
		border: 2px solid var(--color-beige);
	}

	.date-info {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--spacing-lg);
		align-items: center;
	}

	.date-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
		text-align: center;
	}

	.date-card.check-in {
		text-align: left;
	}

	.date-card.check-out {
		text-align: right;
	}

	.date-type {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-gray);
		font-weight: 600;
	}

	.date-value {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	.date-weekday {
		font-size: 0.875rem;
		color: var(--color-gray-dark);
	}

	.nights-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background: var(--color-secondary);
		color: var(--color-white);
		border-radius: var(--radius-md);
	}

	.nights-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 0.875rem;
	}

	.nights-text strong {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1;
	}

	/* Flatpickr Custom Styling */
	:global(.flatpickr-calendar) {
		background: var(--color-white);
		border: 2px solid var(--color-secondary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		font-family: var(--font-sans);
	}

	:global(.flatpickr-months) {
		background: var(--color-primary);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
	}

	:global(.flatpickr-month) {
		color: var(--color-white);
	}

	:global(.flatpickr-current-month) {
		color: var(--color-white);
	}

	:global(.flatpickr-weekday) {
		color: var(--color-primary);
		font-weight: 600;
	}

	:global(.flatpickr-day) {
		color: var(--color-black);
		border-radius: var(--radius-sm);
	}

	:global(.flatpickr-day:hover) {
		background: var(--color-beige);
		border-color: var(--color-secondary);
	}

	:global(.flatpickr-day.today) {
		border-color: var(--color-secondary);
	}

	:global(.flatpickr-day.selected),
	:global(.flatpickr-day.startRange),
	:global(.flatpickr-day.endRange) {
		background: var(--color-secondary);
		border-color: var(--color-secondary);
		color: var(--color-white);
	}

	:global(.flatpickr-day.inRange) {
		background: var(--color-beige);
		border-color: var(--color-beige);
		box-shadow: -5px 0 0 var(--color-beige), 5px 0 0 var(--color-beige);
	}

	:global(.flatpickr-day.disabled) {
		color: var(--color-gray-light);
	}

	:global(.flatpickr-prev-month),
	:global(.flatpickr-next-month) {
		fill: var(--color-white);
	}

	:global(.flatpickr-prev-month:hover),
	:global(.flatpickr-next-month:hover) {
		fill: var(--color-secondary);
	}

	@media (max-width: 768px) {
		.date-info {
			grid-template-columns: 1fr;
			gap: var(--spacing-md);
		}

		.date-card.check-in,
		.date-card.check-out {
			text-align: center;
		}

		.nights-indicator {
			flex-direction: row;
			justify-content: center;
		}

		.nights-text {
			flex-direction: row;
			gap: var(--spacing-xs);
		}
	}
</style>

