import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const configured = env.PUBLIC_SITE_URL?.trim();
	const origin = (configured || url.origin).replace(/\/$/, '');

	const body = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
