# Debug Guide - OPERA Availability Issues

## 🔍 Problem: Getting 0 Rooms

If you're getting 0 rooms from the availability search, it's likely that:
1. Room type codes from OPERA don't match your config
2. Rate plan codes from OPERA don't match your config
3. OPERA is returning an error
4. The date range has no availability

---

## 🛠️ Debug Steps

### Step 1: Use the Debug Endpoint

Call the debug endpoint to see what OPERA is returning:

```bash
# Replace with your actual dates
curl "http://localhost:5173/api/debug/availability?checkIn=2025-02-01&checkOut=2025-02-05&adults=2&children=0"
```

Or visit in browser:
```
http://localhost:5173/api/debug/availability?checkIn=2025-02-01&checkOut=2025-02-05&adults=2&children=0
```

### Step 2: Check the Response

The debug endpoint will show you:

```json
{
  "debug": true,
  "summary": {
    "totalRoomStays": 10,
    "uniqueRoomTypes": 5,
    "uniqueRatePlans": 3,
    "matchingRoomTypes": 2,      // ← Should NOT be 0
    "missingRoomTypes": 3,        // ← These need to be added
    "matchingRatePlans": 1,       // ← Should NOT be 0
    "missingRatePlans": 2         // ← These need to be added
  },
  "analysis": {
    "roomTypes": {
      "inResponse": ["1BBFG", "2BMS", "UNKNOWN1"],
      "inConfig": ["1BBFG", "1BBFS", "1BGS"],
      "matching": ["1BBFG"],
      "missing": ["UNKNOWN1"],
      "missingDetails": [
        {
          "code": "UNKNOWN1",
          "suggestion": "Add this to opera-config.ts roomTypes"
        }
      ]
    },
    "ratePlans": {
      "inResponse": ["AIF-2025", "UNKNOWN_RATE"],
      "inConfig": ["AIF-2025", "AIP-2025"],
      "matching": ["AIF-2025"],
      "missing": ["UNKNOWN_RATE"],
      "missingDetails": [
        {
          "code": "UNKNOWN_RATE",
          "suggestion": "Add this to opera-config.ts ratePlans"
        }
      ]
    }
  },
  "rawOperaResponse": { ... }
}
```

### Step 3: Check Browser Console

Open DevTools (F12) and look for these log messages:

```
🔧 ENRICHMENT: Starting with X room stays
🔧 ENRICHMENT: Grouped into Y unique room types: ['1BBFG', '2BMS']
✅ ENRICHMENT: Processing room type 1BBFG with 2 stays
  ✅ Found rate plan AIF-2025 for room 1BBFG
❌ ENRICHMENT: No configuration found for room type: UNKNOWN_CODE
❌ ENRICHMENT: No configuration found for rate plan: UNKNOWN_RATE
🎉 ENRICHMENT: Complete! Returning Z enriched rooms
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Missing Room Types

**Symptom:**
```
❌ ENRICHMENT: No configuration found for room type: NEWROOM
```

**Solution:**
Add the room type to `src/lib/config/opera-config.ts`:

```typescript
export const operaStaticConfig = {
  roomTypes: {
    // ... existing room types ...
    
    'NEWROOM': {  // ← Add the code from OPERA
      nameEn: 'New Room Type Name',
      nameEs: 'Nombre del Nuevo Tipo',
      bedrooms: 1,
      maxAdults: 4,
      maxChildren: 4,
      beds: ['1 KING'],
      location: 'Mayan',  // or 'Las Sirenas'
      view: 'ocean',      // 'ocean', 'garden', or 'pool'
      sortOrder: 60       // Determines display order
    }
  },
  // ...
}
```

### Issue 2: Missing Rate Plans

**Symptom:**
```
❌ ENRICHMENT: No configuration found for rate plan: NEWRATE
```

**Solution:**
Add the rate plan to `src/lib/config/opera-config.ts`:

```typescript
export const operaStaticConfig = {
  // ...
  ratePlans: {
    // ... existing rate plans ...
    
    'NEWRATE': {  // ← Add the code from OPERA
      package: 'family',  // 'premium', 'family', 'basic', or 'promo'
      labelEn: 'New Rate Plan Name',
      labelEs: 'Nombre del Nuevo Plan',
      includes: ['meals', 'drinks', 'activities'],
      sortOrder: 6
    }
  },
  // ...
}
```

### Issue 3: OPERA API Error

**Symptom:**
```
❌ DEBUG: Error in availability check: OPERA availability error 401: ...
```

**Possible Causes:**
1. Invalid credentials in `.env`
2. Token expired (should auto-refresh)
3. Wrong gateway URL
4. Hotel ID incorrect

**Solution:**
Check your `.env` file:
```bash
OPERA_GATEWAY_URL=https://your-correct-gateway.com
OPERA_HOTEL_ID=your_actual_hotel_id
OPERA_CLIENT_ID=your_client_id
OPERA_CLIENT_SECRET=your_client_secret
OPERA_APP_KEY=your_app_key
```

### Issue 4: No Availability for Dates

**Symptom:**
```
✅ OPERA Response received: { roomStaysCount: 0 }
```

**This means OPERA has no availability**. Try:
- Different dates
- Fewer guests
- Different rate plan code

---

## 📊 Understanding the Flow

```
1. User searches for dates
   ↓
2. /api/availability called
   ↓
3. operaClient.checkAvailability() → OPERA API
   ↓
4. OPERA returns roomStays[]
   ↓
5. enrichAvailability() processes response
   ↓
6. For each roomStay:
   - Check if roomTypeCode exists in config ← FAILS if missing
   - Check if ratePlanCode exists in config ← FAILS if missing
   ↓
7. Return enriched rooms (0 if all failed config check)
```

---

## 🔍 Quick Debug Checklist

- [ ] Check debug endpoint shows `totalRoomStays > 0`
- [ ] Check `matchingRoomTypes` is not 0
- [ ] Check `matchingRatePlans` is not 0
- [ ] Look for `missing` arrays in debug response
- [ ] Check browser console for warning messages
- [ ] Verify `.env` has correct OPERA credentials
- [ ] Verify room type codes match OPERA exactly
- [ ] Verify rate plan codes match OPERA exactly
- [ ] Try dates with known availability

---

## 📝 How to Find OPERA Codes

### Option 1: Debug Endpoint
Use the debug endpoint - it shows you exactly what codes OPERA is returning:
```
analysis.roomTypes.inResponse  ← These are the actual codes
analysis.ratePlans.inResponse  ← These are the actual codes
```

### Option 2: Browser Console
Look for the warning messages that show the actual codes:
```
❌ ENRICHMENT: No configuration found for room type: ACTUAL_CODE
```

### Option 3: Raw Response
In the debug endpoint, check `rawOperaResponse.roomStays`:
```json
{
  "roomStays": [
    {
      "roomType": {
        "roomTypeCode": "1BBFG"  ← This is what you need
      },
      "ratePlans": [
        {
          "ratePlanCode": "AIF-2025"  ← This is what you need
        }
      ]
    }
  ]
}
```

---

## 🚀 Example: Adding Missing Codes

### Scenario
Debug endpoint shows:
```json
"missing": ["STUDIO", "SUITE"],
"missingRatePlans": ["EARLYBRD2025"]
```

### Solution
Edit `src/lib/config/opera-config.ts`:

```typescript
export const operaStaticConfig = {
  roomTypes: {
    // ... existing ...
    
    // NEW: Add these
    'STUDIO': {
      nameEn: 'Studio Suite',
      nameEs: 'Suite Estudio',
      bedrooms: 0,
      maxAdults: 2,
      maxChildren: 1,
      beds: ['1 QUEEN'],
      location: 'Mayan',
      view: 'garden',
      sortOrder: 15
    },
    'SUITE': {
      nameEn: 'Executive Suite',
      nameEs: 'Suite Ejecutiva',
      bedrooms: 2,
      maxAdults: 6,
      maxChildren: 4,
      beds: ['1 KING', '2 QUEEN'],
      location: 'Mayan',
      view: 'ocean',
      sortOrder: 70
    }
  },
  
  ratePlans: {
    // ... existing ...
    
    // NEW: Add this
    'EARLYBRD2025': {
      package: 'promo',
      labelEn: 'Early Bird Special 2025',
      labelEs: 'Especial Reserva Anticipada 2025',
      includes: ['meals', 'drinks', 'activities'],
      sortOrder: 1
    }
  }
}
```

Save, refresh browser, search again → Should see rooms now! ✅

---

## 🎯 Still Having Issues?

### Enable Verbose Logging

1. Check browser DevTools Console (F12)
2. Look for emojis: 🔧 (enrichment), ✅ (success), ❌ (errors)
3. Check Network tab for `/api/availability` request
4. Check server terminal for OPERA API logs

### Test with Simple Query

Try the most basic search:
```
checkIn: Tomorrow
checkOut: Day after tomorrow
adults: 2
children: 0
No promo code
```

This should work if your credentials and config are correct.

### Contact Support

If still not working:
1. Share the debug endpoint JSON
2. Share browser console logs
3. Share any error messages from terminal

---

## 📚 Related Files

- `src/lib/config/opera-config.ts` - Room types & rate plans config
- `src/lib/services/opera-client.ts` - OPERA API client
- `src/lib/services/availability-service.ts` - Enrichment logic
- `src/routes/api/availability/+server.ts` - API endpoint
- `src/routes/api/debug/availability/+server.ts` - Debug endpoint

---

**Last Updated**: December 30, 2025

