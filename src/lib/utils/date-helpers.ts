/**
 * Date Helper Utilities
 * Timezone-safe date parsing and formatting
 */

/**
 * Parse a date string (YYYY-MM-DD) to a Date object in local timezone
 * This prevents the timezone offset issue where dates shift by one day
 */
export function parseLocalDate(dateStr: string): Date {
	if (!dateStr) return new Date();
	
	const [year, month, day] = dateStr.split('-').map(Number);
	return new Date(year, month - 1, day);
}

/**
 * Format a date string (YYYY-MM-DD) to a readable format
 * Uses local timezone parsing to avoid date shift issues
 */
export function formatLocalDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
	if (!dateStr) return '';
	
	const date = parseLocalDate(dateStr);
	const defaultOptions: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	};
	
	return date.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Format a date string to long format (e.g., "Monday, Jan 15, 2025")
 */
export function formatLocalDateLong(dateStr: string): string {
	return formatLocalDate(dateStr, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Format a date string to short format (e.g., "Jan 15")
 */
export function formatLocalDateShort(dateStr: string): string {
	return formatLocalDate(dateStr, {
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Calculate nights between two date strings (YYYY-MM-DD)
 * Uses local timezone to avoid timezone offset issues
 */
export function calculateNightsBetween(checkIn: string, checkOut: string): number {
	if (!checkIn || !checkOut) return 0;
	
	const startDate = parseLocalDate(checkIn);
	const endDate = parseLocalDate(checkOut);
	
	const diffTime = endDate.getTime() - startDate.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	
	return Math.max(0, diffDays);
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayLocalString(): string {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Get a date N days from today in YYYY-MM-DD format (local timezone)
 */
export function getDateFromToday(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

