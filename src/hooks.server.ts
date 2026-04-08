/**
 * SvelteKit Server Hooks
 * Runs on every server request
 */

import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Optional HTTP Basic Auth for staging / dev deployments.
 * Set ENABLE_BASIC_AUTH=true plus BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in the environment.
 * Disable in production when the site is public (omit or set ENABLE_BASIC_AUTH=false).
 */
function devBasicAuthResponse(request: Request): Response | null {
	const enabled =
		env.ENABLE_BASIC_AUTH === 'true' ||
		env.ENABLE_BASIC_AUTH === '1' ||
		env.ENABLE_BASIC_AUTH === 'yes';

	if (!enabled) {
		return null;
	}

	const expectedUser = (env.BASIC_AUTH_USER ?? '').trim();
	const expectedPass = env.BASIC_AUTH_PASSWORD ?? '';

	if (!expectedUser || expectedPass === '') {
		console.warn(
			'[hooks] ENABLE_BASIC_AUTH is on but BASIC_AUTH_USER or BASIC_AUTH_PASSWORD is missing — skipping Basic Auth'
		);
		return null;
	}

	const header = request.headers.get('authorization');
	if (!header?.startsWith('Basic ')) {
		return basicAuthChallenge();
	}

	let decoded: string;
	try {
		decoded = atob(header.slice(6).trim());
	} catch {
		return basicAuthChallenge();
	}

	const colon = decoded.indexOf(':');
	const user = colon >= 0 ? decoded.slice(0, colon) : decoded;
	const pass = colon >= 0 ? decoded.slice(colon + 1) : '';

	if (user !== expectedUser || pass !== expectedPass) {
		return basicAuthChallenge();
	}

	return null;
}

function basicAuthChallenge(): Response {
	return new Response('Authentication required', {
		status: 401,
		headers: {
			'WWW-Authenticate': 'Basic realm="Mayan Princess (dev)"',
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store'
		}
	});
}

/**
 * Request handler
 * Can be used for logging, authentication, etc.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const blocked = devBasicAuthResponse(event.request);
	if (blocked) {
		return blocked;
	}

	// Log all API requests (helpful for debugging)
	if (event.url.pathname.startsWith('/api/')) {
		console.log(`[API] ${event.request.method} ${event.url.pathname}`, {
			query: event.url.search,
			timestamp: new Date().toISOString()
		});
	}

	// Process request
	const response = await resolve(event);

	// Add security headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-XSS-Protection', '1; mode=block');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};

/**
 * Error handler
 * Catches unhandled errors and formats them
 */
export const handleError = async ({ error, event }) => {
	// Log error details (in production, send to error tracking service)
	console.error('Server error:', {
		path: event.url.pathname,
		error: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
		timestamp: new Date().toISOString()
	});

	// Return user-friendly error message
	// Never expose internal error details in production
	return {
		message: 'An unexpected error occurred. Please try again later.'
	};
};
