# Gateway de Pagos — CyberSource Unified Checkout

## Resumen

El sistema de pagos utiliza **CyberSource Unified Checkout** con `type: "CAPTURE"`, lo que significa que CyberSource maneja de forma automática todo el proceso de cobro, incluyendo la autenticación 3D Secure (3DS). No se requiere orquestación manual de pasos 3DS en el frontend.

---

## Arquitectura

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Frontend   │──────▶│  SvelteKit API   │──────▶│  Backend (.NET) │
│  (Svelte 5)  │       │   (Proxy)        │       │                 │
└──────┬───────┘       └──────────────────┘       └────────┬────────┘
       │                                                   │
       │         ┌─────────────────────────┐               │
       └────────▶│  CyberSource (iframe)   │◀──────────────┘
                 │  Unified Checkout       │
                 └─────────────────────────┘
```

El frontend nunca se comunica directamente con CyberSource para operaciones sensibles. Todo pasa por el backend a través de endpoints proxy en SvelteKit.

---

## Flujo Completo

### Paso 1 — Crear reservación y obtener Capture Context

**Componente:** `BookingStepper.svelte` → `requestCaptureContextFromReservation()`  
**Endpoint:** `POST /api/reservation`  
**Backend:** `POST /reservations`

Cuando el usuario completa el formulario de datos del huésped y presiona **"Continue to Payment"**, se envía la información de la reserva al backend. Este crea la reservación y genera un **Capture Context** (JWT) a través de la API de CyberSource (`/up/v1/capture-contexts`).

**Payload enviado al backend:**
```json
{
  "checkIn": "2026-03-10",
  "checkOut": "2026-03-15",
  "roomTypeCode": "DLXK",
  "ratePlanCode": "BAR",
  "adults": 2,
  "children": 0,
  "guest": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+50412345678"
  },
  "amountBeforeTax": 1500.00
}
```

**Respuesta del backend:**
```json
{
  "Token": "<capture-context-jwt>",
  "ReservationId": "res-12345"
}
```

El Capture Context JWT contiene internamente:
- La URL del script de Unified Checkout (`clientLibrary`)
- El hash de integridad (`clientLibraryIntegrity`)
- La configuración del `completeMandate` con `type: "CAPTURE"`

### Paso 2 — Inicializar Unified Checkout

**Componente:** `BookingStepper.svelte` → `launchUnifiedCheckout()`

Una vez obtenido el Capture Context:

1. Se decodifica el JWT para extraer `clientLibrary` (URL del script)
2. Se carga el script dinámicamente en el DOM
3. Se inicializa con `Accept(captureContext)`
4. Se crea la instancia con `accept.unifiedPayments(false)` (modo embebido)
5. Se renderiza el formulario de pago con `up.show(showArgs)`

```javascript
const accept = await Accept(captureContext);
const up = await accept.unifiedPayments(false);

const showArgs = {
  containers: {
    paymentSelection: '#uc-payment-selection',
    paymentScreen: '#html-container'
  }
};

const showResult = await up.show(showArgs);
```

El formulario de tarjeta se renderiza dentro de iframes de CyberSource en los contenedores HTML especificados.

### Paso 3 — Procesar el pago

Cuando el usuario llena los datos de la tarjeta y presiona "Pay", se ejecuta:

```javascript
const completeResponse = await up.complete(showResult);
```

CyberSource internamente:
1. Tokeniza la tarjeta
2. Ejecuta la autenticación 3D Secure (si aplica, puede abrir un popup para OTP)
3. Realiza la autorización y captura del cobro

La respuesta es un JWT que al decodificarse contiene:

```json
{
  "id": "7727502856846446204501",
  "outcome": "AUTHORIZED",
  "status": "AUTHORIZED",
  "message": "Request processed successfully.",
  "details": {
    "processorInformation": {
      "approvalCode": "831000",
      "responseCode": "00"
    },
    "orderInformation": {
      "amountDetails": {
        "authorizedAmount": "1865.16",
        "currency": "USD"
      }
    }
  }
}
```

### Paso 4 — Confirmar el pago

**Endpoint:** `POST /api/payment/confirm-payment`  
**Backend:** `POST /payment/confirm-payment`

Si el outcome es `AUTHORIZED`, el frontend envía la confirmación al backend:

**Request:**
```json
{
  "ReservationId": "res-12345",
  "ApprovalCode": "831000",
  "PaymentId": "7727502856846446204501"
}
```

**Response:**
```json
{
  "Status": "OK",
  "Message": "Payment confirmed",
  "reservationId": "res-12345",
  "confirmationNumber": "CONF-98765"
}
```

Con esta respuesta se actualiza el store y se navega a la pantalla de confirmación.

### Paso 5 — Pantalla de confirmación

Se llama a `bookingStore.setConfirmation(confirmationNumber, reservationId)` y `bookingStore.goToStep('confirmation')` para mostrar los detalles finales de la reserva al usuario.

---

## Manejo de Errores

### 3DS Authentication Failed

Si la autenticación 3D Secure falla (tarjeta rechazada, OTP incorrecto, etc.), `complete()` lanza un `AcceptError`:

```javascript
{
  name: "AcceptError",
  reason: "COMPLETE_AUTHENTICATION_FAILED",
  message: "Consumer Authentication failure."
}
```

El sistema muestra un mensaje al usuario y ejecuta `restartPaymentFlow()`, que:
1. Limpia los contenedores HTML del formulario de pago
2. Remueve el script de CyberSource del DOM
3. Resetea el estado interno (token, script URL, referencias)
4. Solicita un nuevo Capture Context al backend
5. Relanza Unified Checkout con el nuevo contexto

### Error en confirm-payment

Si la confirmación falla después de una autorización exitosa, se muestra el error al usuario y se reinicia el flujo de pago.

### Cobro no autorizado

Si `complete()` devuelve un outcome distinto a `AUTHORIZED`, se lanza un error genérico y se reinicia el flujo.

---

## Archivos Involucrados

| Archivo | Descripción |
|---------|-------------|
| `src/lib/components/BookingStepper.svelte` | Orquesta todo el flujo de pagos en el frontend |
| `src/lib/components/GuestDetailsForm.svelte` | Formulario de datos del huésped (previo al pago) |
| `src/routes/api/reservation/+server.ts` | Proxy: crea reserva y obtiene Capture Context |
| `src/routes/api/payment/confirm-payment/+server.ts` | Proxy: confirma el pago en el backend |
| `src/lib/stores/booking.ts` | Store de Svelte con el estado de la reserva |
| `src/lib/config/config.ts` | Configuración con la URL del backend |

---

## Configuración del Capture Context (Backend)

El backend genera el Capture Context con la siguiente estructura para la API `/up/v1/capture-contexts`:

```json
{
  "clientVersion": "0.26",
  "targetOrigins": ["https://tu-dominio.com"],
  "allowedCardNetworks": ["VISA", "MASTERCARD", "AMEX"],
  "allowedPaymentTypes": ["PANENTRY"],
  "country": "HN",
  "locale": "es_US",
  "captureMandate": {
    "billingType": "FULL",
    "requestEmail": false,
    "requestPhone": false,
    "requestShipping": false,
    "showAcceptedNetworkIcons": true
  },
  "orderInformation": {
    "amountDetails": {
      "totalAmount": "1865.16",
      "currency": "USD"
    }
  },
  "completeMandate": {
    "type": "CAPTURE",
    "decisionManager": true,
    "consumerAuthentication": true
  }
}
```

Campos clave del `completeMandate`:
- **`type: "CAPTURE"`** — CyberSource realiza autorización + captura en un solo paso
- **`consumerAuthentication: true`** — Habilita 3D Secure automático
- **`decisionManager: true`** — Habilita el servicio de detección de fraude

---

## Tarjetas de Prueba (Ambiente de Test)

| Tarjeta | Número | Comportamiento |
|---------|--------|----------------|
| Test Case 2.10a | 4000 0000 0000 2537 | 3DS exitoso con Step-Up (OTP) |
| Test Case 2.11a | 4000 0000 0000 2545 | 3DS fallido (AUTHENTICATION_FAILED) |
| Test Case 2.2 | 4000 0000 0000 2503 | Frictionless fallido |
| Visa básica | 4111 1111 1111 1111 | Autorización directa |

> **Nota:** Algunas tarjetas de prueba están pre-programadas para fallar 3DS independientemente del OTP ingresado. El popup de OTP es decorativo en esos casos y `complete()` resuelve/rechaza inmediatamente.
