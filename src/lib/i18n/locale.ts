/**
 * App locale: English | Spanish only.
 * Persisted in localStorage; synced to <html lang=""> for a11y + SEO.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Locale = 'en' | 'es';

const STORAGE_KEY = 'mp_locale';

function readStoredLocale(): Locale {
	if (!browser) return 'en';
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw === 'es' || raw === 'en') return raw;
	} catch {
		/* ignore */
	}
	return 'en';
}

/** Current UI + API language */
export const locale = writable<Locale>('en');

/** Call once on client (layout onMount) to hydrate from storage */
export function initLocale(): void {
	if (!browser) return;
	const l = readStoredLocale();
	locale.set(l);
	applyDocumentLang(l);
}

export function setLocale(next: Locale): void {
	locale.set(next);
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, next);
	} catch {
		/* ignore */
	}
	applyDocumentLang(next);
}

function applyDocumentLang(l: Locale): void {
	if (!browser) return;
	document.documentElement.lang = l === 'es' ? 'es' : 'en';
}
