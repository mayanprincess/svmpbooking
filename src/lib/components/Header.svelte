<script lang="ts">
	import { onMount } from 'svelte';
	import { locale, setLocale, t, type Locale } from '$lib/i18n';
	import { authStore } from '$lib/stores/auth.svelte';

	let languageMenuOpen = $state(false);

	onMount(() => authStore.init());

	const languages: { code: Locale; labelKey: 'langNameEn' | 'langNameEs' }[] = [
		{ code: 'en', labelKey: 'langNameEn' },
		{ code: 'es', labelKey: 'langNameEs' }
	];

	function toggleLanguageMenu() {
		languageMenuOpen = !languageMenuOpen;
	}

	function selectLanguage(code: Locale) {
		setLocale(code);
		languageMenuOpen = false;
	}

	$effect(() => {
		if (!languageMenuOpen) return;

		function handleClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (!target.closest('.header-container')) {
				languageMenuOpen = false;
			}
		}

		function handleEscape(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				languageMenuOpen = false;
			}
		}

		/* Defer so the same click that opens the menu does not hit document and close it */
		const id = window.setTimeout(() => {
			document.addEventListener('click', handleClick);
			document.addEventListener('keydown', handleEscape);
		}, 0);

		return () => {
			clearTimeout(id);
			document.removeEventListener('click', handleClick);
			document.removeEventListener('keydown', handleEscape);
		};
	});
</script>

<header class="header">
	<div class="header-container">
		<div class="header-content">
			<a href="/" class="logo">
				<img src="/logomayan.png" alt={t($locale, 'headerLogoAlt')} class="logo-img" />
				<span class="logo-text">Mayan Princess Booking</span>
			</a>

			<div class="header-actions">
				<!-- User portal link -->
				{#if authStore.isAuthenticated}
					<a href="/portal" class="portal-link">
						<span class="portal-avatar">
							{authStore.user?.first_name?.charAt(0).toUpperCase()}{authStore.user?.last_name?.charAt(0).toUpperCase()}
						</span>
						<span class="portal-label">{t($locale, 'portalAccount')}</span>
					</a>
				{:else}
					<a href="/auth/register" class="portal-link register">{t($locale, 'portalRegister')}</a>
					<a href="/auth/login" class="portal-link login">{t($locale, 'portalLogin')}</a>
				{/if}

				<!-- Language Selector -->
				<div class="language-selector">
					<button
						type="button"
						class="language-button"
						onclick={toggleLanguageMenu}
						aria-label={t($locale, 'langSelect')}
						aria-expanded={languageMenuOpen}
						aria-haspopup="listbox"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="2" y1="12" x2="22" y2="12"></line>
							<path
								d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
							></path>
						</svg>
						<span class="language-code">{$locale === 'es' ? 'ES' : 'EN'}</span>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							class="chevron"
							class:open={languageMenuOpen}
							aria-hidden="true"
						>
							<path
								d="M2 4L6 8L10 4"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					{#if languageMenuOpen}
						<div class="language-dropdown" role="listbox">
							{#each languages as lang}
								<button
									type="button"
									class="language-option"
									class:active={$locale === lang.code}
									onclick={() => selectLanguage(lang.code)}
									role="option"
									aria-selected={$locale === lang.code}
								>
									<span class="lang-code">{lang.code === 'es' ? 'ES' : 'EN'}</span>
									<span class="lang-name">{t($locale, lang.labelKey)}</span>
									{#if $locale === lang.code}
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill="none"
											class="check-icon"
											aria-hidden="true"
										>
											<path
												d="M3 8L6.5 11.5L13 5"
												stroke="var(--color-secondary)"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</header>

<style>
	.header {
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		position: sticky;
		top: 0;
		z-index: 1000;
		border-bottom: 1px solid rgba(24, 52, 83, 0.08);
	}

	.header-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 72px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: var(--color-primary);
		font-weight: 600;
		font-size: 1.125rem;
		letter-spacing: -0.02em;
		transition: opacity 0.2s;
	}

	.logo:hover {
		opacity: 0.8;
	}

	.logo-img {
		height: 32px;
		width: auto;
		flex-shrink: 0;
	}

	.logo-text {
		font-size: 0.9375rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	/* ── Portal link ── */
	.portal-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.4rem 0.875rem;
		border-radius: 6px;
		border: 1px solid rgba(24, 52, 83, 0.2);
		transition: all 0.2s;
	}

	.portal-link:hover {
		border-color: var(--color-secondary);
		color: var(--color-secondary);
		background: rgba(197, 165, 111, 0.06);
	}

	.portal-link.login {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.portal-link.login:hover {
		background: #1a3d5d;
		border-color: #1a3d5d;
		color: white;
	}

	.portal-link.register {
		background: transparent;
		color: var(--color-primary);
		border-color: rgba(24, 52, 83, 0.25);
	}

	.portal-link.register:hover {
		border-color: var(--color-secondary);
		color: var(--color-secondary);
		background: rgba(197, 165, 111, 0.08);
	}

	.portal-avatar {
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background: var(--color-secondary);
		color: white;
		font-size: 0.62rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.portal-label {
		font-size: 0.82rem;
	}

	/* ── Language Selector ── */
	.language-selector {
		position: relative;
	}

	.language-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		background: white;
		border: 1px solid rgba(24, 52, 83, 0.15);
		border-radius: 8px;
		color: var(--color-primary);
		font-weight: 500;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.language-button:hover {
		border-color: var(--color-secondary);
		background: rgba(197, 165, 111, 0.05);
	}

	.language-code {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.chevron {
		transition: transform 0.2s;
		color: var(--color-primary);
		opacity: 0.5;
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.language-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: white;
		border: 1px solid rgba(24, 52, 83, 0.1);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		min-width: 200px;
		padding: 0.5rem;
		animation: slideDown 0.2s ease;
		z-index: 100;
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-8px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.language-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.language-option:hover  { background: rgba(197, 165, 111, 0.08); }
	.language-option.active { background: rgba(197, 165, 111, 0.12); }

	.lang-code {
		font-weight: 600;
		color: var(--color-primary);
		font-size: 0.875rem;
		min-width: 28px;
	}

	.lang-name {
		color: var(--color-primary);
		font-size: 0.9375rem;
		flex: 1;
		opacity: 0.8;
	}

	.check-icon { margin-left: auto; }

	@media (min-width: 768px) {
		.logo-img  { height: 48px; }
		.logo-text { font-size: 1.125rem; }
	}

	@media (min-width: 1024px) {
		.header-content { height: 80px; }
		.logo           { font-size: 1.25rem; }
		.logo-img       { height: 52px; }
		.logo-text      { font-size: 1.25rem; }
	}
</style>
