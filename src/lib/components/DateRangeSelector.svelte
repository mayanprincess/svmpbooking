<script lang="ts">
	/**
	 * Date Range Selector Component
	 * Allows users to select check-in and check-out dates
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

	function formatDateLabel(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="date-range-selector">
	<div class="date-input-group">
		<div class="form-group">
			<label for="check-in" class="form-label">Check-in</label>
			<input
				id="check-in"
				type="date"
				class="form-input"
				bind:value={checkIn}
				min={minDate}
				{disabled}
				required
			/>
			{#if checkIn}
				<div class="date-preview">{formatDateLabel(checkIn)}</div>
			{/if}
		</div>

		<div class="date-separator">→</div>

		<div class="form-group">
			<label for="check-out" class="form-label">Check-out</label>
			<input
				id="check-out"
				type="date"
				class="form-input"
				bind:value={checkOut}
				min={checkOutMinDate}
				{disabled}
				required
			/>
			{#if checkOut}
				<div class="date-preview">{formatDateLabel(checkOut)}</div>
			{/if}
		</div>
	</div>

	{#if checkIn && checkOut}
		{@const nights = Math.ceil(
			(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
		)}
		<div class="nights-display">
			<span class="nights-count">{nights}</span>
			{nights === 1 ? 'night' : 'nights'}
		</div>
	{/if}
</div>

<style>
	.date-range-selector {
		margin-bottom: var(--spacing-lg);
	}

	.date-input-group {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--spacing-md);
		align-items: start;
	}

	.date-separator {
		display: flex;
		align-items: center;
		padding-top: 2rem;
		font-size: 1.5rem;
		color: var(--color-secondary);
		font-weight: bold;
	}

	.date-preview {
		margin-top: var(--spacing-xs);
		font-size: 0.875rem;
		color: var(--color-gray);
		font-weight: 500;
	}

	.nights-display {
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm) var(--spacing-md);
		background-color: var(--color-beige);
		border-radius: var(--radius-md);
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-primary);
	}

	.nights-count {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-secondary);
		margin-right: var(--spacing-xs);
	}

	@media (max-width: 768px) {
		.date-input-group {
			grid-template-columns: 1fr;
		}

		.date-separator {
			display: none;
		}
	}
</style>

