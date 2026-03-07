/**
 * Payer Authentication Validation
 * POST /api/payment/validate-auth
 *
 * After the customer completes the 3DS step-up challenge,
 * sends the authentication transaction ID to the backend so it can call
 * CyberSource POST /risk/v1/authentication-results
 *
 * Body sent to backend:
 *   {
 *     AuthenticationTransactionId: string,
 *     ReservationId: string
 *   }
 *
 * Expected response from backend:
 *   {
 *     Status: "AUTHENTICATION_SUCCESSFUL" | "FAILED",
 *     Cavv?: string,
 *     EciIndicator?: string,
 *     SpecificationVersion?: string,
 *     AuthenticationTransactionId?: string
 *   }
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/config/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.AuthenticationTransactionId || typeof body.AuthenticationTransactionId !== 'string') {
			throw error(400, 'Missing or invalid required field: AuthenticationTransactionId');
		}
		if (!body.ReservationId || typeof body.ReservationId !== 'string') {
			throw error(400, 'Missing or invalid required field: ReservationId');
		}

		const response = await fetch(`${config.backendUrl}/payment/validate-authentication`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				AuthenticationTransactionId: body.AuthenticationTransactionId,
				ReservationId: body.ReservationId
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(errText || `Backend returned ${response.status}`);
		}

		const data = await response.json();

		return json({ success: true, data });
	} catch (err) {
		console.error('ValidateAuth API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to validate authentication'
		});
	}
};
