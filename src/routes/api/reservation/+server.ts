/**
 * Reservation API Endpoint
 * POST /api/reservation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/config/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		const requiredFields = [
			'checkIn',
			'checkOut',
			'roomTypeCode',
			'ratePlanCode',
			'adults',
			'guest',
			'children',
			'amountBeforeTax'
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
      amountBeforeTax: body.amountBeforeTax,
      promoCode: body.promoCode,
      specialRequests: body.specialRequests,
    };

    console.log(reservationRequest);

		// Call OPERA API
		if (!config.backendUrl) {
			throw error(500, 'BACKEND_URL is not configured');
		}

		const response = await fetch(`${config.backendUrl}/reservations`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(reservationRequest)
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			const message =
				(typeof data === 'object' &&
					data !== null &&
					'detail' in data &&
					typeof (data as { detail?: unknown }).detail === 'string' &&
					(data as { detail: string }).detail) ||
				(typeof data === 'object' &&
					data !== null &&
					'message' in data &&
					typeof (data as { message?: unknown }).message === 'string' &&
					(data as { message: string }).message) ||
				`Backend error (${response.status})`;

			throw error(response.status >= 400 && response.status < 600 ? response.status : 502, message);
		}

		return json({
			success: true,
			data
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