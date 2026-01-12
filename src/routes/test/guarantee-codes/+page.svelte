<script lang="ts">
	import { onMount } from 'svelte';

	let loading = $state(true);
	let guaranteeCodes = $state<any>(null);
	let error = $state<string | null>(null);

	async function fetchGuaranteeCodes() {
		loading = true;
		error = null;

		try {
			const response = await fetch('/api/test/guarantee-codes');
			const data = await response.json();

			console.log('Guarantee codes response:', data);
			guaranteeCodes = data;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to fetch guarantee codes';
			console.error('Error fetching guarantee codes:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchGuaranteeCodes();
	});
</script>

<div class="container">
	<div class="header">
		<h1>🔐 Opera PMS - Guarantee Codes</h1>
		<p>Valid guarantee codes for your property</p>
		<button onclick={fetchGuaranteeCodes} disabled={loading} class="refresh-btn">
			{loading ? '🔄 Loading...' : '🔄 Refresh'}
		</button>
	</div>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Fetching guarantee codes from Opera PMS...</p>
		</div>
	{:else if error}
		<div class="error">
			<h3>❌ Error</h3>
			<p>{error}</p>
		</div>
	{:else if guaranteeCodes}
		{#if guaranteeCodes.success}
			<div class="success">
				<h3>✅ Guarantee Codes Retrieved from Opera PMS</h3>
				
				{#if guaranteeCodes.data?.guaranteeCodes?.length > 0}
					<div class="info-box">
						<p><strong>Hotel ID:</strong> {guaranteeCodes.data.hotelId}</p>
						<p><strong>Total Codes:</strong> {guaranteeCodes.data.totalResults}</p>
						<p><strong>Endpoint:</strong> /rsv/config/v1/guaranteeCodes</p>
					</div>
					
					<div class="codes-grid">
						{#each guaranteeCodes.data.guaranteeCodes as guarantee}
							<div class="code-card active-guarantee">
								<div class="code-header">
									<span class="code-value">{guarantee.guaranteeCode || guarantee.code || 'N/A'}</span>
									{#if guarantee.inactive === false || !guarantee.inactive}
										<span class="badge active">✓ Active</span>
									{:else}
										<span class="badge inactive">Inactive</span>
									{/if}
								</div>
								<div class="code-description">
									{guarantee.description || guarantee.guaranteeCodeDescription || guarantee.shortDescription || 'Valid guarantee code'}
								</div>
								{#if guarantee.requiresCreditCard !== undefined}
									<div class="code-meta">
										Requires Credit Card: {guarantee.requiresCreditCard ? 'Yes' : 'No'}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Debug info -->
					<details class="debug-section">
						<summary>🔍 Raw Response (for debugging)</summary>
						<pre>{JSON.stringify(guaranteeCodes.data.rawResponse, null, 2)}</pre>
					</details>
				{:else}
					<div class="info">
						<h4>📋 No specific guarantee codes returned</h4>
						<p>The API call succeeded but didn't return specific codes. Try the common codes below.</p>
						
						{#if guaranteeCodes.data?.rawResponse}
							<details class="debug-section">
								<summary>🔍 Raw Response</summary>
								<pre>{JSON.stringify(guaranteeCodes.data.rawResponse, null, 2)}</pre>
							</details>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="warning">
				<h3>⚠️ Could Not Fetch from Opera API</h3>
				<p>{guaranteeCodes.message}</p>
				{#if guaranteeCodes.error}
					<details>
						<summary>📋 Error Details</summary>
						<pre>{guaranteeCodes.error}</pre>
					</details>
				{/if}
			</div>
		{/if}

		<!-- Always show common codes as reference -->
		<div class="common-codes">
			<h3>🎯 Most Common Guarantee Codes (Try These)</h3>
			<p class="subtitle">These codes are usually available in most Opera properties:</p>
			
			<div class="codes-grid">
				{#each guaranteeCodes.commonCodes || [] as code}
					<div class="code-card common">
						<div class="code-header">
							<span class="code-value">{code.code}</span>
							<span class="badge recommended">Recommended</span>
						</div>
						<div class="code-description">{code.description}</div>
					</div>
				{/each}
			</div>

			<div class="instructions">
				<h4>💡 How to Use</h4>
				<ol>
					<li>Pick a code from above (start with <strong>GT</strong> or <strong>CC</strong>)</li>
					<li>Update <code>src/lib/services/opera-client.ts</code> line 477</li>
					<li>Change <code>guaranteeCode: 'YOUR_CODE_HERE'</code></li>
					<li>Try creating a reservation again</li>
				</ol>
			</div>
		</div>

		<!-- Manual check instructions -->
		<div class="manual-check">
			<h3>🔍 Check Opera PMS Dashboard Manually</h3>
			<p>If you need to see ALL codes configured in your property:</p>
			<div class="steps">
				<div class="step">
					<span class="step-number">1</span>
					<div class="step-content">
						<strong>Login to Opera PMS</strong>
						<p>Access your Opera dashboard</p>
					</div>
				</div>
				<div class="step">
					<span class="step-number">2</span>
					<div class="step-content">
						<strong>Go to Configuration</strong>
						<p>Configuration → Reservations → Guarantee Codes</p>
					</div>
				</div>
				<div class="step">
					<span class="step-number">3</span>
					<div class="step-content">
						<strong>View Active Codes</strong>
						<p>You'll see a list of all guarantee codes configured for your property</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<div class="back-link">
		<a href="/">← Back to Home</a>
	</div>
</div>

<style>
	:root {
		--color-primary: #183453;
		--color-secondary: #c5a56f;
		--color-success: #10b981;
		--color-warning: #f59e0b;
		--color-error: #ef4444;
		--color-info: #3b82f6;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.header {
		text-align: center;
		margin-bottom: 3rem;
		position: relative;
	}

	.header h1 {
		color: var(--color-primary);
		margin-bottom: 0.5rem;
		font-size: 2.5rem;
	}

	.header p {
		color: #6b7280;
		font-size: 1.125rem;
	}

	.refresh-btn {
		position: absolute;
		top: 0;
		right: 0;
		padding: 0.75rem 1.5rem;
		background: var(--color-secondary);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #b8955f;
		transform: translateY(-2px);
	}

	.refresh-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid #e5e7eb;
		border-top-color: var(--color-secondary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.success, .warning, .error, .info, .common-codes, .manual-check {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.success {
		border-left: 4px solid var(--color-success);
	}

	.warning {
		border-left: 4px solid var(--color-warning);
	}

	.error {
		border-left: 4px solid var(--color-error);
	}

	.common-codes {
		border-left: 4px solid var(--color-secondary);
	}

	.manual-check {
		border-left: 4px solid var(--color-info);
	}

	h3 {
		color: var(--color-primary);
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.subtitle {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	.codes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.code-card {
		background: #f9fafb;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		padding: 1.5rem;
		transition: all 0.2s;
	}

	.code-card:hover {
		border-color: var(--color-secondary);
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.code-card.common {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border-color: var(--color-secondary);
	}

	.code-card.active-guarantee {
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		border-color: var(--color-success);
	}

	.info-box {
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.info-box p {
		margin: 0;
		color: #374151;
		font-size: 0.875rem;
	}

	.info-box strong {
		color: var(--color-primary);
	}

	.code-meta {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		font-size: 0.75rem;
		color: #6b7280;
	}

	details {
		margin-top: 1rem;
	}

	details summary {
		cursor: pointer;
		color: var(--color-info);
		font-weight: 600;
		padding: 0.5rem;
		background: #f3f4f6;
		border-radius: 4px;
	}

	details pre {
		margin-top: 0.5rem;
		padding: 1rem;
		background: #1f2937;
		color: #f9fafb;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 0.75rem;
		max-height: 400px;
		overflow-y: auto;
	}

	.debug-section {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.debug-section summary {
		font-size: 0.875rem;
	}

	.code-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.code-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		font-family: 'Courier New', monospace;
	}

	.badge {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge.active {
		background: #d1fae5;
		color: #065f46;
	}

	.badge.inactive {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge.recommended {
		background: var(--color-secondary);
		color: white;
	}

	.code-description {
		color: #4b5563;
		font-size: 0.875rem;
	}

	.instructions {
		margin-top: 2rem;
		padding: 1.5rem;
		background: #eff6ff;
		border-radius: 8px;
		border: 1px solid #bfdbfe;
	}

	.instructions h4 {
		color: var(--color-info);
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.instructions ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.instructions li {
		margin-bottom: 0.5rem;
		color: #374151;
	}

	.instructions code {
		background: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		color: var(--color-error);
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.step {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #f0f9ff;
		border-radius: 8px;
	}

	.step-number {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		background: var(--color-info);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
	}

	.step-content strong {
		display: block;
		color: var(--color-primary);
		margin-bottom: 0.25rem;
	}

	.step-content p {
		margin: 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.back-link {
		text-align: center;
		margin-top: 3rem;
	}

	.back-link a {
		color: var(--color-secondary);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.2s;
	}

	.back-link a:hover {
		color: var(--color-primary);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.header h1 {
			font-size: 1.75rem;
		}

		.refresh-btn {
			position: static;
			margin-top: 1rem;
			width: 100%;
		}

		.codes-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
