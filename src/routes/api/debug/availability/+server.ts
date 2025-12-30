/**
 * Debug Availability API Endpoint
 * Shows raw OPERA response for debugging
 * GET /api/debug/availability
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { operaClient } from '$lib/services/opera-client';
import { operaStaticConfig } from '$lib/config/opera-config';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Extract query parameters
		const checkIn = url.searchParams.get('checkIn');
		const checkOut = url.searchParams.get('checkOut');
		const adults = url.searchParams.get('adults');
		const children = url.searchParams.get('children');
		const ratePlanCode = url.searchParams.get('ratePlanCode');
		const promoCode = url.searchParams.get('promoCode');

		// Validate required parameters
		if (!checkIn || !checkOut || !adults) {
			throw error(400, 'Missing required parameters: checkIn, checkOut, adults');
		}

		const adultsCount = parseInt(adults, 10);
		const childrenCount = children ? parseInt(children, 10) : 0;

		console.log('🔍 DEBUG: Starting availability check', {
			checkIn,
			checkOut,
			adults: adultsCount,
			children: childrenCount,
			ratePlanCode,
			promoCode
		});

		// Call OPERA API
		const operaResponse = await operaClient.checkAvailability({
			checkIn,
			checkOut,
			adults: adultsCount,
			children: childrenCount,
			ratePlanCode: ratePlanCode || undefined,
			promoCode: promoCode || undefined
		});

		console.log('✅ OPERA Response received:', {
			roomStaysCount: operaResponse.roomStays?.length || 0,
			hotelId: operaResponse.hotelId,
			hotelName: operaResponse.hotelName
		});

		// Extract unique room type codes from response
		const roomTypesInResponse = new Set<string>();
		const ratePlansInResponse = new Set<string>();

		if (operaResponse.roomStays) {
			for (const stay of operaResponse.roomStays) {
				if (stay.roomType?.roomTypeCode) {
					roomTypesInResponse.add(stay.roomType.roomTypeCode);
				}
				if (stay.ratePlans) {
					for (const ratePlan of stay.ratePlans) {
						if (ratePlan.ratePlanCode) {
							ratePlansInResponse.add(ratePlan.ratePlanCode);
						}
					}
				}
			}
		}

		// Check what's in our config
		const roomTypesInConfig = Object.keys(operaStaticConfig.roomTypes);
		const ratePlansInConfig = Object.keys(operaStaticConfig.ratePlans);

		// Find matches and mismatches
		const matchingRoomTypes = Array.from(roomTypesInResponse).filter((code) =>
			roomTypesInConfig.includes(code)
		);
		const missingRoomTypes = Array.from(roomTypesInResponse).filter(
			(code) => !roomTypesInConfig.includes(code)
		);

		const matchingRatePlans = Array.from(ratePlansInResponse).filter((code) =>
			ratePlansInConfig.includes(code)
		);
		const missingRatePlans = Array.from(ratePlansInResponse).filter(
			(code) => !ratePlansInConfig.includes(code)
		);

		console.log('🔍 DEBUG: Room Type Analysis', {
			inResponse: Array.from(roomTypesInResponse),
			inConfig: roomTypesInConfig,
			matching: matchingRoomTypes,
			missing: missingRoomTypes
		});

		console.log('🔍 DEBUG: Rate Plan Analysis', {
			inResponse: Array.from(ratePlansInResponse),
			inConfig: ratePlansInConfig,
			matching: matchingRatePlans,
			missing: missingRatePlans
		});

		// Return debug information
		return json({
			debug: true,
			summary: {
				totalRoomStays: operaResponse.roomStays?.length || 0,
				uniqueRoomTypes: roomTypesInResponse.size,
				uniqueRatePlans: ratePlansInResponse.size,
				matchingRoomTypes: matchingRoomTypes.length,
				missingRoomTypes: missingRoomTypes.length,
				matchingRatePlans: matchingRatePlans.length,
				missingRatePlans: missingRatePlans.length
			},
			analysis: {
				roomTypes: {
					inResponse: Array.from(roomTypesInResponse),
					inConfig: roomTypesInConfig,
					matching: matchingRoomTypes,
					missing: missingRoomTypes,
					missingDetails: missingRoomTypes.map((code) => ({
						code,
						suggestion: `Add this to opera-config.ts roomTypes`
					}))
				},
				ratePlans: {
					inResponse: Array.from(ratePlansInResponse),
					inConfig: ratePlansInConfig,
					matching: matchingRatePlans,
					missing: missingRatePlans,
					missingDetails: missingRatePlans.map((code) => ({
						code,
						suggestion: `Add this to opera-config.ts ratePlans`
					}))
				}
			},
			rawOperaResponse: operaResponse,
			configSnapshot: {
				roomTypesConfigured: roomTypesInConfig.length,
				ratePlansConfigured: ratePlansInConfig.length
			}
		});
	} catch (err) {
		console.error('❌ DEBUG: Error in availability check:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		return json({
			debug: true,
			error: true,
			message: err instanceof Error ? err.message : 'Failed to fetch availability',
			stack: err instanceof Error ? err.stack : undefined
		}, { status: 500 });
	}
};

