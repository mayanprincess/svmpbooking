/**
 * Booking Store - Global state management for reservation flow
 * Centralizes all booking-related data across the application
 */

import { writable, derived } from 'svelte/store';
import type { EnrichedRoomAvailability } from '$lib/types/opera';
import { calculateNightsBetween } from '$lib/utils/date-helpers';

// Guest interface
export interface Guest {
	firstName: string;
	lastName: string;
	nationalId: string;
	email?: string;
	phone?: string;
	isMainContact: boolean;
}

// Payment interface
export interface PaymentInfo {
	cardNumber: string;
	cardholderName: string;
	expiryDate: string;
	cvv: string;
	billingAddress?: {
		street: string;
		city: string;
		state: string;
		zipCode: string;
		country: string;
	};
}

// Booking state interface
export interface BookingState {
	// Step management
	currentStep: 'search' | 'select' | 'details' | 'payment' | 'confirmation';
	
	// Search criteria
	checkIn: string;
	checkOut: string;
	adults: number;
	children: number;
	promoCode: string;
	
	// Search results
	availableRooms: EnrichedRoomAvailability[];
	
	// Selection
	selectedRoom: EnrichedRoomAvailability | null;
	selectedRateIndex: number;
	
	// Guest information
	guests: Guest[];
	
	// Payment information
	payment: PaymentInfo | null;
	
	// Confirmation
	confirmationNumber: string;
	reservationId: string;
	
	// UI state
	loading: boolean;
	error: string | null;
}

// Initial state
const initialState: BookingState = {
	currentStep: 'search',
	checkIn: '',
	checkOut: '',
	adults: 2,
	children: 0,
	promoCode: '',
	availableRooms: [],
	selectedRoom: null,
	selectedRateIndex: 0,
	guests: [],
	payment: null,
	confirmationNumber: '',
	reservationId: '',
	loading: false,
	error: null
};

// Create the writable store
function createBookingStore() {
	const { subscribe, set, update } = writable<BookingState>(initialState);

	return {
		subscribe,
		
		// Reset entire store
		reset: () => set(initialState),
		
		// Search actions
		setSearchCriteria: (criteria: {
			checkIn: string;
			checkOut: string;
			adults: number;
			children: number;
			promoCode?: string;
		}) => update(state => ({
			...state,
			checkIn: criteria.checkIn,
			checkOut: criteria.checkOut,
			adults: criteria.adults,
			children: criteria.children,
			promoCode: criteria.promoCode || ''
		})),
		
		setCheckIn: (date: string) => update(state => ({ ...state, checkIn: date })),
		setCheckOut: (date: string) => update(state => ({ ...state, checkOut: date })),
		setAdults: (count: number) => update(state => ({ ...state, adults: count })),
		setChildren: (count: number) => update(state => ({ ...state, children: count })),
		setPromoCode: (code: string) => update(state => ({ ...state, promoCode: code })),
		
		// Room selection
		setAvailableRooms: (rooms: EnrichedRoomAvailability[]) => 
			update(state => ({ ...state, availableRooms: rooms })),
		
		selectRoom: (room: EnrichedRoomAvailability, rateIndex: number) => 
			update(state => ({
				...state,
				selectedRoom: room,
				selectedRateIndex: rateIndex
			})),
		
		// Guest information
		setGuests: (guests: Guest[]) => update(state => ({ ...state, guests })),
		
		// Payment information
		setPayment: (payment: PaymentInfo) => update(state => ({ ...state, payment })),
		
		// Confirmation
		setConfirmation: (confirmationNumber: string, reservationId: string) => 
			update(state => ({
				...state,
				confirmationNumber,
				reservationId
			})),
		
		// Step navigation
		goToStep: (step: BookingState['currentStep']) => 
			update(state => ({ ...state, currentStep: step })),
		
		nextStep: () => update(state => {
			const steps: BookingState['currentStep'][] = ['search', 'select', 'details', 'payment', 'confirmation'];
			const currentIndex = steps.indexOf(state.currentStep);
			const nextStep = steps[currentIndex + 1] || state.currentStep;
			return { ...state, currentStep: nextStep };
		}),
		
		previousStep: () => update(state => {
			const steps: BookingState['currentStep'][] = ['search', 'select', 'details', 'payment', 'confirmation'];
			const currentIndex = steps.indexOf(state.currentStep);
			const prevStep = steps[currentIndex - 1] || state.currentStep;
			return { ...state, currentStep: prevStep };
		}),
		
		// UI state
		setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
		setError: (error: string | null) => update(state => ({ ...state, error })),
		clearError: () => update(state => ({ ...state, error: null }))
	};
}

// Export the store
export const bookingStore = createBookingStore();

// Derived stores for computed values
export const nights = derived(
	bookingStore,
	($booking) => calculateNightsBetween($booking.checkIn, $booking.checkOut)
);

export const selectedRate = derived(
	bookingStore,
	($booking) => $booking.selectedRoom?.rates[$booking.selectedRateIndex] || null
);

export const totalGuests = derived(
	bookingStore,
	($booking) => $booking.adults + $booking.children
);

export const isSearchValid = derived(
	bookingStore,
	($booking) => !!$booking.checkIn && !!$booking.checkOut && $booking.adults >= 1
);

export const mainContact = derived(
	bookingStore,
	($booking) => $booking.guests.find(g => g.isMainContact) || null
);

// Complete booking data for final submission
export const completeBookingData = derived(
	bookingStore,
	($booking) => ({
		// Dates
		checkIn: $booking.checkIn,
		checkOut: $booking.checkOut,
		nights: calculateNightsBetween($booking.checkIn, $booking.checkOut),
		
		// Guests
		adults: $booking.adults,
		children: $booking.children,
		totalGuests: $booking.adults + $booking.children,
		guests: $booking.guests,
		mainContact: $booking.guests.find(g => g.isMainContact) || null,
		
		// Room & Rate
		room: $booking.selectedRoom,
		selectedRate: $booking.selectedRoom?.rates[$booking.selectedRateIndex] || null,
		rateCode: $booking.selectedRoom?.rates[$booking.selectedRateIndex]?.ratePlanCode,
		
		// Payment
		payment: $booking.payment,
		
		// Promo
		promoCode: $booking.promoCode,
		
		// Confirmation
		confirmationNumber: $booking.confirmationNumber,
		reservationId: $booking.reservationId,
		
		// Metadata
		createdAt: new Date().toISOString()
	})
);
