<script lang="ts">
	/**
	 * Reusable Button Component
	 * Consistent styling across the application
	 */

	interface Props {
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		loading?: boolean;
		fullWidth?: boolean;
		onclick?: () => void;
		children?: any;
	}

	let { 
		type = 'button',
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		fullWidth = false,
		onclick,
		children
	}: Props = $props();
</script>

<button
	{type}
	class="btn"
	class:btn-primary={variant === 'primary'}
	class:btn-secondary={variant === 'secondary'}
	class:btn-ghost={variant === 'ghost'}
	class:btn-sm={size === 'sm'}
	class:btn-md={size === 'md'}
	class:btn-lg={size === 'lg'}
	class:btn-full={fullWidth}
	disabled={disabled || loading}
	{onclick}
>
	{#if loading}
		<div class="spinner"></div>
	{/if}
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none !important;
	}

	/* Variants */
	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #0f2740;
		transform: translateY(-1px);
		box-shadow: 0 8px 16px rgba(24, 52, 83, 0.2);
	}

	.btn-secondary {
		background: white;
		color: var(--color-primary);
		border: 2px solid #e5e7eb;
	}

	.btn-secondary:hover:not(:disabled) {
		border-color: var(--color-secondary);
		background: rgba(197, 165, 111, 0.05);
	}

	.btn-ghost {
		background: transparent;
		color: var(--color-primary);
		border: 1px solid #e5e7eb;
	}

	.btn-ghost:hover:not(:disabled) {
		background: rgba(24, 52, 83, 0.05);
	}

	/* Sizes */
	.btn-sm {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}

	.btn-md {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
	}

	.btn-lg {
		padding: 1rem 2rem;
		font-size: 1rem;
	}

	.btn-full {
		width: 100%;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>

