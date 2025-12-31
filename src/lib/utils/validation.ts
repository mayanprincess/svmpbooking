/**
 * Validation Utilities
 * Centralized validation functions for forms
 */

export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
}

export function validatePhone(phone: string): boolean {
	const phoneRegex = /^[\d\s\+\-\(\)]+$/;
	const digitsOnly = phone.replace(/\D/g, '');
	return phoneRegex.test(phone) && digitsOnly.length >= 10;
}

export function validateCardNumber(cardNumber: string): boolean {
	const cleaned = cardNumber.replace(/\s/g, '');
	return cleaned.length >= 13 && cleaned.length <= 16 && /^\d+$/.test(cleaned);
}

export function validateCVV(cvv: string): boolean {
	return cvv.length >= 3 && cvv.length <= 4 && /^\d+$/.test(cvv);
}

export function validateExpiry(month: string, year: string): { isValid: boolean; error?: string } {
	const monthNum = parseInt(month);
	const yearNum = parseInt(year);

	if (!month || !year) {
		return { isValid: false, error: 'Expiry date is required' };
	}

	if (monthNum < 1 || monthNum > 12) {
		return { isValid: false, error: 'Invalid month' };
	}

	const now = new Date();
	const currentYear = now.getFullYear() % 100;
	const currentMonth = now.getMonth() + 1;

	if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
		return { isValid: false, error: 'Card has expired' };
	}

	return { isValid: true };
}

export function validateRequired(value: string, fieldName: string = 'Field'): { isValid: boolean; error?: string } {
	if (!value || value.trim().length === 0) {
		return { isValid: false, error: `${fieldName} is required` };
	}
	return { isValid: true };
}

export function validateMinLength(value: string, minLength: number, fieldName: string = 'Field'): { isValid: boolean; error?: string } {
	if (value.trim().length < minLength) {
		return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
	}
	return { isValid: true };
}

