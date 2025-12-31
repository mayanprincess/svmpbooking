/**
 * Formatting Utilities
 * Centralized formatting functions
 * Note: Date formatting moved to date-helpers.ts for timezone safety
 */

export function formatCurrency(amount: number, currency: string = 'USD'): string {
	return `$${amount.toFixed(2)} ${currency}`;
}

export function formatCardNumber(value: string): string {
	const cleaned = value.replace(/\s/g, '');
	const chunks = cleaned.match(/.{1,4}/g) || [];
	return chunks.join(' ');
}

export function pluralize(count: number, singular: string, plural: string): string {
	return count === 1 ? singular : plural;
}

export function generateConfirmationNumber(prefix: string = 'MPB'): string {
	return prefix + Date.now().toString().slice(-8);
}

