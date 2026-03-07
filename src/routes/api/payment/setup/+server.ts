/**
 * Payer Authentication Setup
 * POST /api/payment/setup
 *
 * Sends the transient token to the backend so it can call
 * CyberSource POST /risk/v1/authentication-setups
 *
 * Body sent to backend:
 *   { TransientToken: string }
 *
 * Expected response from backend:
 *   {
 *     AccessToken: string,
 *     DeviceDataCollectionUrl: string,
 *     ReferenceId: string
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

		const response = await fetch(`${config.backendUrl}/payment/authentication-setup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				TransientToken: body.TransientToken
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(errText || `Backend returned ${response.status}`);
		}

		const data = await response.json();

		return json({ success: true, data });
	} catch (err) {
		console.error('PaymentSetup API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to setup authentication'
		});
	}
};
