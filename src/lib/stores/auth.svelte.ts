/**
 * Portal auth: JWT session via MP Booking API (proxied through /api/*).
 * Tokens + profile snapshot in localStorage; national_id is client-only until API supports it.
 */

import { mapProfileToPortal } from '$lib/auth/map-profile';
import * as flow from '$lib/auth/auth-flow';
import { AUTH_STORAGE_KEY, LEGACY_USER_STORAGE_KEY } from '$lib/auth/constants';
import type { PortalUser } from '$lib/types/portal-user';

export type { PortalUser };

function normalizeUser(u: PortalUser): PortalUser {
	return {
		...u,
		points_balance: u.points_balance ?? 0,
		membership_tier: u.membership_tier ?? 'Member',
		phone: u.phone ?? '',
		reservation_count: u.reservation_count ?? 0,
		account_verified: u.account_verified ?? false,
		national_id: u.national_id ?? '',
		country_code: u.country_code ?? 'HN'
	};
}

type PersistedSession = {
	accessToken: string;
	refreshToken: string;
	user: PortalUser;
};

let accessToken = $state<string | null>(null);
let refreshToken = $state<string | null>(null);
let user = $state<PortalUser | null>(null);

function readStoredSession(): PersistedSession | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(AUTH_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as PersistedSession;
		if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user?.email) return null;
		return {
			accessToken: parsed.accessToken,
			refreshToken: parsed.refreshToken,
			user: normalizeUser(parsed.user)
		};
	} catch {
		return null;
	}
}

function writeStoredSession(next: PersistedSession | null) {
	if (typeof window === 'undefined') return;
	if (next) {
		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
	} else {
		localStorage.removeItem(AUTH_STORAGE_KEY);
	}
}

function clearLegacyDemoStorage() {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
	} catch {
		/* ignore */
	}
}

function persist(): void {
	if (!user || !accessToken || !refreshToken) {
		writeStoredSession(null);
		return;
	}
	writeStoredSession({
		accessToken,
		refreshToken,
		user: normalizeUser(user)
	});
}

async function refreshAndPersist(): Promise<boolean> {
	const rt = refreshToken;
	if (!rt) return false;
	try {
		const tokens = await flow.postRefresh(rt);
		accessToken = tokens.access_token;
		refreshToken = tokens.refresh_token;
		const profile = await flow.getMe(tokens.access_token);
		const nid = user?.national_id ?? '';
		user = mapProfileToPortal(profile, { national_id: nid });
		persist();
		return true;
	} catch {
		accessToken = null;
		refreshToken = null;
		user = null;
		writeStoredSession(null);
		return false;
	}
}

export const authStore = {
	get user(): PortalUser | null {
		return user;
	},
	get isAuthenticated(): boolean {
		return user !== null && accessToken !== null;
	},
	get accessToken(): string | null {
		return accessToken;
	},

	init(): void {
		if (typeof window === 'undefined') return;
		clearLegacyDemoStorage();
		const s = readStoredSession();
		if (s) {
			accessToken = s.accessToken;
			refreshToken = s.refreshToken;
			user = s.user;
		} else {
			accessToken = null;
			refreshToken = null;
			user = null;
		}
	},

	async signInWithPassword(email: string, password: string): Promise<void> {
		const tokens = await flow.postLogin(email, password);
		const profile = await flow.getMe(tokens.access_token);
		accessToken = tokens.access_token;
		refreshToken = tokens.refresh_token;
		user = mapProfileToPortal(profile, { national_id: '' });
		persist();
	},

	async signUpThenSignIn(
		payload: {
			email: string;
			password: string;
			first_name: string;
			last_name: string;
			phone: string;
			country: string;
			national_id: string;
		}
	): Promise<void> {
		await flow.postRegister({
			email: payload.email,
			password: payload.password,
			first_name: payload.first_name,
			last_name: payload.last_name,
			phone: payload.phone,
			country: payload.country
		});
		const tokens = await flow.postLogin(payload.email, payload.password);
		accessToken = tokens.access_token;
		refreshToken = tokens.refresh_token;
		const profile = await flow.getMe(tokens.access_token);
		user = mapProfileToPortal(profile, { national_id: payload.national_id.trim() });
		persist();
	},

	async refreshSession(): Promise<boolean> {
		return refreshAndPersist();
	},

	/**
	 * PATCH /users/me — refreshes tokens once on 401.
	 */
	async saveProfileToApi(updates: {
		first_name: string;
		last_name: string;
		phone: string;
		country: string;
		national_id: string;
	}): Promise<void> {
		const at = accessToken;
		if (!at || !user) {
			throw new Error('Not signed in');
		}
		const body = {
			first_name: updates.first_name,
			last_name: updates.last_name,
			phone: updates.phone,
			country: updates.country
		};
		try {
			const profile = await flow.patchUsersMe(at, body);
			user = mapProfileToPortal(profile, { national_id: updates.national_id.trim() });
			persist();
		} catch (e) {
			const st = (e as { status?: number }).status;
			if (st === 401) {
				const ok = await refreshAndPersist();
				if (!ok) throw e;
				const profile = await flow.patchUsersMe(accessToken!, body);
				user = mapProfileToPortal(profile, { national_id: updates.national_id.trim() });
				persist();
				return;
			}
			throw e;
		}
	},

	logout(): void {
		accessToken = null;
		refreshToken = null;
		user = null;
		writeStoredSession(null);
	},

	/** @deprecated use signInWithPassword — kept for rare direct profile hydration */
	login(next: PortalUser): void {
		const n = normalizeUser(next);
		user = n;
		if (accessToken && refreshToken) {
			persist();
		}
	},

	updateProfile(partial: Partial<PortalUser>): void {
		if (!user) return;
		user = normalizeUser({ ...user, ...partial });
		persist();
	}
};
