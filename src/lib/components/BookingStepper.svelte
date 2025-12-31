<script lang="ts">
	/**
	 * Booking Stepper Component
	 * Multi-step booking flow with animations
	 * Now using global store for state management
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
	import { bookingStore, nights, isSearchValid, selectedRate, completeBookingData } from '$lib/stores';
	import { generateConfirmationNumber, pluralize } from '$lib/utils/formatting';
	import { formatLocalDate } from '$lib/utils/date-helpers';
	import { scrollToElement, scrollToTop, scrollToTopInstant } from '$lib/utils/scroll';
	import { trackEvent } from '$lib/services/analytics';

	// Local state for form inputs (will sync with store)
	let checkIn = $state('');
	let checkOut = $state('');
	let adults = $state(2);
	let children = $state(0);
	let promoCode = $state('');

	// Local validation based on local state
	let isFormValid = $derived(checkIn && checkOut && adults >= 1);

	// Initialize from store
	$effect(() => {
		checkIn = $bookingStore.checkIn;
		checkOut = $bookingStore.checkOut;
		adults = $bookingStore.adults;
		children = $bookingStore.children;
		promoCode = $bookingStore.promoCode;
	});

	async function handleSearch() {
		// Track search initiation
		trackEvent('search_initiated', {
			checkIn,
			checkOut,
			adults,
			children,
			promoCode: promoCode ? 'yes' : 'no'
		});

		// Sync local state to store
		bookingStore.setSearchCriteria({
			checkIn,
			checkOut,
			adults,
			children,
			promoCode
		});

		if (!isFormValid) {
			bookingStore.setError('Please fill in all required fields');
			return;
		}

		bookingStore.setLoading(true);
		bookingStore.clearError();

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
			const rooms = result.data?.rooms || [];
			
			bookingStore.setAvailableRooms(rooms);
			
			if (rooms.length > 0) {
				// Track successful search
				trackEvent('search_completed', {
					roomsFound: rooms.length,
					checkIn,
					checkOut,
					nights: $nights
				});

				bookingStore.goToStep('select');
				scrollToElement('room-selection');
			} else {
				bookingStore.setError('No rooms available for your dates. Please try different dates.');
				
				// Track no availability
				trackEvent('search_completed', {
					roomsFound: 0,
					checkIn,
					checkOut
				});
			}
		} catch (err) {
			bookingStore.setError(err instanceof Error ? err.message : 'An error occurred');
			
			// Track error
			trackEvent('booking_error', {
				step: 'search',
				error: err instanceof Error ? err.message : 'Unknown error'
			});
		} finally {
			bookingStore.setLoading(false);
		}
	}

	function handleSelectRoom(room: EnrichedRoomAvailability, rateIndex: number) {
		// Track room selection
		trackEvent('room_selected', {
			roomType: room.roomTypeCode,
			roomName: room.roomTypeName.en,
			ratePlan: room.rates[rateIndex].ratePlanCode,
			amount: room.rates[rateIndex].amountAfterTax,
			nights: $nights
		});

		bookingStore.selectRoom(room, rateIndex);
		bookingStore.goToStep('details');
		scrollToElement('guest-details');
	}

	function handleGuestDetails(data: any) {
		// Track guest details completion
		trackEvent('guest_details_completed', {
			guestsCount: data.guests.length,
			hasChildren: $bookingStore.children > 0
		});

		bookingStore.setGuests(data.guests);
		bookingStore.goToStep('payment');
		scrollToElement('payment-form');

		// Track payment step started
		trackEvent('payment_started', {
			amount: $bookingStore.selectedRoom?.rates[$bookingStore.selectedRateIndex].amountAfterTax
		});
	}

	function goBackToDetails() {
		// Track step back
		trackEvent('step_back', {
			from: 'payment',
			to: 'details'
		});

		bookingStore.goToStep('details');
		scrollToElement('guest-details', 200);
	}

	async function handlePayment(data: any) {
		// Save payment data to store
		bookingStore.setPayment(data);
		bookingStore.setLoading(true);

		try {
			// Track payment completion attempt
			trackEvent('payment_completed', {
				amount: $bookingStore.selectedRoom?.rates[$bookingStore.selectedRateIndex].amountAfterTax
			});

			// Get complete booking data from store
			const bookingPayload = $completeBookingData;

			console.log('📤 Sending reservation to API:', bookingPayload);

			// Create reservation in Opera PMS
			const response = await fetch('/api/reservations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(bookingPayload)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.details || errorData.error || 'Failed to create reservation');
			}

		const result = await response.json();

		console.log('✅ Reservation created:', result);

		// Update confirmation with Opera PMS response
		if (result.confirmationNumber && result.reservationId) {
			bookingStore.setConfirmation(result.confirmationNumber, result.reservationId);
			console.log('📋 Updated booking store with:', {
				confirmationNumber: result.confirmationNumber,
				reservationId: result.reservationId
			});
		}

		// Track successful booking
		trackEvent('booking_confirmed', {
			confirmationNumber: result.confirmationNumber,
			reservationId: result.reservationId,
			amount: $bookingStore.selectedRoom?.rates[$bookingStore.selectedRateIndex].amountAfterTax,
			roomType: $bookingStore.selectedRoom?.roomTypeCode,
			nights: $nights
		});

			// Go to confirmation page
			bookingStore.goToStep('confirmation');
			
			// Force scroll to absolute top for confirmation page
			scrollToTopInstant();
			setTimeout(() => scrollToTop(0), 50);

		} catch (error) {
			console.error('❌ Reservation error:', error);
			
			// Track error
			trackEvent('booking_error', {
				step: 'payment',
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			// Show error to user
			bookingStore.setError(
				error instanceof Error 
					? `Failed to create reservation: ${error.message}` 
					: 'Failed to create reservation. Please try again.'
			);
		} finally {
			bookingStore.setLoading(false);
		}
	}

	function goBackToSearch() {
		// Track step back
		trackEvent('step_back', {
			from: 'select',
			to: 'search'
		});

		bookingStore.goToStep('search');
		bookingStore.setAvailableRooms([]);
		bookingStore.selectRoom(null as any, 0);
		bookingStore.clearError();
		scrollToTop(200);
	}

	function goBackToSelection() {
		// Track step back
		trackEvent('step_back', {
			from: 'details',
			to: 'select'
		});

		bookingStore.goToStep('select');
		bookingStore.selectRoom(null as any, 0);
		scrollToElement('room-selection', 200);
	}
</script>

<!-- Progress Indicator -->
{#if $bookingStore.currentStep !== 'confirmation'}
	<div class="stepper-progress">
		<div class="step" class:active={$bookingStore.currentStep === 'search'} class:completed={$bookingStore.currentStep !== 'search'}>
			<div class="step-number">1</div>
			<div class="step-label">Search</div>
		</div>
		<div class="step-line" class:active={$bookingStore.currentStep !== 'search'}></div>
		<div class="step" class:active={$bookingStore.currentStep === 'select'} class:completed={['details', 'payment', 'confirmation'].includes($bookingStore.currentStep)}>
			<div class="step-number">2</div>
			<div class="step-label">Select</div>
		</div>
		<div class="step-line" class:active={['details', 'payment', 'confirmation'].includes($bookingStore.currentStep)}></div>
		<div class="step" class:active={$bookingStore.currentStep === 'details'} class:completed={['payment', 'confirmation'].includes($bookingStore.currentStep)}>
			<div class="step-number">3</div>
			<div class="step-label">Details</div>
		</div>
		<div class="step-line" class:active={['payment', 'confirmation'].includes($bookingStore.currentStep)}></div>
		<div class="step" class:active={$bookingStore.currentStep === 'payment'} class:completed={['confirmation'].includes($bookingStore.currentStep)}>
			<div class="step-number">4</div>
			<div class="step-label">Payment</div>
		</div>
	</div>
{/if}

<!-- Step 1: Search -->
{#if $bookingStore.currentStep === 'search'}
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
					{#if $nights > 0}
						<span class="nights-badge">{$nights} {pluralize($nights, 'night', 'nights')}</span>
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

			{#if $bookingStore.error}
				<div class="error-message">{$bookingStore.error}</div>
			{/if}

			<Button type="submit" variant="primary" fullWidth disabled={!isFormValid || $bookingStore.loading} loading={$bookingStore.loading}>
				{#snippet children()}
					{#if !$bookingStore.loading}
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8"></circle>
							<path d="m21 21-4.35-4.35"></path>
						</svg>
					{/if}
					{$bookingStore.loading ? 'Searching...' : 'Search Rooms'}
				{/snippet}
			</Button>
		</form>
	</div>
{/if}

<!-- Step 2: Select Room -->
{#if $bookingStore.currentStep === 'select'}
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
					{formatLocalDate($bookingStore.checkIn)} - {formatLocalDate($bookingStore.checkOut)}
				</span>
				<span class="summary-item">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
					{$bookingStore.adults} {pluralize($bookingStore.adults, 'Adult', 'Adults')}{$bookingStore.children > 0 ? `, ${$bookingStore.children} ${pluralize($bookingStore.children, 'Child', 'Children')}` : ''}
				</span>
				<span class="summary-item">{$nights} {pluralize($nights, 'Night', 'Nights')}</span>
			</div>
		</div>

		<div class="rooms-container">
			<h3 class="rooms-title">{$bookingStore.availableRooms.length} {pluralize($bookingStore.availableRooms.length, 'Villa', 'Villas')} Available</h3>
			<div class="rooms-grid">
				{#each $bookingStore.availableRooms as room}
					<RoomCardCompact {room} nights={$nights} onSelect={handleSelectRoom} />
				{/each}
			</div>
		</div>
	</div>
{/if}

<!-- Step 3: Guest Details -->
{#if $bookingStore.currentStep === 'details' && $bookingStore.selectedRoom}
	<div class="step-content details-step" id="guest-details" in:fly={{ y: 20, duration: 300 }}>
		<GuestDetailsForm
			room={$bookingStore.selectedRoom}
			adults={$bookingStore.adults}
			children={$bookingStore.children}
			checkIn={$bookingStore.checkIn}
			checkOut={$bookingStore.checkOut}
			nights={$nights}
			selectedRate={$bookingStore.selectedRoom.rates[$bookingStore.selectedRateIndex]}
			onSubmit={handleGuestDetails}
			onBack={goBackToSelection}
		/>
	</div>
{/if}

<!-- Step 4: Payment -->
{#if $bookingStore.currentStep === 'payment' && $bookingStore.selectedRoom && $bookingStore.guests.length > 0}
	<div class="step-content payment-step" id="payment-form" in:fly={{ y: 20, duration: 300 }}>
		<PaymentForm
			amount={$bookingStore.selectedRoom.rates[$bookingStore.selectedRateIndex].amountAfterTax}
			currency="USD"
			onSubmit={handlePayment}
			onBack={goBackToDetails}
		/>
	</div>
{/if}

<!-- Step 5: Confirmation -->
{#if $bookingStore.currentStep === 'confirmation' && $bookingStore.selectedRoom && $bookingStore.guests.length > 0}
	<div class="step-content confirmation-step" in:fly={{ y: 20, duration: 300 }}>
		<BookingConfirmation
			confirmationNumber={$bookingStore.confirmationNumber}
			room={$bookingStore.selectedRoom}
			selectedRate={$bookingStore.selectedRoom.rates[$bookingStore.selectedRateIndex]}
			checkIn={$bookingStore.checkIn}
			checkOut={$bookingStore.checkOut}
			nights={$nights}
			guests={$bookingStore.guests}
			amount={$bookingStore.selectedRoom.rates[$bookingStore.selectedRateIndex].amountAfterTax}
			email={$bookingStore.guests[0].email || ''}
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

