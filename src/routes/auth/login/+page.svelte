<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import { authStore, type PortalUser } from '$lib/stores/auth.svelte';
	import { locale, t } from '$lib/i18n';

	let error = $state('');

	onMount(() => {
		authStore.init();
		if (authStore.isAuthenticated) {
			const r = page.url.searchParams.get('redirect') ?? '/portal';
			const dest = r.startsWith('/') ? r : '/portal';
			goto(dest, { replaceState: true });
		}
	});

	function parseNameFromEmail(email: string): Pick<PortalUser, 'first_name' | 'last_name'> {
		const local = email.split('@')[0] ?? 'guest';
		const parts = local.split(/[._-]+/).filter(Boolean);
		const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
		const first = cap(parts[0]?.replace(/\d/g, '') || 'Guest');
		const last = cap(parts[1]?.replace(/\d/g, '') || 'Member');
		return { first_name: first, last_name: last };
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		const form = e.target as HTMLFormElement;
		const fd = new FormData(form);
		const email = String(fd.get('email') ?? '').trim();
		const password = String(fd.get('password') ?? '');

		if (!email || password.length < 4) {
			error =
				$locale === 'es'
					? 'Introduce un correo válido y al menos 4 caracteres en la contraseña.'
					: 'Enter a valid email and a password of at least 4 characters.';
			return;
		}

		const names = parseNameFromEmail(email);
		authStore.login({
			email,
			...names,
			points_balance: 2500,
			membership_tier: 'Coral Elite',
			phone: '+50400000000',
			country_code: 'HN',
			reservation_count: 0,
			account_verified: false,
			national_id: ''
		});

		const dest = page.url.searchParams.get('redirect');
		goto(dest && dest.startsWith('/') ? dest : '/portal', { replaceState: true });
	}
</script>

<svelte:head>
	<title>{t($locale, 'portalLoginTitle')} — Mayan Princess</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="page">
	<Header />

	<main class="main">
		<div class="panel">
			<h1 class="h1">{t($locale, 'portalLoginTitle')}</h1>
			<p class="lead">{t($locale, 'portalLoginSubtitle')}</p>
			<p class="demo">{t($locale, 'portalLoginDemoHint')}</p>

			<p class="register-hint">
				{t($locale, 'registerNoAccount')}
				<a href="/auth/register{page.url.search}">{t($locale, 'registerCta')}</a>
			</p>

			<form class="form" onsubmit={handleSubmit} novalidate>
				<label class="field">
					<span class="label">{t($locale, 'portalEmail')}</span>
					<input
						class="input"
						type="email"
						name="email"
						autocomplete="username"
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
						autocomplete="current-password"
						required
						minlength="4"
					/>
				</label>

				{#if error}
					<p class="err" role="alert">{error}</p>
				{/if}

				<button type="submit" class="submit">{t($locale, 'portalLoginSubmit')}</button>
			</form>

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
		max-width: 440px;
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
		margin: 0 0 0.75rem;
		color: var(--color-gray-dark);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.demo {
		font-size: 0.8rem;
		color: var(--color-gray);
		margin: 0 0 0.75rem;
		line-height: 1.45;
	}

	.register-hint {
		font-size: 0.9rem;
		color: var(--color-gray-dark);
		margin: 0 0 1.25rem;
		line-height: 1.45;
	}

	.register-hint a {
		margin-left: 0.35rem;
		color: var(--color-secondary);
		font-weight: 600;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	.back {
		margin: 1.5rem 0 0;
		text-align: center;
		font-size: 0.9rem;
	}

	.back a {
		color: var(--color-secondary);
		font-weight: 500;
	}
</style>
