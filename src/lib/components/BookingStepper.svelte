<script lang="ts">
	/**
	 * Booking Stepper Component
	 * Multi-step booking flow with animations
	 * Now using global store for state management
	 */

	import { get } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { tick } from 'svelte';
	import { locale, t, villasAvailablePhrase } from '$lib/i18n';
	import DateRangeSelector from './DateRangeSelectorResponsive.svelte';
	import GuestSelector from './GuestSelector.svelte';
	import PromoCodeInput from './PromoCodeInput.svelte';
	import RoomCardCompact from './RoomCardCompact.svelte';
	import GuestDetailsForm from './GuestDetailsForm.svelte';
	import BookingConfirmation from './BookingConfirmation.svelte';
	import Button from './shared/Button.svelte';
	import type { EnrichedRoomAvailability } from '$lib/types/opera';
	import { bookingStore, nights, completeBookingData } from '$lib/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import { formatLocalDateForLang } from '$lib/utils/date-helpers';
	import { scrollToElement, scrollToTop, scrollToTopInstant } from '$lib/utils/scroll';
	import { trackEvent } from '$lib/services/analytics';

	// Unified Checkout state
	let paymentToken = $state('');
	let reservationId = $state('');
	let ucScriptUrl = $state<string | null>(null);
	let ucScriptIntegrity = $state<string | null>(null);
	let showPaymentHtml = $state(false);
	let unifiedCheckoutLaunched = $state(false);
	let paymentResetTrigger = $state(0);
	let ucPaymentsRef = $state<any>(null);

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

	// Lanzar Unified Checkout al llegar al paso payment con token disponible
	$effect(() => {
		if ($bookingStore.currentStep === 'payment' && paymentToken && !unifiedCheckoutLaunched) {
			unifiedCheckoutLaunched = true;
			launchUnifiedCheckout();
		}
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
			bookingStore.setError(t(get(locale), 'fillRequired'));
			return;
		}

		bookingStore.setLoading(true);
		bookingStore.clearError();

		try {
			const lang = get(locale);
			const params = new URLSearchParams({
				checkIn,
				checkOut,
				adults: adults.toString(),
				children: children.toString(),
				lang
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
				bookingStore.setError(t(get(locale), 'noRooms'));
				
				// Track no availability
				trackEvent('search_completed', {
					roomsFound: 0,
					checkIn,
					checkOut
				});
			}
		} catch (err) {
			bookingStore.setError(
				err instanceof Error ? err.message : t(get(locale), 'searchError')
			);
			
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

	async function handleGuestDetails(data: any) {
		trackEvent('guest_details_completed', {
			guestsCount: data.guests.length,
			hasChildren: $bookingStore.children > 0
		});

		bookingStore.setGuests(data.guests);
		await requestCaptureContextFromReservation();
	}

	/**
	 * Decodifica el payload de un JWT (capture context) para leer clientLibrary y clientLibraryIntegrity.
	 */
	function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
		try {
			const parts = jwt.split('.');
			if (parts.length !== 3) return null;
			const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
			return JSON.parse(atob(base64)) as Record<string, unknown>;
		} catch {
			return null;
		}
	}

	/**
	 * Carga el script de CyberSource Unified Checkout (clientLibrary).
	 * Según la doc, la URL e integridad deben venir del capture context.
	 */
	function loadUnifiedCheckoutScript(url: string, integrity?: string | null): Promise<void> {
		return new Promise((resolve, reject) => {
			if (document.querySelector(`script[src="${url}"]`)) {
				resolve();
				return;
			}
			const script = document.createElement('script');
			script.src = url;
			script.crossOrigin = 'anonymous';
			if (integrity) script.integrity = integrity;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load Unified Checkout script'));
			document.head.appendChild(script);
		});
	}

	/**
	 * Inicializa Unified Checkout con type CAPTURE.
	 * CyberSource maneja todo internamente (cobro + 3DS).
	 * Solo necesitamos show() → complete().
	 */
	async function launchUnifiedCheckout(): Promise<void> {
		const captureContext = paymentToken;
		if (!captureContext || typeof window === 'undefined') return;

		const scriptUrl = ucScriptUrl;
		if (!scriptUrl) {
			bookingStore.setError('Unified Checkout: falta URL del script.');
			return;
		}

		try {
			await loadUnifiedCheckoutScript(scriptUrl, ucScriptIntegrity);

			const Accept = (window as any).Accept;
			if (!Accept) {
				bookingStore.setError('Unified Checkout: script no definió Accept.');
				return;
			}

			const accept = await Accept(captureContext);
			const up = await accept.unifiedPayments(false);
			ucPaymentsRef = up;

			const showArgs = {
				containers: {
					paymentSelection: '#uc-payment-selection',
					paymentScreen: '#html-container'
				}
			};

			const showResult = await up.show(showArgs);

			const completeResponse = await up.complete(showResult);
			const decodedResponse = typeof completeResponse === 'string'
				? decodeJwtPayload(completeResponse)
				: completeResponse;
			if (decodedResponse?.outcome === 'AUTHORIZED' || decodedResponse?.status === 'AUTHORIZED') {

				const approvalCode = decodedResponse.details?.processorInformation?.approvalCode || '';
				const paymentId = decodedResponse.id || '';

				const confirmRes = await fetch('/api/payment/confirm-payment', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						ReservationId: reservationId,
						ApprovalCode: approvalCode,
						PaymentId: paymentId
					})
				});

				const confirmJson = await confirmRes.json();
				if (!confirmRes.ok) {
					throw new Error(confirmJson.message || 'Error al confirmar el pago');
				}

				const confirmData = confirmJson.data;

				bookingStore.setConfirmation(
					confirmData.confirmationNumber || reservationId,
					confirmData.reservationId || reservationId
				);
				bookingStore.goToStep('confirmation');
				scrollToTopInstant();
				setTimeout(() => scrollToTop(0), 50);
			} else {
				throw new Error(`El cobro no fue aprobado. Estado: ${decodedResponse?.outcome || 'desconocido'}`);
			}
		} catch (err: any) {
			console.error('[UC] Error en flujo de pago:', err?.reason || err?.message);
			bookingStore.setError(
				err?.reason === 'COMPLETE_AUTHENTICATION_FAILED'
					? 'La autenticación 3D Secure falló. Por favor intenta con otra tarjeta.'
					: err?.message || 'Error al procesar el pago.'
			);
			await restartPaymentFlow();
		}
	}

	/**
	 * Limpia el estado de Unified Checkout y vuelve a solicitar un capture context
	 * para que el usuario pueda intentar con otra tarjeta.
	 */
	async function restartPaymentFlow(): Promise<void> {
		const paymentSelection = document.getElementById('uc-payment-selection');
		const htmlContainer = document.getElementById('html-container');
		if (paymentSelection) paymentSelection.innerHTML = '';
		if (htmlContainer) htmlContainer.innerHTML = '';

		// Limpiar el script anterior de UC para forzar recarga
		const oldScript = document.querySelector(`script[src="${ucScriptUrl}"]`);
		if (oldScript) oldScript.remove();

		// Resetear estado
		paymentToken = '';
		ucScriptUrl = null;
		ucScriptIntegrity = null;
		unifiedCheckoutLaunched = false;
		ucPaymentsRef = null;

		// Volver a pedir capture context (genera nuevo token + relanza UC)
		await requestCaptureContextFromReservation();
	}

	/**
	 * Llama a /api/reservation para crear la reserva y obtener el capture context (Token)
	 * necesario para inicializar el Unified Checkout en el paso 4.
	 */
	async function requestCaptureContextFromReservation(): Promise<void> {
		bookingStore.setLoading(true);
		try {
			const bookingPayload = $completeBookingData;
			const body = {
				checkIn: bookingPayload.checkIn,
				checkOut: bookingPayload.checkOut,
				roomTypeCode: bookingPayload.room?.roomTypeCode,
				ratePlanCode: bookingPayload.rateCode,
				adults: bookingPayload.adults,
				children: bookingPayload.children,
				guest: {
					firstName: bookingPayload.mainContact?.firstName,
					lastName: bookingPayload.mainContact?.lastName,
					email: bookingPayload.mainContact?.email,
					phone: bookingPayload.mainContact?.phone || ''
				},
				amountBeforeTax: bookingPayload.selectedRate?.amountBeforeTax || 0,
				promoCode: bookingPayload.promoCode || undefined,
				specialRequests: undefined
			};

			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			const token = authStore.accessToken;
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const response = await fetch('/api/reservation', {
				method: 'POST',
				headers,
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message ||
						errorData.details ||
						errorData.error ||
						'Error al crear la reserva'
				);
			}

		const result = await response.json();
		const captureContext = result.data?.Token;
		const resId = result.data?.ReservationId;

		if (!captureContext) {
			bookingStore.setError(result.data?.Message || 'No se recibió el token de pago.');
			return;
		}

		paymentToken = captureContext;
		reservationId = resId || '';

			const payload = decodeJwtPayload(captureContext);
			if (payload?.ctx) {
				const ctx = payload.ctx as Array<{ data?: { clientLibrary?: string; clientLibraryIntegrity?: string; targetOrigins?: string[] } }>;
				const ctxData = ctx?.[0]?.data;
				if (ctxData?.clientLibrary) {
					ucScriptUrl = ctxData.clientLibrary;
					ucScriptIntegrity = ctxData.clientLibraryIntegrity ?? null;
				}
			}

			if (!ucScriptUrl && payload?.clientLibrary) {
				ucScriptUrl = payload.clientLibrary as string;
				ucScriptIntegrity = (payload.clientLibraryIntegrity as string) ?? null;
			}

			showPaymentHtml = true;
			unifiedCheckoutLaunched = false;
			bookingStore.goToStep('payment');
			await tick();
			scrollToElement('payment-form');

			trackEvent('payment_step_reached', {
				roomType: bookingPayload.room?.roomTypeCode,
				amount: bookingPayload.selectedRate?.amountAfterTax
			});
		} catch (err) {
			console.error('Error al obtener token de pago:', err);
			bookingStore.setError(err instanceof Error ? err.message : 'Error al preparar el pago.');
		} finally {
			bookingStore.setLoading(false);
		}
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
			<div class="step-label">{t($locale, 'stepSearch')}</div>
		</div>
		<div class="step-line" class:active={$bookingStore.currentStep !== 'search'}></div>
		<div class="step" class:active={$bookingStore.currentStep === 'select'} class:completed={['details', 'payment', 'confirmation'].includes($bookingStore.currentStep)}>
			<div class="step-number">2</div>
			<div class="step-label">{t($locale, 'stepSelect')}</div>
		</div>
		<div class="step-line" class:active={['details', 'payment', 'confirmation'].includes($bookingStore.currentStep)}></div>
		<div class="step" class:active={$bookingStore.currentStep === 'details'} class:completed={['payment', 'confirmation'].includes($bookingStore.currentStep)}>
			<div class="step-number">3</div>
			<div class="step-label">{t($locale, 'stepDetails')}</div>
		</div>
		<div class="step-line" class:active={['payment', 'confirmation'].includes($bookingStore.currentStep)}></div>
		<div class="step" class:active={$bookingStore.currentStep === 'payment'} class:completed={['confirmation'].includes($bookingStore.currentStep)}>
			<div class="step-number">4</div>
			<div class="step-label">{t($locale, 'stepPayment')}</div>
		</div>
	</div>
{/if}

<!-- Step 1: Search -->
{#if $bookingStore.currentStep === 'search'}
	<div class="step-content search-step" in:fly={{ y: 20, duration: 300 }}>
		<div class="search-header">
			<h2>{t($locale, 'searchTitle')}</h2>
			<p>{t($locale, 'searchSubtitle')}</p>
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
						<span class="nights-badge"
							>{$nights}
							{$nights === 1 ? t($locale, 'night') : t($locale, 'nights')}</span
						>
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
					{$bookingStore.loading ? t($locale, 'searching') : t($locale, 'searchButton')}
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
				{t($locale, 'modifySearch')}
			</button>
			<div class="search-summary">
				<span class="summary-item">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
					{formatLocalDateForLang($bookingStore.checkIn, $locale)} — {formatLocalDateForLang(
						$bookingStore.checkOut,
						$locale
					)}
				</span>
				<span class="summary-item">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
						<circle cx="12" cy="7" r="4"></circle>
					</svg>
					{$bookingStore.adults}
					{$bookingStore.adults === 1 ? t($locale, 'adult') : t($locale, 'adults')}{$bookingStore.children > 0
						? `, ${$bookingStore.children} ${$bookingStore.children === 1 ? t($locale, 'child') : t($locale, 'children')}`
						: ''}
				</span>
				<span class="summary-item"
					>{$nights}
					{$nights === 1 ? t($locale, 'night') : t($locale, 'nights')}</span
				>
			</div>
		</div>

    

		<div class="rooms-container">
			<h3 class="rooms-title">{villasAvailablePhrase($locale, $bookingStore.availableRooms.length)}</h3>
			<div class="rooms-grid">
				{#each $bookingStore.availableRooms as room}
					<RoomCardCompact language={$locale} {room} nights={$nights} onSelect={handleSelectRoom} />
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
			loading={$bookingStore.loading}
			onSubmit={handleGuestDetails}
			onBack={goBackToSelection}
		/>
	</div>
{/if}

<!-- Step 4: Payment (visually part of Checkout step) -->
{#if $bookingStore.currentStep === 'payment' && $bookingStore.selectedRoom && $bookingStore.guests.length > 0}
	<div class="step-content payment-step" id="payment-form" in:fly={{ y: 20, duration: 300 }}>
		{#if $bookingStore.error}
			<div class="payment-error-banner" in:fly={{ y: -10, duration: 300 }}>
				<div class="payment-error-icon">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="15" y1="9" x2="9" y2="15"/>
						<line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				</div>
				<div class="payment-error-content">
					<strong>{t($locale, 'paymentFailedTitle')}</strong>
					<p>{$bookingStore.error}</p>
				</div>
				<button
					class="payment-error-dismiss"
					onclick={() => bookingStore.clearError()}
					aria-label={t($locale, 'dismissError')}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
		{/if}

		<!-- Compact Reservation Summary -->
		<div class="payment-summary-card">
			<div class="payment-summary-top">
				<h3 class="payment-summary-title">{t($locale, 'reservationSummary')}</h3>
				<button class="edit-details-link" onclick={goBackToDetails}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
					</svg>
					{t($locale, 'edit')}
				</button>
			</div>
			<div class="payment-summary-grid">
				<div class="payment-summary-item">
					<span class="psi-label">{t($locale, 'labelRoom')}</span>
					<span class="psi-value"
						>{$locale === 'es'
							? $bookingStore.selectedRoom.roomTypeName.es
							: $bookingStore.selectedRoom.roomTypeName.en}</span
					>
				</div>
				<div class="payment-summary-item">
					<span class="psi-label">{t($locale, 'labelDates')}</span>
					<span class="psi-value"
						>{formatLocalDateForLang($bookingStore.checkIn, $locale, 'short')} — {formatLocalDateForLang(
							$bookingStore.checkOut,
							$locale,
							'short'
						)}
						· {$nights}
						{$nights === 1 ? t($locale, 'night') : t($locale, 'nights')}</span
					>
				</div>
				<div class="payment-summary-item">
					<span class="psi-label">{t($locale, 'labelGuest')}</span>
					<span class="psi-value">{$bookingStore.guests[0]?.firstName} {$bookingStore.guests[0]?.lastName}</span>
				</div>
				<div class="payment-summary-item">
					<span class="psi-label">{t($locale, 'labelGuests')}</span>
					<span class="psi-value"
						>{$bookingStore.adults}
						{$bookingStore.adults === 1 ? t($locale, 'adult') : t($locale, 'adults')}{$bookingStore.children > 0
							? `, ${$bookingStore.children} ${$bookingStore.children === 1 ? t($locale, 'child') : t($locale, 'children')}`
							: ''}</span
					>
				</div>
			</div>
			<div class="payment-summary-total-row">
				<span class="pst-label">{t($locale, 'labelTotal')}</span>
				<span class="pst-amount">{formatCurrency($bookingStore.selectedRoom.rates[$bookingStore.selectedRateIndex].amountAfterTax)}</span>
			</div>
		</div>

		<!-- Payment Form -->
		<div class="payment-html-wrapper">
			<div class="payment-secure-badge">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
					<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
				</svg>
				{t($locale, 'securePayment')}
			</div>
			<div class="payment-uc-selection" id="uc-payment-selection"></div>
			<div class="payment-html-container" id="html-container"></div>
		</div>
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
		margin-top: 0;
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

	.payment-error-banner {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		max-width: 600px;
		margin: 0 auto 1.5rem;
		padding: 1rem 1.25rem;
		background: #fef2f2;
		border: 1.5px solid #fca5a5;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
	}

	.payment-error-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: #fee2e2;
		border-radius: 50%;
		color: #dc2626;
	}

	.payment-error-content {
		flex: 1;
		min-width: 0;
	}

	.payment-error-content strong {
		display: block;
		font-size: 0.9375rem;
		font-weight: 700;
		color: #991b1b;
		margin-bottom: 0.25rem;
	}

	.payment-error-content p {
		font-size: 0.875rem;
		color: #b91c1c;
		margin: 0;
		line-height: 1.5;
		word-break: break-word;
	}

	.payment-error-dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: 8px;
		color: #dc2626;
		cursor: pointer;
		transition: background 0.2s;
		padding: 0;
	}

	.payment-error-dismiss:hover {
		background: #fee2e2;
	}

	/* Payment Summary Card */
	.payment-summary-card {
		background: linear-gradient(135deg, rgba(24, 52, 83, 0.03) 0%, rgba(197, 165, 111, 0.06) 100%);
		border: 1.5px solid rgba(197, 165, 111, 0.25);
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.25rem;
	}

	.payment-summary-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.payment-summary-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0;
	}

	.edit-details-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.75rem;
		background: transparent;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b7280;
		cursor: pointer;
		transition: all 0.2s;
	}

	.edit-details-link:hover {
		border-color: var(--color-secondary);
		color: var(--color-primary);
		background: rgba(197, 165, 111, 0.05);
	}

	.payment-summary-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.payment-summary-item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.psi-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.psi-value {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.payment-summary-total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1.5px solid rgba(197, 165, 111, 0.2);
	}

	.pst-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.pst-amount {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-secondary);
	}

	/* Payment Form Wrapper */
	.payment-html-wrapper {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
		overflow: visible;
	}

	.payment-secure-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #6b7280;
		margin-bottom: 1.5rem;
		padding: 0.4rem 0.75rem;
		background: #f9fafb;
		border-radius: 8px;
	}

	.payment-secure-badge svg {
		color: #10b981;
	}

	.payment-uc-selection {
		width: 100%;
		min-height: 80px;
		margin-bottom: 1rem;
		overflow: visible;
	}

	.payment-html-container {
		width: 100%;
		min-height: 650px;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		background: #fff;
		padding: 1rem;
		overflow: visible;
	}

	.payment-html-container :global(iframe) {
		display: block !important;
		width: 100% !important;
		min-height: 620px !important;
		border: 0;
	}

	@media (max-width: 768px) {
		.payment-summary-grid {
			grid-template-columns: 1fr;
		}

		.payment-summary-card {
			padding: 1rem;
		}

		.payment-html-wrapper {
			padding: 1rem;
		}

		.payment-html-container {
			min-height: 550px;
			padding: 0.5rem;
		}

		.payment-html-container :global(iframe) {
			min-height: 520px !important;
		}

		.pst-amount {
			font-size: 1.25rem;
		}
	}
</style>

