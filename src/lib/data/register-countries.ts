/**
 * Countries for registration / profile. Honduras & United States appear first;
 * remaining codes are sorted A–Z by English name.
 */

export type CountryMeta = { en: string; es: string };

/** ISO 3166-1 alpha-2 → labels */
export const REGISTER_COUNTRY_META: Record<string, CountryMeta> = {
	HN: { en: 'Honduras', es: 'Honduras' },
	US: { en: 'United States', es: 'Estados Unidos' },
	AD: { en: 'Andorra', es: 'Andorra' },
	AE: { en: 'United Arab Emirates', es: 'Emiratos Árabes Unidos' },
	AR: { en: 'Argentina', es: 'Argentina' },
	AT: { en: 'Austria', es: 'Austria' },
	AU: { en: 'Australia', es: 'Australia' },
	BE: { en: 'Belgium', es: 'Bélgica' },
	BZ: { en: 'Belize', es: 'Belice' },
	BO: { en: 'Bolivia', es: 'Bolivia' },
	BR: { en: 'Brazil', es: 'Brasil' },
	CA: { en: 'Canada', es: 'Canadá' },
	CH: { en: 'Switzerland', es: 'Suiza' },
	CL: { en: 'Chile', es: 'Chile' },
	CN: { en: 'China', es: 'China' },
	CO: { en: 'Colombia', es: 'Colombia' },
	CR: { en: 'Costa Rica', es: 'Costa Rica' },
	CU: { en: 'Cuba', es: 'Cuba' },
	CZ: { en: 'Czechia', es: 'Chequia' },
	DE: { en: 'Germany', es: 'Alemania' },
	DK: { en: 'Denmark', es: 'Dinamarca' },
	DO: { en: 'Dominican Republic', es: 'República Dominicana' },
	EC: { en: 'Ecuador', es: 'Ecuador' },
	EE: { en: 'Estonia', es: 'Estonia' },
	EG: { en: 'Egypt', es: 'Egipto' },
	ES: { en: 'Spain', es: 'España' },
	FI: { en: 'Finland', es: 'Finlandia' },
	FR: { en: 'France', es: 'Francia' },
	GB: { en: 'United Kingdom', es: 'Reino Unido' },
	GT: { en: 'Guatemala', es: 'Guatemala' },
	GR: { en: 'Greece', es: 'Grecia' },
	HU: { en: 'Hungary', es: 'Hungría' },
	IE: { en: 'Ireland', es: 'Irlanda' },
	IL: { en: 'Israel', es: 'Israel' },
	IN: { en: 'India', es: 'India' },
	IS: { en: 'Iceland', es: 'Islandia' },
	IT: { en: 'Italy', es: 'Italia' },
	JM: { en: 'Jamaica', es: 'Jamaica' },
	JP: { en: 'Japan', es: 'Japón' },
	KR: { en: 'South Korea', es: 'Corea del Sur' },
	MX: { en: 'Mexico', es: 'México' },
	NI: { en: 'Nicaragua', es: 'Nicaragua' },
	NL: { en: 'Netherlands', es: 'Países Bajos' },
	NO: { en: 'Norway', es: 'Noruega' },
	PA: { en: 'Panama', es: 'Panamá' },
	PE: { en: 'Peru', es: 'Perú' },
	PL: { en: 'Poland', es: 'Polonia' },
	PT: { en: 'Portugal', es: 'Portugal' },
	PY: { en: 'Paraguay', es: 'Paraguay' },
	RO: { en: 'Romania', es: 'Rumanía' },
	SE: { en: 'Sweden', es: 'Suecia' },
	SG: { en: 'Singapore', es: 'Singapur' },
	SV: { en: 'El Salvador', es: 'El Salvador' },
	TR: { en: 'Turkey', es: 'Turquía' },
	TT: { en: 'Trinidad and Tobago', es: 'Trinidad y Tobago' },
	UY: { en: 'Uruguay', es: 'Uruguay' },
	VE: { en: 'Venezuela', es: 'Venezuela' },
	ZA: { en: 'South Africa', es: 'Sudáfrica' }
};

const PRIORITY: string[] = ['HN', 'US'];

export function getRegisterCountryCodes(): string[] {
	const rest = Object.keys(REGISTER_COUNTRY_META)
		.filter((c) => !PRIORITY.includes(c))
		.sort((a, b) =>
			REGISTER_COUNTRY_META[a].en.localeCompare(REGISTER_COUNTRY_META[b].en, 'en')
		);
	return [...PRIORITY, ...rest];
}

export function countryLabel(code: string, lang: 'en' | 'es'): string {
	const m = REGISTER_COUNTRY_META[code];
	if (!m) return code;
	return lang === 'es' ? m.es : m.en;
}
