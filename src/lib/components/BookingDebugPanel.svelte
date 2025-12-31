<script lang="ts">
	/**
	 * Booking Debug Panel
	 * Shows real-time booking store state for development/debugging
	 * Add ?debug=true to URL to enable
	 */

	import { bookingStore, nights, selectedRate, completeBookingData } from '$lib/stores';
	import { browser } from '$app/environment';

	// Check if debug mode is enabled via URL query param
	let isDebugMode = $state(false);

	$effect(() => {
		if (browser) {
			const params = new URLSearchParams(window.location.search);
			isDebugMode = params.get('debug') === 'true';
		}
	});

	let isExpanded = $state(false);
	let activeTab = $state<'store' | 'derived' | 'complete'>('store');

	function togglePanel() {
		isExpanded = !isExpanded;
	}

	function copyToClipboard(data: any) {
		const text = JSON.stringify(data, null, 2);
		navigator.clipboard.writeText(text);
		alert('Copied to clipboard!');
	}

	function resetStore() {
		if (confirm('Reset entire booking store?')) {
			bookingStore.reset();
		}
	}
</script>

{#if isDebugMode}
	<div class="debug-panel" class:expanded={isExpanded}>
		<button class="debug-toggle" onclick={togglePanel}>
			🐛 Debug {isExpanded ? '▼' : '▶'}
		</button>

		{#if isExpanded}
			<div class="debug-content">
				<div class="debug-header">
					<h3>Booking Store Debug</h3>
					<div class="debug-actions">
						<button class="action-btn" onclick={resetStore}>🔄 Reset</button>
						<button class="action-btn" onclick={() => copyToClipboard($bookingStore)}>📋 Copy</button>
					</div>
				</div>

				<div class="debug-tabs">
					<button 
						class="tab" 
						class:active={activeTab === 'store'}
						onclick={() => activeTab = 'store'}
					>
						Store State
					</button>
					<button 
						class="tab" 
						class:active={activeTab === 'derived'}
						onclick={() => activeTab = 'derived'}
					>
						Derived Values
					</button>
					<button 
						class="tab" 
						class:active={activeTab === 'complete'}
						onclick={() => activeTab = 'complete'}
					>
						Complete Data
					</button>
				</div>

				<div class="debug-body">
					{#if activeTab === 'store'}
						<div class="debug-section">
							<h4>Main Store</h4>
							<pre>{JSON.stringify($bookingStore, null, 2)}</pre>
						</div>
					{:else if activeTab === 'derived'}
						<div class="debug-section">
							<h4>Derived Values</h4>
							<pre>{JSON.stringify({
								nights: $nights,
								selectedRate: $selectedRate,
								isSearchValid: $bookingStore.checkIn && $bookingStore.checkOut && $bookingStore.adults >= 1
							}, null, 2)}</pre>
						</div>
					{:else if activeTab === 'complete'}
						<div class="debug-section">
							<h4>Complete Booking Data (Ready for API)</h4>
							<pre>{JSON.stringify($completeBookingData, null, 2)}</pre>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.debug-panel {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 10000;
		background: #1f2937;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		max-width: 600px;
		width: 90vw;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	.debug-panel:not(.expanded) {
		width: auto;
		max-height: none;
	}

	.debug-toggle {
		background: #374151;
		color: #f3f4f6;
		border: none;
		padding: 0.75rem 1.25rem;
		border-radius: 12px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.2s;
	}

	.debug-toggle:hover {
		background: #4b5563;
	}

	.expanded .debug-toggle {
		border-radius: 12px 12px 0 0;
	}

	.debug-content {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow: hidden;
	}

	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #374151;
	}

	.debug-header h3 {
		margin: 0;
		color: #f3f4f6;
		font-size: 1rem;
		font-weight: 600;
	}

	.debug-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		background: #4b5563;
		color: #f3f4f6;
		border: none;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: #6b7280;
	}

	.debug-tabs {
		display: flex;
		background: #111827;
		border-bottom: 1px solid #374151;
	}

	.tab {
		flex: 1;
		background: none;
		border: none;
		padding: 0.75rem 1rem;
		color: #9ca3af;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border-bottom: 2px solid transparent;
	}

	.tab:hover {
		background: #1f2937;
		color: #f3f4f6;
	}

	.tab.active {
		color: #60a5fa;
		border-bottom-color: #60a5fa;
		background: #1f2937;
	}

	.debug-body {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.debug-section h4 {
		margin: 0 0 0.75rem 0;
		color: #f3f4f6;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	pre {
		background: #111827;
		color: #10b981;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.75rem;
		line-height: 1.5;
		overflow-x: auto;
		margin: 0;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	/* Scrollbar styling */
	.debug-body::-webkit-scrollbar {
		width: 8px;
	}

	.debug-body::-webkit-scrollbar-track {
		background: #111827;
	}

	.debug-body::-webkit-scrollbar-thumb {
		background: #4b5563;
		border-radius: 4px;
	}

	.debug-body::-webkit-scrollbar-thumb:hover {
		background: #6b7280;
	}

	@media (max-width: 768px) {
		.debug-panel {
			bottom: 10px;
			right: 10px;
			max-width: 95vw;
		}

		.debug-tabs {
			flex-direction: column;
		}

		.tab {
			text-align: left;
			border-bottom: 1px solid #374151;
			border-left: 2px solid transparent;
		}

		.tab.active {
			border-bottom-color: #374151;
			border-left-color: #60a5fa;
		}
	}
</style>
