/**
 * Availability Service
 * Enriches OPERA API responses with local configuration data
 */

import { operaStaticConfig } from '$lib/config/opera-config';
import type {
	AvailabilityResponse,
	EnrichedRoomAvailability,
	EnrichedRate,
	RoomStay,
	RoomRate
} from '$lib/types/opera';

/**
 * Enrich OPERA availability response with local configuration
 */
export function enrichAvailability(
	operaResponse: AvailabilityResponse,
	language: 'en' | 'es' = 'en'
): EnrichedRoomAvailability[] {
	// Extract room stays from the nested structure
	const hotelAvail = operaResponse.hotelAvailability?.[0];
	const roomStays = hotelAvail?.roomStays || [];
	const enrichedRooms: EnrichedRoomAvailability[] = [];

	console.log('🔧 ENRICHMENT: Starting with', roomStays.length, 'room stays');

	// Extract all room rates from all room stays
	const allRoomRates: RoomRate[] = [];
	for (const stay of roomStays) {
		if (stay.roomRates && stay.roomRates.length > 0) {
			allRoomRates.push(...stay.roomRates);
		}
	}

	console.log('🔧 ENRICHMENT: Found', allRoomRates.length, 'total room rates');

	// Group room rates by room type
	const roomTypeMap = new Map<string, RoomRate[]>();

	for (const roomRate of allRoomRates) {
		const roomTypeCode = roomRate.roomType;
		if (!roomTypeCode) {
			console.warn('⚠️ ENRICHMENT: Room rate missing roomType', roomRate);
			continue;
		}

		if (!roomTypeMap.has(roomTypeCode)) {
			roomTypeMap.set(roomTypeCode, []);
		}
		roomTypeMap.get(roomTypeCode)!.push(roomRate);
	}

	console.log('🔧 ENRICHMENT: Grouped into', roomTypeMap.size, 'unique room types:', Array.from(roomTypeMap.keys()));

	// Process each room type
	for (const [roomTypeCode, rates] of roomTypeMap) {
		const roomConfig = operaStaticConfig.roomTypes[roomTypeCode as keyof typeof operaStaticConfig.roomTypes];

		// Skip if we don't have configuration for this room type
		if (!roomConfig) {
			console.warn(`❌ ENRICHMENT: No configuration found for room type: ${roomTypeCode}`);
			console.warn(`   Add this to opera-config.ts roomTypes:`, {
				[roomTypeCode]: {
					nameEn: 'Room Name Here',
					nameEs: 'Nombre Aquí',
					bedrooms: 1,
					maxAdults: 4,
					maxChildren: 4,
					beds: ['1 KING'],
					location: 'Location',
					view: 'ocean',
					sortOrder: 10
				}
			});
			continue;
		}

		console.log(`✅ ENRICHMENT: Processing room type ${roomTypeCode} with ${rates.length} rates`);

		// Get view label
		const viewLabel = operaStaticConfig.views[roomConfig.view] || {
			en: roomConfig.view,
			es: roomConfig.view
		};

		// Collect all enriched rates for this room type
		const enrichedRates: EnrichedRate[] = [];

		for (const roomRate of rates) {
			const ratePlanCode = roomRate.ratePlanCode;
			const ratePlanConfig =
				operaStaticConfig.ratePlans[ratePlanCode as keyof typeof operaStaticConfig.ratePlans];

			// Skip if we don't have configuration for this rate plan
			if (!ratePlanConfig) {
				console.warn(`❌ ENRICHMENT: No configuration found for rate plan: ${ratePlanCode} in room ${roomTypeCode}`);
				console.warn(`   Add this to opera-config.ts ratePlans:`, {
					[ratePlanCode]: {
						package: 'family',
						labelEn: 'Rate Plan Name',
						labelEs: 'Nombre del Plan',
						includes: ['meals', 'drinks', 'activities'],
						sortOrder: 1
					}
				});
				continue;
			}

			console.log(`  ✅ Found rate plan ${ratePlanCode} for room ${roomTypeCode}`);
			console.log(`  💰 Rate total structure:`, roomRate.total);

			// Get package info
			const packageType = ratePlanConfig.package;
			const packageConfig = operaStaticConfig.packageTypes[packageType];

			// Get rate amount from the roomRate.total
			// OPERA sometimes only sends amountBeforeTax, so we use that as fallback
			const amountBeforeTax = roomRate.total?.amountBeforeTax || 0;
			const amountAfterTax = roomRate.total?.amountAfterTax || amountBeforeTax;
			const currencyCode = roomRate.total?.currencyCode || 'USD';
			
			console.log(`  💵 Parsed amounts: before=${amountBeforeTax}, after=${amountAfterTax}, currency=${currencyCode}`);

			// Get amenities labels
			const includesLabels = {
				en: ratePlanConfig.includes
					.map((amenity) => operaStaticConfig.amenities[amenity as keyof typeof operaStaticConfig.amenities]?.en)
					.filter(Boolean) as string[],
				es: ratePlanConfig.includes
					.map((amenity) => operaStaticConfig.amenities[amenity as keyof typeof operaStaticConfig.amenities]?.es)
					.filter(Boolean) as string[]
			};

			enrichedRates.push({
				ratePlanCode,
				ratePlanName: {
					en: ratePlanConfig.labelEn,
					es: ratePlanConfig.labelEs
				},
				package: packageType,
				packageLabel: {
					en: packageConfig.labelEn,
					es: packageConfig.labelEs
				},
				packageColor: packageConfig.color,
				includes: [...ratePlanConfig.includes],
				includesLabels,
				amountBeforeTax,
				amountAfterTax,
				currencyCode,
				sortOrder: ratePlanConfig.sortOrder
			});
		}

		// Sort rates by price (lowest first)
		enrichedRates.sort((a, b) => a.amountAfterTax - b.amountAfterTax);

		// Create enriched room
		enrichedRooms.push({
			roomTypeCode,
			roomTypeName: {
				en: roomConfig.nameEn,
				es: roomConfig.nameEs
			},
			bedrooms: roomConfig.bedrooms,
			maxAdults: roomConfig.maxAdults,
			maxChildren: roomConfig.maxChildren,
			beds: [...roomConfig.beds],
			location: roomConfig.location,
			view: roomConfig.view,
			viewLabel,
			rates: enrichedRates,
			available: enrichedRates.length > 0,
			sortOrder: roomConfig.sortOrder
		});
	}

	// Sort rooms by sort order
	enrichedRooms.sort((a, b) => a.sortOrder - b.sortOrder);

	console.log('🎉 ENRICHMENT: Complete! Returning', enrichedRooms.length, 'enriched rooms');
	
	if (enrichedRooms.length === 0 && allRoomRates.length > 0) {
		console.error('⚠️ ENRICHMENT: Had room rates but 0 enriched rooms!');
		console.error('   This means room types or rate plans are not in opera-config.ts');
		console.error('   Check the warnings above for missing configurations');
	}

	return enrichedRooms;
}

/**
 * Calculate number of nights between two dates
 * Uses timezone-safe date parsing to avoid date shift issues
 */
export function calculateNights(checkIn: string, checkOut: string): number {
	// Parse dates in local timezone to avoid timezone offset issues
	const [yearIn, monthIn, dayIn] = checkIn.split('-').map(Number);
	const [yearOut, monthOut, dayOut] = checkOut.split('-').map(Number);
	
	const start = new Date(yearIn, monthIn - 1, dayIn);
	const end = new Date(yearOut, monthOut - 1, dayOut);
	
	const diffTime = Math.abs(end.getTime() - start.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
}

/**
 * Format currency
 */
export function formatCurrency(
	amount: number,
	currencyCode: string = 'USD',
	locale: string = 'en-US'
): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: currencyCode
	}).format(amount);
}

