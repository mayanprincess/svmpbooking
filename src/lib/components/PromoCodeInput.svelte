<script lang="ts">
	/**
	 * Promo Code Input Component
	 * Allows users to enter a promotional code
	 */

	interface Props {
		promoCode: string;
		disabled?: boolean;
		onchange?: (promoCode: string) => void;
	}

	let { promoCode = $bindable(''), disabled = false, onchange }: Props = $props();

	let showInput = $state(false);

	function toggleInput() {
		showInput = !showInput;
		if (!showInput) {
			promoCode = '';
			if (onchange) onchange('');
		}
	}

	$effect(() => {
		if (onchange && promoCode) {
			onchange(promoCode);
		}
	});
</script>

<div class="promo-code-input">
	{#if !showInput}
		<button type="button" class="promo-toggle" onclick={toggleInput} {disabled}>
			<svg
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M2 6C2 4.89543 2.89543 4 4 4H16C17.1046 4 18 4.89543 18 6V8C18 9.10457 17.1046 10 16 10H4C2.89543 10 2 9.10457 2 8V6Z"
					stroke="currentColor"
					stroke-width="2"
				/>
				<path
					d="M2 12C2 10.8954 2.89543 10 4 10H16C17.1046 10 18 10.8954 18 12V14C18 15.1046 17.1046 16 16 16H4C2.89543 16 2 15.1046 2 14V12Z"
					stroke="currentColor"
					stroke-width="2"
				/>
				<circle cx="6" cy="7" r="1" fill="currentColor" />
				<circle cx="6" cy="13" r="1" fill="currentColor" />
			</svg>
			Have a promo code?
		</button>
	{:else}
		<div class="promo-input-container">
			<div class="form-group">
				<label for="promo-code" class="form-label">Promo Code</label>
				<div class="input-with-button">
					<input
						id="promo-code"
						type="text"
						class="form-input"
						placeholder="Enter code"
						bind:value={promoCode}
						{disabled}
						maxlength="20"
					/>
					<button type="button" class="remove-btn" onclick={toggleInput} aria-label="Remove promo code">
						<svg
							width="20"
							height="20"
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M15 5L5 15M5 5L15 15"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</button>
				</div>
				{#if promoCode}
					<div class="promo-applied">
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M13.3334 4L6.00002 11.3333L2.66669 8"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						Code applied
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.promo-code-input {
		margin-bottom: var(--spacing-lg);
	}

	.promo-toggle {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		background-color: transparent;
		border: 2px dashed var(--color-gray-light);
		border-radius: var(--radius-md);
		color: var(--color-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		width: 100%;
		justify-content: center;
	}

	.promo-toggle:hover:not(:disabled) {
		border-color: var(--color-secondary);
		background-color: var(--color-beige);
	}

	.promo-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.promo-input-container {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.input-with-button {
		position: relative;
		display: flex;
		gap: var(--spacing-sm);
	}

	.input-with-button .form-input {
		flex: 1;
		text-transform: uppercase;
	}

	.remove-btn {
		position: absolute;
		right: var(--spacing-sm);
		top: 50%;
		transform: translateY(-50%);
		padding: var(--spacing-sm);
		background-color: transparent;
		border: none;
		color: var(--color-gray);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.remove-btn:hover {
		background-color: var(--color-beige);
		color: var(--color-error);
	}

	.promo-applied {
		margin-top: var(--spacing-sm);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 0.875rem;
		color: var(--color-success);
		font-weight: 500;
	}

	.promo-applied svg {
		flex-shrink: 0;
	}
</style>

