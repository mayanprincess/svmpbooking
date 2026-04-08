<script lang="ts">
	/**
	 * Main Booking Page
	 * Entry point for the booking engine
	 */

	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import Header from '$lib/components/Header.svelte';
	import BookingStepper from '$lib/components/BookingStepper.svelte';
	import BookingDebugPanel from '$lib/components/BookingDebugPanel.svelte';
	import {
		buildBookingPageJsonLd,
		escapeJsonForHtml,
		SEO_DEFAULT_DESCRIPTION,
		SEO_DEFAULT_OG_IMAGE,
		SEO_DEFAULT_TITLE,
		SEO_KEYWORDS,
		SEO_SITE_NAME
	} from '$lib/seo';

	const canonicalHref = $derived.by(() => {
		const raw = env.PUBLIC_SITE_URL?.trim();
		const base = raw ? raw.replace(/\/$/, '') : '';
		if (base) return `${base}${page.url.pathname}${page.url.search}`;
		return `${page.url.origin}${page.url.pathname}${page.url.search}`;
	});

	const ogImage = $derived(env.PUBLIC_OG_IMAGE_URL?.trim() || SEO_DEFAULT_OG_IMAGE);

	const jsonLdPayload = $derived.by(() =>
		escapeJsonForHtml(buildBookingPageJsonLd(canonicalHref))
	);
</script>

<svelte:head>
	<title>{SEO_DEFAULT_TITLE}</title>
	<meta name="description" content={SEO_DEFAULT_DESCRIPTION} />
	<meta name="keywords" content={SEO_KEYWORDS} />
	<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	<link rel="canonical" href={canonicalHref} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SEO_SITE_NAME} />
	<meta property="og:title" content={SEO_DEFAULT_TITLE} />
	<meta property="og:description" content={SEO_DEFAULT_DESCRIPTION} />
	<meta property="og:url" content={canonicalHref} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:locale:alternate" content="es_HN" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SEO_DEFAULT_TITLE} />
	<meta name="twitter:description" content={SEO_DEFAULT_DESCRIPTION} />
	<meta name="twitter:image" content={ogImage} />

	<link rel="alternate" hreflang="en" href={canonicalHref} />
	<link rel="alternate" hreflang="x-default" href={canonicalHref} />

	{@html `<script type="application/ld+json">${jsonLdPayload}</script>`}
</svelte:head>

<div class="page-container" id="page-top">
	<Header />

	<main class="main-content" id="main-content">
		<h1 class="visually-hidden">
			Book Mayan Princess — all-inclusive resort on West Bay Beach, Roatán
		</h1>
		<BookingStepper />
	</main>

	<BookingDebugPanel />
</div>

<style>
	:global(:root) {
		--color-primary: #183453;
		--color-secondary: #c5a56f;
		--color-tertiary: #d6a34b;
		--color-premium: #b58e4b;
		--color-family: #2babd9;
		--color-breakfast: #2babd9;
		--color-promo: #9333ea;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.page-container {
		min-height: 100vh;
		background: linear-gradient(180deg, #f5f3f0 0%, #ffffff 40%);
		scroll-behavior: smooth;
	}

	.main-content {
		padding: 2rem 0;
	}

	/* Ensure smooth scrolling works globally */
	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		scroll-behavior: smooth;
	}
</style>
