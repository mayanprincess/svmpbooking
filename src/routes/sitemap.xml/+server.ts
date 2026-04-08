import { env } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

/**
 * Minimal sitemap for the single-page booking app.
 * Prefer PUBLIC_SITE_URL (canonical production origin, no trailing slash).
 */
export const GET: RequestHandler = ({ url }) => {
	const configured = env.PUBLIC_SITE_URL?.trim();
	const origin = (configured || url.origin).replace(/\/$/, '');
	const lastmod = new Date().toISOString().split('T')[0];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
