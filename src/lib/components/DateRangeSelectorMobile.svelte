<script lang="ts">
	/**
	 * Mobile date-range UX:
	 * - Strong active field feedback (check-in vs check-out)
	 * - Sticky "what's next" instruction style helper
	 * - Native OS date picker for speed/accessibility
	 */

	import { onMount } from 'svelte';
	import { locale, t } from '$lib/i18n';
	import {
		addDaysToLocalDateString,
		calculateNightsBetween,
		formatLocalDate,
		getTodayLocalString,
		maxLocalDateString,
		parseLocalDate
	} from '$lib/utils/date-helpers';
	import { pluralize } from '$lib/utils/formatting';

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
		minDate = getTodayLocalString(),
		disabled = false
	}: Props = $props();

	let checkInInput: HTMLInputElement | undefined;
	let checkOutInput: HTMLInputElement | undefined;

	type ActiveField = 'checkIn' | 'checkOut';
	let activeField = $state<ActiveField>('checkIn');

	/** Refreshed on the client so `<input type="date" min>` matches guest timezone. */
	let todayLocal = $state(getTodayLocalString());

	onMount(() => {
		todayLocal = getTodayLocalString();
	});

	let checkInMinDate = $derived(maxLocalDateString(todayLocal, minDate ?? todayLocal));
	let checkOutMinDate = $derived(checkIn ? addDaysToLocalDateString(checkIn, 1) : checkInMinDate);
	let nights = $derived(calculateNightsBetween(checkIn, checkOut));

	let helperText = $derived.by(() => {
		if (!checkIn) {
			return $locale === 'es' ? 'Selecciona tu fecha de llegada primero.' : 'Select your check-in date first.';
		}
		if (!checkOut) {
			return $locale === 'es'
				? 'Ahora selecciona la fecha de salida.'
				: 'Now select your check-out date.';
		}
		return '';
	});

	function focusField(field: ActiveField) {
		if (disabled) return;
		activeField = field;
		if (field === 'checkIn') {
			checkInInput?.focus();
		} else {
			checkOutInput?.focus();
		}
	}

	function onCheckInChanged() {
		if (checkIn) {
			activeField = 'checkOut';
			// Move user toward selecting return date without forcing hidden behavior.
			setTimeout(() => checkOutInput?.focus(), 40);
		}
	}

	$effect(() => {
		if (checkIn && parseLocalDate(checkIn) < parseLocalDate(checkInMinDate)) {
			checkIn = '';
		}

		if (checkIn && checkOut) {
			const startDate = parseLocalDate(checkIn);
			const endDate = parseLocalDate(checkOut);
			const minOut = parseLocalDate(addDaysToLocalDateString(checkIn, 1));

			if (endDate <= startDate || endDate < minOut) {
				checkOut = '';
			}
		}

		if (onchange && checkIn && checkOut) {
			onchange(checkIn, checkOut);
		}
	});
</script>

<div class="date-range-mobile">
	<p class="native-calendar-hint">
		<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
			<path
				d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-8V6H9v6h2zm0 2v-1.5H9V12h2z"
				fill="currentColor"
			/>
		</svg>
		<span>{t($locale, 'nativeDateHint')}</span>
	</p>

	<div class="range-card">
		<button
			type="button"
			class="date-chip"
			class:active={activeField === 'checkIn'}
			class:filled={!!checkIn}
			onclick={() => focusField('checkIn')}
			aria-pressed={activeField === 'checkIn'}
			{disabled}
		>
			<input
				bind:this={checkInInput}
				id="checkin-mobile"
				type="date"
				class="date-input"
				bind:value={checkIn}
				min={checkInMinDate}
				onfocus={() => (activeField = 'checkIn')}
				onchange={onCheckInChanged}
				{disabled}
				required
			/>
			<span class="chip-label">Check-in</span>
			<span class="chip-value">{checkIn ? formatLocalDate(checkIn) : 'Add date'}</span>
		</button>

		<div class="connector" aria-hidden="true">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
				<path
					d="M5 12h14M13 6l6 6-6 6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>

		<button
			type="button"
			class="date-chip"
			class:active={activeField === 'checkOut'}
			class:filled={!!checkOut}
			onclick={() => focusField('checkOut')}
			aria-pressed={activeField === 'checkOut'}
			{disabled}
		>
			<input
				bind:this={checkOutInput}
				id="checkout-mobile"
				type="date"
				class="date-input"
				bind:value={checkOut}
				min={checkOutMinDate}
				onfocus={() => (activeField = 'checkOut')}
				{disabled}
				required
			/>
			<span class="chip-label">Check-out</span>
			<span class="chip-value">{checkOut ? formatLocalDate(checkOut) : 'Add date'}</span>
		</button>
	</div>

	{#if helperText}
		<div class="helper-strip">
			<span class="helper-dot"></span>
			<span>{helperText}</span>
		</div>
	{/if}

	{#if nights > 0}
		<div class="nights-display">
			<span class="nights-number">{nights}</span>
			<span>{pluralize(nights, 'Night', 'Nights')}</span>
			<span class="nights-sep">·</span>
			<span class="nights-range">{formatLocalDate(checkIn)} — {formatLocalDate(checkOut)}</span>
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

	.native-calendar-hint {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-sm);
		margin: 0;
		padding: var(--spacing-sm) var(--spacing-md);
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-gray-dark);
		background: color-mix(in srgb, var(--color-secondary) 8%, var(--color-white));
		border: 1px solid color-mix(in srgb, var(--color-secondary) 22%, var(--color-gray-light));
		border-radius: var(--radius-md);
	}

	.native-calendar-hint svg {
		flex-shrink: 0;
		margin-top: 0.1rem;
		color: var(--color-secondary);
	}

	.range-card {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 0.55rem;
		align-items: center;
		padding: 0.55rem;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--color-beige-light) 70%, #fff) 0%,
			#fff 100%
		);
		border: 1px solid color-mix(in srgb, var(--color-secondary) 25%, var(--color-gray-light));
		border-radius: var(--radius-xl);
		box-shadow: 0 8px 20px rgba(24, 52, 83, 0.06);
	}

	.date-chip {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2rem;
		padding: 0.7rem 0.8rem;
		min-height: 4rem;
		background: #fff;
		border: 2px solid var(--color-gray-light);
		border-radius: 0.9rem;
		color: var(--color-primary);
		text-align: left;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			background 0.18s ease;
	}

	.date-chip.active {
		border-color: var(--color-secondary);
		background: color-mix(in srgb, var(--color-secondary) 7%, white);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-secondary) 20%, transparent);
	}

	.date-chip.filled:not(.active) {
		border-color: color-mix(in srgb, var(--color-primary) 20%, var(--color-gray-light));
	}

	.date-chip:disabled {
		opacity: 0.6;
	}

	.chip-label {
		font-size: 0.64rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: color-mix(in srgb, var(--color-primary) 60%, var(--color-gray));
	}

	.chip-value {
		font-size: 0.95rem;
		font-weight: 650;
		line-height: 1.2;
	}

	.connector {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		color: var(--color-secondary);
		background: color-mix(in srgb, var(--color-secondary) 10%, white);
		border: 1px solid color-mix(in srgb, var(--color-secondary) 35%, var(--color-gray-light));
	}

	.date-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.date-input::-webkit-calendar-picker-indicator {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	.helper-strip {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 0.75rem;
		font-size: 0.84rem;
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 5%, white);
		border: 1px solid color-mix(in srgb, var(--color-primary) 12%, var(--color-gray-light));
		border-radius: var(--radius-md);
	}

	.helper-strip.ready {
		color: #0f5f3b;
		background: color-mix(in srgb, #38a169 12%, white);
		border-color: color-mix(in srgb, #38a169 26%, var(--color-gray-light));
	}

	.helper-dot {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 999px;
		background: currentColor;
		flex-shrink: 0;
	}

	.nights-display {
		display: inline-flex;
		align-items: baseline;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.35rem 0.45rem;
		padding: 0.65rem 0.9rem;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-secondary) 14%, white) 0%,
			color-mix(in srgb, var(--color-beige-light) 88%, white) 100%
		);
		color: var(--color-primary);
		border: 1px solid color-mix(in srgb, var(--color-secondary) 34%, transparent);
		border-radius: var(--radius-lg);
	}

	.nights-number {
		font-size: 1.2rem;
		font-weight: 800;
		color: var(--color-secondary);
	}

	.nights-sep {
		opacity: 0.4;
	}

	.nights-range {
		font-size: 0.8rem;
		opacity: 0.9;
	}
</style>

