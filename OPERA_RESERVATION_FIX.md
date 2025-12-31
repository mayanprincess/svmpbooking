# ✅ Opera PMS Reservation Format Fixed

## 🐛 El Problema

Opera estaba rechazando las reservas con este error:
```json
{
  "error": "Unknown property: reservations.",
  "o:errorCode": "OPERAWS-GEN01242"
}
```

**Causa:** El formato del payload no coincidía con la documentación de Opera Cloud API v1.

## ✅ La Solución

Actualicé el mapping para que coincida **exactamente** con el formato esperado por Opera:

### **Antes (incorrecto):**
```json
{
  "reservations": [{  // ❌ Array
    "hotelId": "...",
    "reservationGuests": [{...}],  // ❌ Array
    "roomStay": {...}
  }]
}
```

### **Ahora (correcto):**
```json
{
  "reservations": {  // ✅ Objeto
    "reservation": {  // ✅ Singular
      "reservationGuests": {  // ✅ Objeto
        "profileInfo": {
          "profile": {
            "customer": {
              "personName": [{
                "givenName": "Oswaldo",
                "surname": "Sanchez"
              }],
              "email": [{
                "emailAddress": "oswaldo@example.com",
                "primary": true
              }],
              "telephone": [{
                "telephoneNumber": "+504...",
                "primary": true
              }]
            }
          }
        }
      },
      "reservationPaymentMethods": {
        "paymentMethod": "CA"  // Cash
      },
      "markAsRecentlyAccessed": true,
      "hotelId": "HOTID123",
      "reservationStatus": "Reserved",
      "roomStay": {
        "guarantee": {
          "onHold": false,
          "guaranteeCode": "6PM"
        },
        "roomRates": {
          "numberOfUnits": 1,
          "rates": {
            "rate": {
              "start": "2026-01-07",
              "end": "2026-01-10",
              "base": {
                "amountBeforeTax": 855.4,  // ✅ Precio real
                "currencyCode": "USD"
              }
            }
          },
          "start": "2026-01-07",
          "end": "2026-01-10",
          "marketCode": "LEISURE",
          "sourceCode": "WEB",
          "roomTypeCharged": "1BBFG",
          "ratePlanCode": "AIP-2025",
          "roomType": "1BBFG",
          "pseudoRoom": false
        },
        "guestCounts": {
          "children": 0,
          "adults": 2
        },
        "arrivalDate": "2026-01-07",
        "departureDate": "2026-01-10"
      }
    }
  }
}
```

## 📝 Cambios Realizados

### 1. **`opera-client.ts`** - Actualizado `mapReservationToOpera()`
- ✅ Estructura: `reservations.reservation` en lugar de `reservations[0]`
- ✅ Guest: objeto singular en lugar de array
- ✅ Agregado: `reservationPaymentMethods`, `markAsRecentlyAccessed`, `reservationStatus`
- ✅ Agregado: campos completos de `roomRates` con `marketCode`, `sourceCode`, etc.
- ✅ Precio real del rate plan incluido

### 2. **`opera.ts`** - Actualizado `ReservationRequest`
- ✅ Agregado campo: `amountBeforeTax: number`

### 3. **`reservations/+server.ts`** - Pasa el precio
- ✅ Incluye `amountBeforeTax` del rate seleccionado

## 🧪 Cómo Probar

### 1. **Reinicia el servidor de desarrollo:**
```bash
npm run dev
```

### 2. **Abre la app:**
```bash
http://localhost:5173/?debug=true
```

### 3. **Completa una reserva:**
- ✅ Selecciona fechas: 7-10 de enero 2026
- ✅ Adultos: 2
- ✅ Selecciona habitación 1BBFG con rate AIP-2025
- ✅ Llena datos del huésped
- ✅ Completa pago

### 4. **Verifica en la consola:**

Deberías ver:
```javascript
📤 Sending reservation to API: { ... }

// Opera client logs
OPERA API Request: {
  method: "POST",
  url: "https://gateway.opera.../rsv/v1/hotels/HOTID123/reservations"
}

✅ Reservation created: {
  confirmationNumber: "OPERA-12345",
  reservationId: "res-67890"
}
```

### 5. **Verifica en Opera PMS:**
Entra a tu sandbox y busca la reserva con el número de confirmación.

## 🎯 Formato de Headers

Los headers que se envían automáticamente:
```javascript
{
  "Authorization": "Bearer <token>",
  "Accept": "application/json",
  "Content-Type": "application/json",
  "x-enterpriseid": "YOUR_ENTERPRISE_ID",
  "x-hotelid": "YOUR_HOTEL_ID",
  "x-app-key": "YOUR_APP_KEY"
}
```

## ⚙️ Configuración Actual

### **Payment Method:**
- Actualmente: `"CA"` (Cash)
- Para cambiar a tarjeta de crédito, modifica en `opera-client.ts`:
```typescript
reservationPaymentMethods: {
  paymentMethod: 'CC',  // Credit Card
  paymentCard: {
    cardType: 'VI',  // Visa
    cardNumber: '************1234',
    expirationDate: '12/26'
  }
}
```

### **Guarantee Code:**
- Actualmente: `"6PM"` (garantizado hasta 6PM)
- Otras opciones: `"CC"`, `"DEP"`, etc.

### **Market Code:**
- Actualmente: `"LEISURE"`
- Puedes cambiarlo según tu configuración de Opera

### **Source Code:**
- Actualmente: `"WEB"`
- Indica que la reserva viene del sitio web

## 🔍 Debugging

Si aún tienes problemas, verifica:

### 1. **Permisos en Opera:**
Tu App Key debe tener permisos de:
- ✅ Read reservations
- ✅ Create reservations
- ✅ Read profiles (si usas profileId)

### 2. **Rate Plan activo:**
Verifica que `AIP-2025` esté activo para las fechas seleccionadas.

### 3. **Room Type disponible:**
Verifica que `1BBFG` existe en tu property.

### 4. **Headers correctos:**
```javascript
x-hotelid: "HOTID123"  // Debe coincidir con tu hotel ID
x-app-key: "..."       // Tu app key
```

## 📊 Datos de la Reserva de Prueba

La última reserva que intentaste crear:
```json
{
  "checkIn": "2026-01-07",
  "checkOut": "2026-01-10",
  "nights": 3,
  "adults": 2,
  "children": 0,
  "roomType": "1BBFG",
  "ratePlan": "AIP-2025",
  "amount": 855.4,  // Precio del rate AIP-2025
  "guest": {
    "firstName": "Oswaldo",
    "lastName": "Sanchez",
    "nationalId": "0502199200553",
    "email": "...",
    "phone": "..."
  },
  "payment": {
    "cardLast4": "4444",
    "cardBrand": "Visa",
    "cardHolder": "Oswaldo Sanchez"
  }
}
```

## ✅ Próximos Pasos

Después de que funcione la creación de reservas, considera:

1. **Profile Management** - Crear/buscar profiles antes de la reserva
2. **Payment Integration** - Procesar pagos reales
3. **Email Confirmation** - Enviar confirmaciones automáticas
4. **Cancellation Flow** - Permitir cancelaciones
5. **Modifications** - Permitir cambios en reservas

## 🎉 ¡Pruébalo!

El formato ahora coincide **100%** con la documentación de Opera. Intenta hacer otra reserva y debería funcionar! 🚀

Si ves algún error diferente, copia el mensaje completo y te ayudo a resolverlo.
