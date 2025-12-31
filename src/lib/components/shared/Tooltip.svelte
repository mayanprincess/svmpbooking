<script lang="ts">
	/**
	 * Tooltip Component
	 * Elegant tooltip that appears on hover
	 */

	import { onMount } from 'svelte';

	interface Props {
		children?: any;
		content?: any;
		position?: 'top' | 'bottom' | 'left' | 'right';
		maxWidth?: string;
	}

	let { children, content, position = 'top', maxWidth = '200px' }: Props = $props();

	let showTooltip = $state(false);
	let tooltipElement: HTMLElement;
	let triggerElement: HTMLElement;

	function handleMouseEnter() {
		showTooltip = true;
	}

	function handleMouseLeave() {
		showTooltip = false;
	}
</script>

<div 
	class="tooltip-wrapper" 
	bind:this={triggerElement}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	{@render children()}
	
	{#if showTooltip}
		<div 
			class="tooltip" 
			class:top={position === 'top'}
			class:bottom={position === 'bottom'}
			class:left={position === 'left'}
			class:right={position === 'right'}
			style="max-width: {maxWidth}"
			bind:this={tooltipElement}
		>
			{@render content()}
		</div>
	{/if}
</div>

<style>
	.tooltip-wrapper {
		position: relative;
		display: inline-flex;
	}

	.tooltip {
		position: absolute;
		z-index: 1000;
		padding: 0.75rem;
		background: rgba(31, 41, 55, 0.95);
		backdrop-filter: blur(8px);
		color: white;
		border-radius: 8px;
		font-size: 0.8125rem;
		line-height: 1.5;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		pointer-events: none;
		white-space: normal;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Position variants */
	.tooltip.top {
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip.bottom {
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
	}

	.tooltip.left {
		right: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
	}

	.tooltip.right {
		left: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
	}

	/* Arrow */
	.tooltip::before {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border: 5px solid transparent;
	}

	.tooltip.top::before {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border-top-color: rgba(31, 41, 55, 0.95);
	}

	.tooltip.bottom::before {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border-bottom-color: rgba(31, 41, 55, 0.95);
	}

	.tooltip.left::before {
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		border-left-color: rgba(31, 41, 55, 0.95);
	}

	.tooltip.right::before {
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		border-right-color: rgba(31, 41, 55, 0.95);
	}
</style>

