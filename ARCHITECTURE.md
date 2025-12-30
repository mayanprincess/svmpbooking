# Architecture Documentation

## Overview

This booking engine is built with a modern, secure, and scalable architecture using SvelteKit and OPERA Cloud PMS integration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ BookingForm  │  │  RoomCard    │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Server)                      │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ /api/availability    │  │ /api/reservation     │        │
│  │ - Validation         │  │ - Validation         │        │
│  │ - Error handling     │  │ - Error handling     │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ OperaClient          │  │ AvailabilityService  │        │
│  │ - OAuth2 auth        │  │ - Data enrichment    │        │
│  │ - Token caching      │  │ - Formatting         │        │
│  │ - API calls          │  │ - Calculations       │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Configuration Layer                        │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ opera.ts             │  │ Environment Vars     │        │
│  │ - Room types         │  │ - Credentials        │        │
│  │ - Rate plans         │  │ - API endpoints      │        │
│  │ - Amenities          │  │ - Timeouts           │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OPERA Cloud PMS                           │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ OAuth2 Token         │  │ Availability API     │        │
│  │ Endpoint             │  │ Reservation API      │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Client Layer (Browser)

**Components:**
- `BookingForm.svelte` - Main search form with state management
- `DateRangeSelector.svelte` - Date picker with validation
- `GuestSelector.svelte` - Guest counter with dropdown
- `PromoCodeInput.svelte` - Promo code input with toggle
- `RoomCard.svelte` - Room display with rate selection

**Responsibilities:**
- User interface rendering
- Form state management
- Client-side validation
- User interactions
- API calls to server endpoints

**Security:**
- No direct OPERA API access
- No credentials in client code
- All sensitive operations server-side

### 2. API Layer (Server Routes)

**Endpoints:**

#### `/api/availability` (GET)
- Validates query parameters
- Calls OperaClient service
- Enriches response data
- Returns formatted JSON

#### `/api/reservation` (POST)
- Validates request body
- Validates guest information
- Calls OperaClient service
- Returns confirmation

**Responsibilities:**
- Request validation
- Error handling
- Response formatting
- Security headers
- Logging

### 3. Service Layer

#### OperaClient (`opera-client.ts`)

**Methods:**
- `getAccessToken()` - OAuth2 token management with caching
- `authorizedRequest()` - Authenticated HTTP requests
- `checkAvailability()` - Availability queries
- `createReservation()` - Reservation creation

**Features:**
- Token caching (50-minute TTL)
- Automatic token refresh
- Error handling
- Request/response logging

#### AvailabilityService (`availability-service.ts`)

**Methods:**
- `enrichAvailability()` - Merges OPERA data with local config
- `calculateNights()` - Date calculations
- `formatCurrency()` - Currency formatting

**Features:**
- Data transformation
- Multi-language support
- Sorting and filtering

### 4. Configuration Layer

#### opera.ts

**Contains:**
- Room type mappings (OPERA codes → descriptions)
- Rate plan mappings (OPERA codes → packages)
- Package types (Premium, Family, Basic, Promo)
- Amenities labels (EN/ES)
- View types (Ocean, Garden, Pool)

**Benefits:**
- Centralized configuration
- Easy brand customization
- Type-safe access
- Multi-language support

#### Environment Variables

**Stored in `.env`:**
- OPERA credentials
- API endpoints
- Timeouts
- Default values

**Security:**
- Never committed to git
- Server-side only
- Validated on startup

## Data Flow

### Availability Search Flow

```
1. User fills form → BookingForm component
2. Form submits → fetch('/api/availability')
3. API validates params → /api/availability/+server.ts
4. API calls service → operaClient.checkAvailability()
5. Service gets token → OAuth2 flow (cached)
6. Service calls OPERA → GET /par/v1/hotels/{id}/availability
7. OPERA returns data → Raw availability response
8. Service enriches data → enrichAvailability()
9. API returns JSON → Enriched room data
10. UI updates → Display RoomCard components
```

### Reservation Flow

```
1. User selects room → RoomCard component
2. User fills guest info → Guest form
3. Form submits → fetch('/api/reservation', { method: 'POST' })
4. API validates data → /api/reservation/+server.ts
5. API calls service → operaClient.createReservation()
6. Service gets token → OAuth2 flow (cached)
7. Service calls OPERA → POST /rsv/v1/hotels/{id}/reservations
8. OPERA creates reservation → Confirmation number
9. API returns JSON → Reservation details
10. UI shows confirmation → Success message
```

## Security Architecture

### Authentication & Authorization

```
┌──────────────┐
│   Client     │ No credentials stored
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐
│ SvelteKit    │ Server-side only
│ API Routes   │
└──────┬───────┘
       │ OAuth2
       ▼
┌──────────────┐
│ OperaClient  │ Token caching
└──────┬───────┘
       │ Bearer Token
       ▼
┌──────────────┐
│ OPERA Cloud  │ PMS System
└──────────────┘
```

**Security Measures:**

1. **Credential Protection**
   - Environment variables only
   - Never in client code
   - Server-side processing

2. **API Security**
   - Input validation
   - Type checking
   - Error sanitization
   - Security headers

3. **Token Management**
   - In-memory caching
   - Automatic refresh
   - Expiration handling
   - No persistent storage

4. **Request Security**
   - HTTPS only (production)
   - CORS configuration
   - Rate limiting (recommended)
   - Request logging

## State Management

### Client State (Svelte 5 Runes)

```typescript
// Reactive state
let checkIn = $state('');
let checkOut = $state('');
let adults = $state(2);

// Derived state
let isValid = $derived(checkIn && checkOut && adults >= 1);

// Effects
$effect(() => {
  if (checkIn && checkOut) {
    // Recalculate nights
  }
});
```

**Benefits:**
- Fine-grained reactivity
- Automatic updates
- Type-safe
- Minimal boilerplate

### Server State

**Token Cache:**
```typescript
let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;
```

**Considerations for Production:**
- Use Redis for multi-instance deployments
- Implement distributed caching
- Add cache invalidation
- Monitor cache hit rates

## Error Handling

### Client-Side

```typescript
try {
  const response = await fetch('/api/availability');
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  const data = await response.json();
} catch (error) {
  // Display user-friendly message
  errorMessage = 'Unable to load availability';
}
```

### Server-Side

```typescript
try {
  const operaResponse = await operaClient.checkAvailability(params);
  return json({ success: true, data: operaResponse });
} catch (err) {
  console.error('API error:', err);
  throw error(500, {
    message: 'Failed to fetch availability'
  });
}
```

### OPERA Client

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('OPERA error:', errorText);
  throw new RuntimeException(`OPERA error: ${response.status}`);
}
```

## Performance Considerations

### Optimizations Implemented

1. **Token Caching**
   - Reduces auth requests
   - 50-minute TTL
   - Automatic refresh

2. **Component Splitting**
   - Lazy loading ready
   - Modular components
   - Minimal bundle size

3. **Efficient Rendering**
   - Svelte compilation
   - No virtual DOM
   - Reactive updates only

### Recommended Enhancements

1. **Caching Layer**
   - Redis for tokens
   - Response caching
   - CDN for static assets

2. **Database Layer**
   - Cache availability results
   - Store user sessions
   - Track analytics

3. **API Optimization**
   - Request batching
   - Response compression
   - Connection pooling

## Scalability

### Current Architecture

- **Horizontal Scaling**: ✅ Stateless API routes
- **Vertical Scaling**: ✅ Node.js performance
- **Load Balancing**: ✅ Compatible
- **Multi-Region**: ⚠️ Needs distributed cache

### Scaling Recommendations

1. **Add Redis**
   ```typescript
   // Replace in-memory cache
   const token = await redis.get('opera_token');
   if (!token) {
     const newToken = await getNewToken();
     await redis.set('opera_token', newToken, 'EX', 3000);
   }
   ```

2. **Add Rate Limiting**
   ```typescript
   import rateLimit from '@fastify/rate-limit';
   
   app.register(rateLimit, {
     max: 100,
     timeWindow: '15 minutes'
   });
   ```

3. **Add Monitoring**
   - Application Performance Monitoring (APM)
   - Error tracking (Sentry)
   - Analytics (Google Analytics)
   - Uptime monitoring

## Testing Strategy

### Unit Tests
- Service functions
- Data transformations
- Validation logic

### Integration Tests
- API endpoints
- OPERA client
- Error handling

### E2E Tests
- User flows
- Form submissions
- Reservation process

### Recommended Tools
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **MSW** - API mocking

## Deployment Architecture

### Development
```
Local Machine
├── npm run dev
├── .env (local credentials)
└── http://localhost:5173
```

### Production (Vercel)
```
Vercel Edge Network
├── CDN (static assets)
├── Serverless Functions (API routes)
├── Environment Variables (secrets)
└── https://your-domain.com
```

### Production (Node.js)
```
Server
├── PM2 Process Manager
├── Nginx Reverse Proxy
├── SSL Certificate
└── Environment Variables
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm update
   npm audit fix
   ```

2. **Monitor Logs**
   - Check for OPERA errors
   - Track response times
   - Review error rates

3. **Review Configuration**
   - Update room types
   - Adjust rate plans
   - Verify credentials

4. **Performance Monitoring**
   - API response times
   - Token cache hits
   - User conversion rates

### Troubleshooting

**Common Issues:**

1. **Token Expiration**
   - Check token TTL
   - Verify refresh logic
   - Monitor auth errors

2. **API Timeouts**
   - Increase timeout values
   - Check OPERA status
   - Review network issues

3. **Missing Rooms**
   - Verify room codes
   - Check rate plans
   - Review date ranges

## Future Enhancements

### Phase 2
- Complete reservation flow
- Payment integration
- Email confirmations
- User accounts

### Phase 3
- Multi-property support
- Advanced filtering
- Dynamic pricing
- Loyalty programs

### Phase 4
- Mobile app
- Chatbot integration
- AI recommendations
- Predictive analytics

