/**
 * Payer Authentication Enrollment (Check Enrollment)
 * POST /api/payment/enroll
 *
 * Sends the transient token + device fingerprint reference to the backend
 * so it can call CyberSource POST /risk/v1/authentications
 *
 * Body sent to backend:
 *   {
 *     TransientToken: string,
 *     ReferenceId: string,
 *     ReservationId: string
 *   }
 *
 * Expected response from backend:
 *   {
 *     Status: "AUTHENTICATION_SUCCESSFUL" | "PENDING_AUTHENTICATION" | "FAILED",
 *     // When AUTHENTICATION_SUCCESSFUL (frictionless):
 *     AuthenticationTransactionId?: string,
 *     Cavv?: string,
 *     EciIndicator?: string,
 *     SpecificationVersion?: string,
 *     // When PENDING_AUTHENTICATION (step-up needed):
 *     StepUpUrl?: string,
 *     AccessToken?: string,
 *     AuthenticationTransactionId?: string
 *   }
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/config/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (!body.TransientToken || typeof body.TransientToken !== 'string') {
			throw error(400, 'Missing or invalid required field: TransientToken');
		}
		if (!body.ReferenceId || typeof body.ReferenceId !== 'string') {
			throw error(400, 'Missing or invalid required field: ReferenceId');
		}
		if (!body.ReservationId || typeof body.ReservationId !== 'string') {
			throw error(400, 'Missing or invalid required field: ReservationId');
		}

		const response = await fetch(`${config.backendUrl}/payment/check-enrollment`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				TransientToken: body.TransientToken,
				ReferenceId: body.ReferenceId,
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
		console.error('PaymentEnroll API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to check enrollment'
		});
	}
};
