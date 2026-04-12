/**
 * Client auth state for the user portal (session persisted in localStorage).
 * Replace login()/payload with your real API when the backend is wired.
 */

export type PortalUser = {
	email: string;
	first_name: string;
	last_name: string;
	/** Reward / loyalty points (demo until API exists) */
	points_balance: number;
	membership_tier: string;
	/** Demo contact phone shown on dashboard */
	phone?: string;
	/** Demo: reservations count from API */
	reservation_count?: number;
	/** Demo: KYC / email verification */
	account_verified?: boolean;
	/** National ID / passport — required for tickets when using saved profile */
	national_id?: string;
	/** ISO 3166-1 alpha-2 — country for phone format & ID context */
	country_code?: string;
};

const STORAGE_KEY = 'svmp_portal_user_v1';

function normalizeUser(u: PortalUser): PortalUser {
	return {
		...u,
		points_balance: u.points_balance ?? 0,
		membership_tier: u.membership_tier ?? 'Member',
		phone: u.phone ?? '+504 0000-0000',
		reservation_count: u.reservation_count ?? 0,
		account_verified: u.account_verified ?? false,
		national_id: u.national_id ?? '',
		country_code: u.country_code ?? 'HN'
	};
}

let user = $state<PortalUser | null>(null);

function readStoredUser(): PortalUser | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as PortalUser;
		if (!parsed?.email || !parsed?.first_name) return null;
		return normalizeUser(parsed);
	} catch {
		return null;
	}
}

function writeStoredUser(next: PortalUser | null) {
	if (typeof window === 'undefined') return;
	if (next) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} else {
		localStorage.removeItem(STORAGE_KEY);
	}
}

export const authStore = {
	get user(): PortalUser | null {
		return user;
	},
	get isAuthenticated(): boolean {
		return user !== null;
	},
	/**
	 * Re-sync from localStorage on every call (safe for SPA navigations + HMR).
	 * A previous version used a one-shot flag that left `user` null while `initDone`
	 * stayed true → redirect loop between /portal and /auth/login.
	 */
	init(): void {
		if (typeof window === 'undefined') return;
		user = readStoredUser();
	},
	login(next: PortalUser): void {
		const n = normalizeUser(next);
		user = n;
		writeStoredUser(n);
	},
	logout(): void {
		user = null;
		writeStoredUser(null);
	},
	/** Merge fields into current user and persist (e.g. profile completion in /portal). */
	updateProfile(partial: Partial<PortalUser>): void {
		if (!user) return;
		user = normalizeUser({ ...user, ...partial });
		writeStoredUser(user);
	}
};
