export type TokenPair = {
	access_token: string;
	refresh_token: string;
	token_type?: string;
};

/** Login JSON: local OpenAPI may return tokens only; production may embed `user` and omit refresh. */
export type LoginResponse = {
	access_token: string;
	refresh_token?: string;
	token_type?: string;
	user?: Record<string, unknown>;
};

export async function readApiErrorMessage(res: Response): Promise<string> {
	let text = '';
	try {
		const data: unknown = await res.json();
		if (typeof data === 'object' && data !== null) {
			const d = data as Record<string, unknown>;
			if (typeof d.detail === 'string') return d.detail;
			if (Array.isArray(d.detail)) {
				return d.detail
					.map((item: unknown) => {
						if (typeof item === 'object' && item !== null && 'msg' in item) {
							return String((item as { msg?: unknown }).msg ?? '');
						}
						return String(item);
					})
					.filter(Boolean)
					.join('; ');
			}
			if (typeof d.message === 'string') return d.message;
		}
	} catch {
		try {
			text = await res.clone().text();
		} catch {
			text = '';
		}
	}
	return text || res.statusText || `Error ${res.status}`;
}

function throwHttpError(res: Response, msg: string): never {
	const err = new Error(msg) as Error & { status: number };
	err.status = res.status;
	throw err;
}

export async function postLogin(email: string, password: string): Promise<LoginResponse> {
	const res = await fetch('/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
	if (!res.ok) {
		throwHttpError(res, await readApiErrorMessage(res));
	}
	return res.json() as Promise<LoginResponse>;
}

export async function postRefresh(refresh_token: string): Promise<TokenPair> {
	const res = await fetch('/api/auth/refresh', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refresh_token })
	});
	if (!res.ok) {
		throwHttpError(res, await readApiErrorMessage(res));
	}
	return res.json() as Promise<TokenPair>;
}

export async function getMe(access_token: string): Promise<unknown> {
	const res = await fetch('/api/auth/me', {
		headers: { Authorization: `Bearer ${access_token}` }
	});
	if (!res.ok) {
		throwHttpError(res, await readApiErrorMessage(res));
	}
	return res.json();
}

export async function postRegister(body: {
	email: string;
	password: string;
	first_name: string;
	last_name: string;
	phone: string;
	country: string;
	/** National ID / passport — backend accepts snake_case or camelCase */
	national_id: string;
}): Promise<void> {
	const res = await fetch('/api/auth/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		throwHttpError(res, await readApiErrorMessage(res));
	}
}

export async function patchUsersMe(
	access_token: string,
	body: Partial<{ first_name: string; last_name: string; phone: string; country: string }>
): Promise<unknown> {
	const res = await fetch('/api/users/me', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${access_token}`
		},
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		throwHttpError(res, await readApiErrorMessage(res));
	}
	return res.json();
}
