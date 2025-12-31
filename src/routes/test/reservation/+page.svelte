<script lang="ts">
	let confirmationNumber = '';
	let loading = false;
	let result: any = null;
	let error = '';

	async function searchReservation(byId: boolean = false) {
		if (!confirmationNumber.trim()) {
			error = 'Please enter a confirmation or reservation number';
			return;
		}

		loading = true;
		error = '';
		result = null;

		try {
			const url = byId 
				? `/api/test/reservation/${confirmationNumber}?byId=true`
				: `/api/test/reservation/${confirmationNumber}`;
			
			const response = await fetch(url);
			const data = await response.json();

			if (response.ok) {
				result = data;
			} else {
				error = data.details || data.error || 'Failed to fetch reservation';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="test-page">
	<div class="container">
		<h1>🔍 Opera PMS Reservation Tester</h1>
		<p class="subtitle">Verify if reservations exist in Opera PMS</p>

		<div class="search-box">
			<input
				type="text"
				bind:value={confirmationNumber}
				placeholder="Enter confirmation or reservation number"
				on:keypress={(e) => e.key === 'Enter' && searchReservation(false)}
			/>
			<button on:click={() => searchReservation(false)} disabled={loading}>
				{loading ? '🔄...' : '🔍 By Confirmation'}
			</button>
			<button on:click={() => searchReservation(true)} disabled={loading} class="by-id">
				{loading ? '🔄...' : '🆔 By ID (Direct)'}
			</button>
		</div>

		{#if error}
			<div class="error-box">
				<h3>❌ Error</h3>
				<pre>{error}</pre>
			</div>
		{/if}

		{#if result}
			<div class="success-box">
				<h3>✅ Reservation Found</h3>
				<div class="result-summary">
					<p><strong>Search Type:</strong> {result.searchType === 'reservationId' ? '🆔 Direct by ID' : '🔍 By Confirmation Number'}</p>
					<p><strong>Search Value:</strong> {result.searchValue}</p>
					<p><strong>Message:</strong> {result.message}</p>
				</div>
				
				<details open>
					<summary><strong>📋 Full Response</strong></summary>
					<pre class="json-view">{JSON.stringify(result.data, null, 2)}</pre>
				</details>

				<button class="copy-btn" on:click={() => {
					navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
					alert('Copied to clipboard!');
				}}>
					📋 Copy JSON
				</button>
			</div>
		{/if}

		<div class="info-box">
			<h4>💡 Latest Reservation to Test:</h4>
			<ul>
				<li>
					<strong>Confirmation:</strong> 331220672
					<button class="quick-btn" on:click={() => {
						confirmationNumber = '331220672';
						searchReservation(false);
					}}>
						🔍 By Confirmation
					</button>
				</li>
				<li>
					<strong>Reservation ID:</strong> 13454122
					<button class="quick-btn success" on:click={() => {
						confirmationNumber = '13454122';
						searchReservation(true);
					}}>
						🆔 By ID (Recommended)
					</button>
				</li>
			</ul>
			<p class="hint">💡 <strong>Tip:</strong> Search by ID is more reliable and returns full details</p>
		</div>
	</div>
</div>

<style>
	.test-page {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	h1 {
		color: #1a202c;
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.subtitle {
		color: #718096;
		margin: 0 0 2rem 0;
	}

	.search-box {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	input {
		flex: 1;
		padding: 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	input:focus {
		outline: none;
		border-color: #667eea;
	}

	button {
		padding: 1rem 2rem;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	button:hover:not(:disabled) {
		background: #5568d3;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	button.by-id {
		background: #48bb78;
	}

	button.by-id:hover:not(:disabled) {
		background: #38a169;
	}

	.error-box {
		background: #fff5f5;
		border: 2px solid #fc8181;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.error-box h3 {
		color: #c53030;
		margin: 0 0 1rem 0;
	}

	.success-box {
		background: #f0fff4;
		border: 2px solid #68d391;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.success-box h3 {
		color: #22543d;
		margin: 0 0 1rem 0;
	}

	.result-summary {
		background: white;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.result-summary p {
		margin: 0.5rem 0;
		color: #2d3748;
	}

	details {
		margin-top: 1rem;
		background: white;
		border-radius: 8px;
		padding: 1rem;
	}

	summary {
		cursor: pointer;
		user-select: none;
		color: #2d3748;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.json-view {
		background: #1a202c;
		color: #68d391;
		padding: 1rem;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 0.875rem;
		line-height: 1.5;
		max-height: 500px;
		overflow-y: auto;
	}

	.copy-btn {
		margin-top: 1rem;
		background: #48bb78;
	}

	.copy-btn:hover {
		background: #38a169;
	}

	.info-box {
		background: #ebf8ff;
		border: 2px solid #90cdf4;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.info-box h4 {
		color: #2c5282;
		margin: 0 0 1rem 0;
	}

	.info-box ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.info-box li {
		margin: 0.5rem 0;
	}

	.quick-btn {
		background: #4299e1;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}

	.quick-btn:hover {
		background: #3182ce;
	}

	.quick-btn.success {
		background: #48bb78;
	}

	.quick-btn.success:hover {
		background: #38a169;
	}

	.hint {
		margin-top: 1rem;
		padding: 0.75rem;
		background: white;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #2d3748;
	}

	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
	}
</style>
