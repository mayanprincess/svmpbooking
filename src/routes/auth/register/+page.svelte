<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import CountryAndPhoneFields from '$lib/components/CountryAndPhoneFields.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { locale, t } from '$lib/i18n';
	import { validateEmail } from '$lib/utils/validation';
	import { isValidPhoneForCountry, toE164 } from '$lib/utils/phone-regional';

	let error = $state('');
	let countryCode = $state('HN');
	let phone = $state('+504 ');

	const MIN_ID_LEN = 3;

	onMount(() => {
		authStore.init();
		if (authStore.isAuthenticated) {
			const r = page.url.searchParams.get('redirect') ?? '/portal';
			const dest = r.startsWith('/') ? r : '/portal';
			goto(dest, { replaceState: true });
		}
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const first_name = String(fd.get('first_name') ?? '').trim();
		const last_name = String(fd.get('last_name') ?? '').trim();
		const email = String(fd.get('email') ?? '').trim();
		const password = String(fd.get('password') ?? '');
		const national_id = String(fd.get('national_id') ?? '').trim();

		if (!first_name || !last_name) {
			error =
				$locale === 'es'
					? 'Introduce nombre y apellido.'
					: 'Enter your first and last name.';
			return;
		}
		if (!validateEmail(email)) {
			error =
				$locale === 'es'
					? 'Introduce un correo electrónico válido.'
					: 'Enter a valid email address.';
			return;
		}
		if (password.length < 4) {
			error =
				$locale === 'es'
					? 'La contraseña debe tener al menos 4 caracteres.'
					: 'Password must be at least 4 characters.';
			return;
		}
		if (national_id.length < MIN_ID_LEN) {
			error =
				$locale === 'es'
					? `El número de identidad debe tener al menos ${MIN_ID_LEN} caracteres (como en tu documento).`
					: `ID number must be at least ${MIN_ID_LEN} characters (as on your document).`;
			return;
		}
		if (!isValidPhoneForCountry(countryCode, phone)) {
			error =
				$locale === 'es'
					? 'Teléfono inválido: sigue el formato indicado (Honduras, EE. UU. u otro país con +).'
					: 'Invalid phone: follow the format shown (Honduras, USA, or international +).';
			return;
		}

		const phoneE164 = toE164(countryCode, phone);

		authStore.login({
			email,
			first_name,
			last_name,
			phone: phoneE164,
			national_id,
			country_code: countryCode,
			points_balance: 2500,
			membership_tier: 'Coral Elite',
			reservation_count: 0,
			account_verified: false
		});

		const dest = page.url.searchParams.get('redirect');
		goto(dest && dest.startsWith('/') ? dest : '/portal', { replaceState: true });
	}
</script>

<svelte:head>
	<title>{t($locale, 'registerTitle')} — Mayan Princess</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="page">
	<Header />

	<main class="main">
		<div class="panel">
			<h1 class="h1">{t($locale, 'registerTitle')}</h1>
			<p class="lead">{t($locale, 'registerSubtitle')}</p>

			<form class="form" onsubmit={handleSubmit} novalidate>
				<div class="row">
					<label class="field">
						<span class="label">{t($locale, 'registerFirstName')}</span>
						<input
							class="input"
							type="text"
							name="first_name"
							autocomplete="given-name"
							required
						/>
					</label>
					<label class="field">
						<span class="label">{t($locale, 'registerLastName')}</span>
						<input
							class="input"
							type="text"
							name="last_name"
							autocomplete="family-name"
							required
						/>
					</label>
				</div>

				<label class="field">
					<span class="label">{t($locale, 'portalEmail')}</span>
					<input
						class="input"
						type="email"
						name="email"
						autocomplete="email"
						required
						placeholder="you@example.com"
					/>
				</label>

				<label class="field">
					<span class="label">{t($locale, 'portalPassword')}</span>
					<input
						class="input"
						type="password"
						name="password"
						autocomplete="new-password"
						required
						minlength="4"
					/>
				</label>

				<CountryAndPhoneFields bind:countryCode bind:phone>
					{#snippet between()}
						<label class="field">
							<span class="label">{t($locale, 'registerIdentityNumber')}</span>
							<input
								class="input"
								type="text"
								name="national_id"
								autocomplete="off"
								required
								minlength={MIN_ID_LEN}
							/>
							<p class="identity-hint">{t($locale, 'registerIdentityHint')}</p>
						</label>
					{/snippet}
				</CountryAndPhoneFields>

				{#if error}
					<p class="err" role="alert">{error}</p>
				{/if}

				<button type="submit" class="submit">{t($locale, 'registerSubmit')}</button>
			</form>

			<p class="switch">
				<a href="/auth/login{page.url.search}">{t($locale, 'registerHaveAccount')}</a>
			</p>

			<p class="back">
				<a href="/">{t($locale, 'portalBookCta')}</a>
			</p>
		</div>
	</main>
</div>

<style>
	.page {
		min-height: 100vh;
		background: radial-gradient(1200px 500px at 10% -10%, rgba(197, 165, 111, 0.18), transparent),
			linear-gradient(180deg, var(--color-beige-light), #e8edf3);
	}

	.main {
		display: flex;
		justify-content: center;
		padding: clamp(1.5rem, 5vw, 3rem) 1rem 4rem;
	}

	.panel {
		width: 100%;
		max-width: 480px;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(12px);
		border-radius: 1.25rem;
		padding: 2rem 1.75rem 1.75rem;
		border: 1px solid rgba(24, 52, 83, 0.1);
		box-shadow: 0 24px 60px rgba(24, 52, 83, 0.12);
	}

	.h1 {
		font-family: var(--font-serif);
		font-size: 1.75rem;
		margin: 0 0 0.5rem;
		color: var(--color-primary);
	}

	.lead {
		margin: 0 0 1.5rem;
		color: var(--color-gray-dark);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form :global(.field) {
		margin: 0;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	@media (max-width: 520px) {
		.row {
			grid-template-columns: 1fr;
		}
	}

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

	.input:focus {
		outline: none;
		border-color: var(--color-secondary);
		box-shadow: 0 0 0 3px rgba(197, 165, 111, 0.2);
	}

	.identity-hint {
		margin: 0;
		font-size: 0.78rem;
		color: var(--color-gray);
		line-height: 1.35;
	}

	.err {
		color: var(--color-error);
		font-size: 0.875rem;
		margin: 0;
	}

	.submit {
		margin-top: 0.25rem;
		padding: 0.85rem 1rem;
		border: none;
		border-radius: 999px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		box-shadow: 0 12px 28px rgba(24, 52, 83, 0.22);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.submit:hover {
		transform: translateY(-1px);
		box-shadow: 0 16px 32px rgba(24, 52, 83, 0.28);
	}

	.switch {
		margin: 1.25rem 0 0;
		text-align: center;
		font-size: 0.9rem;
	}

	.switch a {
		color: var(--color-secondary);
		font-weight: 500;
	}

	.back {
		margin: 1rem 0 0;
		text-align: center;
		font-size: 0.9rem;
	}

	.back a {
		color: var(--color-secondary);
		font-weight: 500;
	}
</style>
