<script lang="ts">
	/**
	 * Desktop: dual-month Flatpickr range (one control).
	 * Mobile & tablet: native date inputs (best OS picker + accessibility).
	 */

	import { onMount } from 'svelte';
	import DateRangeSelectorMobile from './DateRangeSelectorMobile.svelte';
	import DateRangeSelectorDesktop from './DateRangeSelectorDesktop.svelte';

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
		minDate,
		disabled = false
	}: Props = $props();

	let ready = $state(false);
	let useDesktop = $state(false);

	onMount(() => {
		const mq = window.matchMedia('(min-width: 768px)');
		useDesktop = mq.matches;
		const onChange = () => {
			useDesktop = mq.matches;
		};
		mq.addEventListener('change', onChange);
		ready = true;
		return () => mq.removeEventListener('change', onChange);
	});
</script>

<div class="date-range-responsive">
	{#if !ready}
		<div class="date-range-responsive__skeleton" aria-hidden="true">
			<div class="date-range-responsive__skeleton-line"></div>
			<div class="date-range-responsive__skeleton-block"></div>
		</div>
	{:else if useDesktop}
		<DateRangeSelectorDesktop bind:checkIn bind:checkOut {onchange} {minDate} {disabled} />
	{:else}
		<DateRangeSelectorMobile bind:checkIn bind:checkOut {onchange} {minDate} {disabled} />
	{/if}
</div>

<style>
	.date-range-responsive__skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
		animation: pulse-skel 1.2s ease-in-out infinite;
	}

	.date-range-responsive__skeleton-line {
		height: 0.65rem;
		width: 38%;
		border-radius: 4px;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-gray-light));
	}

	.date-range-responsive__skeleton-block {
		min-height: 4.35rem;
		border-radius: var(--radius-xl);
		background: linear-gradient(
			90deg,
			var(--color-gray-light) 0%,
			color-mix(in srgb, var(--color-beige) 70%, var(--color-gray-light)) 50%,
			var(--color-gray-light) 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes pulse-skel {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.72;
		}
	}

	@keyframes shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: -100% 0;
		}
	}
</style>
