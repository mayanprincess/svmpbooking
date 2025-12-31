<script lang="ts">
	let mobileMenuOpen = $state(false);
	let languageMenuOpen = $state(false);
	let currentLanguage = $state('EN');

	const languages = [
		{ code: 'EN', name: 'English' },
		{ code: 'ES', name: 'Español' },
		{ code: 'FR', name: 'Français' },
		{ code: 'DE', name: 'Deutsch' }
	];

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
		if (mobileMenuOpen) {
			languageMenuOpen = false;
		}
	}

	function toggleLanguageMenu() {
		languageMenuOpen = !languageMenuOpen;
	}

	function selectLanguage(code: string) {
		currentLanguage = code;
		languageMenuOpen = false;
		mobileMenuOpen = false;
	}

	// Close menus when clicking outside
	$effect(() => {
		if (!mobileMenuOpen && !languageMenuOpen) return;

		function handleClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if (!target.closest('.header-container')) {
				mobileMenuOpen = false;
				languageMenuOpen = false;
			}
		}

		function handleEscape(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				mobileMenuOpen = false;
				languageMenuOpen = false;
			}
		}

		document.addEventListener('click', handleClick);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('click', handleClick);
			document.removeEventListener('keydown', handleEscape);
		};
	});
</script>

<header class="header">
	<div class="header-container">
		<div class="header-content">
			<!-- Logo -->
			<a href="/" class="logo">
				<img src="/logomayan.png" alt="Logo" class="logo-img" />
				<span class="logo-text">Mayan Princess Booking</span>
			</a>

			<!-- Right Side: Language & Mobile Menu -->
			<div class="header-actions">
				<!-- Language Selector -->
				<div class="language-selector">
					<button
						class="language-button"
						onclick={toggleLanguageMenu}
						aria-label="Select language"
						aria-expanded={languageMenuOpen}
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
						>
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="2" y1="12" x2="22" y2="12"></line>
							<path
								d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
							></path>
						</svg>
						<span class="language-code">{currentLanguage}</span>
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							class="chevron"
							class:open={languageMenuOpen}
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
						<div class="language-dropdown">
							{#each languages as lang}
								<button
									class="language-option"
									class:active={currentLanguage === lang.code}
									onclick={() => selectLanguage(lang.code)}
								>
									<span class="lang-code">{lang.code}</span>
									<span class="lang-name">{lang.name}</span>
									{#if currentLanguage === lang.code}
										<svg
											width="16"
											height="16"
											viewBox="0 0 16 16"
											fill="none"
											class="check-icon"
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

				<!-- Menu Button (Always Visible) -->
				<button
					class="menu-button"
					onclick={toggleMobileMenu}
					aria-label="Toggle menu"
					aria-expanded={mobileMenuOpen}
				>
					<span class="hamburger" class:open={mobileMenuOpen}></span>
				</button>
			</div>
		</div>

		<!-- Navigation Menu -->
		{#if mobileMenuOpen}
			<nav class="nav-menu">
				<a href="/" class="nav-link active">Book</a>
				<a href="/rooms" class="nav-link">Rooms</a>
				<a href="/offers" class="nav-link">Offers</a>
				<a href="/contact" class="nav-link">Contact</a>
			</nav>
		{/if}
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

	/* Logo */
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
		cursor: pointer;
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

	/* Header Actions */
	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	/* Language Selector */
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
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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

	.language-option:hover {
		background: rgba(197, 165, 111, 0.08);
	}

	.language-option.active {
		background: rgba(197, 165, 111, 0.12);
	}

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

	.check-icon {
		margin-left: auto;
	}

	/* Menu Button (Always Visible) */
	.menu-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: all 0.2s;
		border-radius: 8px;
	}

	.menu-button:hover {
		background: rgba(24, 52, 83, 0.05);
	}

	.hamburger {
		position: relative;
		width: 24px;
		height: 2px;
		background: var(--color-primary);
		transition: all 0.3s;
		border-radius: 2px;
	}

	.hamburger::before,
	.hamburger::after {
		content: '';
		position: absolute;
		width: 24px;
		height: 2px;
		background: var(--color-primary);
		border-radius: 2px;
		transition: all 0.3s;
	}

	.hamburger::before {
		top: -7px;
	}

	.hamburger::after {
		bottom: -7px;
	}

	.hamburger.open {
		background: transparent;
	}

	.hamburger.open::before {
		top: 0;
		transform: rotate(45deg);
	}

	.hamburger.open::after {
		bottom: 0;
		transform: rotate(-45deg);
	}

	/* Navigation Menu */
	.nav-menu {
		display: flex;
		flex-direction: column;
		border-top: 1px solid rgba(24, 52, 83, 0.08);
		padding: 1rem 0;
		animation: slideDown 0.2s ease;
		background: white;
	}

	.nav-link {
		padding: 0.875rem 1rem;
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 500;
		font-size: 1rem;
		transition: all 0.2s;
		border-left: 3px solid transparent;
	}

	.nav-link:hover {
		background: rgba(24, 52, 83, 0.05);
	}

	.nav-link.active {
		color: var(--color-secondary);
		border-left-color: var(--color-secondary);
		background: rgba(197, 165, 111, 0.05);
	}

	/* Tablet & Desktop */
	@media (min-width: 768px) {
		.logo-img {
			height: 48px;
		}

		.logo-text {
			font-size: 1.125rem;
		}
	}

	@media (min-width: 1024px) {
		.header-content {
			height: 80px;
		}

		.logo {
			font-size: 1.25rem;
		}

		.logo-img {
			height: 52px;
		}

		.logo-text {
			font-size: 1.25rem;
		}
	}
</style>

