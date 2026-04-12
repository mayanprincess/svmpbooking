import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBackendUrlOrThrow } from '$lib/server/backend';

export const GET: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization');
	if (!auth) {
		throw error(401, 'Missing Authorization');
	}
	const base = getBackendUrlOrThrow();
	const r = await fetch(`${base}/users/me`, {
		method: 'GET',
		headers: { Authorization: auth }
	});
	const text = await r.text();
	return new Response(text, {
		status: r.status,
		headers: { 'Content-Type': r.headers.get('content-type') ?? 'application/json; charset=utf-8' }
	});
};

export const PATCH: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization');
	if (!auth) {
		throw error(401, 'Missing Authorization');
	}
	let body: string;
	try {
		body = await request.text();
	} catch {
		throw error(400, 'Invalid body');
	}
	const base = getBackendUrlOrThrow();
	const r = await fetch(`${base}/users/me`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: auth
		},
		body
	});
	const text = await r.text();
	return new Response(text, {
		status: r.status,
		headers: { 'Content-Type': r.headers.get('content-type') ?? 'application/json; charset=utf-8' }
	});
};
