# Setup Guide - Mayan Princess Booking Engine

## Prerequisites

- Node.js 18+ installed
- OPERA Cloud API credentials
- Access to OPERA Cloud environment

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd svmpbooking

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your OPERA Cloud credentials:

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

### 3. Configure Room Types and Rate Plans

Edit `src/lib/config/opera.ts` to match your OPERA setup:

#### Room Types

Update the `roomTypes` object with your OPERA room type codes:

```typescript
roomTypes: {
  'YOUR_ROOM_CODE': {
    nameEn: 'Room Name in English',
    nameEs: 'Nombre en Español',
    bedrooms: 1,
    maxAdults: 4,
    maxChildren: 4,
    beds: ['1 KING'],
    location: 'Location Name',
    view: 'ocean', // ocean, garden, or pool
    sortOrder: 10
  },
  // Add more room types...
}
```

#### Rate Plans

Update the `ratePlans` object with your OPERA rate plan codes:

```typescript
ratePlans: {
  'YOUR_RATE_CODE': {
    package: 'family', // premium, family, basic, or promo
    labelEn: 'Rate Plan Name',
    labelEs: 'Nombre del Plan',
    includes: ['meals', 'drinks', 'activities'],
    sortOrder: 1
  },
  // Add more rate plans...
}
```

### 4. Customize Branding

#### Colors

Edit `src/app.css` to change brand colors:

```css
:root {
  --color-primary: #183453;    /* Your primary color */
  --color-secondary: #c5a56f;  /* Your secondary color */
  --color-tertiary: #d6a34b;   /* Your tertiary color */
}
```

#### Logo and Branding

Edit `src/routes/+page.svelte` - update the hero section:

```svelte
<div class="logo-section">
  <h1 class="logo-title">Your Brand Name</h1>
  <p class="logo-subtitle">Your Tagline</p>
</div>
```

### 5. Test the Setup

#### Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

#### Test API Endpoints

Test availability endpoint:

```bash
curl "http://localhost:5173/api/availability?checkIn=2025-02-01&checkOut=2025-02-05&adults=2&children=0"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "checkIn": "2025-02-01",
    "checkOut": "2025-02-05",
    "adults": 2,
    "children": 0,
    "rooms": [...],
    "totalRooms": 5
  }
}
```

### 6. Verify OPERA Integration

Check the console logs for:

✅ **Successful token acquisition:**
```
OPERA token obtained successfully { expiresIn: 3600, ... }
```

✅ **Successful API calls:**
```
OPERA API Request: { method: 'GET', url: '...' }
Availability response: { roomStaysCount: 10 }
```

❌ **Common Issues:**

**401 Unauthorized:**
- Check client ID and secret
- Verify app key is correct
- Ensure scope matches granted permissions

**404 Not Found:**
- Verify gateway URL
- Check enterprise ID and hotel ID
- Confirm API endpoints are correct

**Empty Results:**
- Verify room type codes match OPERA
- Check rate plan codes are active
- Ensure dates are valid

### 7. Production Deployment

#### Build for Production

```bash
npm run build
```

#### Preview Production Build

```bash
npm run preview
```

#### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add all OPERA_* variables
4. Redeploy

#### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

Add environment variables in Netlify dashboard:
1. Go to Site Settings
2. Navigate to Environment Variables
3. Add all OPERA_* variables
4. Redeploy

## Security Checklist

Before going to production:

- [ ] All sensitive credentials are in environment variables
- [ ] `.env` file is in `.gitignore`
- [ ] HTTPS is enabled
- [ ] Rate limiting is configured
- [ ] Error messages don't expose internal details
- [ ] CORS is properly configured
- [ ] Security headers are set (done in `hooks.server.ts`)
- [ ] Input validation is in place (done in API routes)
- [ ] Logging is configured for monitoring
- [ ] Backup strategy is in place

## Testing Checklist

- [ ] Date selection works correctly
- [ ] Guest counter increments/decrements properly
- [ ] Promo code input appears/disappears
- [ ] Search returns results
- [ ] Room cards display correctly
- [ ] Rate selection works
- [ ] Responsive design works on mobile
- [ ] Error messages display properly
- [ ] API endpoints return correct data
- [ ] OPERA integration works

## Monitoring

Add monitoring for:

1. **API Response Times**
   - Track OPERA API latency
   - Monitor token acquisition time

2. **Error Rates**
   - Log all API errors
   - Track failed reservations

3. **User Actions**
   - Track search queries
   - Monitor conversion rates

4. **System Health**
   - Server uptime
   - Memory usage
   - Token cache hits/misses

## Support

For issues or questions:

1. Check the main README.md
2. Review OPERA Cloud API documentation
3. Check browser console for errors
4. Review server logs
5. Contact development team

## Next Steps

After basic setup:

1. **Add Reservation Flow**
   - Guest information form
   - Payment processing
   - Confirmation page

2. **Enhance Features**
   - Image galleries for rooms
   - Reviews and ratings
   - Special offers section
   - Multi-language switcher

3. **Optimize Performance**
   - Add Redis for token caching
   - Implement CDN for assets
   - Add service worker for offline support

4. **Add Analytics**
   - Google Analytics
   - Conversion tracking
   - User behavior analysis

5. **Improve SEO**
   - Meta tags
   - Structured data
   - Sitemap
   - robots.txt

