/**
 * Reservation API Endpoint
 * POST /api/reservation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { operaClient } from '$lib/services/opera-client';
import type { ReservationRequest } from '$lib/types/opera';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Validate required fields
		const requiredFields = [
			'checkIn',
			'checkOut',
			'roomTypeCode',
			'ratePlanCode',
			'adults',
			'guest'
		];

		for (const field of requiredFields) {
			if (!(field in body)) {
				throw error(400, `Missing required field: ${field}`);
			}
		}

		// Validate guest fields
		const requiredGuestFields = ['firstName', 'lastName', 'email', 'phone'];
		for (const field of requiredGuestFields) {
			if (!(field in body.guest)) {
				throw error(400, `Missing required guest field: ${field}`);
			}
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.guest.email)) {
			throw error(400, 'Invalid email format');
		}

	// Create reservation request
	const reservationRequest: ReservationRequest = {
		checkIn: body.checkIn,
		checkOut: body.checkOut,
		roomTypeCode: body.roomTypeCode,
		ratePlanCode: body.ratePlanCode,
		adults: body.adults,
		children: body.children || 0,
		guest: {
			firstName: body.guest.firstName,
			lastName: body.guest.lastName,
			email: body.guest.email,
			phone: body.guest.phone,
			address: body.guest.address
		},
		amountBeforeTax: body.amountBeforeTax || 0, // Required field
		specialRequests: body.specialRequests,
		promoCode: body.promoCode
	};

		// Call OPERA API
		const operaResponse = await operaClient.createReservation(reservationRequest);

		return json({
			success: true,
			data: operaResponse
		});
	} catch (err) {
		console.error('Reservation API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to create reservation'
		});
	}
};

