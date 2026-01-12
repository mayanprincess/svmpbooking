/**
 * Test endpoint to fetch guarantee codes from Opera PMS
 * GET /api/test/guarantee-codes
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { operaClient } from '$lib/services/opera-client';

export const GET: RequestHandler = async () => {
	try {
		const hotelId = (operaClient as any).hotelId;
		
		console.log('🔍 Fetching guarantee codes from Opera PMS...', { hotelId });

		// Use the Opera configuration endpoint for guarantee codes
		// This is simpler and returns all configured guarantee codes for the hotel
		const endpoint = `/rsv/config/v1/guaranteeCodes?hotelIds=${hotelId}`;
		
		console.log('📡 Calling endpoint:', endpoint);
		
		const response = await (operaClient as any).authorizedRequest(endpoint, {
			method: 'GET'
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('❌ Error fetching guarantee codes:', {
				status: response.status,
				statusText: response.statusText,
				body: errorText
			});
			
			// Return a helpful message even if the endpoint fails
			return json({
				success: false,
				message: 'Could not fetch guarantee codes from Opera API',
				error: errorText,
				suggestion: 'Please check Opera PMS dashboard manually or try common codes',
				commonCodes: [
					{ code: 'GT', description: 'Guaranteed' },
					{ code: 'CC', description: 'Credit Card' },
					{ code: 'CA', description: 'Cash' },
					{ code: 'DEP', description: 'Deposit' },
					{ code: 'CTA', description: 'Company/Travel Agent' }
				]
			});
		}

		const data = await response.json();
		console.log('✅ Guarantee codes received:', JSON.stringify(data, null, 2));

		// Parse the guarantee codes from Opera response
		// The response structure may vary, so we handle multiple possible formats
		const guaranteeCodes = data.guaranteeCodes || data.guarantees || data.items || [];
		
		return json({
			success: true,
			data: {
				guaranteeCodes,
				totalResults: guaranteeCodes.length,
				hotelId,
				rawResponse: data // Include raw response for debugging
			},
			message: 'Guarantee codes fetched successfully'
		});
	} catch (err) {
		console.error('❌ Error:', err);
		
		return json({
			success: false,
			error: err instanceof Error ? err.message : 'Unknown error',
			suggestion: 'Try these common codes: GT, CC, CA, DEP',
			commonCodes: [
				{ code: 'GT', description: 'Guaranteed' },
				{ code: 'CC', description: 'Credit Card' },
				{ code: 'CA', description: 'Cash' },
				{ code: 'DEP', description: 'Deposit' },
				{ code: 'CTA', description: 'Company/Travel Agent' }
			]
		});
	}
};
