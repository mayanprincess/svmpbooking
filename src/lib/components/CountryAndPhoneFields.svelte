<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getRegisterCountryCodes, countryLabel } from '$lib/data/register-countries';
	import {
		formatPhoneForCountry,
		phonePlaceholderForCountry,
		phoneRegionFromCountry
	} from '$lib/utils/phone-regional';
	import { locale, t, type UiKey } from '$lib/i18n';

	let {
		countryCode = $bindable('HN'),
		phone = $bindable(''),
		between,
		countryHeadingKey = 'registerCountry' as UiKey
	} = $props<{
		countryCode?: string;
		phone?: string;
		/** Rendered after country, before phone (e.g. national ID on register) */
		between?: Snippet;
		/** i18n key for the country field label */
		countryHeadingKey?: UiKey;
	}>();

	const codes = getRegisterCountryCodes();

	function labelFor(code: string) {
		return countryLabel(code, $locale === 'es' ? 'es' : 'en');
	}

	function onCountrySelect(e: Event) {
		const next = (e.currentTarget as HTMLSelectElement).value;
		countryCode = next;
		const r = phoneRegionFromCountry(next);
		if (r === 'HN') phone = '+504 ';
		else if (r === 'US') phone = '+1 ';
		else phone = '+';
	}

	function onPhoneInput(e: Event) {
		const v = (e.currentTarget as HTMLInputElement).value;
		phone = formatPhoneForCountry(countryCode, v);
	}

	const phoneHintKey = $derived.by((): UiKey => {
		const r = phoneRegionFromCountry(countryCode);
		if (r === 'HN') return 'registerPhoneHintHN';
		if (r === 'US') return 'registerPhoneHintUS';
		return 'registerPhoneHintIntl';
	});
</script>

<label class="field">
	<span class="label">{t($locale, countryHeadingKey)}</span>
	<select class="input select" name="country_code" value={countryCode} onchange={onCountrySelect}>
		{#each codes as code (code)}
			<option value={code}>{labelFor(code)}</option>
		{/each}
	</select>
</label>

{@render between?.()}

<label class="field">
	<span class="label">{t($locale, 'portalProfilePhone')}</span>
	<input
		class="input"
		type="tel"
		name="phone"
		autocomplete="tel"
		inputmode="tel"
		value={phone}
		oninput={onPhoneInput}
		placeholder={phonePlaceholderForCountry(countryCode)}
		required
	/>
	<p class="hint">{t($locale, phoneHintKey)}</p>
</label>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-primary);
	}

	.input {
		padding: 0.75rem 0.85rem;
		border-radius: 0.65rem;
		border: 1px solid rgba(24, 52, 83, 0.15);
		font-size: 1rem;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.select {
		background-color: #fff;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23183453' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 0.85rem center;
		padding-right: 2.25rem;
	}

	.input:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.2);
	}

	.hint {
		margin: 0;
		font-size: 0.78rem;
		color: var(--color-gray);
		line-height: 1.35;
	}
</style>
