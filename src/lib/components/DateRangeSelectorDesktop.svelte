<script lang="ts">
	/**
	 * Desktop date range: dual-month Flatpickr in one interaction.
	 * Luxury hotel aesthetic — navy + gold, generous typography.
	 */

	import { onMount } from 'svelte';
	import {
		formatLocalDate,
		calculateNightsBetween,
		getTodayLocalString
	} from '$lib/utils/date-helpers';
	import { pluralize } from '$lib/utils/formatting';
	import type { Instance } from 'flatpickr/dist/types/instance';

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

	let inputEl: HTMLInputElement;
	let triggerEl: HTMLButtonElement;
	let fp = $state<Instance | null>(null);
	let open = $state(false);

	const fmtShort = (iso: string) =>
		iso
			? new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
					weekday: 'short',
					month: 'short',
					day: 'numeric'
				})
			: '';

	let nights = $derived(calculateNightsBetween(checkIn, checkOut));

	onMount(() => {
		let cancelled = false;
		let instance: Instance | null = null;

		void (async () => {
			const Flatpickr = (await import('flatpickr')).default;
			await import('flatpickr/dist/flatpickr.min.css');
			if (cancelled || !inputEl || !triggerEl) return;

			instance = Flatpickr(inputEl, {
				mode: 'range',
				minDate,
				dateFormat: 'Y-m-d',
				showMonths: 2,
				disableMobile: true,
				clickOpens: false,
				allowInput: false,
				locale: { firstDayOfWeek: 0 },
				appendTo: document.body,
				positionElement: triggerEl,
				position: 'auto',
				onOpen: () => {
					open = true;
				},
				onClose: () => {
					open = false;
				},
				onChange: (selectedDates: Date[]) => {
					if (selectedDates.length === 2) {
						checkIn = Flatpickr.formatDate(selectedDates[0], 'Y-m-d');
						checkOut = Flatpickr.formatDate(selectedDates[1], 'Y-m-d');
						onchange?.(checkIn, checkOut);
						instance?.close();
					}
				}
			});

			fp = instance;

			if (checkIn && checkOut) {
				instance.setDate([checkIn, checkOut], false);
			}
		})();

		return () => {
			cancelled = true;
			instance?.destroy();
			fp = null;
		};
	});

	$effect(() => {
		const inst = fp;
		if (!inst || !checkIn || !checkOut) return;
		const cur = inst.selectedDates;
		const t0 = cur[0]?.getTime();
		const t1 = cur[1]?.getTime();
		const n0 = new Date(checkIn + 'T12:00:00').getTime();
		const n1 = new Date(checkOut + 'T12:00:00').getTime();
		if (t0 !== n0 || t1 !== n1) {
			inst.setDate([checkIn, checkOut], false);
		}
	});

	$effect(() => {
		fp?.set('minDate', minDate);
	});

	function openPicker() {
		if (disabled) return;
		fp?.open();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openPicker();
		}
	}
</script>

<div class="desktop-range">
	<p class="desktop-range__label">
		<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
			<rect x="3" y="5" width="14" height="13" rx="2" stroke="currentColor" stroke-width="2" />
			<path d="M3 9H17" stroke="currentColor" stroke-width="2" />
			<path d="M7 3V5M13 3V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		</svg>
		Stay dates
	</p>

	<input
		bind:this={inputEl}
		type="text"
		class="desktop-range__flatpickr-input"
		readonly
		tabindex={-1}
		aria-hidden="true"
	/>

	<button
		bind:this={triggerEl}
		type="button"
		class="desktop-range__trigger"
		class:desktop-range__trigger--open={open}
		onclick={openPicker}
		onkeydown={onKeydown}
		{disabled}
		aria-expanded={open}
		aria-haspopup="dialog"
		aria-label="Select check-in and check-out dates. Opens a two-month calendar."
	>
		<span class="desktop-range__segment">
			<span class="desktop-range__seg-label">Check-in</span>
			<span class="desktop-range__seg-value" class:muted={!checkIn}>
				{checkIn ? fmtShort(checkIn) : 'Add date'}
			</span>
		</span>

		<span class="desktop-range__mid" aria-hidden="true">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path
					d="M5 12h14M13 6l6 6-6 6"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>

		<span class="desktop-range__segment desktop-range__segment--end">
			<span class="desktop-range__seg-label">Check-out</span>
			<span class="desktop-range__seg-value" class:muted={!checkOut}>
				{checkOut ? fmtShort(checkOut) : 'Add date'}
			</span>
		</span>
	</button>

	{#if checkIn && checkOut && nights > 0}
		<div class="desktop-range__nights">
			<span class="desktop-range__nights-inner">
				<strong>{nights}</strong>
				{pluralize(nights, 'night', 'nights')}
				<span class="dot">·</span>
				<span class="sub">{formatLocalDate(checkIn)} — {formatLocalDate(checkOut)}</span>
			</span>
		</div>
	{/if}
</div>

<style>
	.desktop-range {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.desktop-range__label {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		margin: 0;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-primary);
	}

	.desktop-range__flatpickr-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
		opacity: 0;
		pointer-events: none;
	}

	.desktop-range__trigger {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: stretch;
		gap: 0;
		width: 100%;
		padding: 0;
		text-align: left;
		background: var(--color-white);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-xl);
		cursor: pointer;
		transition:
			border-color var(--transition-fast),
			box-shadow var(--transition-fast),
			transform var(--transition-fast);
		box-shadow: var(--shadow-sm);
	}

	.desktop-range__trigger:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--color-secondary) 55%, var(--color-gray-light));
		box-shadow: var(--shadow-md);
	}

	.desktop-range__trigger:focus-visible {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-secondary) 22%, transparent);
	}

	.desktop-range__trigger--open:not(:disabled) {
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-secondary) 18%, transparent);
	}

	.desktop-range__trigger:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.desktop-range__segment {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2rem;
		padding: var(--spacing-md) var(--spacing-lg);
		min-height: 4.25rem;
		justify-content: center;
	}

	.desktop-range__segment--end {
		align-items: flex-end;
		text-align: right;
	}

	.desktop-range__seg-label {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--color-primary) 65%, var(--color-gray));
	}

	.desktop-range__seg-value {
		font-family: var(--font-serif);
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1.2;
	}

	.desktop-range__seg-value.muted {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-gray);
		font-style: italic;
	}

	.desktop-range__mid {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 var(--spacing-sm);
		color: var(--color-secondary);
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--color-beige) 80%, white) 0%,
			var(--color-white) 100%
		);
		border-left: 1px solid var(--color-gray-light);
		border-right: 1px solid var(--color-gray-light);
	}

	.desktop-range__nights {
		display: flex;
		justify-content: center;
	}

	.desktop-range__nights-inner {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: center;
		gap: 0.35rem 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		color: var(--color-primary);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-secondary) 12%, var(--color-white)) 0%,
			var(--color-beige-light) 100%
		);
		border: 1px solid color-mix(in srgb, var(--color-secondary) 35%, transparent);
		border-radius: var(--radius-lg);
	}

	.desktop-range__nights-inner strong {
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--color-secondary);
	}

	.desktop-range__nights-inner .dot {
		opacity: 0.45;
	}

	.desktop-range__nights-inner .sub {
		font-size: 0.8rem;
		opacity: 0.85;
	}

	/* Flatpickr — scoped to body appends; use global with wrapper class via altInputClass — flatpickr adds to calendar */
	:global(.flatpickr-calendar) {
		border-radius: var(--radius-xl) !important;
		box-shadow: var(--shadow-xl) !important;
		border: 1px solid color-mix(in srgb, var(--color-secondary) 40%, var(--color-gray-light)) !important;
		font-family: var(--font-sans) !important;
		z-index: 12000 !important;
	}

	:global(.flatpickr-months) {
		background: linear-gradient(
			180deg,
			var(--color-primary) 0%,
			color-mix(in srgb, var(--color-primary) 88%, black) 100%
		) !important;
		border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
		padding: 0.35rem 0 !important;
	}

	:global(.flatpickr-month) {
		color: var(--color-white) !important;
	}

	:global(.flatpickr-current-month) {
		color: var(--color-white) !important;
		font-weight: 600 !important;
	}

	:global(.flatpickr-weekday) {
		color: var(--color-primary) !important;
		font-weight: 700 !important;
		font-size: 0.7rem !important;
		text-transform: uppercase !important;
		letter-spacing: 0.06em !important;
	}

	:global(.flatpickr-day) {
		border-radius: var(--radius-sm) !important;
		font-weight: 500 !important;
	}

	:global(.flatpickr-day:hover) {
		background: color-mix(in srgb, var(--color-secondary) 18%, var(--color-beige-light)) !important;
		border-color: transparent !important;
	}

	:global(.flatpickr-day.today) {
		border-color: var(--color-secondary) !important;
		color: var(--color-primary) !important;
		font-weight: 700 !important;
	}

	:global(.flatpickr-day.selected),
	:global(.flatpickr-day.startRange),
	:global(.flatpickr-day.endRange) {
		background: var(--color-secondary) !important;
		border-color: var(--color-secondary) !important;
		color: var(--color-white) !important;
	}

	:global(.flatpickr-day.inRange) {
		background: color-mix(in srgb, var(--color-secondary) 22%, var(--color-beige)) !important;
		border-color: transparent !important;
		color: var(--color-primary) !important;
		box-shadow:
			-4px 0 0 color-mix(in srgb, var(--color-secondary) 22%, var(--color-beige)),
			4px 0 0 color-mix(in srgb, var(--color-secondary) 22%, var(--color-beige)) !important;
	}

	:global(.flatpickr-prev-month svg),
	:global(.flatpickr-next-month svg) {
		fill: var(--color-white) !important;
	}

	:global(.flatpickr-prev-month:hover),
	:global(.flatpickr-next-month:hover) {
		background: color-mix(in srgb, white 12%, transparent) !important;
	}
</style>
