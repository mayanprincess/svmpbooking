import { validateEmail, validatePhone } from '$lib/utils/validation';

/** Shape needed for ticket / booking pre-fill checks (matches persisted portal user). */
export type ProfileCompletenessUser = {
	first_name: string;
	last_name: string;
	email: string;
	phone?: string;
	national_id?: string;
};

/** Minimum length for ID / passport stored on profile (tickets) */
const MIN_ID_LEN = 3;

/**
 * True when the portal user has every field needed to pre-fill the main guest
 * (same rules as GuestDetailsForm main contact: name, ID, email, phone).
 */
export function isPortalProfileComplete(user: ProfileCompletenessUser | null): boolean {
	if (!user) return false;
	const fn = user.first_name?.trim() ?? '';
	const ln = user.last_name?.trim() ?? '';
	const email = user.email?.trim() ?? '';
	const phone = user.phone?.trim() ?? '';
	const nid = user.national_id?.trim() ?? '';
	if (fn.length === 0 || ln.length === 0) return false;
	if (!validateEmail(email)) return false;
	if (!validatePhone(phone)) return false;
	if (nid.length < MIN_ID_LEN) return false;
	return true;
}
