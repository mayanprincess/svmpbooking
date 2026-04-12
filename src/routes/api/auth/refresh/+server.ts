import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBackendUrlOrThrow } from '$lib/server/backend';

export const POST: RequestHandler = async ({ request }) => {
	let body: string;
	try {
		body = await request.text();
	} catch {
		throw error(400, 'Invalid body');
	}
	const base = getBackendUrlOrThrow();
	const r = await fetch(`${base}/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body
	});
	const text = await r.text();
	return new Response(text, {
		status: r.status,
		headers: { 'Content-Type': r.headers.get('content-type') ?? 'application/json; charset=utf-8' }
	});
};
