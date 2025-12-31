/**
 * OPERA Static Configuration (Public)
 * This file contains only static configuration data (no secrets).
 * Safe to import in client-side code.
 */

export const operaStaticConfig = {
	// Default values (non-sensitive)
	defaultRatePlanCode: 'AIF-2025',

	// Room Type Mapping (OPERA code => room details)
	roomTypes: {
		// === MAYAN - 1 BEDROOM ===
		'1BBFG': {
			nameEn: 'One Bedroom Beach Front',
			nameEs: 'Una Recámara Frente al Mar',
			bedrooms: 1,
			maxAdults: 4,
			maxChildren: 4,
			beds: ['1 KING'],
			location: 'Mayan',
			view: 'ocean',
			sortOrder: 10
		},
		'1BBFS': {
			nameEn: 'One Bedroom Beach Front + Sofa Bed',
			nameEs: 'Una Recámara Frente al Mar + Sofá Cama',
			bedrooms: 1,
			maxAdults: 4,
			maxChildren: 4,
			beds: ['1 KING', '1 SOFA'],
			location: 'Mayan',
			view: 'ocean',
			sortOrder: 11
		},
		'1BGS': {
			nameEn: 'One Bedroom Tropical Garden + Sofa Bed',
			nameEs: 'Una Recámara Jardín Tropical + Sofá Cama',
			bedrooms: 1,
			maxAdults: 4,
			maxChildren: 4,
			beds: ['1 KING', '1 SOFA'],
			location: 'Mayan',
			view: 'garden',
			sortOrder: 20
		},
		'1BPTG': {
			nameEn: 'One Bedroom Tower Villa',
			nameEs: 'Una Recámara Tower Villa',
			bedrooms: 1,
			maxAdults: 4,
			maxChildren: 4,
			beds: ['1 KING'],
			location: 'Mayan',
			view: 'garden',
			sortOrder: 30
		},
		'1BPG': {
			nameEn: 'One Bedroom Tower Villa + Sofa Bed',
			nameEs: 'Una Recámara Tower Villa + Sofá Cama',
			bedrooms: 1,
			maxAdults: 4,
			maxChildren: 4,
			beds: ['1 KING', '1 SOFA'],
			location: 'Mayan',
			view: 'garden',
			sortOrder: 31
		},
		'1BT': {
			nameEn: 'One Bedroom Tropical Garden',
			nameEs: 'Una Recámara Jardín Tropical',
			bedrooms: 1,
			maxAdults: 4,
			maxChildren: 4,
			beds: ['1 QUEEN'],
			location: 'Mayan',
			view: 'garden',
			sortOrder: 21
		},

		// === MAYAN - 2 BEDROOM ===
		'2BMS': {
			nameEn: 'Two Bedroom Master Suite',
			nameEs: 'Dos Recámaras Master Suite',
			bedrooms: 2,
			maxAdults: 6,
			maxChildren: 4,
			beds: ['1 KING', '1 QUEEN', '1 SOFA'],
			location: 'Mayan',
			view: 'ocean',
			sortOrder: 40
		},
		'2BMSS': {
			nameEn: 'Two Bedroom Master Suite Superior',
			nameEs: 'Dos Recámaras Master Suite Superior',
			bedrooms: 2,
			maxAdults: 6,
			maxChildren: 4,
			beds: ['1 KING', '1 QUEEN', '1 SOFA'],
			location: 'Mayan',
			view: 'ocean',
			sortOrder: 41
		},
		'2BT': {
			nameEn: 'Two Bedroom Tropical Garden',
			nameEs: 'Dos Recámaras Jardín Tropical',
			bedrooms: 2,
			maxAdults: 4,
			maxChildren: 4,
			beds: ['2 QUEEN'],
			location: 'Mayan',
			view: 'garden',
			sortOrder: 50
		},
		'2BJS': {
			nameEn: 'Two Bedroom Junior Suite',
			nameEs: 'Dos Recámaras Junior Suite',
			bedrooms: 2,
			maxAdults: 6,
			maxChildren: 4,
			beds: ['1 KING', '1 QUEEN', '1 SOFA'],
			location: 'Mayan',
			view: 'ocean',
			sortOrder: 45
		}
	},

	// Rate Plan Mapping (OPERA code => package info)
	ratePlans: {
		ALLINCPREM: {
			package: 'premium',
			labelEn: 'All Inclusive Premium',
			labelEs: 'Todo Incluido Premium',
			includes: ['meals', 'drinks', 'activities', 'premium_spirits'],
			sortOrder: 1
		},
		FRACKMP2025: {
			package: 'promo',
			labelEn: 'Special Rate 2025',
			labelEs: 'Tarifa Especial 2025',
			includes: ['meals', 'drinks', 'activities'],
			sortOrder: 5
		},
		AIF: {
			package: 'family',
			labelEn: 'All Inclusive Family',
			labelEs: 'Todo Incluido Familiar',
			includes: ['meals', 'drinks', 'kids_club', 'activities'],
			sortOrder: 2
		},
		'AIF-2025': {
			package: 'family',
			labelEn: 'All Inclusive Family 2025',
			labelEs: 'Todo Incluido Familiar 2025',
			includes: ['meals', 'drinks', 'kids_club', 'activities'],
			sortOrder: 3
		},
		'AIP-2025': {
			package: 'premium',
			labelEn: 'All Inclusive Premium 2025',
			labelEs: 'Todo Incluido Premium 2025',
			includes: ['meals', 'drinks', 'kids_club', 'activities', 'premium_spirits'],
			sortOrder: 4
		},
		'BI-2025': {
			package: 'basic',
			labelEn: 'Breakfast Included 2025',
			labelEs: 'Desayuno Incluido 2025',
			includes: ['breakfast'],
			sortOrder: 10
		}
	},

	// Package Type Labels & Colors
	packageTypes: {
		premium: {
			labelEn: 'Premium',
			labelEs: 'Premium',
			color: '#b58e4b',
			bgClass: 'bg-premium'
		},
		family: {
			labelEn: 'Family',
			labelEs: 'Familiar',
			color: '#2babd9',
			bgClass: 'bg-family'
		},
		basic: {
			labelEn: 'Breakfast Only',
			labelEs: 'Solo Desayuno',
			color: '#2babd9',
			bgClass: 'bg-breakfast'
		},
		promo: {
			labelEn: 'Special',
			labelEs: 'Especial',
			color: '#9333ea',
			bgClass: 'bg-promo'
		}
	},

	// Included Amenities Labels
	amenities: {
		meals: { en: 'All Meals', es: 'Todas las Comidas' },
		drinks: { en: 'Unlimited Drinks', es: 'Bebidas Ilimitadas' },
		premium_spirits: { en: 'Premium Spirits', es: 'Licores Premium' },
		activities: { en: 'Daily Activities', es: 'Actividades Diarias' },
		kids_club: { en: 'Kids Club Access', es: 'Acceso a Club de Niños' },
		breakfast: { en: 'Daily Breakfast', es: 'Desayuno Diario' }
	},

	// View Labels
	views: {
		ocean: { en: 'Ocean View', es: 'Vista al Mar' },
		garden: { en: 'Garden View', es: 'Vista al Jardín' },
		pool: { en: 'Pool View', es: 'Vista a la Piscina' }
	}
} as const;

