import {
	SEO_DEFAULT_DESCRIPTION,
	SEO_DEFAULT_OG_IMAGE,
	SEO_MARKETING_ORIGIN,
	SEO_SITE_NAME
} from './config';

/** Escape `<` so JSON-LD is safe inside `<script type="application/ld+json">`. */
export function escapeJsonForHtml(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * Hotel / Resort + WebPage structured data for the booking landing page.
 */
export function buildBookingPageJsonLd(canonicalUrl: string): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': ['Resort', 'Hotel'],
				'@id': `${canonicalUrl}#hotel`,
				name: SEO_SITE_NAME,
				description: SEO_DEFAULT_DESCRIPTION,
				url: SEO_MARKETING_ORIGIN,
				image: SEO_DEFAULT_OG_IMAGE,
				address: {
					'@type': 'PostalAddress',
					streetAddress: 'West Bay Beach',
					addressLocality: 'Roatán',
					addressRegion: 'Bay Islands',
					addressCountry: 'HN'
				},
				geo: {
					'@type': 'GeoCoordinates',
					latitude: 16.318,
					longitude: -86.599
				},
				amenityFeature: [
					{ '@type': 'LocationFeatureSpecification', name: 'All-inclusive dining' },
					{ '@type': 'LocationFeatureSpecification', name: 'Lagoon-style pool' },
					{ '@type': 'LocationFeatureSpecification', name: 'West Bay Beach access' },
					{ '@type': 'LocationFeatureSpecification', name: 'PADI diving' }
				]
			},
			{
				'@type': 'WebPage',
				'@id': canonicalUrl,
				url: canonicalUrl,
				name: SEO_DEFAULT_TITLE,
				description: SEO_DEFAULT_DESCRIPTION,
				isPartOf: {
					'@type': 'WebSite',
					name: SEO_SITE_NAME,
					url: SEO_MARKETING_ORIGIN
				},
				about: { '@id': `${canonicalUrl}#hotel` },
				mainEntity: { '@id': `${canonicalUrl}#hotel` },
				potentialAction: {
					'@type': 'ReserveAction',
					target: {
						'@type': 'EntryPoint',
						urlTemplate: canonicalUrl
					},
					name: 'Book a stay'
				}
			}
		]
	};
}
