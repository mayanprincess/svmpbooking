/**
 * TypeScript types for OPERA Cloud API
 */

// Room Type Configuration
export interface RoomTypeConfig {
	nameEn: string;
	nameEs: string;
	bedrooms: number;
	maxAdults: number;
	maxChildren: number;
	beds: string[];
	location: string;
	view: 'ocean' | 'garden' | 'pool';
	sortOrder: number;
}

// Rate Plan Configuration
export interface RatePlanConfig {
	package: 'premium' | 'family' | 'basic' | 'promo';
	labelEn: string;
	labelEs: string;
	includes: string[];
	sortOrder: number;
}

// Package Type Configuration
export interface PackageTypeConfig {
	labelEn: string;
	labelEs: string;
	color: string;
	bgClass: string;
}

// OAuth2 Token Response
export interface OperaTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
}

// Availability Request Parameters
export interface AvailabilityParams {
	checkIn: string; // YYYY-MM-DD
	checkOut: string; // YYYY-MM-DD
	adults: number;
	children: number;
	ratePlanCode?: string;
	promoCode?: string;
}

// Room Stay (from OPERA API)
export interface RoomStay {
	roomRates: RoomRate[];
	guestCounts?: {
		adults?: number;
		children?: number;
	};
}

// Room Rate (from OPERA API - THIS IS THE MAIN DATA STRUCTURE)
export interface RoomRate {
	roomType: string; // Room type code (e.g., "1BBFG", "2BMS")
	ratePlanCode: string; // Rate plan code (e.g., "AIF-2025", "BI-2025")
	total: {
		amountBeforeTax: number;
		amountAfterTax: number;
		currencyCode: string;
	};
	rates?: {
		[date: string]: {
			amountBeforeTax: number;
			amountAfterTax: number;
			currencyCode: string;
		};
	};
	start: string;
	end: string;
	suppressRate?: boolean;
	marketCode?: string;
	numberOfUnits?: number;
	packages?: any[];
}

// Legacy interfaces (kept for backward compatibility)
export interface RatePlan {
	ratePlanCode: string;
	ratePlanName?: string;
	marketCode?: string;
	rates?: Rate[];
}

export interface Rate {
	base?: {
		amountBeforeTax?: number;
		amountAfterTax?: number;
		currencyCode?: string;
	};
	total?: {
		amountBeforeTax?: number;
		amountAfterTax?: number;
		currencyCode?: string;
	};
	start?: string;
	end?: string;
}

// Hotel Availability Item (from OPERA API)
export interface HotelAvailabilityItem {
	roomStays: RoomStay[];
	ratePlanSet?: string;
	hotelId: string;
	closed?: boolean;
	redemption?: boolean;
	hasMore?: boolean;
}

// Availability Response (from OPERA API)
export interface AvailabilityResponse {
	hotelAvailability: HotelAvailabilityItem[];
	links?: Array<{
		href: string;
		rel: string;
		templated: boolean;
		method: string;
		operationId: string;
	}>;
}

// Enriched Room Availability (with local config merged)
export interface EnrichedRoomAvailability {
	roomTypeCode: string;
	roomTypeName: {
		en: string;
		es: string;
	};
	bedrooms: number;
	maxAdults: number;
	maxChildren: number;
	beds: string[];
	location: string;
	view: 'ocean' | 'garden' | 'pool';
	viewLabel: {
		en: string;
		es: string;
	};
	rates: EnrichedRate[];
	available: boolean;
	sortOrder: number;
}

// Enriched Rate (with package info)
export interface EnrichedRate {
	ratePlanCode: string;
	ratePlanName: {
		en: string;
		es: string;
	};
	package: string;
	packageLabel: {
		en: string;
		es: string;
	};
	packageColor: string;
	includes: string[];
	includesLabels: {
		en: string[];
		es: string[];
	};
	amountBeforeTax: number;
	amountAfterTax: number;
	currencyCode: string;
	nightlyRate?: number;
	sortOrder: number;
}

// Reservation Request
export interface ReservationRequest {
	checkIn: string;
	checkOut: string;
	roomTypeCode: string;
	ratePlanCode: string;
	adults: number;
	children: number;
	guest: GuestInfo;
	specialRequests?: string;
	promoCode?: string;
}

// Guest Information
export interface GuestInfo {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	address?: {
		street?: string;
		city?: string;
		state?: string;
		postalCode?: string;
		country?: string;
	};
}

// Reservation Response
export interface ReservationResponse {
	confirmationNumber?: string;
	reservationId?: string;
	status?: string;
	message?: string;
	errors?: string[];
}

// API Error
export interface OperaApiError {
	status: number;
	message: string;
	details?: unknown;
	timestamp: string;
}

