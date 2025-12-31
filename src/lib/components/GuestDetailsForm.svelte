<script lang="ts">
	/**
	 * Guest Details Form Component
	 * Collects guest information for reservation
	 */

	import type { EnrichedRoomAvailability } from '$lib/types/opera';
	import { validateEmail, validatePhone, validateRequired } from '$lib/utils/validation';
	import { formatCurrency, pluralize } from '$lib/utils/formatting';
	import { formatLocalDateShort } from '$lib/utils/date-helpers';
	import { scrollToFirstError } from '$lib/utils/scroll';
	import Button from './shared/Button.svelte';

	interface Guest {
		firstName: string;
		lastName: string;
		nationalId: string;
		email?: string;
		phone?: string;
		isMainContact: boolean;
	}

	interface Props {
		room: EnrichedRoomAvailability;
		adults: number;
		children: number;
		checkIn: string;
		checkOut: string;
		nights: number;
		selectedRate: any;
		onSubmit: (data: any) => void;
		onBack: () => void;
	}

	let { room, adults, children, checkIn, checkOut, nights, selectedRate, onSubmit, onBack }: Props = $props();

	// Initialize guests array
	let guests = $state<Guest[]>([]);
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	// Initialize guests only once
	$effect(() => {
		if (guests.length === 0) {
			guests = Array.from({ length: adults + children }, (_, index) => ({
				firstName: '',
				lastName: '',
				nationalId: '',
				email: index === 0 ? '' : undefined,
				phone: index === 0 ? '' : undefined,
				isMainContact: index === 0
			}));
		}
	});

	function validateGuest(index: number): boolean {
		const guest = guests[index];
		let isValid = true;
		const prefix = `guest-${index}`;

		// First name
		const fnValidation = validateRequired(guest.firstName, 'First name');
		if (!fnValidation.isValid) {
			errors[`${prefix}-firstName`] = fnValidation.error!;
			isValid = false;
		} else {
			delete errors[`${prefix}-firstName`];
		}

		// Last name
		const lnValidation = validateRequired(guest.lastName, 'Last name');
		if (!lnValidation.isValid) {
			errors[`${prefix}-lastName`] = lnValidation.error!;
			isValid = false;
		} else {
			delete errors[`${prefix}-lastName`];
		}

		// National ID
		const idValidation = validateRequired(guest.nationalId, 'National ID');
		if (!idValidation.isValid) {
			errors[`${prefix}-nationalId`] = idValidation.error!;
			isValid = false;
		} else {
			delete errors[`${prefix}-nationalId`];
		}

		// Main contact validation
		if (guest.isMainContact) {
			if (!guest.email || !validateEmail(guest.email)) {
				errors[`${prefix}-email`] = 'Valid email is required';
				isValid = false;
			} else {
				delete errors[`${prefix}-email`];
			}

			if (!guest.phone || !validatePhone(guest.phone)) {
				errors[`${prefix}-phone`] = 'Valid phone number is required (min 10 digits)';
				isValid = false;
			} else {
				delete errors[`${prefix}-phone`];
			}
		}

		return isValid;
	}

	function handleBlur(index: number, field: string) {
		const key = `guest-${index}-${field}`;
		touched[key] = true;
		validateGuest(index);
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		// Mark all fields as touched
		guests.forEach((_, index) => {
			['firstName', 'lastName', 'nationalId', 'email', 'phone'].forEach(field => {
				touched[`guest-${index}-${field}`] = true;
			});
		});

		// Validate all guests
		let allValid = true;
		guests.forEach((_, index) => {
			if (!validateGuest(index)) {
				allValid = false;
			}
		});

		if (allValid) {
			onSubmit({ guests });
		} else {
			scrollToFirstError();
		}
	}
</script>

<div class="guest-details-form">
	<!-- Booking Summary -->
	<div class="booking-summary">
		<div class="summary-header">
			<h3>Reservation Summary</h3>
			<div class="package-badge" style="background-color: {selectedRate.packageColor}">
				{selectedRate.packageLabel.en}
			</div>
		</div>

		<!-- Room & Dates Section -->
		<div class="summary-section">
			<div class="summary-row">
				<div class="summary-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
					</svg>
				</div>
				<div class="summary-info">
					<span class="info-label">Room</span>
					<span class="info-value">{room.roomTypeName.en}</span>
				</div>
			</div>

			<div class="summary-row">
				<div class="summary-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
				</div>
				<div class="summary-info">
					<span class="info-label">Check-in</span>
					<span class="info-value">{formatLocalDateShort(checkIn)}</span>
				</div>
			</div>

			<div class="summary-row">
				<div class="summary-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
				</div>
				<div class="summary-info">
					<span class="info-label">Check-out</span>
					<span class="info-value">{formatLocalDateShort(checkOut)}</span>
				</div>
			</div>

			<div class="summary-row">
				<div class="summary-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
					</svg>
				</div>
				<div class="summary-info">
					<span class="info-label">Nights</span>
					<span class="info-value">{nights} {pluralize(nights, 'night', 'nights')}</span>
				</div>
			</div>

			<div class="summary-row">
				<div class="summary-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
					</svg>
				</div>
				<div class="summary-info">
					<span class="info-label">Guests</span>
					<span class="info-value">{adults} {pluralize(adults, 'Adult', 'Adults')}{children > 0 ? `, ${children} ${pluralize(children, 'Child', 'Children')}` : ''}</span>
				</div>
			</div>
		</div>

		<!-- Package Inclusions -->
		<div class="summary-section inclusions-section">
			<div class="inclusions-header">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 6L9 17l-5-5"/>
				</svg>
				<span>Package Includes</span>
			</div>
			<div class="inclusions-list">
				{#each selectedRate.includesLabels.en as inclusion}
					<div class="inclusion-item">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M20 6L9 17l-5-5"/>
						</svg>
						<span>{inclusion}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Total Price -->
		<div class="summary-total">
			<div class="total-row">
				<span class="total-label">Total Amount</span>
				<span class="total-price">{formatCurrency(selectedRate.amountAfterTax)}</span>
			</div>
			<div class="total-note">For {nights} {pluralize(nights, 'night', 'nights')}</div>
		</div>
	</div>

	<!-- Guest Details Form -->
	<form class="details-form" onsubmit={handleSubmit}>
		<div class="form-header">
			<h3>Guest Information</h3>
			<p>Please provide details for all guests staying in this room</p>
		</div>

		{#each guests as guest, index}
			<div class="guest-section">
				<div class="guest-header">
					<h4>
						{#if index < adults}
							Adult {index + 1}
						{:else}
							Child {index - adults + 1}
						{/if}
						{#if guest.isMainContact}
							<span class="main-contact-badge">Main Contact</span>
						{/if}
					</h4>
					{#if guest.isMainContact}
						<p class="helper-text">This person will receive the confirmation email</p>
					{/if}
				</div>

				<div class="form-grid">
					<!-- First Name -->
					<div class="form-field">
						<label for="guest-{index}-firstName">
							First Name <span class="required">*</span>
						</label>
						<input
							id="guest-{index}-firstName"
							type="text"
							bind:value={guest.firstName}
							onblur={() => handleBlur(index, 'firstName')}
							class:error={touched[`guest-${index}-firstName`] && errors[`guest-${index}-firstName`]}
							placeholder="Enter first name"
							autocomplete="given-name"
						/>
						{#if touched[`guest-${index}-firstName`] && errors[`guest-${index}-firstName`]}
							<span class="error-message">{errors[`guest-${index}-firstName`]}</span>
						{/if}
					</div>

					<!-- Last Name -->
					<div class="form-field">
						<label for="guest-{index}-lastName">
							Last Name <span class="required">*</span>
						</label>
						<input
							id="guest-{index}-lastName"
							type="text"
							bind:value={guest.lastName}
							onblur={() => handleBlur(index, 'lastName')}
							class:error={touched[`guest-${index}-lastName`] && errors[`guest-${index}-lastName`]}
							placeholder="Enter last name"
							autocomplete="family-name"
						/>
						{#if touched[`guest-${index}-lastName`] && errors[`guest-${index}-lastName`]}
							<span class="error-message">{errors[`guest-${index}-lastName`]}</span>
						{/if}
					</div>

					<!-- National ID -->
					<div class="form-field full-width">
						<label for="guest-{index}-nationalId">
							National ID / Passport Number <span class="required">*</span>
						</label>
						<input
							id="guest-{index}-nationalId"
							type="text"
							bind:value={guest.nationalId}
							onblur={() => handleBlur(index, 'nationalId')}
							class:error={touched[`guest-${index}-nationalId`] && errors[`guest-${index}-nationalId`]}
							placeholder="Enter ID or passport number"
						/>
						{#if touched[`guest-${index}-nationalId`] && errors[`guest-${index}-nationalId`]}
							<span class="error-message">{errors[`guest-${index}-nationalId`]}</span>
						{/if}
					</div>

					<!-- Email (Main contact only) -->
					{#if guest.isMainContact}
						<div class="form-field">
							<label for="guest-{index}-email">
								Email <span class="required">*</span>
							</label>
							<input
								id="guest-{index}-email"
								type="email"
								bind:value={guest.email}
								onblur={() => handleBlur(index, 'email')}
								class:error={touched[`guest-${index}-email`] && errors[`guest-${index}-email`]}
								placeholder="your@email.com"
								autocomplete="email"
							/>
							{#if touched[`guest-${index}-email`] && errors[`guest-${index}-email`]}
								<span class="error-message">{errors[`guest-${index}-email`]}</span>
							{/if}
						</div>

						<!-- Phone (Main contact only) -->
						<div class="form-field">
							<label for="guest-{index}-phone">
								Phone Number <span class="required">*</span>
							</label>
							<input
								id="guest-{index}-phone"
								type="tel"
								bind:value={guest.phone}
								onblur={() => handleBlur(index, 'phone')}
								class:error={touched[`guest-${index}-phone`] && errors[`guest-${index}-phone`]}
								placeholder="+1 (555) 123-4567"
								autocomplete="tel"
							/>
							{#if touched[`guest-{index}-phone`] && errors[`guest-${index}-phone`]}
								<span class="error-message">{errors[`guest-${index}-phone`]}</span>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/each}

		<!-- Form Actions -->
		<div class="form-actions">
			<Button variant="secondary" onclick={onBack}>
				{#snippet children()}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M19 12H5M12 19l-7-7 7-7"/>
					</svg>
					Back
				{/snippet}
			</Button>
			<Button type="submit" variant="primary" fullWidth>
				{#snippet children()}
					Continue to Payment
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
				{/snippet}
			</Button>
		</div>
	</form>
</div>

<style>
	.guest-details-form {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	/* Booking Summary */
	.booking-summary {
		background: linear-gradient(135deg, rgba(24, 52, 83, 0.03) 0%, rgba(197, 165, 111, 0.05) 100%);
		border: 2px solid rgba(197, 165, 111, 0.2);
		border-radius: 16px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.summary-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid rgba(197, 165, 111, 0.2);
	}

	.summary-header h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
	}

	.package-badge {
		padding: 6px 16px;
		border-radius: 20px;
		color: white;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	/* Summary Sections */
	.summary-section {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(197, 165, 111, 0.15);
	}

	.summary-section:last-of-type {
		border-bottom: none;
		padding-bottom: 0;
	}

	.summary-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: white;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		transition: all 0.2s;
	}

	.summary-row:hover {
		background: rgba(255, 255, 255, 0.8);
		transform: translateX(2px);
	}

	.summary-row:last-child {
		margin-bottom: 0;
	}

	.summary-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, var(--color-secondary) 0%, var(--color-tertiary) 100%);
		border-radius: 10px;
		color: white;
		flex-shrink: 0;
	}

	.summary-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.info-label {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.info-value {
		font-size: 1rem;
		color: var(--color-primary);
		font-weight: 700;
	}

	/* Package Inclusions */
	.inclusions-section {
		background: white;
		padding: 1rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
	}

	.inclusions-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 1rem;
	}

	.inclusions-header svg {
		color: #10b981;
	}

	.inclusions-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.inclusion-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #4b5563;
		padding: 0.5rem;
		background: #f9fafb;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.inclusion-item:hover {
		background: #f3f4f6;
		transform: translateX(2px);
	}

	.inclusion-item svg {
		color: #10b981;
		flex-shrink: 0;
	}

	/* Total Price */
	.summary-total {
		background: linear-gradient(135deg, var(--color-primary) 0%, #0f2740 100%);
		color: white;
		padding: 1.5rem;
		border-radius: 12px;
		margin-top: 1.5rem;
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.total-label {
		font-size: 1rem;
		font-weight: 600;
		opacity: 0.9;
	}

	.total-price {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-tertiary);
	}

	.total-note {
		font-size: 0.8125rem;
		opacity: 0.8;
		text-align: right;
	}

	/* Form */
	.details-form {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.form-header {
		margin-bottom: 2rem;
	}

	.form-header h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 0.5rem 0;
	}

	.form-header p {
		font-size: 0.9375rem;
		color: #6b7280;
		margin: 0;
	}

	/* Guest Section */
	.guest-section {
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		border: 2px solid transparent;
		transition: all 0.2s;
	}

	.guest-section:hover {
		border-color: #e5e7eb;
	}

	.guest-header {
		margin-bottom: 1.5rem;
	}

	.guest-header h4 {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 0.25rem 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.main-contact-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 12px;
		background: var(--color-secondary);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 12px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.helper-text {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	/* Form Grid */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25rem;
	}

	@media (min-width: 640px) {
		.form-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.full-width {
			grid-column: 1 / -1;
		}
	}

	/* Form Field */
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.required {
		color: #ef4444;
	}

	.form-field input {
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		transition: all 0.2s;
		background: white;
	}

	.form-field input:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.1);
	}

	.form-field input.error {
		border-color: #ef4444;
	}

	.form-field input.error:focus {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.error-message {
		font-size: 0.875rem;
		color: #ef4444;
		font-weight: 500;
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 2px solid #e5e7eb;
	}

	@media (min-width: 640px) {
		.form-actions {
			flex-direction: row;
			justify-content: space-between;
			gap: 1.5rem;
		}
	}

	@media (max-width: 639px) {
		.details-form {
			padding: 1.5rem 1rem;
		}

		.guest-section {
			padding: 1rem;
		}

		.booking-summary {
			padding: 1rem;
		}

		.summary-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.total-price {
			font-size: 1.75rem;
		}

		.inclusions-list {
			grid-template-columns: 1fr;
		}
	}
</style>

