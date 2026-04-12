<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CountryAndPhoneFields from '$lib/components/CountryAndPhoneFields.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { isPortalProfileComplete } from '$lib/utils/portal-profile';
	import {
		displayPhoneFromStored,
		guessCountryFromStoredPhone,
		isValidPhoneForCountry,
		toE164
	} from '$lib/utils/phone-regional';
	import { locale, setLocale, t, type Locale } from '$lib/i18n';
	import type { UserReservationMine } from '$lib/types/user-reservation';
	import { formatLocalDateForLang } from '$lib/utils/date-helpers';

	let ready = $state(false);
	let mineReservations = $state<UserReservationMine[]>([]);
	let mineLoading = $state(false);
	let mineError = $state('');
	let profileFirstName = $state('');
	let profileLastName = $state('');
	let profileNationalId = $state('');
	let profileCountry = $state('HN');
	let profilePhone = $state('+504 ');
	let profileSaved = $state(false);
	let profileError = $state('');

	const profileComplete = $derived(isPortalProfileComplete(authStore.user));

	const pointsLocale = $derived($locale === 'es' ? 'es-HN' : 'en-US');

	const loginRedirectUrl = `/auth/login?redirect=${encodeURIComponent('/portal')}`;

	async function loadMyReservations() {
		let token = authStore.accessToken;
		if (!token) {
			mineReservations = [];
			return;
		}
		mineLoading = true;
		mineError = '';
		try {
			const fetchMine = (at: string) =>
				fetch('/api/reservations/mine?limit=50', {
					headers: { Authorization: `Bearer ${at}` }
				});

			let r = await fetchMine(token);
			if (r.status === 401) {
				const refreshed = await authStore.refreshSession();
				token = authStore.accessToken;
				if (refreshed && token) {
					r = await fetchMine(token);
				}
			}
			if (r.status === 401) {
				authStore.logout();
				goto(loginRedirectUrl, { replaceState: true });
				return;
			}
			if (!r.ok) {
				mineError = t($locale, 'portalReservationsLoadError');
				return;
			}
			const data: unknown = await r.json();
			const list = Array.isArray(data)
				? data
				: typeof data === 'object' && data !== null && 'data' in data
					? (data as { data: unknown }).data
					: [];
			mineReservations = Array.isArray(list) ? (list as UserReservationMine[]) : [];
		} catch {
			mineError = t($locale, 'portalReservationsLoadError');
		} finally {
			mineLoading = false;
		}
	}

	onMount(async () => {
		authStore.init();
		const u = authStore.user;
		if (u) {
			profileFirstName = u.first_name ?? '';
			profileLastName = u.last_name ?? '';
			profileNationalId = u.national_id ?? '';
			profileCountry = u.country_code ?? guessCountryFromStoredPhone(u.phone);
			profilePhone = displayPhoneFromStored(profileCountry, u.phone ?? '');
		}
		ready = true;
		if (!authStore.isAuthenticated) {
			goto(`/auth/login?redirect=${encodeURIComponent('/portal')}`, { replaceState: true });
			return;
		}
		await loadMyReservations();
	});

	function logoutAndLeave() {
		authStore.logout();
		goto('/');
	}

	function pickLocale(code: Locale) {
		setLocale(code);
	}

	const initials = $derived.by(() => {
		const u = authStore.user;
		if (!u) return '·';
		const a = u.first_name?.charAt(0) ?? '';
		const b = u.last_name?.charAt(0) ?? '';
		return (a + b).toUpperCase() || '·';
	});

	const fullName = $derived(
		`${authStore.user?.first_name ?? ''} ${authStore.user?.last_name ?? ''}`.trim()
	);

	const hash = $derived(page.url.hash);
	const navSection = $derived(
		hash === '#reservas' ? 'reservas' : hash === '#perfil' ? 'perfil' : 'dashboard'
	);

	async function saveProfile(e: SubmitEvent) {
		e.preventDefault();
		profileError = '';
		const fn = profileFirstName.trim();
		const ln = profileLastName.trim();
		if (!fn || !ln) {
			profileError =
				$locale === 'es'
					? 'Introduce nombre y apellido.'
					: 'Enter your first and last name.';
			return;
		}
		if (!isValidPhoneForCountry(profileCountry, profilePhone)) {
			profileError =
				$locale === 'es'
					? 'Revisa el teléfono según el formato de tu país.'
					: 'Check the phone format for your country.';
			return;
		}
		try {
			await authStore.saveProfileToApi({
				first_name: fn,
				last_name: ln,
				phone: toE164(profileCountry, profilePhone),
				country: profileCountry,
				national_id: profileNationalId.trim()
			});
			const u = authStore.user;
			if (u) {
				profileFirstName = u.first_name ?? '';
				profileLastName = u.last_name ?? '';
				profileNationalId = u.national_id ?? '';
				profileCountry = u.country_code ?? profileCountry;
				profilePhone = displayPhoneFromStored(u.country_code ?? profileCountry, u.phone ?? '');
			}
			profileSaved = true;
			window.setTimeout(() => {
				profileSaved = false;
			}, 4000);
		} catch (err) {
			profileError =
				err instanceof Error
					? err.message
					: $locale === 'es'
						? 'No se pudo guardar el perfil.'
						: 'Could not save profile.';
		}
	}
</script>

<svelte:head>
	<title>{t($locale, 'portalNavDashboard')} — Mayan Princess</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="shell">
	{#if !ready}
		<div class="state-card" aria-live="polite">
			<div class="shimmer"></div>
			<p>{t($locale, 'searching')}</p>
		</div>
	{:else if !authStore.isAuthenticated}
		<div class="state-card">
			<p>{t($locale, 'portalLogin')}</p>
		</div>
	{:else}
		<!-- Sidebar: full height column -->
		<aside class="sidebar" aria-label="Portal">
			<a href="/" class="side-logo">
				<img src="/logomayan.png" alt={t($locale, 'headerLogoAlt')} class="side-logo-img" />
				<span class="side-logo-text">Mayan Princess</span>
			</a>

			<div class="side-user">
				<div class="side-avatar" aria-hidden="true">{initials}</div>
				<div class="side-user-meta">
					<p class="side-user-name">{fullName}</p>
					<p class="side-user-email">{authStore.user?.email}</p>
				</div>
			</div>

			<nav class="side-nav">
				<a
					href="/portal"
					class="side-link"
					class:side-link--on={navSection === 'dashboard'}
					aria-current={navSection === 'dashboard' ? 'page' : undefined}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linejoin="round"
						/>
					</svg>
					{t($locale, 'portalNavDashboard')}
				</a>
				<a
					href="/portal#reservas"
					class="side-link"
					class:side-link--on={navSection === 'reservas'}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<rect
							x="4"
							y="5"
							width="16"
							height="16"
							rx="2"
							stroke="currentColor"
							stroke-width="1.75"
						/>
						<path d="M8 3v4M16 3v4M4 11h16" stroke="currentColor" stroke-width="1.75" />
					</svg>
					{t($locale, 'portalNavReservations')}
				</a>
				<a href="/portal#perfil" class="side-link" class:side-link--on={navSection === 'perfil'}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle cx="12" cy="9" r="4" stroke="currentColor" stroke-width="1.75" />
						<path
							d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
						/>
					</svg>
					{t($locale, 'portalNavProfile')}
				</a>
			</nav>

			<div class="side-spacer"></div>

			<div class="side-lang" role="group" aria-label={t($locale, 'langSelect')}>
				<button
					type="button"
					class="side-lang-btn"
					class:on={$locale === 'en'}
					onclick={() => pickLocale('en')}
				>
					EN
				</button>
				<button
					type="button"
					class="side-lang-btn"
					class:on={$locale === 'es'}
					onclick={() => pickLocale('es')}
				>
					ES
				</button>
			</div>

			<button type="button" class="side-out" onclick={logoutAndLeave}>
				{t($locale, 'portalLogout')}
			</button>
			<a href="/" class="side-back">{t($locale, 'portalBackToSite')}</a>
		</aside>

		<!-- Main panel -->
		<div class="panel">
			<div class="panel-inner">
				<header class="page-head">
					<div class="page-head-text">
						<h1 class="page-title">
							{t($locale, 'portalGreeting')}
							<span class="page-title-name">{fullName}</span>
						</h1>
						<p class="page-sub">{t($locale, 'portalSubDashboard')}</p>
					</div>
					<a href="/" class="page-cta">{t($locale, 'portalNewReservation')}</a>
				</header>

				<section class="stats" aria-label={t($locale, 'portalNavOverview')}>
					<article class="stat-card">
						<div class="stat-icon" aria-hidden="true">
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
								<rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.75" />
								<path d="M8 3v4M16 3v4M4 11h16" stroke="currentColor" stroke-width="1.75" />
							</svg>
						</div>
						<p class="stat-label">{t($locale, 'portalStatReservations')}</p>
						<p class="stat-value">{authStore.user?.reservation_count ?? 0}</p>
					</article>
					<article class="stat-card">
						<div class="stat-icon" aria-hidden="true">
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="9" r="4" stroke="currentColor" stroke-width="1.75" />
								<path
									d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
								/>
							</svg>
						</div>
						<p class="stat-label">{t($locale, 'portalStatAccount')}</p>
						<p
							class="stat-value stat-value--sm"
							class:warn={!authStore.user?.account_verified}
						>
							{authStore.user?.account_verified
								? t($locale, 'portalStatusVerified')
								: t($locale, 'portalStatusUnverified')}
						</p>
					</article>
					<article class="stat-card">
						<div class="stat-icon" aria-hidden="true">
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
								<path
									d="M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v11c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 20 4 18.88 4 17.5v-11z"
									stroke="currentColor"
									stroke-width="1.75"
								/>
								<path
									d="M8 14h8M8 10h5"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
								/>
							</svg>
						</div>
						<p class="stat-label">{t($locale, 'portalStatContact')}</p>
						<p class="stat-value stat-value--sm stat-mono">{authStore.user?.phone}</p>
					</article>
				</section>

				<section class="points-banner">
					<div class="points-banner-accent" aria-hidden="true"></div>
					<div class="points-banner-body">
						<span class="points-star" aria-hidden="true">★</span>
						<div>
							<h2 class="points-title">{t($locale, 'portalPointsSoonTitle')}</h2>
							<p class="points-desc">{t($locale, 'portalPointsSoonBody')}</p>
							<p class="points-balance">
								{t($locale, 'portalRewardsCard')}: <strong
									>{authStore.user?.points_balance?.toLocaleString(pointsLocale) ?? '—'}</strong
								>
								{t($locale, 'portalPointsUnit')} · {authStore.user?.membership_tier}
							</p>
						</div>
					</div>
					<span class="points-badge">{t($locale, 'portalBadgeSoon')}</span>
				</section>

				<section class="recent" id="reservas">
					<div class="recent-head">
						<h2 class="recent-title">{t($locale, 'portalRecentTitle')}</h2>
						<span class="recent-link">{t($locale, 'portalViewAll')} →</span>
					</div>
					{#if mineLoading}
						<div class="recent-empty recent-empty--muted" role="status">
							<p class="recent-msg">{t($locale, 'portalReservationsLoading')}</p>
						</div>
					{:else if mineError}
						<div class="recent-empty recent-empty--warn">
							<p class="recent-msg">{mineError}</p>
							<button type="button" class="recent-retry" onclick={() => loadMyReservations()}>
								{t($locale, 'portalRetry')}
							</button>
						</div>
					{:else if mineReservations.length === 0}
						<div class="recent-empty">
							<div class="recent-empty-icon" aria-hidden="true">
								<svg width="40" height="40" viewBox="0 0 24 24" fill="none">
									<rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5" />
									<path d="M8 3v4M16 3v4M4 11h16" stroke="currentColor" stroke-width="1.5" />
								</svg>
							</div>
							<p class="recent-msg">{t($locale, 'portalEmptyReservations')}</p>
							<p class="recent-hint">{t($locale, 'portalReservationsSoon')}</p>
							<a href="/" class="recent-cta">{t($locale, 'portalReserveNow')}</a>
						</div>
					{:else}
						<ul class="recent-list">
							{#each mineReservations as r (r.id)}
								<li class="recent-item">
									<div class="recent-item-main">
										<p class="recent-item-confirm">
											{t($locale, 'portalReservationConfirmation')} ·
											<strong>{r.confirmationNumber ?? String(r.id)}</strong>
										</p>
										<p class="recent-item-dates">
											{t($locale, 'labelDates')}: {r.checkIn
												? formatLocalDateForLang(String(r.checkIn), $locale)
												: '—'}
											→
											{r.checkOut
												? formatLocalDateForLang(String(r.checkOut), $locale)
												: '—'}
										</p>
									</div>
									<span
										class="recent-item-paid"
										class:recent-item-paid--yes={r.isPaid === true}
										class:recent-item-paid--no={r.isPaid !== true}
									>
										{r.isPaid === true
											? t($locale, 'portalReservationPaid')
											: t($locale, 'portalReservationUnpaid')}
									</span>
								</li>
							{/each}
						</ul>
					{/if}
				</section>

				<section class="profile-card" id="perfil">
					<p class="profile-section-kicker">{t($locale, 'portalProfileTicketsTitle')}</p>
					<div class="profile-card-head">
						<h2 class="profile-ph-title">{t($locale, 'portalNavProfile')}</h2>
						<span
							class="profile-badge"
							class:profile-badge--ok={profileComplete}
							class:profile-badge--warn={!profileComplete}
						>
							{profileComplete
								? t($locale, 'portalProfileCompleteBadge')
								: t($locale, 'portalProfileIncompleteBadge')}
						</span>
					</div>
					<p class="profile-ph-text">{t($locale, 'portalProfileTicketsBody')}</p>

					<form class="profile-form" onsubmit={saveProfile}>
						<div class="profile-name-row">
							<label class="profile-field">
								<span class="profile-label">{t($locale, 'registerFirstName')}</span>
								<input
									class="profile-input"
									type="text"
									name="first_name"
									bind:value={profileFirstName}
									autocomplete="given-name"
									required
								/>
							</label>
							<label class="profile-field">
								<span class="profile-label">{t($locale, 'registerLastName')}</span>
								<input
									class="profile-input"
									type="text"
									name="last_name"
									bind:value={profileLastName}
									autocomplete="family-name"
									required
								/>
							</label>
						</div>
						<label class="profile-field">
							<span class="profile-label">{t($locale, 'portalEmail')}</span>
							<input
								class="profile-input"
								type="email"
								value={authStore.user?.email ?? ''}
								disabled
								readonly
							/>
						</label>
						<div class="profile-contact-block">
							<CountryAndPhoneFields
								countryHeadingKey="portalProfileCountry"
								bind:countryCode={profileCountry}
								bind:phone={profilePhone}
							>
								{#snippet between()}
									<label class="profile-field">
										<span class="profile-label">{t($locale, 'portalProfileNationalId')}</span>
										<input
											class="profile-input"
											type="text"
											name="national_id"
											bind:value={profileNationalId}
											autocomplete="off"
											required
											minlength="3"
										/>
									</label>
								{/snippet}
							</CountryAndPhoneFields>
						</div>
						{#if profileError}
							<p class="profile-err" role="alert">{profileError}</p>
						{/if}
						<button type="submit" class="profile-save">{t($locale, 'portalProfileSave')}</button>
						{#if profileSaved}
							<p class="profile-saved-msg" role="status">{t($locale, 'portalProfileSaved')}</p>
						{/if}
					</form>
				</section>
			</div>
		</div>
	{/if}
</main>

<style>
	.shell {
		display: flex;
		min-height: 100vh;
		width: 100%;
	}

	.state-card {
		margin: auto;
		padding: 2rem 2.5rem;
		background: #fff;
		border-radius: 1rem;
		box-shadow: 0 8px 32px rgba(24, 52, 83, 0.08);
		text-align: center;
		color: var(--pd-muted, #5c6b7a);
	}

	.shimmer {
		height: 4px;
		border-radius: 99px;
		background: linear-gradient(
			90deg,
			rgba(197, 165, 111, 0.2),
			rgba(197, 165, 111, 0.75),
			rgba(197, 165, 111, 0.2)
		);
		background-size: 200% 100%;
		animation: shimmer 1.2s ease-in-out infinite;
		margin-bottom: 1rem;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	/* Sidebar */
	.sidebar {
		width: 100%;
		max-width: 280px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem 1.25rem 2rem;
		background: linear-gradient(180deg, var(--pd-navy-deep, #0f1f33) 0%, var(--pd-navy, #183453) 100%);
		color: #f0f4f8;
		border-right: 1px solid rgba(197, 165, 111, 0.15);
	}

	@media (max-width: 900px) {
		.shell {
			flex-direction: column;
		}
		.sidebar {
			max-width: none;
			border-right: none;
			border-bottom: 1px solid rgba(197, 165, 111, 0.15);
		}
		.side-spacer {
			display: none;
		}
	}

	.side-logo {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		text-decoration: none;
		color: inherit;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.side-logo-img {
		height: 36px;
		width: auto;
	}

	.side-logo-text {
		font-family: var(--pd-serif, Georgia, serif);
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.side-user {
		display: flex;
		gap: 0.85rem;
		align-items: center;
		padding: 0.85rem;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.side-avatar {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 50%;
		background: linear-gradient(145deg, #d4b57c, var(--pd-gold, #c5a56f));
		color: var(--pd-navy-deep, #0f1f33);
		font-weight: 700;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.side-user-name {
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0 0 0.2rem;
		line-height: 1.25;
	}

	.side-user-email {
		font-size: 0.72rem;
		opacity: 0.7;
		margin: 0;
		word-break: break-all;
	}

	.side-nav {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.side-link {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.7rem 0.85rem;
		border-radius: 0.65rem;
		text-decoration: none;
		color: rgba(240, 244, 248, 0.75);
		font-size: 0.9rem;
		font-weight: 500;
		border: 1px solid transparent;
		transition:
			background 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.side-link:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.06);
	}

	.side-link--on {
		color: #fff;
		background: rgba(197, 165, 111, 0.12);
		border-color: rgba(197, 165, 111, 0.35);
	}

	.side-spacer {
		flex: 1;
		min-height: 1.5rem;
	}

	.side-lang {
		display: flex;
		gap: 0.35rem;
	}

	.side-lang-btn {
		flex: 1;
		padding: 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		border-radius: 0.4rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: transparent;
		color: rgba(240, 244, 248, 0.6);
		cursor: pointer;
	}

	.side-lang-btn.on {
		background: rgba(197, 165, 111, 0.2);
		border-color: rgba(197, 165, 111, 0.4);
		color: #fff;
	}

	.side-out {
		padding: 0.65rem 1rem;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: transparent;
		color: rgba(240, 244, 248, 0.85);
		font-size: 0.88rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.side-out:hover {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.35);
	}

	.side-back {
		font-size: 0.8rem;
		text-align: center;
		color: rgba(197, 165, 111, 0.85);
		text-decoration: none;
	}

	.side-back:hover {
		text-decoration: underline;
	}

	/* Main */
	.panel {
		flex: 1;
		min-width: 0;
		background: var(--pd-cream, #f7f4ef);
		overflow-x: hidden;
	}

	.panel-inner {
		max-width: 1040px;
		margin: 0 auto;
		padding: clamp(1.75rem, 4vw, 2.75rem) clamp(1.25rem, 4vw, 2.5rem) 3.5rem;
	}

	.page-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem 1.5rem;
		margin-bottom: 2.25rem;
	}

	.page-head-text {
		min-width: min(100%, 320px);
	}

	.page-title {
		font-family: var(--pd-serif, Georgia, serif);
		font-size: clamp(1.65rem, 3.5vw, 2.1rem);
		font-weight: 600;
		color: var(--pd-navy, #183453);
		margin: 0 0 0.5rem;
		line-height: 1.2;
	}

	.page-title-name {
		display: inline;
		font-weight: 600;
	}

	.page-sub {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--pd-muted, #5c6b7a);
		max-width: 48ch;
	}

	.page-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.35rem;
		border-radius: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		color: var(--pd-navy-deep, #0f1f33) !important;
		background: linear-gradient(180deg, #d8bc86 0%, var(--pd-gold, #c5a56f) 100%);
		box-shadow: 0 4px 14px rgba(197, 165, 111, 0.35);
		border: 1px solid rgba(160, 130, 70, 0.35);
		flex-shrink: 0;
		align-self: center;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.page-cta:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 20px rgba(197, 165, 111, 0.4);
		color: var(--pd-navy-deep, #0f1f33) !important;
	}

	/* Stats — generous gutters */
	.stats {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 640px) {
		.stats {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.75rem;
		}
	}

	.stat-card {
		background: #fff;
		border-radius: 0.85rem;
		padding: 1.25rem 1.35rem;
		border: 1px solid rgba(24, 52, 83, 0.08);
		box-shadow: 0 2px 12px rgba(24, 52, 83, 0.06);
	}

	.stat-icon {
		color: var(--pd-gold, #c5a56f);
		margin-bottom: 0.75rem;
		opacity: 0.9;
	}

	.stat-label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--pd-muted, #5c6b7a);
		margin: 0 0 0.35rem;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--pd-navy, #183453);
		margin: 0;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.stat-value--sm {
		font-size: 1.05rem;
		font-weight: 600;
	}

	.stat-value.warn {
		color: #c2410c;
	}

	.stat-mono {
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}

	.points-banner {
		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.35rem 1.5rem;
		margin-bottom: 2.5rem;
		background: #fff;
		border-radius: 0.85rem;
		border: 1px solid rgba(24, 52, 83, 0.08);
		box-shadow: 0 2px 12px rgba(24, 52, 83, 0.06);
		overflow: hidden;
	}

	.points-banner-accent {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: linear-gradient(180deg, var(--pd-gold, #c5a56f), #8b6914);
	}

	.points-banner-body {
		display: flex;
		gap: 1rem;
		padding-left: 0.5rem;
		min-width: 0;
	}

	.points-star {
		font-size: 1.5rem;
		color: var(--pd-gold, #c5a56f);
		line-height: 1;
	}

	.points-title {
		font-family: var(--pd-serif, Georgia, serif);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--pd-navy, #183453);
		margin: 0 0 0.35rem;
	}

	.points-desc {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--pd-muted, #5c6b7a);
		margin: 0 0 0.5rem;
		max-width: 56ch;
	}

	.points-balance {
		font-size: 0.82rem;
		color: var(--pd-muted, #5c6b7a);
		margin: 0;
	}

	.points-balance strong {
		color: var(--pd-navy, #183453);
	}

	.points-badge {
		flex-shrink: 0;
		align-self: flex-start;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		padding: 0.35rem 0.6rem;
		border-radius: 0.35rem;
		background: rgba(197, 165, 111, 0.18);
		color: #7a5c20;
		border: 1px solid rgba(197, 165, 111, 0.35);
	}

	.recent {
		margin-bottom: 2.5rem;
	}

	.recent-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.recent-title {
		font-family: var(--pd-serif, Georgia, serif);
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--pd-navy, #183453);
		margin: 0;
	}

	.recent-link {
		font-size: 0.85rem;
		color: var(--pd-gold, #c5a56f);
		font-weight: 500;
	}

	.recent-empty {
		text-align: center;
		padding: 2.5rem 1.5rem;
		background: #fff;
		border-radius: 0.85rem;
		border: 1px dashed rgba(24, 52, 83, 0.15);
	}

	.recent-empty-icon {
		color: var(--pd-gold, #c5a56f);
		opacity: 0.85;
		margin-bottom: 1rem;
	}

	.recent-msg {
		font-size: 0.95rem;
		color: var(--pd-navy, #183453);
		font-weight: 500;
		margin: 0 0 0.5rem;
	}

	.recent-hint {
		font-size: 0.82rem;
		color: var(--pd-muted, #5c6b7a);
		margin: 0 0 1.25rem;
		max-width: 42ch;
		margin-left: auto;
		margin-right: auto;
	}

	.recent-cta {
		display: inline-flex;
		padding: 0.65rem 1.5rem;
		border-radius: 0.5rem;
		background: var(--pd-navy, #183453);
		color: #fff !important;
		font-size: 0.88rem;
		font-weight: 600;
		text-decoration: none;
	}

	.recent-cta:hover {
		filter: brightness(1.08);
		color: #fff !important;
	}

	.recent-empty--muted {
		border-style: solid;
		border-color: rgba(24, 52, 83, 0.1);
	}

	.recent-empty--warn {
		border-style: solid;
		border-color: rgba(180, 90, 50, 0.35);
		background: rgba(255, 248, 245, 0.9);
	}

	.recent-retry {
		margin-top: 0.75rem;
		padding: 0.5rem 1.1rem;
		border-radius: 0.45rem;
		border: 1px solid rgba(24, 52, 83, 0.2);
		background: #fff;
		color: var(--pd-navy, #183453);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.recent-retry:hover {
		border-color: var(--pd-gold, #c5a56f);
	}

	.recent-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.recent-item {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem 1rem;
		padding: 1rem 1.15rem;
		background: #fff;
		border-radius: 0.85rem;
		border: 1px solid rgba(24, 52, 83, 0.08);
	}

	.recent-item-main {
		min-width: 0;
		flex: 1;
	}

	.recent-item-confirm {
		margin: 0 0 0.35rem;
		font-size: 0.88rem;
		color: var(--pd-muted, #5c6b7a);
	}

	.recent-item-confirm strong {
		color: var(--pd-navy, #183453);
		font-weight: 600;
	}

	.recent-item-dates {
		margin: 0;
		font-size: 0.9rem;
		color: var(--pd-navy, #183453);
	}

	.recent-item-paid {
		flex-shrink: 0;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.35rem 0.55rem;
		border-radius: 0.35rem;
	}

	.recent-item-paid--yes {
		background: rgba(46, 125, 80, 0.12);
		color: #1b5e20;
	}

	.recent-item-paid--no {
		background: rgba(197, 165, 111, 0.18);
		color: #7a5c20;
	}

	.profile-section-kicker {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--pd-muted, #5c6b7a);
		margin: 0 0 0.5rem;
	}

	.profile-card {
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.75);
		border-radius: 0.85rem;
		border: 1px solid rgba(24, 52, 83, 0.08);
	}

	.profile-card-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.profile-ph-title {
		font-family: var(--pd-serif, Georgia, serif);
		font-size: 1.1rem;
		margin: 0;
		color: var(--pd-navy, #183453);
	}

	.profile-badge {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.3rem 0.55rem;
		border-radius: 999px;
	}

	.profile-badge--ok {
		background: rgba(16, 185, 129, 0.15);
		color: #047857;
		border: 1px solid rgba(16, 185, 129, 0.35);
	}

	.profile-badge--warn {
		background: rgba(245, 158, 11, 0.12);
		color: #b45309;
		border: 1px solid rgba(245, 158, 11, 0.35);
	}

	.profile-ph-text {
		font-size: 0.88rem;
		color: var(--pd-muted, #5c6b7a);
		margin: 0 0 1.25rem;
		line-height: 1.5;
		max-width: 62ch;
	}

	.profile-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 420px;
	}

	.profile-name-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	@media (max-width: 480px) {
		.profile-name-row {
			grid-template-columns: 1fr;
		}
	}

	.profile-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.profile-label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--pd-navy, #183453);
	}

	.profile-input {
		padding: 0.65rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(24, 52, 83, 0.15);
		font-size: 0.95rem;
	}

	.profile-input:disabled {
		background: rgba(24, 52, 83, 0.06);
		color: var(--pd-muted, #5c6b7a);
	}

	.profile-save {
		align-self: flex-start;
		padding: 0.6rem 1.25rem;
		border-radius: 0.5rem;
		border: none;
		background: var(--pd-navy, #183453);
		color: #fff;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.profile-save:hover {
		filter: brightness(1.06);
	}

	.profile-saved-msg {
		font-size: 0.85rem;
		color: #047857;
		margin: 0;
	}

	.profile-err {
		font-size: 0.85rem;
		color: var(--color-error, #b91c1c);
		margin: 0;
	}

	.profile-contact-block {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.profile-contact-block :global(.label) {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--pd-navy, #183453);
	}

	.profile-contact-block :global(.input) {
		padding: 0.65rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(24, 52, 83, 0.15);
		font-size: 0.95rem;
	}

	.profile-contact-block :global(.hint) {
		font-size: 0.78rem;
		color: var(--pd-muted, #5c6b7a);
	}
</style>
