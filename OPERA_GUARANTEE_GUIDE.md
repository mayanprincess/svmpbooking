# 🏨 Opera PMS - Guía de Garantías de Reservas

## 📚 Tabla de Contenidos
- [Tipos de Garantías](#tipos-de-garantías)
- [OnHold vs Guaranteed](#onhold-vs-guaranteed)
- [Mejores Prácticas](#mejores-prácticas)
- [Códigos de Garantía Comunes](#códigos-de-garantía-comunes)
- [Cómo Aparecen en el Dashboard](#cómo-aparecen-en-el-dashboard)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Tipos de Garantías

Opera PMS admite diferentes tipos de garantías para las reservas:

### 1. **Guaranteed Reservations (Reservas Garantizadas)**
```typescript
guarantee: {
    guaranteeCode: '6PM',           // Código de garantía
    shortDescription: '6PM Hold',   // Descripción corta
    onHold: false                   // false = garantizada
}
```

**Características:**
- ✅ Aparecen **inmediatamente** en el dashboard principal
- ✅ Se muestran en la búsqueda estándar de reservas
- ✅ Estado: **"Reserved"** o **"Due In"**
- ✅ El hotel las considera **confirmadas**
- ✅ Pueden ser check-in directamente

**Cuándo usarlas:**
- Reservas con pago por adelantado
- Reservas con tarjeta de crédito
- Reservas con depósito
- **Recomendado para bookings web**

---

### 2. **On Hold Reservations (Reservas Tentativas)**
```typescript
guarantee: {
    guaranteeCode: '6PM',
    shortDescription: '6PM Hold',
    onHold: true                    // true = tentativa
}
```

**Características:**
- ⚠️ Pueden **NO aparecer** en el dashboard principal por defecto
- ⚠️ Están en sección **"Tentative"** o **"On Hold"**
- ⚠️ Tienen **tiempo límite** para confirmarse
- ⚠️ Requieren **conversión manual** a garantizada
- ⚠️ Pueden ser **auto-canceladas** si no se confirman

**Cuándo usarlas:**
- Reservas pendientes de pago
- Quotes o cotizaciones
- Reservas que requieren aprobación manual
- **NO recomendado para bookings web automatizados**

---

### 3. **Credit Card Guarantee**
```typescript
guarantee: {
    guaranteeCode: 'CC',
    shortDescription: 'Credit Card Guarantee',
    onHold: false
}
```

Con información de tarjeta (opcional, para mayor seguridad):
```typescript
reservationPaymentMethods: [
    {
        paymentMethod: 'CC',
        folioView: 1,
        paymentCard: {
            cardType: 'VI',                    // VI=Visa, MC=MasterCard, AX=Amex
            cardNumber: 'xxxxxxxxxxxx1234',    // Enmascarada
            cardHolderName: 'John Doe',
            expirationDate: '12/26'
        }
    }
]
```

---

## 🔄 OnHold vs Guaranteed

| Característica | OnHold = true | OnHold = false |
|----------------|---------------|----------------|
| **Aparece en dashboard** | ❌ Puede no aparecer | ✅ Aparece inmediatamente |
| **Estado inicial** | Tentative | Reserved/Due In |
| **Requiere confirmación** | ✅ Sí | ❌ No |
| **Tiempo límite** | ✅ Sí (6PM, 24h, etc.) | ❌ No |
| **Auto-cancelación** | ✅ Posible | ❌ No |
| **Check-in directo** | ❌ No | ✅ Sí |
| **Búsqueda estándar** | ⚠️ Depende del filtro | ✅ Sí |

---

## 🎯 Mejores Prácticas

### ✅ Para Bookings Web (Recomendado)

**Opción 1: Garantía con código 6PM**
```typescript
guarantee: {
    guaranteeCode: '6PM',
    shortDescription: '6PM Hold',
    onHold: false  // Garantizada, NO tentativa
}
```

**Opción 2: Garantía con tarjeta de crédito**
```typescript
guarantee: {
    guaranteeCode: 'CC',
    shortDescription: 'Credit Card Guarantee',
    onHold: false
}
```

**Opción 3: Garantía con depósito**
```typescript
guarantee: {
    guaranteeCode: 'DEP',
    shortDescription: 'Deposit Guarantee',
    onHold: false
}
```

### ❌ Evitar para Bookings Web

```typescript
guarantee: {
    onHold: true  // ❌ NO recomendado para web
}
```

**Razón:** Las reservas OnHold=true:
- No aparecen en búsquedas estándar
- Confunden a los agentes del hotel
- Pueden ser auto-canceladas
- Requieren pasos manuales adicionales

---

## 📋 Códigos de Garantía Comunes

Estos son los códigos estándar de Opera PMS (pueden variar por hotel):

| Código | Descripción | Uso típico |
|--------|-------------|------------|
| `6PM` | Hold until 6PM | Llegadas del mismo día |
| `CC` | Credit Card | Pago con tarjeta |
| `DEP` | Deposit | Depósito pagado |
| `CA` | Cash | Pago en efectivo |
| `GT` | Guaranteed | Garantía general |
| `PD` | Paid in Full | Pagado completamente |

**⚠️ Importante:** Los códigos exactos dependen de la configuración de tu propiedad en Opera. Verifica con tu administrador cuáles están activos.

---

## 🖥️ Cómo Aparecen en el Dashboard

### Reservas Garantizadas (`onHold: false`)

**Ubicación en Opera PMS:**
```
Reservations → Advanced Search
Filter: Status = "Reserved" or "Due In"
→ Aparecen en la lista principal ✅
```

**Búsqueda rápida:**
```
- Por nombre del huésped ✅
- Por número de confirmación ✅
- Por fecha de llegada ✅
- Por teléfono/email ✅
```

---

### Reservas Tentativas (`onHold: true`)

**Ubicación en Opera PMS:**
```
Reservations → Advanced Search
Filter: Status = "Tentative" or check "Include On Hold"
→ Pueden NO aparecer sin este filtro ⚠️
```

**Problema común:**
```
Usuario busca por nombre → No encuentra nada
Razón: El filtro no incluye "Tentative" por defecto
Solución: Marcar "Include On Hold Reservations"
```

---

## 🔍 Troubleshooting

### Problema 1: "No encuentro la reserva en Opera"

**Verificar:**
1. **Estado de la reserva:**
   ```typescript
   // En el código
   reservationStatus: 'Reserved',  // ¿Qué dice?
   onHold: false                   // ¿Es false o true?
   ```

2. **Filtros en Opera:**
   - ✅ Buscar sin filtros (dejar todo en blanco)
   - ✅ Marcar "Include On Hold" si aplica
   - ✅ Expandir rango de fechas
   - ✅ Buscar solo por apellido

3. **Hotel correcto:**
   ```typescript
   x-hotelid: 'MAYAN'  // ¿Estás en el hotel correcto?
   ```

---

### Problema 2: "La reserva aparece como Tentative"

**Causa:** Tienes `onHold: true`

**Solución:**
```typescript
// En opera-client.ts línea ~478
guarantee: {
    guaranteeCode: '6PM',
    shortDescription: '6PM Hold',
    onHold: false  // Cambiar a false
}
```

---

### Problema 3: "Error: Invalid guarantee code"

**Causa:** El código de garantía no existe en tu propiedad

**Solución:**
1. Verificar en Opera:
   ```
   Configuration → Reservations → Guarantee Codes
   ```

2. Usar un código válido:
   ```typescript
   guarantee: {
       guaranteeCode: 'GT',  // Código genérico, suele estar siempre
       onHold: false
   }
   ```

---

## 🧪 Prueba Recomendada

### Paso 1: Crear una reserva de prueba

```bash
# En tu app
1. Selecciona fechas futuras (ej: próxima semana)
2. Completa el booking flow
3. Obtén el Reservation ID (ej: 13454122)
```

### Paso 2: Verificar en Opera PMS

```
1. Login a Opera PMS
2. Ir a: Reservations → Advanced Search
3. Buscar por:
   - Reservation ID: 13454122
   - O por apellido del huésped
4. Verificar que aparezca con Status="Reserved" ✅
```

### Paso 3: Si no aparece

```
1. Marcar checkbox: "Include On Hold Reservations"
2. Si ahora aparece → Cambiar onHold a false en el código
3. Si aún no aparece → Verificar x-hotelid es correcto
```

---

## 📊 Configuración Actual en el Código

### Ubicación:
`src/lib/services/opera-client.ts` línea 478

### Configuración Recomendada:
```typescript
guarantee: {
    guaranteeCode: '6PM',
    shortDescription: '6PM Hold',
    onHold: false  // ✅ Garantizada
}
```

### Para Payment Method:
`src/lib/services/opera-client.ts` línea 540

```typescript
reservationPaymentMethods: [
    {
        paymentMethod: 'CA',  // CA = Cash, CC = Credit Card
        folioView: 1
    }
]
```

**Recomendación:** Si procesas pagos con tarjeta, cambia a:
```typescript
paymentMethod: 'CC'  // Credit Card
```

---

## 🎯 Resumen Ejecutivo

### Para bookings web automatizados:

✅ **USA:**
```typescript
guarantee: {
    guaranteeCode: '6PM' or 'CC' or 'DEP',
    onHold: false  // Siempre false para web
}
```

❌ **EVITA:**
```typescript
guarantee: {
    onHold: true  // Causa problemas en dashboard
}
```

### Checklist de Reserva Exitosa:

- [ ] `onHold: false` ✅
- [ ] `guaranteeCode` válido (6PM, CC, DEP, GT)
- [ ] `reservationStatus: 'Reserved'` ✅
- [ ] `x-hotelid` correcto en headers
- [ ] Verification endpoint funciona (`/test/reservation`)

---

## 📞 Soporte

Si después de estos cambios la reserva aún no aparece:

1. **Verifica permisos de API:**
   - x-app-key tiene permisos de CREATE_RESERVATION
   - User tiene permisos en Opera para ese hotel

2. **Contacta a Oracle Hospitality Support:**
   - Proporciona el Reservation ID
   - Menciona que la API devuelve 201 pero no aparece en UI

3. **Verifica configuración de Opera:**
   - Puede haber reglas de negocio personalizadas
   - Algunos hoteles tienen workflows especiales

---

## 🚀 Próximos Pasos

Después de solucionar las garantías:

1. **[ ] Payment Integration** - Procesar pagos reales con Stripe/PayPal
2. **[ ] Email Confirmations** - Enviar emails automáticos
3. **[ ] Pre-Authorization** - Autorizar tarjetas antes de reservar
4. **[ ] Profile Management** - Crear perfiles de huéspedes
5. **[ ] Cancellation Policy** - Implementar cancelaciones

---

**✅ Cambios Aplicados:** El código ahora usa `onHold: false` por defecto, lo que garantiza que las reservas aparezcan en el dashboard principal de Opera PMS.
