/**
 * Analytics Service
 * Track booking funnel events for optimization
 */

import { browser } from '$app/environment';

// Event types for the booking funnel
export type AnalyticsEvent =
	| 'search_initiated'
	| 'search_completed'
	| 'room_viewed'
	| 'room_selected'
	| 'guest_details_started'
	| 'guest_details_completed'
	| 'payment_started'
	| 'payment_completed'
	| 'booking_confirmed'
	| 'booking_error'
	| 'step_back'
	| 'form_abandoned';

export interface AnalyticsEventData {
	event: AnalyticsEvent;
	timestamp: string;
	sessionId: string;
	data?: Record<string, any>;
}

class AnalyticsService {
	private sessionId: string;
	private events: AnalyticsEventData[] = [];

	constructor() {
		// Generate session ID (persists in sessionStorage)
		if (browser) {
			this.sessionId = this.getOrCreateSessionId();
		} else {
			this.sessionId = '';
		}
	}

	/**
	 * Get or create session ID
	 */
	private getOrCreateSessionId(): string {
		const stored = sessionStorage.getItem('booking_session_id');
		if (stored) return stored;

		const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		sessionStorage.setItem('booking_session_id', newId);
		return newId;
	}

	/**
	 * Track an event
	 */
	track(event: AnalyticsEvent, data?: Record<string, any>): void {
		if (!browser) return;

		const eventData: AnalyticsEventData = {
			event,
			timestamp: new Date().toISOString(),
			sessionId: this.sessionId,
			data
		};

		// Store in memory
		this.events.push(eventData);

		// Log to console in development
		if (import.meta.env.DEV) {
			console.log('📊 Analytics Event:', eventData);
		}

		// Send to various analytics platforms
		this.sendToGoogleAnalytics(eventData);
		this.sendToMetaPixel(eventData);
		this.sendToCustomBackend(eventData);

		// Store in localStorage for debugging
		this.storeEventLocally(eventData);
	}

	/**
	 * Send to Google Analytics (GA4)
	 */
	private sendToGoogleAnalytics(event: AnalyticsEventData): void {
		if (typeof window === 'undefined') return;

		// Check if gtag is available
		if (typeof (window as any).gtag === 'function') {
			(window as any).gtag('event', event.event, {
				event_category: 'booking_funnel',
				event_label: event.sessionId,
				...event.data
			});

			console.log('✅ Sent to Google Analytics:', event.event);
		} else {
			console.log('⚠️ Google Analytics not configured');
		}
	}

	/**
	 * Send to Meta Pixel (Facebook)
	 */
	private sendToMetaPixel(event: AnalyticsEventData): void {
		if (typeof window === 'undefined') return;

		// Check if fbq is available
		if (typeof (window as any).fbq === 'function') {
			const pixelEvent = this.mapToMetaPixelEvent(event.event);
			if (pixelEvent) {
				(window as any).fbq('track', pixelEvent, event.data);
				console.log('✅ Sent to Meta Pixel:', pixelEvent);
			}
		} else {
			console.log('⚠️ Meta Pixel not configured');
		}
	}

	/**
	 * Map our events to Meta Pixel standard events
	 */
	private mapToMetaPixelEvent(event: AnalyticsEvent): string | null {
		const mapping: Record<string, string> = {
			search_initiated: 'Search',
			search_completed: 'ViewContent',
			room_viewed: 'ViewContent',
			room_selected: 'AddToCart',
			guest_details_started: 'InitiateCheckout',
			payment_started: 'AddPaymentInfo',
			booking_confirmed: 'Purchase'
		};

		return mapping[event] || null;
	}

	/**
	 * Send to custom backend for storage and analysis
	 */
	private async sendToCustomBackend(event: AnalyticsEventData): Promise<void> {
		try {
			// Only send certain events to backend to reduce load
			const importantEvents: AnalyticsEvent[] = [
				'search_completed',
				'room_selected',
				'guest_details_completed',
				'payment_started',
				'booking_confirmed',
				'booking_error'
			];

			if (!importantEvents.includes(event.event)) {
				return;
			}

			// Send async without waiting
			fetch('/api/analytics', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(event)
			}).catch((err) => console.error('Analytics backend error:', err));

			console.log('✅ Sent to backend:', event.event);
		} catch (error) {
			console.error('Failed to send to backend:', error);
		}
	}

	/**
	 * Store event locally for debugging
	 */
	private storeEventLocally(event: AnalyticsEventData): void {
		try {
			const stored = localStorage.getItem('analytics_events');
			const events = stored ? JSON.parse(stored) : [];
			events.push(event);

			// Keep only last 50 events
			if (events.length > 50) {
				events.shift();
			}

			localStorage.setItem('analytics_events', JSON.stringify(events));
		} catch (error) {
			console.error('Failed to store event locally:', error);
		}
	}

	/**
	 * Get all events for current session
	 */
	getSessionEvents(): AnalyticsEventData[] {
		return this.events.filter((e) => e.sessionId === this.sessionId);
	}

	/**
	 * Get all stored events (for debugging)
	 */
	getAllStoredEvents(): AnalyticsEventData[] {
		if (!browser) return [];

		try {
			const stored = localStorage.getItem('analytics_events');
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	/**
	 * Clear all stored events
	 */
	clearStoredEvents(): void {
		if (browser) {
			localStorage.removeItem('analytics_events');
			this.events = [];
		}
	}

	/**
	 * Get funnel conversion data
	 */
	getFunnelStats(): {
		searchInitiated: number;
		searchCompleted: number;
		roomsViewed: number;
		roomsSelected: number;
		guestDetailsStarted: number;
		guestDetailsCompleted: number;
		paymentStarted: number;
		bookingsCompleted: number;
		conversionRate: number;
	} {
		const events = this.getAllStoredEvents();

		const stats = {
			searchInitiated: events.filter((e) => e.event === 'search_initiated').length,
			searchCompleted: events.filter((e) => e.event === 'search_completed').length,
			roomsViewed: events.filter((e) => e.event === 'room_viewed').length,
			roomsSelected: events.filter((e) => e.event === 'room_selected').length,
			guestDetailsStarted: events.filter((e) => e.event === 'guest_details_started').length,
			guestDetailsCompleted: events.filter((e) => e.event === 'guest_details_completed').length,
			paymentStarted: events.filter((e) => e.event === 'payment_started').length,
			bookingsCompleted: events.filter((e) => e.event === 'booking_confirmed').length,
			conversionRate: 0
		};

		// Calculate conversion rate (completed bookings / search initiated)
		if (stats.searchInitiated > 0) {
			stats.conversionRate = (stats.bookingsCompleted / stats.searchInitiated) * 100;
		}

		return stats;
	}
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Convenience functions
export const trackEvent = (event: AnalyticsEvent, data?: Record<string, any>) =>
	analytics.track(event, data);

export const getFunnelStats = () => analytics.getFunnelStats();

export const getSessionEvents = () => analytics.getSessionEvents();
