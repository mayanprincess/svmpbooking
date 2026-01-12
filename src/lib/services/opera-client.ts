/**
 * OPERA Cloud API Client
 * Lightweight wrapper around Oracle Hospitality Integration Platform (OHIP)
 * Based on OAuth2 client credentials flow
 */

import { operaConfig, validateOperaConfig } from '$lib/config/opera';
import type {
	AvailabilityParams,
	AvailabilityResponse,
	OperaTokenResponse,
	ReservationRequest,
	ReservationResponse,
	RoomStay
} from '$lib/types/opera';

// Simple in-memory cache for access token
let cachedToken: {
	token: string;
	expiresAt: number;
} | null = null;

/**
 * OPERA Cloud API Client
 */
export class OperaClient {
	private gatewayUrl: string;
	private enterpriseId: string;
	private hotelId: string;

	constructor() {
		// Validate configuration on instantiation
		validateOperaConfig();

		this.gatewayUrl = operaConfig.gatewayUrl;
		this.enterpriseId = operaConfig.enterpriseId;
		this.hotelId = operaConfig.hotelId;
	}

	/**
	 * Get OAuth2 access token (with caching)
	 * Made public for testing/debugging purposes
	 */
	async getAccessToken(): Promise<string> {
		// Return cached token if still valid (with 5 minute buffer)
		if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
			return cachedToken.token;
		}

		// Request new token
		const clientId = operaConfig.clientId;
		const clientSecret = operaConfig.clientSecret;
		const scope = operaConfig.scope;
		const appKey = operaConfig.appKey;

		// Debug logging for scope
		console.log('🔐 OAuth2 Token Request:', {
			clientId: clientId ? `${clientId.substring(0, 8)}...` : 'MISSING',
			scope: scope || 'MISSING',
			scopeLength: scope?.length || 0,
			appKey: appKey ? `${appKey.substring(0, 8)}...` : 'MISSING',
			enterpriseId: this.enterpriseId || 'MISSING',
			gatewayUrl: this.gatewayUrl
		});

		const basicAuth = btoa(`${clientId}:${clientSecret}`);

		const response = await fetch(`${this.gatewayUrl}/oauth/v1/tokens`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${basicAuth}`,
				'x-app-key': appKey,
				enterpriseId: this.enterpriseId
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				scope: scope
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ OPERA OAuth error:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText,
				requestedScope: scope,
				hint: response.status === 403 
					? 'Scope might not be authorized for this application. Check Oracle Hospitality Developer Portal.'
					: response.status === 401
					? 'Check CLIENT_ID and CLIENT_SECRET in .env file'
					: 'Unknown OAuth error'
			});
			throw new Error(`Unable to obtain OPERA token: ${response.status} ${errorText}`);
		}

		const data: OperaTokenResponse = await response.json();

		if (!data.access_token) {
			throw new Error('OPERA token missing in response');
		}

		// Cache token (expires_in is in seconds)
		cachedToken = {
			token: data.access_token,
			expiresAt: Date.now() + data.expires_in * 1000
		};

		console.log('OPERA token obtained successfully', {
			expiresIn: data.expires_in,
			expiresAt: new Date(cachedToken.expiresAt).toISOString()
		});

		return data.access_token;
	}

	/**
	 * Make authenticated request to OPERA API
	 */
	private async authorizedRequest(
		endpoint: string,
		options: RequestInit = {}
	): Promise<Response> {
		const token = await this.getAccessToken();

		const headers = {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'x-enterpriseid': this.enterpriseId,
			'x-hotelid': this.hotelId,
			'x-app-key': operaConfig.appKey,
			...options.headers
		};

		const url = `${this.gatewayUrl}${endpoint}`;

		console.log('OPERA API Request:', {
			method: options.method || 'GET',
			url,
			headers: {
				...headers,
				Authorization: 'Bearer ***'
			}
		});

		const response = await fetch(url, {
			...options,
			headers
		});

		return response;
	}

	/**
	 * Check availability for given dates and guests
	 */
	async checkAvailability(params: AvailabilityParams): Promise<AvailabilityResponse> {
		const queryParams = new URLSearchParams({
			roomStayStartDate: params.checkIn,
			roomStayEndDate: params.checkOut,
			adults: params.adults.toString(),
			children: params.children.toString(),
			roomStayQuantity: '1',
			limit: '50'
		});

		// Only add ratePlanCode if explicitly provided
		if (params.ratePlanCode) {
			queryParams.append('ratePlanCode', params.ratePlanCode);
		}

		// Add promo code if provided
		if (params.promoCode) {
			queryParams.append('promotionCode', params.promoCode);
		}

		const endpoint = `/par/v1/hotels/${this.hotelId}/availability?${queryParams.toString()}`;

		console.log('🔍 OPERA Availability Request:', {
			endpoint,
			fullUrl: `${this.gatewayUrl}${endpoint}`,
			hotelId: this.hotelId,
			params: {
				roomStayStartDate: params.checkIn,
				roomStayEndDate: params.checkOut,
				adults: params.adults,
				children: params.children,
				roomStayQuantity: 1,
				limit: 50,
				ratePlanCode: params.ratePlanCode || 'NOT PROVIDED',
				promoCode: params.promoCode || 'NOT PROVIDED'
			}
		});

		const response = await this.authorizedRequest(endpoint);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ OPERA availability error:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText,
				endpoint,
				hotelId: this.hotelId
			});
			throw new Error(`OPERA availability error: ${response.status} ${errorText}`);
		}

		const data: AvailabilityResponse = await response.json();

		// Extract the first hotel availability (usually there's only one)
		const hotelAvail = data.hotelAvailability?.[0];
		const roomStays = hotelAvail?.roomStays || [];

		console.log('✅ OPERA availability response summary:', {
			status: response.status,
			hotelId: hotelAvail?.hotelId,
			roomStaysCount: roomStays.length,
			closed: hotelAvail?.closed,
			hasMore: hotelAvail?.hasMore
		});

		if (roomStays.length > 0) {
			console.log('📊 Room stays breakdown:');
			
			// Extract all room rates from room stays
			const allRoomRates = roomStays.flatMap(stay => stay.roomRates || []);
			
			// Group by room type
			const roomTypeMap = new Map<string, number>();
			const ratePlanMap = new Map<string, number>();
			
			allRoomRates.forEach((rate) => {
				const roomCode = rate.roomType || 'UNKNOWN';
				roomTypeMap.set(roomCode, (roomTypeMap.get(roomCode) || 0) + 1);
				
				const rateCode = rate.ratePlanCode || 'UNKNOWN';
				ratePlanMap.set(rateCode, (ratePlanMap.get(rateCode) || 0) + 1);
			});

			console.log('🏨 Room Types Found:', Array.from(roomTypeMap.entries()).map(([code, count]) => `${code} (${count})`).join(', '));
			console.log('💰 Rate Plans Found:', Array.from(ratePlanMap.entries()).map(([code, count]) => `${code} (${count})`).join(', '));

			// Show first room rate in detail
			if (allRoomRates.length > 0) {
				console.log('📋 First room rate example:', {
					roomType: allRoomRates[0].roomType,
					ratePlanCode: allRoomRates[0].ratePlanCode,
					total: allRoomRates[0].total,
					start: allRoomRates[0].start,
					end: allRoomRates[0].end
				});
			}

			// Full data available in console for inspection
			console.groupCollapsed('🔍 Click to see full OPERA response');
			console.log(data);
			console.groupEnd();
		} else {
			console.warn('⚠️ No room stays in response - check if hotelId is correct or dates are available');
		}

		return data;
	}

	/**
	 * Create a reservation
	 */
	async createReservation(reservation: ReservationRequest): Promise<ReservationResponse> {
		// CRITICAL: Validate that we have the exact values from availability search
		console.log('🎯 Creating reservation with values:', {
			hotelId: this.hotelId,
			roomTypeCode: reservation.roomTypeCode,
			ratePlanCode: reservation.ratePlanCode,
			checkIn: reservation.checkIn,
			checkOut: reservation.checkOut,
			adults: reservation.adults,
			children: reservation.children,
			amountBeforeTax: reservation.amountBeforeTax
		});

		// Map our reservation request to OPERA's schema
		const payload = this.mapReservationToOpera(reservation);

		const endpoint = `/rsv/v1/hotels/${this.hotelId}/reservations`;

		console.log('📤 OPERA Reservation Payload (full):', JSON.stringify(payload, null, 2));

		const response = await this.authorizedRequest(endpoint, {
			method: 'POST',
			body: JSON.stringify(payload)
		});

		console.log('📡 OPERA Response Status:', response.status, response.statusText);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ OPERA reservation error:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText,
				requestPayload: payload
			});
			throw new Error(`OPERA reservation error: ${response.status} ${errorText}`);
		}

		const data: ReservationResponse = await response.json();

	console.log('✅ OPERA reservation response (full):', JSON.stringify(data, null, 2));

	// Parse reservation ID and confirmation number from HATEOAS links
	let reservationId: string | undefined;
	let confirmationNumber: string | undefined;

	if (data.links && data.links.length > 0) {
		// Extract reservation ID from self link (e.g., /reservations/13454120)
		const selfLink = data.links.find((link) => link.operationId === 'getReservation');
		if (selfLink) {
			const match = selfLink.href.match(/\/reservations\/(\d+)/);
			if (match) {
				reservationId = match[1];
			}
		}

		// Extract confirmation number from query parameter
		const confirmationLink = data.links.find((link) =>
			link.href.includes('confirmationNumberList')
		);
		if (confirmationLink) {
			const match = confirmationLink.href.match(/confirmationNumberList=(\d+)/);
			if (match) {
				confirmationNumber = match[1];
			}
		}
	}

	console.log('📋 Parsed reservation details:', {
		reservationId,
		confirmationNumber
	});

	return {
		...data,
		reservationId,
		confirmationNumber
	};
	}

	/**
	 * Get reservation by ID (most reliable)
	 */
	async getReservationById(reservationId: string): Promise<any> {
		const endpoint = `/rsv/v1/hotels/${this.hotelId}/reservations/${reservationId}`;

		console.log('🔍 Looking up reservation by ID:', {
			reservationId,
			endpoint
		});

		const response = await this.authorizedRequest(endpoint, {
			method: 'GET'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OPERA reservation lookup error:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText
			});
			throw new Error(`OPERA reservation lookup error: ${response.status} ${errorText}`);
		}

		const data = await response.json();

		console.log('✅ Reservation data:', JSON.stringify(data, null, 2));

		return data;
	}

	/**
	 * Get reservation by confirmation number
	 */
	async getReservationByConfirmationNumber(confirmationNumber: string): Promise<any> {
		const endpoint = `/rsv/v1/hotels/${this.hotelId}/reservations?confirmationNumberList=${confirmationNumber}`;

		console.log('🔍 Looking up reservation by confirmation number:', {
			confirmationNumber,
			endpoint
		});

		const response = await this.authorizedRequest(endpoint, {
			method: 'GET'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OPERA reservation lookup error:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText
			});
			throw new Error(`OPERA reservation lookup error: ${response.status} ${errorText}`);
		}

		const data = await response.json();

		console.log('✅ Reservation data:', JSON.stringify(data, null, 2));

		return data;
	}

	/**
	 * Map our reservation format to OPERA's expected schema
	 * Based on Opera Cloud API v1 documentation
	 */
	private mapReservationToOpera(reservation: ReservationRequest): unknown {
		return {
			reservations: {
				reservation: [
					{
						// Source of sale info
						sourceOfSale: {
							sourceType: 'PMS',
							sourceCode: this.hotelId
						},

						// Room stay details
						roomStay: {
							// Room rates
							roomRates: [
								{
									roomType: reservation.roomTypeCode,
									ratePlanCode: reservation.ratePlanCode,
									start: reservation.checkIn,
									end: reservation.checkOut,
									suppressRate: false,
									marketCode: 'INTERNET',
									sourceCode: 'WEB',
									numberOfUnits: '1',
									pseudoRoom: false,
									roomTypeCharged: reservation.roomTypeCode,
									houseUseOnly: false,
									complimentary: false,
									fixedRate: true,
									discountAllowed: false,
									bogoDiscount: false,
									roomNumberLocked: false,

									// Guest counts at room rate level
									guestCounts: {
										adults: reservation.adults.toString(),
										children: reservation.children.toString()
									},

									// Rate details
									rates: {
										rate: [
											{
												base: {
													amountBeforeTax: reservation.amountBeforeTax.toString(),
													currencyCode: 'USD'
												},
												total: {
													amountBeforeTax: reservation.amountBeforeTax.toString()
												},
												start: reservation.checkIn,
												end: reservation.checkOut,
												shareDistributionInstruction: 'Full'
											}
										]
									},

									// Total amount
									total: {
										amountBeforeTax: reservation.amountBeforeTax.toString(),
										currencyCode: 'USD'
									}
								}
							],

							// Guest counts at room stay level
							guestCounts: {
								adults: reservation.adults.toString(),
								children: reservation.children.toString()
							},

					// Dates
					arrivalDate: reservation.checkIn,
					departureDate: reservation.checkOut,

					// Guarantee - Using PROP (Property Guaranteed)
					// This is the most universal guarantee code for web bookings
					guarantee: {
						guaranteeCode: 'PROP',
						shortDescription: 'Property Guaranteed',
						onHold: false // false = guaranteed reservation (appears in dashboard)
					},

					// ALTERNATIVE OPTIONS (configured in your Opera property):
					// 
					// OPTION 1: Credit Card guarantee (if you process payments)
					// guarantee: {
					// 	guaranteeCode: 'CC',
					// 	shortDescription: 'Credit Card Guaranteed',
					// 	onHold: false
					// },
					//
					// OPTION 2: Deposit Received (if deposit was paid)
					// guarantee: {
					// 	guaranteeCode: 'DRV',
					// 	shortDescription: 'Deposit Received',
					// 	onHold: false
					// },
					//
					// OPTION 3: Direct Bill (for corporate accounts)
					// guarantee: {
					// 	guaranteeCode: 'DB',
					// 	shortDescription: 'Direct Bill Guaranteed',
					// 	onHold: false
					// },

					// Flags
					roomNumberLocked: false,
					printRate: false
						},

						// Guest information
						reservationGuests: [
							{
								profileInfo: {
									profile: {
										customer: {
											personName: [
												{
													givenName: reservation.guest.firstName,
													surname: reservation.guest.lastName,
													nameType: 'Primary'
												}
											],
											language: 'E'
										},
										profileType: 'Guest'
									}
								},
								primary: true
							}
						],

						// Communication (email/phone if available)
						reservationCommunication: {
							emails: {
								emailInfo: reservation.guest.email
									? [
											{
												email: {
													emailAddress: reservation.guest.email,
													type: 'HOME',
													primaryInd: true
												}
											}
									  ]
									: []
							},
							telephones: {
								telephoneInfo: reservation.guest.phone
									? [
											{
												telephone: {
													phoneNumber: reservation.guest.phone,
													phoneUseType: 'HOME',
													primaryInd: true
												}
											}
									  ]
									: []
							}
						},

						// Payment methods
						reservationPaymentMethods: [
							{
								paymentMethod: 'CA',
								folioView: 1
							}
						],

						// Comments
						comments: [
							{
								comment: {
									text: {
										value: 'Booking from website'
									},
									commentTitle: 'General Notes',
									notificationLocation: 'RESERVATION',
									type: 'GEN',
									internal: false
								}
							}
						],

						// Hotel and status
						hotelId: this.hotelId,
						roomStayReservation: true,
						reservationStatus: 'Reserved',
						computedReservationStatus: 'Reserved',
						walkIn: false,
						printRate: false,
						preRegistered: false,
						upgradeEligible: false,
						allowAutoCheckin: false,
						hasOpenFolio: false,
						allowMobileCheckout: false,
						allowMobileViewFolio: false,
						allowPreRegistration: false,
						optedForCommunication: false
					}
				]
			}
		};
	}

	/**
	 * Generate idempotency key for reservations
	 */
	generateIdempotencyKey(): string {
		return crypto.randomUUID();
	}
}

/**
 * Singleton instance
 */
export const operaClient = new OperaClient();

