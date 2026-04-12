/** Logged-in portal member (API profile + client-only fields such as national_id). */
export type PortalUser = {
	email: string;
	first_name: string;
	last_name: string;
	points_balance: number;
	membership_tier: string;
	phone?: string;
	reservation_count?: number;
	account_verified?: boolean;
	national_id?: string;
	country_code?: string;
};
