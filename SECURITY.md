# Security Guidelines

## ⚠️ Critical: Separating Public and Private Configuration

### Problem
Environment variables from `$env/dynamic/private` must NEVER be imported into client-side code. This would leak sensitive credentials (API keys, secrets, etc.) to the browser.

### Solution
We've separated configuration into two files:

#### 1. `opera-config.ts` - Public (Client-Safe) ✅
**Location**: `src/lib/config/opera-config.ts`

**Contains:**
- Room type mappings
- Rate plan configurations
- Package types
- Amenity labels
- View labels

**Can be imported by:**
- ✅ Client-side components (.svelte files)
- ✅ Client-side services
- ✅ Server-side code

**Usage:**
```typescript
import { operaStaticConfig } from '$lib/config/opera-config';

// Access room types
const roomType = operaStaticConfig.roomTypes['1BBFG'];
```

#### 2. `opera.ts` - Private (Server-Only) 🔒
**Location**: `src/lib/config/opera.ts`

**Contains:**
- API credentials (from environment variables)
- Gateway URLs
- Client IDs and secrets
- App keys
- All sensitive configuration

**Can ONLY be imported by:**
- ✅ Server-side API routes (`+server.ts` files)
- ✅ Server-side hooks (`hooks.server.ts`)
- ✅ Server-side services used only in API routes
- ❌ **NEVER** in `.svelte` component files
- ❌ **NEVER** in client-side services

**Usage:**
```typescript
// ONLY in +server.ts or server-side code
import { operaConfig } from '$lib/config/opera';

// Access credentials (server-side only)
const token = await getToken(operaConfig.clientId, operaConfig.clientSecret);
```

## File Import Rules

### ✅ Safe Imports

```typescript
// In ANY file (client or server)
import { operaStaticConfig } from '$lib/config/opera-config';

// In +server.ts files ONLY
import { operaConfig } from '$lib/config/opera';
import { env } from '$env/dynamic/private';
```

### ❌ Dangerous Imports

```typescript
// ❌ NEVER in .svelte files
import { operaConfig } from '$lib/config/opera';

// ❌ NEVER in client-side code
import { env } from '$env/dynamic/private';

// ❌ NEVER import server-only code in components
import { operaClient } from '$lib/services/opera-client';
```

## Current Project Structure

### Client-Side Code (Browser)
```
+page.svelte
  └─> RoomCard.svelte
       └─> availability-service.ts
            └─> opera-config.ts ✅ (PUBLIC - Safe)
```

### Server-Side Code (API Routes)
```
api/availability/+server.ts
  └─> opera-client.ts
       └─> opera.ts 🔒 (PRIVATE - Credentials)
            └─> opera-config.ts ✅ (PUBLIC - Static data)
```

## How to Add New Configuration

### Adding Non-Sensitive Data (Room Types, Labels, etc.)

1. **Edit** `src/lib/config/opera-config.ts`
2. Add your new configuration to `operaStaticConfig`
3. Can be used anywhere (client or server)

```typescript
// In opera-config.ts
export const operaStaticConfig = {
  roomTypes: {
    'NEW_ROOM': {
      nameEn: 'New Room Type',
      // ... configuration
    }
  }
}
```

### Adding Sensitive Data (API Keys, URLs, etc.)

1. **Add to** `.env` file
2. **Edit** `src/lib/config/opera.ts` (server-side only)
3. **NEVER** use in client-side code

```bash
# In .env
NEW_API_KEY=secret123
```

```typescript
// In opera.ts (server-side only)
export const operaConfig = {
  newApiKey: env.NEW_API_KEY || '',
  // ...
}
```

## Security Checklist

Before deploying or committing code, verify:

- [ ] No `$env/dynamic/private` imports in `.svelte` files
- [ ] No `opera.ts` imports in client-side code
- [ ] All sensitive config is in environment variables
- [ ] `.env` file is in `.gitignore`
- [ ] Only `opera-config.ts` is imported by components
- [ ] API routes properly validate all inputs
- [ ] Error messages don't expose internal details

## Common Errors and Solutions

### Error: "Cannot import $env/dynamic/private into browser code"

**Cause:** You're importing `opera.ts` (or a file that imports it) in a `.svelte` component or client-side service.

**Solution:**
1. Change the import to use `opera-config.ts` instead
2. If you need server-side data, fetch it via API route

```typescript
// ❌ Wrong - in component
import { operaConfig } from '$lib/config/opera';

// ✅ Correct - in component
import { operaStaticConfig } from '$lib/config/opera-config';

// ✅ Or fetch from API
const response = await fetch('/api/availability');
```

### Error: "Module not found: $env/dynamic/private"

**Cause:** Trying to use private environment variables in client code.

**Solution:** Move the code to a server-side API route (`+server.ts`).

## Best Practices

### 1. Separation of Concerns

```
Client Code
  └─> Handles UI and user interactions
  └─> Uses public configuration only
  └─> Calls API endpoints for data

Server Code
  └─> Handles sensitive operations
  └─> Uses private configuration
  └─> Validates all inputs
  └─> Returns sanitized data
```

### 2. Environment Variables

```bash
# .env - NEVER commit this file
OPERA_CLIENT_SECRET=abc123xyz
OPERA_APP_KEY=secret-key-here

# .env.example - Safe to commit
OPERA_CLIENT_SECRET=your_secret_here
OPERA_APP_KEY=your_app_key_here
```

### 3. API Route Security

```typescript
// In +server.ts
export const GET: RequestHandler = async ({ url }) => {
  // ✅ Validate inputs
  const param = url.searchParams.get('param');
  if (!param) throw error(400, 'Invalid input');
  
  // ✅ Use server-side config
  const result = await operaClient.doSomething(operaConfig.apiKey);
  
  // ✅ Return only necessary data
  return json({ data: sanitizedResult });
};
```

### 4. Error Handling

```typescript
try {
  const result = await operaClient.getData();
  return json({ success: true, data: result });
} catch (err) {
  // ✅ Log full error server-side
  console.error('Detailed error:', err);
  
  // ✅ Return generic message to client
  throw error(500, 'An error occurred');
  
  // ❌ NEVER expose internal details
  // throw error(500, err.message);
}
```

## References

- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-dynamic-private)
- [SvelteKit Server-only Modules](https://kit.svelte.dev/docs/server-only-modules)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)

## Questions?

If you're unsure whether code should be client-side or server-side:

**Ask yourself:**
1. Does it use environment variables? → **Server-side**
2. Does it handle sensitive data? → **Server-side**
3. Does it call external APIs? → **Server-side**
4. Does it render UI? → **Client-side**
5. Does it format display data? → **Client-side**

**When in doubt, keep it server-side!**

---

Last updated: December 30, 2025

