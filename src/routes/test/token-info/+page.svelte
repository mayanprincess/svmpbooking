<script lang="ts">
	import { onMount } from 'svelte';

	let loading = $state(true);
	let error = $state<string | null>(null);
	let tokenInfo = $state<any>(null);

	async function fetchTokenInfo() {
		loading = true;
		error = null;
		
		try {
			const response = await fetch('/api/test/token-info');
			const data = await response.json();
			
			if (!response.ok) {
				error = data.error || `HTTP ${response.status}`;
				return;
			}
			
			tokenInfo = data.tokenInfo;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	function getScopeDescription(scope: string): string {
		const descriptions: Record<string, string> = {
			'OHIP_RSV_ASYNC': 'Reservations - Create, modify, cancel',
			'OHIP_PAR': 'Availability - Search rates and availability',
			'OHIP_CRM': 'CRM - Guest profiles and memberships',
			'OHIP_CFG': 'Configuration - Settings and codes',
			'OHIP_CSH': 'Cashiering - Payments and folios',
			'OHIP_FD': 'Front Desk - Check-in/check-out',
			'OHIP_HSK': 'Housekeeping - Room status',
			'OHIP_EVT': 'Events - Catering and events',
			'ohipproduction': 'Full production access',
			'urn:opc:hgbu:ws:__myscopes__': 'Meta-scope (all assigned permissions)'
		};
		
		return descriptions[scope] || 'Unknown scope';
	}

	onMount(() => {
		fetchTokenInfo();
	});
</script>

<div class="container">
	<header>
		<h1>🔐 Opera OAuth Token Inspector</h1>
		<p>Inspect your current OAuth token and available scopes</p>
		<button onclick={fetchTokenInfo} disabled={loading}>
			{loading ? '⏳ Loading...' : '🔄 Refresh Token Info'}
		</button>
	</header>

	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Fetching token information...</p>
		</div>
	{:else if error}
		<div class="error">
			<h2>❌ Error</h2>
			<p>{error}</p>
			<button onclick={fetchTokenInfo}>Try Again</button>
		</div>
	{:else if tokenInfo}
		<div class="success">
			<!-- Token Preview -->
			<section class="card">
				<h2>📝 Token Preview</h2>
				<code class="token-preview">{tokenInfo.tokenPreview}</code>
			</section>

			<!-- Scopes -->
			<section class="card scopes">
				<h2>🎯 Available Scopes ({tokenInfo.scopes.count})</h2>
				
				<div class="scope-raw">
					<strong>Raw Scope String:</strong>
					<code>{tokenInfo.scopes.raw}</code>
				</div>

				{#if tokenInfo.scopes.list.length > 0}
					<div class="scope-list">
						<h3>Parsed Scopes:</h3>
						<ul>
							{#each tokenInfo.scopes.list as scope}
								<li>
									<span class="scope-badge">{scope}</span>
									<span class="scope-description">{getScopeDescription(scope)}</span>
								</li>
							{/each}
						</ul>
					</div>
				{:else}
					<p class="warning">⚠️ No individual scopes found. You might be using a meta-scope like <code>__myscopes__</code></p>
				{/if}
			</section>

			<!-- Expiration -->
			<section class="card expiration">
				<h2>⏰ Token Expiration</h2>
				<div class="expiration-grid">
					<div>
						<strong>Expires At:</strong>
						<p>{tokenInfo.expiration.expiresAt}</p>
					</div>
					<div>
						<strong>Time Remaining:</strong>
						<p class:expired={tokenInfo.expiration.isExpired}>
							{tokenInfo.expiration.timeRemaining}
						</p>
					</div>
					<div>
						<strong>Status:</strong>
						<p class:valid={!tokenInfo.expiration.isExpired} class:expired={tokenInfo.expiration.isExpired}>
							{tokenInfo.expiration.isExpired ? '❌ Expired' : '✅ Valid'}
						</p>
					</div>
				</div>
			</section>

			<!-- Header -->
			<section class="card">
				<h2>📋 Token Header</h2>
				<pre>{JSON.stringify(tokenInfo.header, null, 2)}</pre>
			</section>

			<!-- Payload -->
			<section class="card">
				<h2>📦 Token Payload (Sanitized)</h2>
				<pre>{JSON.stringify(tokenInfo.payload, null, 2)}</pre>
			</section>

			<!-- What This Means -->
			<section class="card info">
				<h2>💡 What This Means</h2>
				{#if tokenInfo.scopes.raw.includes('__myscopes__')}
					<div class="info-block">
						<h3>🔹 You're using a Meta-Scope</h3>
						<p>
							Your scope <code>urn:opc:hgbu:ws:__myscopes__</code> is a special Oracle scope that automatically
							includes all permissions assigned to your application in the Oracle Hospitality Developer Portal.
						</p>
						<p>
							This is the <strong>recommended approach</strong> as Oracle manages the specific scopes for you.
						</p>
					</div>
				{/if}

				<div class="info-block">
					<h3>🔹 Available APIs</h3>
					<p>Based on your scopes, you should have access to:</p>
					<ul>
						<li>✅ Reservations API (RSV)</li>
						<li>✅ Availability API (PAR)</li>
						<li>✅ Configuration API (CFG)</li>
						<li>✅ CRM/Profiles API</li>
					</ul>
				</div>
			</section>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #1a1a1a;
	}

	header p {
		color: #666;
		margin-bottom: 1.5rem;
	}

	button {
		background: #0066cc;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover:not(:disabled) {
		background: #0052a3;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.loading {
		text-align: center;
		padding: 4rem 2rem;
	}

	.spinner {
		width: 50px;
		height: 50px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #0066cc;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error {
		background: #fff3f3;
		border: 2px solid #ff4444;
		border-radius: 12px;
		padding: 2rem;
		text-align: center;
	}

	.error h2 {
		color: #cc0000;
		margin-bottom: 1rem;
	}

	.card {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.card h2 {
		margin-top: 0;
		margin-bottom: 1.5rem;
		color: #1a1a1a;
		border-bottom: 2px solid #f0f0f0;
		padding-bottom: 0.75rem;
	}

	.card h3 {
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		color: #333;
	}

	.token-preview {
		display: block;
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 8px;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.9rem;
		word-break: break-all;
		color: #0066cc;
	}

	.scopes {
		border-left: 4px solid #00cc66;
	}

	.scope-raw {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.scope-raw code {
		display: block;
		margin-top: 0.5rem;
		color: #0066cc;
		font-family: 'Monaco', 'Courier New', monospace;
		word-break: break-all;
	}

	.scope-list ul {
		list-style: none;
		padding: 0;
	}

	.scope-list li {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.scope-badge {
		background: #0066cc;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.scope-description {
		color: #666;
		font-size: 0.9rem;
	}

	.warning {
		background: #fff9e6;
		border-left: 4px solid #ffcc00;
		padding: 1rem;
		margin-top: 1rem;
		border-radius: 4px;
	}

	.expiration {
		border-left: 4px solid #9933ff;
	}

	.expiration-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.expiration-grid strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #666;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.expiration-grid p {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.valid {
		color: #00cc66;
	}

	.expired {
		color: #ff4444;
	}

	pre {
		background: #f8f9fa;
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.info {
		border-left: 4px solid #0099ff;
	}

	.info-block {
		margin-bottom: 1.5rem;
	}

	.info-block:last-child {
		margin-bottom: 0;
	}

	.info-block h3 {
		margin-top: 0;
	}

	.info-block ul {
		margin: 0.5rem 0;
	}

	.info-block li {
		margin-bottom: 0.5rem;
	}

	code {
		background: #f0f0f0;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: 0.9em;
	}
</style>
