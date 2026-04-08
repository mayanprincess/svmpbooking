/**
 * Central SEO constants for the booking app (aligned with mayanprincess.com messaging).
 * Set PUBLIC_SITE_URL in production to the canonical booking origin (no trailing slash).
 */

export const SEO_SITE_NAME = 'Mayan Princess Beach & Dive Resort';

/** Main marketing site (rooms, dining, island content). */
export const SEO_MARKETING_ORIGIN = 'https://www.mayanprincess.com';

/**
 * Same hero image path the main site uses for og:image (absolute URL for crawlers).
 * @see https://www.mayanprincess.com/ — meta property og:image
 */
export const SEO_DEFAULT_OG_IMAGE = `${SEO_MARKETING_ORIGIN}/experience/bluelagoon.png`;

/** Primary title: brand + intent + location (≤ ~60 chars for SERP). */
export const SEO_DEFAULT_TITLE =
	'Book Mayan Princess | All-Inclusive Resort in West Bay, Roatán';

/**
 * Meta description: natural language with target phrases (≤ ~155–160 chars ideal).
 */
export const SEO_DEFAULT_DESCRIPTION =
	'Reserve your stay at Mayan Princess on West Bay Beach, Roatán. All-inclusive villas, lagoon pool, diving & dining. Secure online booking for one of the best hotels in Roatán.';

/** Supporting phrases (use sparingly; major engines ignore meta keywords but some tools read it). */
export const SEO_KEYWORDS = [
	'Mayan Princess',
	'Mayan Princess Roatán',
	'hotel Roatán',
	'Roatán all inclusive',
	'West Bay Beach hotel',
	'book Roatán',
	'Roatán resort',
	'Roatán best hotel',
	'all inclusive Roatán',
	'Honduras Caribbean resort',
	'diving Roatán',
	'beach resort Roatán'
].join(', ');
