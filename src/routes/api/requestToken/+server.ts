/**
 * Request Token API Endpoint
 * POST /api/requestToken
 * Body: { TotalAmount: number }
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '$lib/config/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		if (body.TotalAmount == null || typeof body.TotalAmount !== 'number') {
			throw error(400, 'Missing or invalid required field: TotalAmount (number)');
		}

		const { TotalAmount } = body;

		const response = await fetch(`${config.backendUrl}/payment/sale-request`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ TotalAmount })
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(errText || `Backend returned ${response.status}`);
		}

		const raw = await response.text();
		let trimmed = raw.trim();

		// Si el backend devolvió un JSON-string envuelto en comillas (ej: "\"eyJ...\""), quitar la capa extra
		if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
			try {
				const unwrapped = JSON.parse(trimmed);
				if (typeof unwrapped === 'string') trimmed = unwrapped;
			} catch { /* no era JSON válido, continuar */ }
		}

		let captureContext: string;

		if (trimmed.startsWith('{')) {
			const parsed = JSON.parse(trimmed) as Record<string, unknown>;
			captureContext = (
				(parsed.token as string) ??
				(parsed.captureContext as string) ??
				(parsed.keyId as string) ??
				''
			).trim();
		} else {
			captureContext = trimmed;
		}

		console.log('[RequestToken] Raw del backend (primeros 100 chars):', raw.substring(0, 100));
		console.log('[RequestToken] captureContext extraído (primeros 80 chars):', captureContext.substring(0, 80));

		const parts = captureContext.split('.');
		if (parts.length !== 3) {
			console.error('[RequestToken] NO es JWT válido, tiene', parts.length, 'partes. Primeros 80 chars:', captureContext.substring(0, 80));
			throw new Error('El backend no devolvió un capture context JWT válido');
		}

		let clientLibrary: string | null = null;
		let clientLibraryIntegrity: string | null = null;
		try {
			const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
			const ctxData = payload?.ctx?.[0]?.data;
			clientLibrary = ctxData?.clientLibrary ?? payload?.clientLibrary ?? null;
			clientLibraryIntegrity = ctxData?.clientLibraryIntegrity ?? payload?.clientLibraryIntegrity ?? null;
		} catch { /* no se pudo decodificar, el cliente lo intentará */ }

		return json({
			success: true,
			data: {
				token: captureContext,
				...(clientLibrary ? { clientLibrary } : {}),
				...(clientLibraryIntegrity ? { clientLibraryIntegrity } : {})
			}
		});
	} catch (err) {
		console.error('RequestToken API error:', err);

		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, {
			message: err instanceof Error ? err.message : 'Failed to request token'
		});
	}
};
