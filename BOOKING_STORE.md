# Booking Store Documentation

## Overview
The booking store is a **global state management solution** for the entire reservation flow. It centralizes all booking-related data and provides reactive updates across all components.

## Features

✅ **Centralized State**: All booking data in one place  
✅ **Type-Safe**: Full TypeScript support  
✅ **Reactive**: Automatic UI updates when data changes  
✅ **Derived Values**: Computed properties (nights, total, etc.)  
✅ **Easy Access**: Import and use anywhere in the app  

## Store Structure

```typescript
{
  // Step management
  currentStep: 'search' | 'select' | 'details' | 'payment' | 'confirmation',
  
  // Search criteria
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  promoCode: string,
  
  // Search results
  availableRooms: EnrichedRoomAvailability[],
  
  // Selection
  selectedRoom: EnrichedRoomAvailability | null,
  selectedRateIndex: number,
  
  // Guest information
  guests: Guest[],
  
  // Payment information
  payment: PaymentInfo | null,
  
  // Confirmation
  confirmationNumber: string,
  reservationId: string,
  
  // UI state
  loading: boolean,
  error: string | null
}
```

## Usage Examples

### 1. Reading Data (Subscribing to the store)

```svelte
<script lang="ts">
  import { bookingStore, nights, selectedRate } from '$lib/stores';
  
  // The store is automatically reactive
  $: console.log('Current booking:', $bookingStore);
  $: console.log('Number of nights:', $nights);
  $: console.log('Selected rate:', $selectedRate);
</script>

<div>
  <h2>Check-in: {$bookingStore.checkIn}</h2>
  <h2>Check-out: {$bookingStore.checkOut}</h2>
  <h2>Nights: {$nights}</h2>
  <h2>Adults: {$bookingStore.adults}</h2>
  <h2>Children: {$bookingStore.children}</h2>
</div>
```

### 2. Updating Search Criteria

```svelte
<script lang="ts">
  import { bookingStore } from '$lib/stores';
  
  function handleDateChange(checkIn: string, checkOut: string) {
    bookingStore.setSearchCriteria({
      checkIn,
      checkOut,
      adults: 2,
      children: 0
    });
  }
  
  function updateAdults(count: number) {
    bookingStore.setAdults(count);
  }
</script>
```

### 3. Room Selection

```svelte
<script lang="ts">
  import { bookingStore } from '$lib/stores';
  import type { EnrichedRoomAvailability } from '$lib/types/opera';
  
  function selectRoom(room: EnrichedRoomAvailability, rateIndex: number) {
    bookingStore.selectRoom(room, rateIndex);
    bookingStore.goToStep('details');
  }
</script>
```

### 4. Guest Information

```svelte
<script lang="ts">
  import { bookingStore, type Guest } from '$lib/stores';
  
  function saveGuestInfo(guests: Guest[]) {
    bookingStore.setGuests(guests);
    bookingStore.goToStep('payment');
  }
</script>
```

### 5. Getting Complete Booking Data

```svelte
<script lang="ts">
  import { completeBookingData } from '$lib/stores';
  
  async function submitReservation() {
    const bookingData = $completeBookingData;
    
    console.log('Complete booking data:', bookingData);
    /*
    {
      checkIn: "2025-01-15",
      checkOut: "2025-01-20",
      nights: 5,
      adults: 2,
      children: 1,
      totalGuests: 3,
      guests: [...],
      mainContact: { firstName: "John", ... },
      room: { ... },
      selectedRate: { ... },
      payment: { ... },
      promoCode: "SAVE20",
      confirmationNumber: "ABC123",
      createdAt: "2025-12-30T..."
    }
    */
    
    // Send to API
    const response = await fetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
  }
</script>
```

### 6. Navigation Between Steps

```svelte
<script lang="ts">
  import { bookingStore } from '$lib/stores';
  
  function goBack() {
    bookingStore.previousStep();
  }
  
  function continue() {
    bookingStore.nextStep();
  }
  
  function jumpToStep(step: 'search' | 'select' | 'details' | 'payment' | 'confirmation') {
    bookingStore.goToStep(step);
  }
</script>
```

### 7. Loading & Error States

```svelte
<script lang="ts">
  import { bookingStore } from '$lib/stores';
  
  async function searchRooms() {
    bookingStore.setLoading(true);
    bookingStore.clearError();
    
    try {
      const response = await fetch('/api/availability');
      const data = await response.json();
      bookingStore.setAvailableRooms(data.rooms);
      bookingStore.goToStep('select');
    } catch (error) {
      bookingStore.setError('Failed to fetch rooms');
    } finally {
      bookingStore.setLoading(false);
    }
  }
</script>

{#if $bookingStore.loading}
  <Spinner />
{/if}

{#if $bookingStore.error}
  <ErrorMessage message={$bookingStore.error} />
{/if}
```

## Available Derived Stores

These are automatically computed values that update when the main store changes:

- `nights` - Number of nights between check-in and check-out
- `selectedRate` - The currently selected rate plan
- `totalGuests` - Sum of adults + children
- `isSearchValid` - Boolean indicating if search criteria is complete
- `mainContact` - The guest marked as main contact
- `completeBookingData` - All booking data in one object ready for API submission

## Store Actions

### Search Actions
- `setSearchCriteria({ checkIn, checkOut, adults, children, promoCode? })` - Set all search criteria at once
- `setCheckIn(date)` - Set check-in date
- `setCheckOut(date)` - Set check-out date
- `setAdults(count)` - Set number of adults
- `setChildren(count)` - Set number of children
- `setPromoCode(code)` - Set promo code

### Room Selection
- `setAvailableRooms(rooms)` - Set available rooms from API
- `selectRoom(room, rateIndex)` - Select a room and rate plan

### Guest & Payment
- `setGuests(guests)` - Set guest information
- `setPayment(payment)` - Set payment information

### Confirmation
- `setConfirmation(confirmationNumber, reservationId)` - Set confirmation details

### Navigation
- `goToStep(step)` - Jump to specific step
- `nextStep()` - Go to next step
- `previousStep()` - Go to previous step

### UI State
- `setLoading(boolean)` - Set loading state
- `setError(message)` - Set error message
- `clearError()` - Clear error message

### Reset
- `reset()` - Reset entire store to initial state

## Benefits

1. **Single Source of Truth**: All booking data lives in one place
2. **Easy Debugging**: Console log `$bookingStore` to see entire state
3. **Persistence Ready**: Easy to save/restore state from localStorage or session
4. **API Ready**: `completeBookingData` gives you everything needed for API calls
5. **Type Safety**: Full TypeScript support prevents errors
6. **Reactive**: Components automatically update when data changes

## Example: Complete Flow

```svelte
<script lang="ts">
  import { bookingStore, completeBookingData, nights } from '$lib/stores';
  
  // 1. User searches
  bookingStore.setSearchCriteria({
    checkIn: '2025-01-15',
    checkOut: '2025-01-20',
    adults: 2,
    children: 0
  });
  
  // 2. Fetch and set rooms
  const rooms = await fetchRooms();
  bookingStore.setAvailableRooms(rooms);
  bookingStore.goToStep('select');
  
  // 3. User selects room
  bookingStore.selectRoom(selectedRoom, 0);
  bookingStore.goToStep('details');
  
  // 4. User fills guest info
  bookingStore.setGuests([...]);
  bookingStore.goToStep('payment');
  
  // 5. User fills payment
  bookingStore.setPayment({...});
  
  // 6. Submit reservation
  const response = await fetch('/api/reservations', {
    method: 'POST',
    body: JSON.stringify($completeBookingData)
  });
  
  // 7. Show confirmation
  bookingStore.setConfirmation('ABC123', 'res-456');
  bookingStore.goToStep('confirmation');
  
  // 8. Reset for new booking
  bookingStore.reset();
</script>
```

## Migration Guide

To migrate existing components to use the global store:

### Before (Local State):
```svelte
<script lang="ts">
  let checkIn = $state('');
  let checkOut = $state('');
  let adults = $state(2);
</script>
```

### After (Global Store):
```svelte
<script lang="ts">
  import { bookingStore } from '$lib/stores';
</script>

<input bind:value={$bookingStore.checkIn} />
<input bind:value={$bookingStore.checkOut} />
```

Or with actions:
```svelte
<input 
  value={$bookingStore.checkIn} 
  onchange={(e) => bookingStore.setCheckIn(e.target.value)}
/>
```
