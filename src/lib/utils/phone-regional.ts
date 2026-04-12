/**
 * Phone masks and validation for Honduras (+504), USA (+1), and other countries (E.164-style).
 */

import { validatePhone } from '$lib/utils/validation';

export type PhoneRegion = 'HN' | 'US' | 'INT';

export function phoneRegionFromCountry(countryCode: string): PhoneRegion {
	if (countryCode === 'HN') return 'HN';
	if (countryCode === 'US') return 'US';
	return 'INT';
}

export function formatPhoneHonduras(digitsFromInput: string): string {
	let d = digitsFromInput.replace(/\D/g, '');
	if (d.startsWith('504')) d = d.slice(3);
	d = d.slice(0, 8);
	if (d.length === 0) return '+504 ';
	if (d.length <= 4) return `+504 ${d}`;
	return `+504 ${d.slice(0, 4)}-${d.slice(4)}`;
}

export function formatPhoneUS(digitsFromInput: string): string {
	let d = digitsFromInput.replace(/\D/g, '');
	if (d.startsWith('1')) d = d.slice(1);
	d = d.slice(0, 10);
	const a = d.slice(0, 3);
	const b = d.slice(3, 6);
	const c = d.slice(6, 10);
	if (d.length === 0) return '+1 ';
	if (d.length <= 3) return `+1 (${a}`;
	if (d.length <= 6) return `+1 (${a}) ${b}`;
	return `+1 (${a}) ${b}-${c}`;
}

/** Loose international: leading + and up to 15 digits */
export function formatPhoneInternational(raw: string): string {
	let s = raw.replace(/[^\d+]/g, '');
	if (!s.startsWith('+') && /^\d/.test(s)) s = '+' + s;
	if (!s.startsWith('+')) return s;
	const digits = s.slice(1).replace(/\D/g, '').slice(0, 15);
	return digits ? `+${digits}` : '+';
}

export function formatPhoneForCountry(countryCode: string, rawInput: string): string {
	const region = phoneRegionFromCountry(countryCode);
	if (region === 'HN') return formatPhoneHonduras(rawInput);
	if (region === 'US') return formatPhoneUS(rawInput);
	return formatPhoneInternational(rawInput);
}

export function isValidPhoneForCountry(countryCode: string, display: string): boolean {
	const region = phoneRegionFromCountry(countryCode);
	const d = display.replace(/\D/g, '');
	if (region === 'HN') {
		const local = d.startsWith('504') ? d.slice(3) : d;
		return local.length === 8;
	}
	if (region === 'US') {
		const n = d.startsWith('1') ? d.slice(1) : d;
		return n.length === 10;
	}
	return validatePhone(display);
}

export function toE164(countryCode: string, display: string): string {
	const region = phoneRegionFromCountry(countryCode);
	const d = display.replace(/\D/g, '');
	if (region === 'HN') {
		const local = d.startsWith('504') ? d.slice(3) : d;
		return `+504${local.slice(0, 8)}`;
	}
	if (region === 'US') {
		const n = d.startsWith('1') ? d.slice(1) : d;
		return `+1${n.slice(0, 10)}`;
	}
	const allDigits = display.replace(/\D/g, '');
	if (allDigits.length === 0) return '';
	return `+${allDigits.slice(0, 15)}`;
}

export function phonePlaceholderForCountry(countryCode: string): string {
	const region = phoneRegionFromCountry(countryCode);
	if (region === 'HN') return '+504 9999-9999';
	if (region === 'US') return '+1 (555) 123-4567';
	return '+44 20 7946 0958';
}

export function guessCountryFromStoredPhone(phone: string | undefined): string {
	const p = (phone ?? '').replace(/\s/g, '');
	if (p.startsWith('+504')) return 'HN';
	if (p.startsWith('+1')) return 'US';
	return 'HN';
}

/** Build display string from stored E.164 for editing */
export function displayPhoneFromStored(countryCode: string | undefined, stored: string): string {
	const cc = countryCode ?? guessCountryFromStoredPhone(stored);
	const region = phoneRegionFromCountry(cc);
	const d = stored.replace(/\D/g, '');
	if (region === 'HN') {
		const local = d.startsWith('504') ? d.slice(3) : d.slice(-8);
		return formatPhoneHonduras(local);
	}
	if (region === 'US') {
		const n = d.startsWith('1') ? d.slice(1) : d;
		return formatPhoneUS(n);
	}
	return stored.startsWith('+') ? stored : formatPhoneInternational(stored);
}
