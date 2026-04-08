/**
 * Utilities Index
 * Central export point for all utility functions
 */

export {
	validateEmail,
	validatePhone,
	validateCardNumber,
	validateCVV,
	validateExpiry,
	validateRequired,
	validateMinLength
} from './validation';

export {
	formatCurrency,
	formatCardNumber,
	pluralize,
	generateConfirmationNumber
} from './formatting';

export {
	parseLocalDate,
	formatLocalDate,
	formatLocalDateLong,
	formatLocalDateShort,
	formatLocalDateForLang,
	calculateNightsBetween,
	getTodayLocalString,
	getDateFromToday,
	addDaysToLocalDateString,
	maxLocalDateString
} from './date-helpers';

export {
	scrollToElement,
	scrollToTop,
	scrollToTopInstant,
	scrollToFirstError
} from './scroll';

export {
	detectCardBrand,
	getCardIcon,
	sanitizeCardInput,
	maskCardNumber
} from './payment';

