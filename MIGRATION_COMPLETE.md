# ✅ Migración a Store Global Completada

## 🎉 ¿Qué se ha migrado?

### 1. **Store Global Creado** (`src/lib/stores/booking.ts`)
Toda la información de la reserva ahora vive en un store centralizado de Svelte que incluye:

- ✅ Fechas (check-in, check-out)
- ✅ Número de huéspedes (adultos, niños)
- ✅ Código promocional
- ✅ Habitaciones disponibles
- ✅ Habitación y paquete seleccionado
- ✅ Información de todos los huéspedes
- ✅ Información de pago
- ✅ Números de confirmación y reserva
- ✅ Estados de UI (loading, error)
- ✅ Navegación entre pasos

### 2. **BookingStepper Migrado** (`src/lib/components/BookingStepper.svelte`)
El componente principal ahora usa el store global:
- ✅ Ya no tiene estado local
- ✅ Lee y escribe directamente al store
- ✅ Comparte datos automáticamente con otros componentes
- ✅ Todos los datos persisten durante la navegación

### 3. **Panel de Debug Agregado** (`src/lib/components/BookingDebugPanel.svelte`)
Un panel de desarrollo que te permite ver el estado en tiempo real:
- 🐛 Se activa con `?debug=true` en la URL
- 📊 Muestra el estado completo del store
- 📋 Permite copiar datos al portapapeles
- 🔄 Permite resetear el store
- 🎯 Muestra `completeBookingData` listo para API

## 🚀 Cómo usar

### Ver el estado en tiempo real

Agrega `?debug=true` a la URL:

```
http://localhost:5173/?debug=true
```

Verás un panel flotante en la esquina inferior derecha con 3 pestañas:

1. **Store State**: Todo el estado actual
2. **Derived Values**: Valores calculados (noches, validaciones, etc.)
3. **Complete Data**: El objeto completo listo para enviar a la API

### Usar el store en cualquier componente

```svelte
<script lang="ts">
  import { bookingStore, nights, completeBookingData } from '$lib/stores';
  
  // Leer datos reactivos
  $: console.log('Check-in:', $bookingStore.checkIn);
  $: console.log('Noches:', $nights);
  
  // Modificar datos
  function updateDates() {
    bookingStore.setCheckIn('2025-02-01');
    bookingStore.setCheckOut('2025-02-05');
  }
  
  // Obtener datos completos para API
  async function submitToAPI() {
    const data = $completeBookingData;
    console.log('Sending to API:', data);
    
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
</script>

<div>
  <h2>Check-in: {$bookingStore.checkIn}</h2>
  <h2>Adultos: {$bookingStore.adults}</h2>
  <h2>Noches: {$nights}</h2>
  
  <button onclick={updateDates}>Cambiar fechas</button>
  <button onclick={submitToAPI}>Enviar a API</button>
</div>
```

## 📦 El objeto `completeBookingData`

Este es el objeto final que contiene TODO lo necesario para crear una reserva:

```javascript
{
  // Fechas
  "checkIn": "2025-02-01",
  "checkOut": "2025-02-05",
  "nights": 4,
  
  // Huéspedes
  "adults": 2,
  "children": 1,
  "totalGuests": 3,
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "nationalId": "123456789",
      "email": "john@example.com",
      "phone": "+1234567890",
      "isMainContact": true
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "nationalId": "987654321",
      "isMainContact": false
    },
    {
      "firstName": "Little",
      "lastName": "Doe",
      "nationalId": "456789123",
      "isMainContact": false
    }
  ],
  "mainContact": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  
  // Habitación y Paquete
  "room": {
    "roomTypeCode": "1BBFG",
    "roomTypeName": { "en": "1 Bedroom Beachfront Garden" },
    "rates": [...]
  },
  "selectedRate": {
    "ratePlanCode": "AIF-2025",
    "amountBeforeTax": 932.58,
    "amountAfterTax": 932.58,
    "packageLabel": { "en": "All Inclusive Family" },
    "includesLabels": { "en": ["Breakfast", "Lunch", "Dinner", ...] }
  },
  "rateCode": "AIF-2025",
  
  // Pago
  "payment": {
    "cardNumber": "************1234",
    "cardholderName": "John Doe",
    "expiryDate": "12/26",
    "cvv": "***"
  },
  
  // Extras
  "promoCode": "SUMMER2025",
  "confirmationNumber": "MPB-20250130-A1B2C",
  "reservationId": "RES-1738267890123",
  "createdAt": "2025-01-30T15:30:00.000Z"
}
```

## 🔌 Próximo paso: API de Reservas

Para completar el flujo, necesitas crear un endpoint que:

### 1. Reciba el `completeBookingData`
### 2. Cree la reserva en Opera PMS
### 3. Procese el pago
### 4. Envíe confirmación por email

**Ejemplo de endpoint** (`src/routes/api/reservations/+server.ts`):

```typescript
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const bookingData = await request.json();
    
    // 1. Validar datos
    if (!bookingData.mainContact?.email) {
      return json({ error: 'Email required' }, { status: 400 });
    }
    
    // 2. Crear reserva en Opera PMS
    const operaReservation = await createOperaReservation({
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      roomType: bookingData.room.roomTypeCode,
      ratePlan: bookingData.rateCode,
      guests: bookingData.guests,
      amount: bookingData.selectedRate.amountAfterTax
    });
    
    // 3. Procesar pago
    const paymentResult = await processPayment({
      amount: bookingData.selectedRate.amountAfterTax,
      cardData: bookingData.payment,
      reference: bookingData.confirmationNumber
    });
    
    // 4. Guardar en base de datos (opcional)
    await saveReservationToDatabase(bookingData);
    
    // 5. Enviar email de confirmación
    await sendConfirmationEmail({
      to: bookingData.mainContact.email,
      confirmationNumber: bookingData.confirmationNumber,
      ...bookingData
    });
    
    return json({
      success: true,
      confirmationNumber: bookingData.confirmationNumber,
      operaReservationId: operaReservation.id
    });
    
  } catch (error) {
    console.error('Reservation error:', error);
    return json({ error: 'Failed to create reservation' }, { status: 500 });
  }
};
```

## 🎯 Beneficios de esta migración

### Antes (estado local):
- ❌ Datos dispersos en múltiples componentes
- ❌ Difícil de debuggear
- ❌ Props drilling (pasar datos por muchos niveles)
- ❌ Difícil agregar features
- ❌ No se puede acceder a datos desde otros lugares

### Ahora (store global):
- ✅ Un único lugar para todos los datos
- ✅ Debug panel en tiempo real
- ✅ Acceso desde cualquier componente
- ✅ Fácil agregar nuevas features
- ✅ Datos disponibles en toda la aplicación
- ✅ Listo para enviar a API con un solo objeto
- ✅ Type-safe con TypeScript

## 🧪 Testing del Store

Puedes testear el store fácilmente:

```typescript
import { bookingStore, completeBookingData } from '$lib/stores';
import { get } from 'svelte/store';

// Set search criteria
bookingStore.setSearchCriteria({
  checkIn: '2025-02-01',
  checkOut: '2025-02-05',
  adults: 2,
  children: 1
});

// Get current value
const current = get(bookingStore);
console.log('Current booking:', current);

// Get complete data
const complete = get(completeBookingData);
console.log('Complete data:', complete);

// Reset
bookingStore.reset();
```

## 📚 Documentación

Para más detalles, ver:
- `BOOKING_STORE.md` - Documentación completa del store
- `src/lib/stores/booking.ts` - Código fuente del store
- `src/lib/stores/index.ts` - Exports centralizados

## 🐛 Debug Tips

1. Abre la app con `?debug=true`
2. Click en el panel de debug
3. Navega por las 3 pestañas
4. Copia el JSON cuando necesites compartir estado
5. Usa el botón Reset para limpiar todo

## ✨ Siguiente Features Sugeridos

Ahora que tienes el store global, es fácil agregar:

1. **Persistencia**: Guardar en localStorage para no perder datos al refrescar
2. **Historial**: Ver reservas anteriores del usuario
3. **Multi-idioma**: El store ya tiene el lenguaje, solo falta implementar
4. **Analytics**: Track cada paso del funnel
5. **A/B Testing**: Experimentar con diferentes flujos
6. **Abandonos**: Recuperar carritos abandonados

¿Quieres que implemente alguno de estos? 🚀
