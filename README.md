# Mayan Princess Booking Engine

A modern, elegant booking engine built with SvelteKit for hotel reservations integrated with OPERA Cloud PMS.

## Features

- 🏨 **Real-time Availability** - Direct integration with OPERA Cloud PMS
- 📅 **Date Range Selection** - Intuitive calendar interface
- 👥 **Guest Management** - Adults and children counting with limits
- 🎟️ **Promo Code Support** - Apply promotional codes
- 💅 **Elegant Design** - Modern UI with brand colors
- 📱 **Responsive** - Works on all devices
- 🔒 **Secure** - Server-side API calls with OAuth2 authentication
- 🌐 **Multi-language Ready** - English and Spanish support

## Tech Stack

- **Framework**: SvelteKit 2.x (Svelte 5)
- **Language**: TypeScript
- **Styling**: Custom CSS with CSS Variables
- **API**: OPERA Cloud REST API
- **Authentication**: OAuth2 Client Credentials Flow

## Project Structure

```
src/
├── lib/
│   ├── config/
│   │   └── opera.ts                 # OPERA PMS configuration
│   ├── services/
│   │   ├── opera-client.ts          # OPERA API client with OAuth2
│   │   └── availability-service.ts  # Enrichment service
│   ├── types/
│   │   └── opera.ts                 # TypeScript types
│   └── components/
│       ├── BookingForm.svelte       # Main booking form
│       ├── DateRangeSelector.svelte # Date picker
│       ├── GuestSelector.svelte     # Guest counter
│       ├── PromoCodeInput.svelte    # Promo code input
│       └── RoomCard.svelte          # Room display card
├── routes/
│   ├── api/
│   │   ├── availability/
│   │   │   └── +server.ts           # Availability API endpoint
│   │   └── reservation/
│   │       └── +server.ts           # Reservation API endpoint
│   ├── +layout.svelte               # Layout wrapper
│   └── +page.svelte                 # Home page
└── app.css                          # Global styles

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with your OPERA Cloud credentials:

```env
# OPERA PMS Configuration
OPERA_APP_KEY=your_app_key_here
OPERA_CLIENT_ID=your_client_id_here
OPERA_CLIENT_SECRET=your_client_secret_here
OPERA_ENTERPRISE_ID=your_enterprise_id_here
OPERA_GATEWAY_URL=https://your-opera-gateway.com
OPERA_HOTEL_ID=your_hotel_id_here
OPERA_SCOPE=your_scope_here
OPERA_TIMEOUT=15000
OPERA_CONNECT_TIMEOUT=5000
OPERA_DEFAULT_RATE_PLAN_CODE=AIF-2025

# Queue Configuration
QUEUE_CONNECTION=sync
```

### 3. Configuration

The booking engine uses a centralized configuration in `src/lib/config/opera.ts`. This file contains:

- Room type mappings (OPERA codes to descriptions)
- Rate plan mappings (OPERA codes to package info)
- Package types (Premium, Family, Basic, Promo)
- Amenities labels (multi-language)
- View types (Ocean, Garden, Pool)

**To customize for another brand:**
1. Update the room types and rate plans in `opera.ts`
2. Change the brand colors in `src/app.css` (CSS variables)
3. Update the logo/branding in `src/routes/+page.svelte`

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## API Endpoints

### GET /api/availability

Check room availability for given dates.

**Query Parameters:**
- `checkIn` (required) - YYYY-MM-DD format
- `checkOut` (required) - YYYY-MM-DD format
- `adults` (required) - Number of adults (1-12)
- `children` (optional) - Number of children (0-8)
- `ratePlanCode` (optional) - Filter by specific rate plan
- `promoCode` (optional) - Apply promotional code
- `lang` (optional) - Language code (en/es), defaults to 'en'

**Example:**
```
GET /api/availability?checkIn=2025-01-15&checkOut=2025-01-18&adults=2&children=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-18",
    "adults": 2,
    "children": 0,
    "rooms": [
      {
        "roomTypeCode": "1BBFG",
        "roomTypeName": {
          "en": "One Bedroom Beach Front",
          "es": "Una Recámara Frente al Mar"
        },
        "bedrooms": 1,
        "maxAdults": 4,
        "maxChildren": 4,
        "beds": ["1 KING"],
        "location": "Mayan",
        "view": "ocean",
        "rates": [
          {
            "ratePlanCode": "AIF-2025",
            "ratePlanName": {
              "en": "All Inclusive Family 2025",
              "es": "Todo Incluido Familiar 2025"
            },
            "package": "family",
            "amountAfterTax": 1500.00,
            "currencyCode": "USD",
            "includes": ["meals", "drinks", "kids_club", "activities"]
          }
        ]
      }
    ],
    "totalRooms": 1
  }
}
```

### POST /api/reservation

Create a new reservation.

**Request Body:**
```json
{
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-18",
  "roomTypeCode": "1BBFG",
  "ratePlanCode": "AIF-2025",
  "adults": 2,
  "children": 0,
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "specialRequests": "Late check-in",
  "promoCode": "SUMMER2025"
}
```

## Design System

### Colors

The design uses three main brand colors that can be customized:

```css
:root {
  --color-primary: #183453;    /* Navy blue - headings, buttons */
  --color-secondary: #c5a56f;  /* Gold - accents, highlights */
  --color-tertiary: #d6a34b;   /* Amber - hover states */
}
```

### Components

All components follow these principles:
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Responsiveness**: Mobile-first design
- **Consistency**: Unified spacing, colors, and typography
- **Performance**: Minimal re-renders, efficient state management

## Customization for Other Brands

This booking engine is designed to be brand-agnostic. To customize:

### 1. Update Colors
Edit `src/app.css`:
```css
:root {
  --color-primary: #your-color;
  --color-secondary: #your-color;
  --color-tertiary: #your-color;
}
```

### 2. Update Room Types
Edit `src/lib/config/opera.ts` - `roomTypes` object

### 3. Update Rate Plans
Edit `src/lib/config/opera.ts` - `ratePlans` object

### 4. Update Branding
Edit `src/routes/+page.svelte` - hero section

### 5. Update Logo
Replace or modify the logo section in the hero

## OPERA Cloud Integration

### Authentication Flow

1. Client credentials are stored securely in environment variables
2. OAuth2 token is requested on-demand with client credentials flow
3. Token is cached in memory with automatic refresh
4. All API calls use Bearer token authentication

### Security Best Practices

✅ **Implemented:**
- Environment variables for sensitive data
- Server-side API calls only (no client-side OPERA calls)
- OAuth2 token caching to minimize auth requests
- Input validation on all API endpoints
- Error handling without exposing internal details

⚠️ **Recommended for Production:**
- Use a proper secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Implement rate limiting on API endpoints
- Add request logging and monitoring
- Use Redis for token caching in multi-instance deployments
- Add CSRF protection
- Implement user session management
- Add reservation payment processing

## Development

### Type Checking
```bash
npm run check
```

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Testing

The API can be tested using tools like:
- **Postman** - Import the endpoints
- **curl** - Command line testing
- **Browser DevTools** - Check network requests

Example curl:
```bash
curl "http://localhost:5173/api/availability?checkIn=2025-01-15&checkOut=2025-01-18&adults=2&children=0"
```

## Deployment

This SvelteKit app can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **Node.js server** (using adapter-node)
- **Static hosting** (using adapter-static, without server routes)

For OPERA integration, you'll need a deployment that supports server-side rendering (SSR) or API routes.

## Troubleshooting

### OPERA API Errors

If you get 401/403 errors:
1. Verify your credentials in `.env`
2. Check your OPERA Cloud app permissions
3. Ensure the scope matches your granted permissions
4. Check the gateway URL is correct

### No Rooms Available

If no rooms appear:
1. Check the date range is valid
2. Verify room types exist in OPERA
3. Check rate plans are active
4. Look at browser console for API errors
5. Verify `opera.ts` config matches OPERA codes

### TypeScript Errors

Run type checking:
```bash
npm run check
```

## License

© 2025 Mayan Princess Beach & Dive Resort. All rights reserved.

## Support

For questions or issues, please contact the development team.
