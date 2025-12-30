/**
 * SvelteKit Server Hooks
 * Runs on every server request
 */

import type { Handle } from '@sveltejs/kit';

/**
 * Request handler
 * Can be used for logging, authentication, etc.
 */
export const handle: Handle = async ({ event, resolve }) => {
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

