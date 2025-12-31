<script lang="ts">
	/**
	 * Booking Confirmation Component
	 * Shows success message and booking details
	 */

	import { formatCurrency, pluralize } from '$lib/utils/formatting';
	import { formatLocalDateLong } from '$lib/utils/date-helpers';
	import Button from './shared/Button.svelte';

	interface Props {
		confirmationNumber: string;
		room: any;
		selectedRate: any;
		checkIn: string;
		checkOut: string;
		nights: number;
		guests: any[];
		amount: number;
		email: string;
	}

	let { confirmationNumber, room, selectedRate, checkIn, checkOut, nights, guests, amount, email }: Props = $props();

	let mainGuest = $derived(guests[0]);
</script>

<div class="confirmation">
	<!-- Success Icon -->
	<div class="success-animation">
		<svg width="80" height="80" viewBox="0 0 80 80" fill="none">
			<circle cx="40" cy="40" r="38" stroke="#10b981" stroke-width="4" class="circle"/>
			<path d="M20 40L35 55L60 25" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="checkmark"/>
		</svg>
	</div>

	<div class="confirmation-content">
		<h1>Booking Confirmed!</h1>
		<p class="confirmation-subtitle">Your reservation has been successfully processed</p>

		<!-- Confirmation Number -->
		<div class="confirmation-number">
			<span class="label">Confirmation Number</span>
			<span class="number">{confirmationNumber}</span>
		</div>

		<!-- Email Notice -->
		<div class="email-notice">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
				<polyline points="22,6 12,13 2,6"></polyline>
			</svg>
			<p>A confirmation email has been sent to <strong>{email}</strong></p>
		</div>

		<!-- Booking Details -->
		<div class="details-card">
			<div class="details-header">
				<h3>Reservation Details</h3>
				<div class="package-badge-confirm" style="background-color: {selectedRate.packageColor}">
					{selectedRate.packageLabel.en}
				</div>
			</div>
			
			<div class="detail-row">
				<span class="detail-label">Room</span>
				<span class="detail-value">{room.roomTypeName.en}</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">Rate Plan</span>
				<span class="detail-value">{selectedRate.ratePlanName.en}</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">Check-in</span>
				<span class="detail-value">{formatLocalDateLong(checkIn)}</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">Check-out</span>
				<span class="detail-value">{formatLocalDateLong(checkOut)}</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">Nights</span>
				<span class="detail-value">{nights} {pluralize(nights, 'night', 'nights')}</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">Guests</span>
				<span class="detail-value">{guests.length} {pluralize(guests.length, 'Guest', 'Guests')}</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">Main Guest</span>
				<span class="detail-value">{mainGuest.firstName} {mainGuest.lastName}</span>
			</div>

			<!-- Package Inclusions -->
			<div class="inclusions-section-confirm">
				<div class="inclusions-header-confirm">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 6L9 17l-5-5"/>
					</svg>
					<span>Your Package Includes</span>
				</div>
				<div class="inclusions-grid">
					{#each selectedRate.includesLabels.en as inclusion}
						<div class="inclusion-item-confirm">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<path d="M20 6L9 17l-5-5"/>
							</svg>
							<span>{inclusion}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="detail-row total">
				<span class="detail-label">Total Paid</span>
				<span class="detail-value">{formatCurrency(amount)}</span>
			</div>
		</div>

		<!-- Next Steps -->
		<div class="next-steps">
			<h4>What's Next?</h4>
			<ul>
				<li>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					Check your email for the complete confirmation
				</li>
				<li>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					Print or save your confirmation number
				</li>
				<li>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					Arrive at the resort for check-in after 3:00 PM
				</li>
			</ul>
		</div>

		<!-- Actions -->
		<div class="actions">
			<Button variant="primary" onclick={() => window.print()}>
				{#snippet children()}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="6 9 6 2 18 2 18 9"></polyline>
						<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
						<rect x="6" y="14" width="12" height="8"></rect>
					</svg>
					Print Confirmation
				{/snippet}
			</Button>
			<Button variant="secondary" onclick={() => window.location.href = '/'}>
				{#snippet children()}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
					</svg>
					Back to Home
				{/snippet}
			</Button>
		</div>
	</div>
</div>

<style>
	.confirmation {
		max-width: 700px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.success-animation {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.success-animation svg {
		animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.circle {
		stroke-dasharray: 240;
		stroke-dashoffset: 240;
		animation: drawCircle 0.6s ease-out forwards;
	}

	.checkmark {
		stroke-dasharray: 80;
		stroke-dashoffset: 80;
		animation: drawCheckmark 0.4s 0.3s ease-out forwards;
	}

	@keyframes scaleIn {
		from { transform: scale(0); }
		to { transform: scale(1); }
	}

	@keyframes drawCircle {
		to { stroke-dashoffset: 0; }
	}

	@keyframes drawCheckmark {
		to { stroke-dashoffset: 0; }
	}

	.confirmation-content {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	h1 {
		text-align: center;
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 0.5rem 0;
	}

	.confirmation-subtitle {
		text-align: center;
		font-size: 1rem;
		color: #6b7280;
		margin: 0 0 2rem 0;
	}

	.confirmation-number {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem;
		background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
		border-radius: 12px;
		margin-bottom: 1.5rem;
	}

	.confirmation-number .label {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.confirmation-number .number {
		font-size: 2rem;
		font-weight: 700;
		color: white;
		font-family: 'Courier New', monospace;
		letter-spacing: 2px;
	}

	.email-notice {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 1rem;
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.email-notice svg {
		flex-shrink: 0;
		color: #10b981;
		margin-top: 2px;
	}

	.email-notice p {
		font-size: 0.9375rem;
		color: #065f46;
		margin: 0;
		line-height: 1.5;
	}

	.details-card {
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 12px;
		margin-bottom: 2rem;
	}

	.details-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.details-header h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
	}

	.package-badge-confirm {
		padding: 6px 16px;
		border-radius: 20px;
		color: white;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-row.total {
		margin-top: 0.5rem;
		padding-top: 1rem;
		border-top: 2px solid var(--color-secondary);
		border-bottom: none;
	}

	.detail-label {
		font-size: 0.9375rem;
		color: #6b7280;
		font-weight: 500;
	}

	.detail-value {
		font-size: 1rem;
		color: var(--color-primary);
		font-weight: 600;
		text-align: right;
	}

	.detail-row.total .detail-value {
		font-size: 1.5rem;
		color: var(--color-secondary);
	}

	/* Inclusions in Confirmation */
	.inclusions-section-confirm {
		padding: 1.5rem 0;
		margin: 1.5rem 0;
		border-top: 2px solid #e5e7eb;
		border-bottom: 2px solid #e5e7eb;
	}

	.inclusions-header-confirm {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 1rem;
	}

	.inclusions-header-confirm svg {
		color: #10b981;
	}

	.inclusions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.inclusion-item-confirm {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #4b5563;
		padding: 0.75rem;
		background: white;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
		transition: all 0.2s;
	}

	.inclusion-item-confirm:hover {
		border-color: #10b981;
		background: #f0fdf4;
	}

	.inclusion-item-confirm svg {
		color: #10b981;
		flex-shrink: 0;
	}

	.next-steps {
		margin-bottom: 2rem;
	}

	.next-steps h4 {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 1rem 0;
	}

	.next-steps ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.next-steps li {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 0;
		font-size: 0.9375rem;
		color: #4b5563;
		line-height: 1.5;
	}

	.next-steps li svg {
		flex-shrink: 0;
		color: #10b981;
		margin-top: 2px;
	}

	.actions {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.actions {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (max-width: 639px) {
		.confirmation-content {
			padding: 1.5rem 1rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.confirmation-number .number {
			font-size: 1.5rem;
		}

		.details-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.inclusions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

