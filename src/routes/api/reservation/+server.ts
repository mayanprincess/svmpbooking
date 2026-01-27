/**
 * Reservation API Endpoint
 * POST /api/reservation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { operaClient } from '$lib/services/opera-client';
import type { ReservationRequest } from '$lib/types/opera';
import { config } from '$lib/config/config';

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
			'guest',
      'children',
      'amountBeforeTax',
      'payment'
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

    const reservationRequest = {
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      roomTypeCode: body.roomTypeCode,
      ratePlanCode: body.ratePlanCode,
      adults: body.adults,
      children: body.children,
      guest: body.guest,
      payment: body.payment,
      amountBeforeTax: body.amountBeforeTax,
      promoCode: body.promoCode,
      specialRequests: body.specialRequests,
    };

    console.log(reservationRequest);

		// Call OPERA API
		const response = await fetch(`${config.backendUrl}/reservations/`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(reservationRequest)
		});

		const data = await response.json();

		return json({
			success: true,
			data: data
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