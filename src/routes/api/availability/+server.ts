/**
 * Availability API Endpoint
 * GET /api/availability
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { operaClient } from '$lib/services/opera-client';
import { enrichAvailability } from '$lib/services/availability-service';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Extract query parameters
		const checkIn = url.searchParams.get('checkIn');
		const checkOut = url.searchParams.get('checkOut');
		const adults = url.searchParams.get('adults');
		const children = url.searchParams.get('children');
		const ratePlanCode = url.searchParams.get('ratePlanCode');
		const promoCode = url.searchParams.get('promoCode');
		const language = url.searchParams.get('lang') || 'en';

		// Validate required parameters
		if (!checkIn || !checkOut || !adults) {
			throw error(400, 'Missing required parameters: checkIn, checkOut, adults');
		}

		// Validate date format (YYYY-MM-DD)
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
			throw error(400, 'Invalid date format. Use YYYY-MM-DD');
		}

		// Validate dates (using local timezone parsing to avoid timezone issues)
		const [yearIn, monthIn, dayIn] = checkIn.split('-').map(Number);
		const [yearOut, monthOut, dayOut] = checkOut.split('-').map(Number);
		
		const checkInDate = new Date(yearIn, monthIn - 1, dayIn);
		const checkOutDate = new Date(yearOut, monthOut - 1, dayOut);
		
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (checkInDate < today) {
			throw error(400, 'Check-in date cannot be in the past');
		}

		if (checkOutDate <= checkInDate) {
			throw error(400, 'Check-out date must be after check-in date');
		}

		// Validate guest counts
		const adultsCount = parseInt(adults, 10);
		const childrenCount = children ? parseInt(children, 10) : 0;

		if (isNaN(adultsCount) || adultsCount < 1 || adultsCount > 12) {
			throw error(400, 'Adults must be between 1 and 12');
		}

		if (isNaN(childrenCount) || childrenCount < 0 || childrenCount > 8) {
			throw error(400, 'Children must be between 0 and 8');
		}

		// Call OPERA API
		const operaResponse = await operaClient.checkAvailability({
			checkIn,
			checkOut,
			adults: adultsCount,
			children: childrenCount,
			ratePlanCode: ratePlanCode || undefined,
			promoCode: promoCode || undefined
		});

		// Enrich with local configuration
		const enrichedRooms = enrichAvailability(operaResponse, language as 'en' | 'es');

		return json({
			success: true,
			data: {
				checkIn,
				checkOut,
				adults: adultsCount,
				children: childrenCount,
				rooms: enrichedRooms,
				totalRooms: enrichedRooms.length
			}
		});
	} catch (err) {
		console.error('Availability API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to fetch availability'
		});
	}
};

