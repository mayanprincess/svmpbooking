import type { PortalUser } from '$lib/types/portal-user';

/** GET /auth/me and GET/PATCH /users/me response shape (MP Booking API). */
export type ApiUserProfile = {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone: string;
	country: string;
	is_verified: boolean;
	tier: string;
	total_points: number;
	created_at: string;
};

const TIER_LABEL: Record<string, string> = {
	standard: 'Standard',
	silver: 'Silver',
	gold: 'Gold',
	platinum: 'Platinum'
};

export function formatTierLabel(tier: string): string {
	return TIER_LABEL[tier] ?? tier;
}

export function mapProfileToPortal(
	p: ApiUserProfile,
	extras?: { national_id?: string }
): PortalUser {
	return {
		email: p.email,
		first_name: p.first_name,
		last_name: p.last_name,
		phone: p.phone,
		country_code: p.country?.trim() || 'HN',
		points_balance: p.total_points,
		membership_tier: formatTierLabel(p.tier),
		reservation_count: 0,
		account_verified: p.is_verified,
		national_id: extras?.national_id?.trim() ?? ''
	};
}
