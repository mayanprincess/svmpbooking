<script lang="ts">
	/**
	 * Guest Selector Component
	 * Allows users to select number of adults and children
	 */

	interface Props {
		adults: number;
		children: number;
		maxAdults?: number;
		maxChildren?: number;
		disabled?: boolean;
		onchange?: (adults: number, children: number) => void;
	}

	let {
		adults = $bindable(2),
		children = $bindable(0),
		maxAdults = 12,
		maxChildren = 8,
		disabled = false,
		onchange
	}: Props = $props();

	let isOpen = $state(false);
	let containerElement: HTMLDivElement;

	// Close dropdown when clicking outside or pressing ESC
	$effect(() => {
		if (isOpen) {
			const handleClickOutside = (event: MouseEvent) => {
				if (containerElement && !containerElement.contains(event.target as Node)) {
					isOpen = false;
				}
			};

			const handleEscapeKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					isOpen = false;
				}
			};

			// Add listeners after a small delay to prevent immediate close
			const timeoutId = setTimeout(() => {
				document.addEventListener('click', handleClickOutside);
				document.addEventListener('keydown', handleEscapeKey);
			}, 100);

			return () => {
				clearTimeout(timeoutId);
				document.removeEventListener('click', handleClickOutside);
				document.removeEventListener('keydown', handleEscapeKey);
			};
		}
	});

	function increment(type: 'adults' | 'children') {
		if (type === 'adults' && adults < maxAdults) {
			adults++;
		} else if (type === 'children' && children < maxChildren) {
			children++;
		}
		if (onchange) {
			onchange(adults, children);
		}
	}

	function decrement(type: 'adults' | 'children') {
		if (type === 'adults' && adults > 1) {
			adults--;
		} else if (type === 'children' && children > 0) {
			children--;
		}
		if (onchange) {
			onchange(adults, children);
		}
	}

	function toggleDropdown() {
		if (!disabled) {
			isOpen = !isOpen;
		}
	}

	function closeDropdown() {
		isOpen = false;
	}

	// Calculate total guests
	let totalGuests = $derived(adults + children);
</script>

<div class="guest-selector" bind:this={containerElement}>
	<div class="form-group">
		<label for="guests" class="form-label">Guests</label>

		<button
			type="button"
			class="guest-selector-trigger"
			onclick={toggleDropdown}
			{disabled}
			aria-expanded={isOpen}
		>
			<span class="guest-count">
				{totalGuests}
				{totalGuests === 1 ? 'Guest' : 'Guests'}
			</span>
			<span class="guest-details">
				{adults}
				{adults === 1 ? 'Adult' : 'Adults'}
				{#if children > 0}
					, {children}
					{children === 1 ? 'Child' : 'Children'}
				{/if}
			</span>
			<svg
				class="dropdown-icon"
				class:open={isOpen}
				width="20"
				height="20"
				viewBox="0 0 20 20"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M5 7.5L10 12.5L15 7.5"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		{#if isOpen}
			<!-- Backdrop for mobile -->
			<div 
				class="dropdown-backdrop" 
				onclick={closeDropdown}
				onkeydown={(e) => e.key === 'Escape' && closeDropdown()}
				role="button"
				tabindex="-1"
				aria-label="Close guest selector"
			></div>
			
			<div class="guest-selector-dropdown">
				<div class="guest-type">
					<div class="guest-type-info">
						<div class="guest-type-label">Adults</div>
						<div class="guest-type-desc">(12+)</div>
					</div>
					<div class="guest-counter">
						<button
							type="button"
							class="counter-btn"
							onclick={() => decrement('adults')}
							disabled={adults <= 1}
							aria-label="Decrease adults"
						>
							−
						</button>
						<span class="counter-value">{adults}</span>
						<button
							type="button"
							class="counter-btn"
							onclick={() => increment('adults')}
							disabled={adults >= maxAdults}
							aria-label="Increase adults"
						>
							+
						</button>
					</div>
				</div>

				<div class="guest-type">
					<div class="guest-type-info">
						<div class="guest-type-label">Children</div>
						<div class="guest-type-desc">(4-11)</div>
					</div>
					<div class="guest-counter">
						<button
							type="button"
							class="counter-btn"
							onclick={() => decrement('children')}
							disabled={children <= 0}
							aria-label="Decrease children"
						>
							−
						</button>
						<span class="counter-value">{children}</span>
						<button
							type="button"
							class="counter-btn"
							onclick={() => increment('children')}
							disabled={children >= maxChildren}
							aria-label="Increase children"
						>
							+
						</button>
					</div>
				</div>

				<div class="guest-note">Maximum 6 adults · 4 children per villa</div>

				<button type="button" class="btn btn-primary btn-done" onclick={closeDropdown}>
					Done
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.guest-selector {
		position: relative;
		margin-bottom: var(--spacing-lg);
	}

	.guest-selector-trigger {
		width: 100%;
		padding: var(--spacing-md);
		font-size: 1rem;
		font-family: var(--font-sans);
		color: var(--color-black);
		background-color: var(--color-white);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: space-between;
		text-align: left;
	}

	.guest-selector-trigger:hover:not(:disabled) {
		border-color: var(--color-secondary);
	}

	.guest-selector-trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.guest-count {
		font-weight: 600;
		color: var(--color-primary);
	}

	.guest-details {
		font-size: 0.875rem;
		color: var(--color-gray);
		margin-left: var(--spacing-sm);
		flex: 1;
	}

	.dropdown-icon {
		flex-shrink: 0;
		color: var(--color-gray);
		transition: transform var(--transition-fast);
	}

	.dropdown-icon.open {
		transform: rotate(180deg);
	}

	.guest-selector-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 0;
		right: 0;
		z-index: 50;
		background-color: var(--color-white);
		border: 2px solid var(--color-gray-light);
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		box-shadow: var(--shadow-xl);
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

	.guest-type {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) 0;
		border-bottom: 1px solid var(--color-gray-light);
	}

	.guest-type:last-of-type {
		border-bottom: none;
	}

	.guest-type-info {
		flex: 1;
	}

	.guest-type-label {
		font-weight: 600;
		color: var(--color-primary);
		margin-bottom: var(--spacing-xs);
	}

	.guest-type-desc {
		font-size: 0.875rem;
		color: var(--color-gray);
	}

	.guest-counter {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.counter-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-beige);
		border: 2px solid var(--color-secondary);
		border-radius: 50%;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.counter-btn:hover:not(:disabled) {
		background-color: var(--color-secondary);
		color: var(--color-white);
		transform: scale(1.1);
	}

	.counter-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
		border-color: var(--color-gray-light);
	}

	.counter-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-primary);
		min-width: 2rem;
		text-align: center;
	}

	.guest-note {
		margin-top: var(--spacing-md);
		padding-top: var(--spacing-md);
		border-top: 1px solid var(--color-gray-light);
		font-size: 0.75rem;
		color: var(--color-gray);
		text-align: center;
	}

	.btn-done {
		width: 100%;
		margin-top: var(--spacing-md);
	}

	.dropdown-backdrop {
		display: none;
	}

	@media (max-width: 768px) {
		.dropdown-backdrop {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 40;
			animation: fadeIn 0.2s ease-out;
		}

		@keyframes fadeIn {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}

		.guest-selector-dropdown {
			position: fixed;
			top: auto;
			bottom: 0;
			left: 0;
			right: 0;
			border-radius: var(--radius-lg) var(--radius-lg) 0 0;
			animation: slideUp 0.3s ease-out;
		}

		@keyframes slideUp {
			from {
				opacity: 0;
				transform: translateY(100%);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>

