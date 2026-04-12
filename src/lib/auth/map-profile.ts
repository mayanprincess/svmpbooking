import type { PortalUser } from '$lib/types/portal-user';

/** Legacy / OpenAPI-oriented shape — also accepts production login `user` payload. */
export type ApiUserProfile = {
	id?: string;
	email: string;
	first_name: string;
	last_name: string;
	phone: string;
	country: string;
	national_id?: string | null;
	is_verified?: boolean;
	account_verified?: boolean;
	tier?: string;
	membership_tier?: string;
	total_points?: number;
	points_balance?: number;
	reservation_count?: number;
	created_at?: string;
};

const TIER_LABEL: Record<string, string> = {
	standard: 'Standard',
	bronze: 'Bronze',
	silver: 'Silver',
	gold: 'Gold',
	platinum: 'Platinum',
	coral: 'Coral Elite'
};

export function formatTierLabel(tier: string): string {
	const k = tier.toLowerCase();
	return TIER_LABEL[k] ?? (tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Member');
}

/**
 * Maps API user JSON (login embed, /auth/me, /users/me) to PortalUser.
 * Supports both OpenAPI-style (tier, total_points, is_verified) and
 * production-style (membership_tier, points_balance, account_verified).
 */
export function toPortalUser(data: unknown, extras?: { national_id?: string }): PortalUser {
	if (typeof data !== 'object' || data === null) {
		return {
			email: '',
			first_name: '',
			last_name: '',
			points_balance: 0,
			membership_tier: 'Member',
			phone: '',
			reservation_count: 0,
			account_verified: false,
			national_id: extras?.national_id?.trim() ?? '',
			country_code: 'HN'
		};
	}
	const r = data as Record<string, unknown>;
	const points =
		typeof r.points_balance === 'number'
			? r.points_balance
			: typeof r.total_points === 'number'
				? r.total_points
				: 0;

	const tierRaw = String(r.membership_tier ?? r.tier ?? 'standard');
	const membership_tier = formatTierLabel(tierRaw);

	const verified = Boolean(r.account_verified ?? r.is_verified ?? false);
	const resCount = typeof r.reservation_count === 'number' ? r.reservation_count : 0;

	const nid =
		(typeof r.national_id === 'string' ? r.national_id : null) ??
		extras?.national_id ??
		'';

	return {
		email: String(r.email ?? ''),
		first_name: String(r.first_name ?? ''),
		last_name: String(r.last_name ?? ''),
		phone: String(r.phone ?? ''),
		country_code: (String(r.country ?? 'HN').trim() || 'HN') as PortalUser['country_code'],
		points_balance: points,
		membership_tier,
		reservation_count: resCount,
		account_verified: verified,
		national_id: String(nid).trim()
	};
}

export function mapProfileToPortal(p: unknown, extras?: { national_id?: string }): PortalUser {
	return toPortalUser(p, extras);
}
