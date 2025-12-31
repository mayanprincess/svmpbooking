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
	 */
	private async getAccessToken(): Promise<string> {
		// Return cached token if still valid (with 5 minute buffer)
		if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
			return cachedToken.token;
		}

		// Request new token
		const clientId = operaConfig.clientId;
		const clientSecret = operaConfig.clientSecret;
		const scope = operaConfig.scope;
		const appKey = operaConfig.appKey;

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
			console.error('OPERA OAuth error:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText
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
		// Map our reservation request to OPERA's schema
		const payload = this.mapReservationToOpera(reservation);

		const endpoint = `/rsv/v1/hotels/${this.hotelId}/reservations`;

		console.log('Creating reservation:', {
			endpoint,
			payload
		});

		const response = await this.authorizedRequest(endpoint, {
			method: 'POST',
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OPERA reservation error:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText
			});
			throw new Error(`OPERA reservation error: ${response.status} ${errorText}`);
		}

		const data: ReservationResponse = await response.json();

		console.log('OPERA reservation response:', data);

		console.log('✅ OPERA reservation response (full):', JSON.stringify(data, null, 2));
		console.log('📋 Reservation summary:', {
			confirmationNumber: data.confirmationNumber,
			reservationId: data.reservationId
		});

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
						sourceOfSale: {
							sourceType: 'PMS',
							sourceCode: this.hotelId
						},
						roomStay: {
							roomRates: [
								{
									total: {
										amountBeforeTax: reservation.amountBeforeTax.toString()
									},
									rates: {
										rate: [
											{
												base: {
													amountBeforeTax: reservation.amountBeforeTax.toString(),
													currencyCode: 'USD'
												},
												shareDistributionInstruction: 'Full',
												total: {
													amountBeforeTax: reservation.amountBeforeTax.toString()
												},
												start: reservation.checkIn,
												end: reservation.checkOut
											}
										]
									},
									guestCounts: {
										adults: reservation.adults.toString(),
										children: reservation.children.toString()
									},
									roomType: reservation.roomTypeCode,
									ratePlanCode: reservation.ratePlanCode,
									start: reservation.checkIn,
									end: reservation.checkOut,
									suppressRate: true,
									marketCode: 'LEISURE',
									marketCodeDescription: 'Leisure',
									sourceCode: 'WEB',
									sourceCodeDescription: 'Website',
									numberOfUnits: '1',
									pseudoRoom: false,
									roomTypeCharged: reservation.roomTypeCode,
									houseUseOnly: false,
									complimentary: false,
									fixedRate: true,
									discountAllowed: false,
									bogoDiscount: false
								}
							],
							guestCounts: {
								adults: reservation.adults.toString(),
								children: reservation.children.toString()
							},
							arrivalDate: reservation.checkIn,
							departureDate: reservation.checkOut,
							guarantee: {
								onHold: true
							},
							roomNumberLocked: false,
							printRate: false
						},
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
												},
												{
													nameType: 'External'
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
						reservationPaymentMethods: [
							{
								paymentMethod: 'CA',
								folioView: '1'
							}
						],
						hotelId: this.hotelId,
						roomStayReservation: true,
						reservationStatus: 'Reserved',
						computedReservationStatus: 'DueIn',
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

