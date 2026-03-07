/**
 * Confirm Payment
 * POST /api/payment/confirm-payment
 *
 * Body sent to backend:
 *   {
 *     ReservationId: string,
 *     ApprovalCode: string,
 *     PaymentId: string
 *   }
 *
 * Expected response from backend:
 *   {
 *     Status: string,
 *     Message: string,
 *     reservationId: string,
 *     confirmationNumber: string
 *   }
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/config/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.ReservationId || typeof body.ReservationId !== 'string') {
			throw error(400, 'Missing or invalid required field: ReservationId');
		}
		if (!body.ApprovalCode || typeof body.ApprovalCode !== 'string') {
			throw error(400, 'Missing or invalid required field: ApprovalCode');
		}
		if (!body.PaymentId || typeof body.PaymentId !== 'string') {
			throw error(400, 'Missing or invalid required field: PaymentId');
		}

		const response = await fetch(`${config.backendUrl}/payment/confirm-payment`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ReservationId: body.ReservationId,
				ApprovalCode: body.ApprovalCode,
				PaymentId: body.PaymentId
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(errText || `Backend returned ${response.status}`);
		}

		const data = await response.json();

		return json({ success: true, data });
	} catch (err) {
		console.error('ConfirmPayment API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to confirm payment'
		});
	}
};
