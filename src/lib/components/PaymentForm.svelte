<script lang="ts">
	/**
	 * Payment Form Component
	 * Clean, optimized payment form with reusable utilities
	 */

	import { validateCardNumber, validateCVV, validateExpiry, validateMinLength } from '$lib/utils/validation';
	import { formatCardNumber, formatCurrency } from '$lib/utils/formatting';
	import { detectCardBrand, sanitizeCardInput } from '$lib/utils/payment';
	import Button from './shared/Button.svelte';

	interface Props {
		amount: number;
		currency: string;
		onSubmit: (paymentData: any) => void;
		onBack: () => void;
	}

	let { amount, currency, onSubmit, onBack }: Props = $props();

	// Card data
	let cardNumber = $state('');
	let cardHolder = $state('');
	let expiryMonth = $state('');
	let expiryYear = $state('');
	let cvv = $state('');

	// UI state
	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});
	let processing = $state(false);

	// Derived state
	let displayCardNumber = $derived(formatCardNumber(cardNumber));
	let cardBrand = $derived(detectCardBrand(cardNumber));

	function handleCardNumberInput(e: Event) {
		const input = e.target as HTMLInputElement;
		cardNumber = sanitizeCardInput(input.value).substring(0, 16);
		input.value = formatCardNumber(cardNumber);
	}

	function handleExpiryInput(e: Event, type: 'month' | 'year') {
		const value = sanitizeCardInput((e.target as HTMLInputElement).value);
		if (type === 'month') {
			expiryMonth = value.substring(0, 2);
		} else {
			expiryYear = value.substring(0, 2);
		}
	}

	function handleCvvInput(e: Event) {
		cvv = sanitizeCardInput((e.target as HTMLInputElement).value).substring(0, 4);
	}

	function validateField(field: string): boolean {
		switch (field) {
			case 'cardNumber':
				if (!validateCardNumber(cardNumber)) {
					errors.cardNumber = 'Invalid card number';
					return false;
				}
				delete errors.cardNumber;
				return true;

			case 'cardHolder':
				const nameValidation = validateMinLength(cardHolder, 3, 'Cardholder name');
				if (!nameValidation.isValid) {
					errors.cardHolder = nameValidation.error!;
					return false;
				}
				delete errors.cardHolder;
				return true;

			case 'expiry':
				const expiryValidation = validateExpiry(expiryMonth, expiryYear);
				if (!expiryValidation.isValid) {
					errors.expiry = expiryValidation.error!;
					return false;
				}
				delete errors.expiry;
				return true;

			case 'cvv':
				if (!validateCVV(cvv)) {
					errors.cvv = 'Invalid CVV';
					return false;
				}
				delete errors.cvv;
				return true;

			default:
				return true;
		}
	}

	function handleBlur(field: string) {
		touched[field] = true;
		validateField(field);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		// Mark all as touched
		touched = { cardNumber: true, cardHolder: true, expiry: true, cvv: true };

		// Validate all fields
		const isValid = ['cardNumber', 'cardHolder', 'expiry', 'cvv'].every(validateField);

		if (!isValid) return;

		processing = true;

		// Simulate payment processing
		await new Promise(resolve => setTimeout(resolve, 2000));

		// In production, tokenize with payment gateway
		onSubmit({
			cardLast4: cardNumber.slice(-4),
			cardBrand,
			cardHolder,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv
		});

		processing = false;
	}
</script>

<div class="payment-form">
	<div class="security-banner">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect>
			<path d="M12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
			<path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
		</svg>
		<span>Secure Payment - Your information is encrypted</span>
	</div>

	<form class="form" onsubmit={handleSubmit}>
		<div class="form-header">
			<h3>Payment Information</h3>
			<div class="amount-display">
				<span class="amount-label">Total Amount</span>
				<span class="amount-value">{formatCurrency(amount, currency)}</span>
			</div>
		</div>

		<!-- Card Preview -->
		<div class="card-preview">
			<div class="card-brand">
				<span class:active={cardNumber.length > 0}>{cardBrand || 'Credit Card'}</span>
			</div>
			<div class="card-number-display">
				{displayCardNumber || '•••• •••• •••• ••••'}
			</div>
			<div class="card-footer">
				<div class="card-holder-display">{cardHolder || 'CARD HOLDER NAME'}</div>
				<div class="card-expiry-display">
					{expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear}` : 'MM/YY'}
				</div>
			</div>
		</div>

		<!-- Card Number -->
		<div class="form-field">
			<label for="cardNumber">Card Number <span class="required">*</span></label>
			<div class="input-with-icon">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
					<line x1="1" y1="10" x2="23" y2="10"></line>
				</svg>
				<input
					id="cardNumber"
					type="text"
					inputmode="numeric"
					placeholder="1234 5678 9012 3456"
					value={displayCardNumber}
					oninput={handleCardNumberInput}
					onblur={() => handleBlur('cardNumber')}
					class:error={touched.cardNumber && errors.cardNumber}
					autocomplete="cc-number"
				/>
			</div>
			{#if touched.cardNumber && errors.cardNumber}
				<span class="error-message">{errors.cardNumber}</span>
			{/if}
		</div>

		<!-- Cardholder Name -->
		<div class="form-field">
			<label for="cardHolder">Cardholder Name <span class="required">*</span></label>
			<input
				id="cardHolder"
				type="text"
				placeholder="JOHN DOE"
				bind:value={cardHolder}
				onblur={() => handleBlur('cardHolder')}
				class:error={touched.cardHolder && errors.cardHolder}
				autocomplete="cc-name"
			/>
			{#if touched.cardHolder && errors.cardHolder}
				<span class="error-message">{errors.cardHolder}</span>
			{/if}
		</div>

		<!-- Expiry and CVV -->
		<div class="form-row">
			<div class="form-field">
				<label>Expiry Date <span class="required">*</span></label>
				<div class="expiry-inputs">
					<input
						type="text"
						inputmode="numeric"
						placeholder="MM"
						value={expiryMonth}
						oninput={(e) => handleExpiryInput(e, 'month')}
						onblur={() => handleBlur('expiry')}
						class:error={touched.expiry && errors.expiry}
						autocomplete="cc-exp-month"
						maxlength="2"
					/>
					<span class="expiry-separator">/</span>
					<input
						type="text"
						inputmode="numeric"
						placeholder="YY"
						value={expiryYear}
						oninput={(e) => handleExpiryInput(e, 'year')}
						onblur={() => handleBlur('expiry')}
						class:error={touched.expiry && errors.expiry}
						autocomplete="cc-exp-year"
						maxlength="2"
					/>
				</div>
				{#if touched.expiry && errors.expiry}
					<span class="error-message">{errors.expiry}</span>
				{/if}
			</div>

			<div class="form-field">
				<label for="cvv">
					CVV <span class="required">*</span>
					<span class="cvv-hint" title="3 or 4 digits on the back of your card">?</span>
				</label>
				<input
					id="cvv"
					type="text"
					inputmode="numeric"
					placeholder="123"
					value={cvv}
					oninput={handleCvvInput}
					onblur={() => handleBlur('cvv')}
					class:error={touched.cvv && errors.cvv}
					autocomplete="cc-csc"
					maxlength="4"
				/>
				{#if touched.cvv && errors.cvv}
					<span class="error-message">{errors.cvv}</span>
				{/if}
			</div>
		</div>

		<!-- Terms Notice -->
		<div class="terms-notice">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10"></circle>
				<line x1="12" y1="16" x2="12" y2="12"></line>
				<line x1="12" y1="8" x2="12.01" y2="8"></line>
			</svg>
			<p>By completing this purchase, you agree to our terms and conditions.</p>
		</div>

		<!-- Actions -->
		<div class="form-actions">
			<Button variant="secondary" onclick={onBack} disabled={processing}>
				{#snippet children()}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M19 12H5M12 19l-7-7 7-7"/>
					</svg>
					Back
				{/snippet}
			</Button>
			<Button type="submit" variant="primary" loading={processing}>
				{#snippet children()}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect>
						<path d="M12 17a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
						<path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
					</svg>
					{processing ? 'Processing...' : `Pay ${formatCurrency(amount, currency)}`}
				{/snippet}
			</Button>
		</div>
	</form>
</div>

<style>
	.payment-form {
		max-width: 600px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	.security-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border-radius: 12px;
		margin-bottom: 2rem;
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.form {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.form-header {
		margin-bottom: 2rem;
	}

	.form-header h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 1rem 0;
	}

	.amount-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(197, 165, 111, 0.1);
		border-radius: 8px;
	}

	.amount-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.amount-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-secondary);
	}

	.card-preview {
		background: linear-gradient(135deg, var(--color-primary) 0%, #0f2740 100%);
		color: white;
		padding: 2rem;
		border-radius: 16px;
		margin-bottom: 2rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		min-height: 200px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.card-brand {
		text-align: right;
	}

	.card-brand span {
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		opacity: 0.6;
	}

	.card-brand span.active {
		opacity: 1;
	}

	.card-number-display {
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: 2px;
		font-family: 'Courier New', monospace;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}

	.card-holder-display,
	.card-expiry-display {
		font-size: 0.875rem;
		font-family: 'Courier New', monospace;
	}

	.card-holder-display {
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.form-field {
		margin-bottom: 1.5rem;
	}

	.form-field label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
	}

	.cvv-hint {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		background: #e5e7eb;
		color: #6b7280;
		border-radius: 50%;
		font-size: 0.75rem;
		cursor: help;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-icon svg {
		position: absolute;
		left: 1rem;
		color: #9ca3af;
	}

	.input-with-icon input {
		padding-left: 3rem;
	}

	.form-field input {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 8px;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.form-field input:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.1);
	}

	.form-field input.error {
		border-color: #ef4444;
	}

	.error-message {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: #ef4444;
		font-weight: 500;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.expiry-inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.expiry-inputs input {
		width: 100%;
		text-align: center;
	}

	.expiry-separator {
		font-size: 1.5rem;
		font-weight: 700;
		color: #9ca3af;
	}

	.terms-notice {
		display: flex;
		gap: 0.75rem;
		padding: 1rem;
		background: #f3f4f6;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.terms-notice svg {
		flex-shrink: 0;
		color: #6b7280;
	}

	.terms-notice p {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.5;
	}

	.form-actions {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
	}

	@media (max-width: 639px) {
		.form {
			padding: 1.5rem 1rem;
		}

		.card-preview {
			padding: 1.5rem;
		}

		.card-number-display {
			font-size: 1.25rem;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.form-actions {
			grid-template-columns: 1fr;
		}
	}
</style>
