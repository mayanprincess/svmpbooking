/**
 * Process Payment
 * POST /api/payment/validate-payment
 *
 * Sends the transient token + 3DS authentication data to the backend
 * so it can call CyberSource POST /pts/v2/payments
 *
 * Body sent to backend:
 *   {
 *     Token: string,
 *     ReservationId: string,
 *     AuthenticationTransactionId?: string,
 *     Cavv?: string,
 *     EciIndicator?: string,
 *     SpecificationVersion?: string
 *   }
 *
 * Expected response from backend:
 *   Payment result from CyberSource
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/config/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.Token || typeof body.Token !== 'string') {
			throw error(400, 'Missing or invalid required field: Token');
		}

		if (!body.ReservationId || typeof body.ReservationId !== 'string') {
			throw error(400, 'Missing or invalid required field: ReservationId');
		}

		const payload: Record<string, string> = {
			Token: body.Token,
			ReservationId: body.ReservationId
		};

		if (body.AuthenticationTransactionId) {
			payload.AuthenticationTransactionId = body.AuthenticationTransactionId;
		}
		if (body.Cavv) {
			payload.Cavv = body.Cavv;
		}
		if (body.EciIndicator) {
			payload.EciIndicator = body.EciIndicator;
		}
		if (body.SpecificationVersion) {
			payload.SpecificationVersion = body.SpecificationVersion;
		}

		const response = await fetch(`${config.backendUrl}/payment/validate-payment`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(errText || `Backend returned ${response.status}`);
		}

		const data = await response.json();

		return json({ success: true, data });
	} catch (err) {
		console.error('ValidatePayment API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to validate payment'
		});
	}
};
