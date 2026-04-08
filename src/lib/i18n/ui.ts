import type { Locale } from './locale';

/** UI copy — extend keys as you translate more screens */
const copy = {
	en: {
		headerLogoAlt: 'Mayan Princess Booking',
		langSelect: 'Select language',
		/** Name of English in current UI language */
		langNameEn: 'English',
		/** Name of Spanish in current UI language */
		langNameEs: 'Español',
		stepSearch: 'Search',
		stepSelect: 'Select',
		stepDetails: 'Details',
		stepPayment: 'Payment',
		searchTitle: 'Find Your Perfect Villa',
		searchSubtitle: 'Select your dates and number of guests to see available rooms',
		searchButton: 'Search Rooms',
		searching: 'Searching...',
		night: 'night',
		nights: 'nights',
		fillRequired: 'Please fill in all required fields',
		noRooms: 'No rooms available for your dates. Please try different dates.',
		searchError: 'An error occurred',
		modifySearch: 'Modify Search',
		adult: 'Adult',
		adults: 'Adults',
		child: 'Child',
		children: 'Children',
		paymentFailedTitle: 'Payment could not be processed',
		dismissError: 'Dismiss error',
		reservationSummary: 'Reservation Summary',
		edit: 'Edit',
		labelRoom: 'Room',
		labelDates: 'Dates',
		labelGuest: 'Guest',
		labelGuests: 'Guests',
		labelTotal: 'Total',
		securePayment: 'Secure payment powered by CyberSource',
		nativeDateHint:
			'Tap a date field to open your device calendar. Check-out must be after check-in.'
	},
	es: {
		headerLogoAlt: 'Reservas Mayan Princess',
		langSelect: 'Seleccionar idioma',
		langNameEn: 'Inglés',
		langNameEs: 'Español',
		stepSearch: 'Buscar',
		stepSelect: 'Elegir',
		stepDetails: 'Datos',
		stepPayment: 'Pago',
		searchTitle: 'Encuentra tu villa ideal',
		searchSubtitle: 'Elige fechas y huéspedes para ver disponibilidad',
		searchButton: 'Buscar villas',
		searching: 'Buscando...',
		night: 'noche',
		nights: 'noches',
		fillRequired: 'Completa todos los campos obligatorios',
		noRooms: 'No hay habitaciones para esas fechas. Prueba otras fechas.',
		searchError: 'Ocurrió un error',
		modifySearch: 'Modificar búsqueda',
		adult: 'Adulto',
		adults: 'Adultos',
		child: 'Niño',
		children: 'Niños',
		paymentFailedTitle: 'No se pudo procesar el pago',
		dismissError: 'Cerrar mensaje',
		reservationSummary: 'Resumen de la reserva',
		edit: 'Editar',
		labelRoom: 'Habitación',
		labelDates: 'Fechas',
		labelGuest: 'Huésped',
		labelGuests: 'Huéspedes',
		labelTotal: 'Total',
		securePayment: 'Pago seguro con CyberSource',
		nativeDateHint:
			'Toca un campo para abrir el calendario del dispositivo. La salida debe ser después del ingreso.'
	}
} as const;

export type UiKey = keyof typeof copy.en;

export function t(lang: Locale, key: UiKey): string {
	return copy[lang][key] ?? copy.en[key];
}

export function villasAvailablePhrase(lang: Locale, count: number): string {
	if (lang === 'es') {
		return count === 1 ? '1 Opción disponible' : `${count} Opciones disponibles`;
	}
	return count === 1 ? '1 Option Available' : `${count} Options Available`;
}
