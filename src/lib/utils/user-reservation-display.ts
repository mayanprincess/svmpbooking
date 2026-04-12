import type { UserReservationMine } from '$lib/types/user-reservation';

function str(v: unknown): string | null {
	return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Guest line for UI: name and optional email, from camelCase or snake_case guest object. */
export function reservationGuestLine(r: UserReservationMine): string | null {
	const direct = r.guest;
	if (direct && typeof direct === 'object') {
		const fn = str(direct.firstName) ?? str(direct.first_name);
		const ln = str(direct.lastName) ?? str(direct.last_name);
		const name = [fn, ln].filter(Boolean).join(' ').trim();
		const email = str(direct.email);
		if (name) return email ? `${name} · ${email}` : name;
		if (email) return email;
	}
	const o = r as Record<string, unknown>;
	const g = o.guest;
	if (g && typeof g === 'object') {
		const d = g as Record<string, unknown>;
		const fn = str(d.firstName) ?? str(d.first_name);
		const ln = str(d.lastName) ?? str(d.last_name);
		const name = [fn, ln].filter(Boolean).join(' ').trim();
		const email = str(d.email);
		if (name) return email ? `${name} · ${email}` : name;
	}
	return null;
}

export function reservationRoomLine(r: UserReservationMine): string | null {
	if (r.roomTypeCode) return r.roomTypeCode;
	const o = r as Record<string, unknown>;
	return str(o.room_type_code) ?? str(o.roomTypeCode);
}
