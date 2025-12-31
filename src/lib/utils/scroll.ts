/**
 * Scroll Utilities
 * Centralized scroll functions
 */

export function scrollToElement(elementId: string, delay: number = 150): void {
	setTimeout(() => {
		const element = document.getElementById(elementId);
		if (element) {
			// Get the element's position relative to the document
			const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
			// Subtract a bit of offset for better visibility (e.g., header height)
			const offsetPosition = elementPosition - 100;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	}, delay);
}

export function scrollToTop(delay: number = 150): void {
	setTimeout(() => {
		// Scroll to absolute top of the page
		window.scrollTo({ 
			top: 0, 
			left: 0,
			behavior: 'smooth' 
		});
		
		// Also scroll the document element to ensure we're at the very top
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0; // For Safari
	}, delay);
}

export function scrollToTopInstant(): void {
	// Instant scroll to top (no animation)
	window.scrollTo(0, 0);
	document.documentElement.scrollTop = 0;
	document.body.scrollTop = 0;
}

export function scrollToFirstError(): void {
	setTimeout(() => {
		const firstError = document.querySelector('.error, .input-error, [class*="error"]');
		if (firstError) {
			firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, 100);
}

