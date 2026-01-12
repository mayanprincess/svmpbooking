import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OperaClient } from '$lib/services/opera-client';

/**
 * Test endpoint to inspect Opera OAuth token and available scopes
 * Usage: GET /api/test/token-info
 */
export const GET: RequestHandler = async () => {
	try {
		const operaClient = new OperaClient();
		
		// Get the access token
		const token = await operaClient.getAccessToken();
		
		// Decode JWT token (JWT has 3 parts: header.payload.signature)
		const parts = token.split('.');
		
		if (parts.length !== 3) {
			return json({
				error: 'Invalid JWT token format',
				token: token.substring(0, 20) + '...'
			}, { status: 400 });
		}

		// Decode header and payload (they are base64url encoded)
		const decodeBase64Url = (str: string) => {
			// Replace URL-safe characters
			const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
			// Add padding if needed
			const pad = base64.length % 4;
			const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
			// Decode using atob (works in Node.js 18+)
			return JSON.parse(atob(padded));
		};

		const header = decodeBase64Url(parts[0]);
		const payload = decodeBase64Url(parts[1]);

		// Extract scopes
		const scopes = payload.scope ? payload.scope.split(' ') : [];

		// Calculate expiration
		const now = Math.floor(Date.now() / 1000);
		const expiresIn = payload.exp ? payload.exp - now : 0;
		const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown';

		return json({
			success: true,
			tokenInfo: {
				header,
				payload: {
					...payload,
					// Mask sensitive data but show structure
					sub: payload.sub ? '***' : undefined,
					client_id: payload.client_id || payload.appkey || 'Not in token',
				},
				scopes: {
					raw: payload.scope || 'No scopes in token',
					list: scopes,
					count: scopes.length
				},
				expiration: {
					expiresAt,
					expiresIn,
					isExpired: expiresIn <= 0,
					timeRemaining: expiresIn > 0 ? `${Math.floor(expiresIn / 60)} minutes` : 'Expired'
				},
				tokenPreview: `${token.substring(0, 30)}...${token.substring(token.length - 10)}`
			}
		});

	} catch (error) {
		console.error('Error inspecting token:', error);
		return json({
			error: 'Failed to inspect token',
			details: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
};
