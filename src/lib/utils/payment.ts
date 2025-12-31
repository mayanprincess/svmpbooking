/**
 * Payment Utilities
 * Card brand detection and payment helpers
 */

export function detectCardBrand(cardNumber: string): string {
	const cleaned = cardNumber.replace(/\s/g, '');
	
	if (cleaned.startsWith('4')) return 'Visa';
	if (cleaned.startsWith('5')) return 'Mastercard';
	if (cleaned.startsWith('34') || cleaned.startsWith('37')) return 'Amex';
	if (cleaned.startsWith('6')) return 'Discover';
	
	return 'Unknown';
}

export function getCardIcon(brand: string): string {
	const icons: Record<string, string> = {
		'Visa': '💳',
		'Mastercard': '💳',
		'Amex': '💳',
		'Discover': '💳',
		'Unknown': '💳'
	};
	return icons[brand] || icons.Unknown;
}

export function sanitizeCardInput(value: string): string {
	return value.replace(/\D/g, '');
}

export function maskCardNumber(cardNumber: string): string {
	const last4 = cardNumber.slice(-4);
	return `•••• •••• •••• ${last4}`;
}

