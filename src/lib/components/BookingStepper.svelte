<script lang="ts">
	/**
	 * Booking Stepper Component
	 * Multi-step booking flow with animations
	 */

	import { fly } from 'svelte/transition';
	import DateRangeSelector from './DateRangeSelectorMobile.svelte';
	import GuestSelector from './GuestSelector.svelte';
	import PromoCodeInput from './PromoCodeInput.svelte';
	import RoomCardCompact from './RoomCardCompact.svelte';
	import GuestDetailsForm from './GuestDetailsForm.svelte';
	import PaymentForm from './PaymentForm.svelte';
	import BookingConfirmation from './BookingConfirmation.svelte';
	import Button from './shared/Button.svelte';
	import Spinner from './shared/Spinner.svelte'; 
	import type { EnrichedRoomAvailability } from '$lib/types/opera';
	import { generateConfirmationNumber, pluralize } from '$lib/utils/formatting';
	import { calculateNightsBetween, formatLocalDate } from '$lib/utils/date-helpers';
	import { scrollToElement, scrollToTop, scrollToTopInstant } from '$lib/utils/scroll';

	// Step management
	let currentStep = $state<'search' | 'select' | 'details' | 'payment' | 'confirmation'>('search');
	
	// Form state
	let checkIn = $state('');
	let checkOut = $state('');
	let adults = $state(2);
	let children = $state(0);
	let promoCode = $state('');
	
	// Search results
	let rooms = $state<EnrichedRoomAvailability[]>([]);
	let selectedRoom = $state<EnrichedRoomAvailability | null>(null);
	let selectedRateIndex = $state(0);
	let guestData = $state<any>(null);
	let paymentData = $state<any>(null);
	let confirmationNumber = $state<string>('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Validation and derived state
	let isSearchValid = $derived(checkIn && checkOut && adults >= 1);
	let nights = $derived(calculateNightsBetween(checkIn, checkOut));

	async function handleSearch() {
		if (!isSearchValid) {
			error = 'Please fill in all required fields';
			return;
		}

		loading = true;
		error = null;

		try {
			const params = new URLSearchParams({
				checkIn,
				checkOut,
				adults: adults.toString(),
				children: children.toString()
			});

			if (promoCode) {
				params.append('promoCode', promoCode);
			}

		const response = await fetch(`/api/availability?${params.toString()}`);

		if (!response.ok) {
			throw new Error('Failed to fetch availability');
		}

		const result = await response.json();
		rooms = result.data?.rooms || [];
		
		if (rooms.length > 0) {
			currentStep = 'select';
			scrollToElement('room-selection');
		} else {
			error = 'No rooms available for your dates. Please try different dates.';
		}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function handleSelectRoom(room: EnrichedRoomAvailability, rateIndex: number) {
		selectedRoom = room;
		selectedRateIndex = rateIndex;
		currentStep = 'details';
		scrollToElement('guest-details');
	}

	function handleGuestDetails(data: any) {
		guestData = data;
		currentStep = 'payment';
		scrollToElement('payment-form');
	}

	function goBackToDetails() {
		currentStep = 'details';
		scrollToElement('guest-details', 200);
	}

	async function handlePayment(data: any) {
		paymentData = data;
		confirmationNumber = generateConfirmationNumber('MPB');

		// TODO: In production:
		// 1. Process payment via payment gateway
		// 2. Create reservation in OPERA
		// 3. Send confirmation email

		currentStep = 'confirmation';
		
		// Force scroll to absolute top for confirmation page
		scrollToTopInstant();
		setTimeout(() => scrollToTop(0), 50);
	}

	function goBackToSearch() {
		currentStep = 'search';
		rooms = [];
		selectedRoom = null;
		error = null;
		scrollToTop(200);
	}

	function goBackToSelection() {
		currentStep = 'select';
		selectedRoom = null;
		scrollToElement('room-selection', 200);
	}
</script>

<!-- Progress Indicator -->
{#if currentStep !== 'confirmation'}
	<div class="stepper-progress">
		<div class="step" class:active={currentStep === 'search'} class:completed={currentStep !== 'search'}>
			<div class="step-number">1</div>
			<div class="step-label">Search</div>
		</div>
		<div class="step-line" class:active={currentStep !== 'search'}></div>
		<div class="step" class:active={currentStep === 'select'} class:completed={['details', 'payment', 'confirmation'].includes(currentStep)}>
			<div class="step-number">2</div>
			<div class="step-label">Select</div>
		</div>
		<div class="step-line" class:active={['details', 'payment', 'confirmation'].includes(currentStep)}></div>
		<div class="step" class:active={currentStep === 'details'} class:completed={['payment', 'confirmation'].includes(currentStep)}>
			<div class="step-number">3</div>
			<div class="step-label">Details</div>
		</div>
		<div class="step-line" class:active={['payment', 'confirmation'].includes(currentStep)}></div>
		<div class="step" class:active={currentStep === 'payment'} class:completed={['confirmation'].includes(currentStep)}>
			<div class="step-number">4</div>
			<div class="step-label">Payment</div>
		</div>
	</div>
{/if}

<!-- Step 1: Search -->
{#if currentStep === 'search'}
	<div class="step-content search-step" in:fly={{ y: 20, duration: 300 }}>
		<div class="search-header">
			<h2>Find Your Perfect Villa</h2>
			<p>Select your dates and number of guests to see available rooms</p>
		</div>

		<form class="search-form" onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
			<div class="form-grid">
				<!-- Dates Row -->
				<div class="form-section">
					<DateRangeSelector
						bind:checkIn
						bind:checkOut
					/>
					{#if nights > 0}
						<span class="nights-badge">{nights} {pluralize(nights, 'night', 'nights')}</span>
					{/if}
				</div>

				<!-- Guests Field -->
				<div class="form-section">
					<GuestSelector
						bind:adults
						bind:children
					/>
				</div>

				<!-- Promo Code Field -->
				<div class="form-section promo-section">
					<PromoCodeInput bind:promoCode />
				</div>
			</div>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<Button type="submit" variant="primary" fullWidth disabled={!isSearchValid || loading} loading={loading}>
				{#snippet children()}
					{#if !loading}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<path d="m21 21-4.35-4.35"></path>
						</svg>
					{/if}
					{loading ? 'Searching...' : 'Search Rooms'}
				{/snippet}
			</Button>
		</form>
	</div>
{/if}

<!-- Step 2: Select Room -->
{#if currentStep === 'select'}
	<div class="step-content select-step" id="room-selection" in:fly={{ y: 20, duration: 300 }}>
		<div class="selection-header">
			<button class="back-button" onclick={goBackToSearch}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 12H5M12 19l-7-7 7-7"/>
				</svg>
				Modify Search
			</button>
			<div class="search-summary">
				<span class="summary-item">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
					{formatLocalDate(checkIn)} - {formatLocalDate(checkOut)}
				</span>
				<span class="summary-item">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
					{adults} {pluralize(adults, 'Adult', 'Adults')}{children > 0 ? `, ${children} ${pluralize(children, 'Child', 'Children')}` : ''}
				</span>
				<span class="summary-item">{nights} {pluralize(nights, 'Night', 'Nights')}</span>
			</div>
		</div>

		<div class="rooms-container">
			<h3 class="rooms-title">{rooms.length} {pluralize(rooms.length, 'Villa', 'Villas')} Available</h3>
			<div class="rooms-grid">
				{#each rooms as room}
					<RoomCardCompact {room} {nights} onSelect={handleSelectRoom} />
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Step 3: Guest Details -->
{#if currentStep === 'details' && selectedRoom}
	<div class="step-content details-step" id="guest-details" in:fly={{ y: 20, duration: 300 }}>
		<GuestDetailsForm
			room={selectedRoom}
			{adults}
			{children}
			{checkIn}
			{checkOut}
			{nights}
			selectedRate={selectedRoom.rates[selectedRateIndex]}
			onSubmit={handleGuestDetails}
			onBack={goBackToSelection}
		/>
	</div>
{/if}

<!-- Step 4: Payment -->
{#if currentStep === 'payment' && selectedRoom && guestData}
	<div class="step-content payment-step" id="payment-form" in:fly={{ y: 20, duration: 300 }}>
		<PaymentForm
			amount={selectedRoom.rates[selectedRateIndex].amountAfterTax}
			currency="USD"
			onSubmit={handlePayment}
			onBack={goBackToDetails}
		/>
	</div>
{/if}

<!-- Step 5: Confirmation -->
{#if currentStep === 'confirmation' && selectedRoom && guestData}
	<div class="step-content confirmation-step" in:fly={{ y: 20, duration: 300 }}>
		<BookingConfirmation
			{confirmationNumber}
			room={selectedRoom}
			selectedRate={selectedRoom.rates[selectedRateIndex]}
			{checkIn}
			{checkOut}
			{nights}
			guests={guestData.guests}
			amount={selectedRoom.rates[selectedRateIndex].amountAfterTax}
			email={guestData.guests[0].email}
		/>
	</div>
{/if}

<style>
	.stepper-progress {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		max-width: 700px;
		margin: 0 auto;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		position: relative;
		flex-shrink: 0;
	}

	.step-number {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.75rem;
		background: #e5e7eb;
		color: #6b7280;
		transition: all 0.3s;
		position: relative;
		z-index: 2;
	}

	.step.active .step-number {
		background: var(--color-primary);
		color: white;
		box-shadow: 0 0 0 4px rgba(24, 52, 83, 0.1);
	}

	.step.completed .step-number {
		background: var(--color-secondary);
		color: white;
	}

	.step-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #6b7280;
		white-space: nowrap;
		text-align: center;
	}

	.step.active .step-label {
		color: var(--color-primary);
		font-weight: 600;
	}

	.step-line {
		flex: 1;
		height: 2px;
		min-width: 60px;
		max-width: 120px;
		background: #e5e7eb;
		transition: all 0.3s;
		margin: 0px;
		position: relative;
		z-index: 1;
        margin-bottom: -25px;
	}

	.step-line.active {
		background: var(--color-secondary);
	}

	.step-content {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	.search-step {
		max-width: 700px;
	}

	.search-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.search-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.search-header p {
		font-size: 0.9375rem;
		color: #6b7280;
	}

	.search-form {
		background: white;
		border-radius: 16px;
		padding: 1.5rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0rem;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		position: relative;
	}

	.nights-badge {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: var(--color-secondary);
		font-weight: 600;
	}

	.promo-section {
		display: flex;
        margin-top: 32px;
	}

	.error-message {
		padding: 0.75rem 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		font-size: 0.875rem;
	}


	.selection-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-primary);
		cursor: pointer;
		transition: all 0.2s;
		width: fit-content;
	}

	.back-button:hover {
		border-color: var(--color-secondary);
		background: rgba(197, 165, 111, 0.05);
	}

	.search-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--color-primary);
		font-weight: 500;
	}

	.summary-item svg {
		color: var(--color-secondary);
	}

	.rooms-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.rooms-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.25rem;
	}

	@media (min-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto auto;
			gap: 1.25rem 1rem;
		}

		.form-section:first-child {
			grid-column: 1 / -1;
		}

		.promo-section {
			display: flex;
		}
	}

	@media (min-width: 768px) {
		.search-header h2 {
			font-size: 1.875rem;
		}

		.search-form {
			padding: 2rem;
		}

		.selection-header {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		.rooms-grid {
			grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		}

		.rooms-title {
			font-size: 1.5rem;
		}

		.step-number {
			width: 52px;
			height: 52px;
			font-size: 1.125rem;
		}

		.step-label {
			font-size: 0.875rem;
		}

		.step-line {
			top: -26px;
		}
	}

	@media (max-width: 639px) {
		.stepper-progress {
			padding: 1.5rem 0.5rem;
		}

		.step-number {
			width: 40px;
			height: 40px;
			font-size: 0.875rem;
		}

		.step-label {
			font-size: 0.65rem;
		}

		.step-line {
			min-width: 30px;
			max-width: 60px;
			top: -20px;
		}
	}

	@media (min-width: 1024px) {
		.rooms-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>

