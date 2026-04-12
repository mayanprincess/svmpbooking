import { error } from '@sveltejs/kit';
import { config } from '$lib/config/config';

/** Base URL for the FastAPI backend (BACKEND_URL). No trailing slash. */
export function getBackendUrlOrThrow(): string {
	const u = config.backendUrl.replace(/\/$/, '');
	if (!u) {
		throw error(503, 'BACKEND_URL is not configured');
	}
	return u;
}
