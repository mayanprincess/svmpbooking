import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBackendUrlOrThrow } from '$lib/server/backend';

/**
 * GET /api/reservations/mine — proxy to backend GET /reservations/mine
 * Query: limit (1–100), forwarded as-is.
 */
export const GET: RequestHandler = async ({ request, url }) => {
	const auth = request.headers.get('authorization');
	if (!auth?.startsWith('Bearer ')) {
		throw error(401, 'Missing or invalid Authorization');
	}

	const base = getBackendUrlOrThrow();
	const limit = url.searchParams.get('limit');
	const qs = new URLSearchParams();
	if (limit) qs.set('limit', limit);

	const path = `/reservations/mine${qs.toString() ? `?${qs}` : ''}`;
	const r = await fetch(`${base}${path}`, {
		method: 'GET',
		headers: { Authorization: auth }
	});

	const text = await r.text();
	return new Response(text, {
		status: r.status,
		headers: { 'Content-Type': r.headers.get('content-type') ?? 'application/json; charset=utf-8' }
	});
};
