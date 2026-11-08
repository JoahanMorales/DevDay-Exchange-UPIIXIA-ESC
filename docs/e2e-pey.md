# E2E con pey real ($0.01) — para Fer y Victor

Prueba de punta a punta: sync desde un teléfono → push CoDi real de **$0.01** → Fer aprueba →
webhook firmado → el dashboard muestra **PAGADA** con la clave de rastreo (tracking key).
La corren humanos; el agente nunca toca el portal ni los secretos.

URL pública: `https://sinsenal-9lb5.onrender.com` (ver `docs/deploy.md`).

## 1. Registrar el webhook (Fer, portal de pey)

1. Portal de pey → **Webhooks** → **Agregar endpoint**.
2. URL: `https://sinsenal-9lb5.onrender.com/webhooks/pey`
3. Evento: `codi.pn.payment_received` (o todos los eventos CoDi PN).
4. Guardar y copiar el **secreto de firma** (formato Standard Webhooks, empieza con `whsec_`).
   No lo pegues en el chat, en un issue ni en git.

## 2. Configurar Render (Victor, dashboard de Render)

Servicio `sinsenal` → **Environment**:

| Variable | Valor |
|---|---|
| `PEY_WEBHOOK_SECRET` | el secreto del paso 1 |
| `PEY_API_KEY` | la API key del portal de pey |
| `PEY_BASE_URL` | la base URL de la API de pey |
| `DEMO_MODE` | `1` |
| `DEMO_REAL_AMOUNT` | `0.01` (con `DEMO_MODE` activo se cobra esto en vez del monto real) |

Guardar → Render redeploya. Comprobar:

```bash
curl -fsS https://sinsenal-9lb5.onrender.com/api/health
# Sin firma debe responder 401 (no 503: 503 = secreto no configurado)
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://sinsenal-9lb5.onrender.com/webhooks/pey -d '{}'
```

## 3. Corrida E2E (Fer, con dos teléfonos o uno + laptop)

1. Abrir el dashboard del comercio en la laptop (`https://sinsenal-9lb5.onrender.com`).
2. En el teléfono, hacer un sync de una deuda (PWA instalada, flujo normal).
3. Arrancar cronómetro en el momento del sync.
4. Llega el push CoDi a la app bancaria de Fer por **$0.01** → aprobar.
5. Esperar a que el dashboard cambie a **PAGADA** y muestre la tracking key. Parar cronómetro.
6. Si no cambia en ~60 s: portal de pey → **Webhook Logs** → revisar el código de respuesta
   (401 = secreto distinto en Render; 503 = falta `PEY_WEBHOOK_SECRET`; timeout = servicio dormido).

## 4. Resultados (Fer llena esta tabla, sin datos personales)

No anotar teléfono, CLABE, nombre ni la tracking key completa (solo los últimos 4 caracteres).

| Fecha | Banco | Sync → push (s) | Push → aprobado (s) | Aprobado → PAGADA en dashboard (s) | Total (s) | Tracking key (últimos 4) | Webhook HTTP |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |

Notas / incidencias:

-
