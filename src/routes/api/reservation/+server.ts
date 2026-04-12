/**
 * Reservation API Endpoint
 * POST /api/reservation
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/config/config';

/** FastAPI / Starlette often use `detail` as string, array of {loc,msg}, or object */
function messageFromBackendBody(status: number, data: unknown, rawText: string): string {
	if (typeof data === 'object' && data !== null) {
		const d = data as Record<string, unknown>;

		if (typeof d._unparsed === 'string') {
			const u = d._unparsed.trim();
			if (u && !u.startsWith('<') && u.length < 800) {
				return u;
			}
		}

		if (typeof d.detail === 'string') {
			return d.detail;
		}

		if (Array.isArray(d.detail)) {
			const parts = d.detail.map((item: unknown) => {
				if (typeof item === 'object' && item !== null && 'msg' in item) {
					const msg = (item as { msg?: unknown }).msg;
					const loc = (item as { loc?: unknown }).loc;
					const prefix = Array.isArray(loc) ? `${loc.join('.')}: ` : '';
					return typeof msg === 'string' ? `${prefix}${msg}` : JSON.stringify(item);
				}
				return typeof item === 'string' ? item : JSON.stringify(item);
			});
			return parts.join('; ');
		}

		if (typeof d.detail === 'object' && d.detail !== null) {
			return JSON.stringify(d.detail);
		}

		if (typeof d.message === 'string') {
			return d.message;
		}
		if (typeof d.error === 'string') {
			return d.error;
		}
	}

	const trimmed = rawText.trim();
	if (trimmed && trimmed.length > 0 && trimmed.length < 800 && !trimmed.startsWith('<')) {
		try {
			JSON.parse(trimmed);
		} catch {
			return trimmed;
		}
	}

	return `Backend error (${status})`;
}

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

		// Call backend (links reservation to user when Authorization: Bearer is sent)
		if (!config.backendUrl) {
			throw error(500, 'BACKEND_URL is not configured');
		}

		const forwardHeaders: Record<string, string> = {
			'Content-Type': 'application/json'
		};
		const auth = request.headers.get('authorization');
		if (auth) {
			forwardHeaders['Authorization'] = auth;
		}

		const response = await fetch(`${config.backendUrl}/reservations`, {
			method: 'POST',
			headers: forwardHeaders,
			body: JSON.stringify(reservationRequest)
		});

		const rawText = await response.text();
		let data: unknown = {};
		if (rawText) {
			try {
				data = JSON.parse(rawText) as unknown;
			} catch {
				data = { _unparsed: rawText };
			}
		}

		if (!response.ok) {
			const message = messageFromBackendBody(response.status, data, rawText);
			console.error('Backend /reservations error:', {
				status: response.status,
				statusText: response.statusText,
				message,
				bodyPreview: rawText.slice(0, 2000)
			});

			const httpStatus =
				response.status >= 400 && response.status < 600 ? response.status : 502;
			throw error(httpStatus, message);
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