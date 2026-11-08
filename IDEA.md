# IDEA · SinSeñal

> Reto: DevDay Exchange Community Hackathon: Mexico City (herramientas de bien público con OpenAI + CoDi vía la API de pey) · Evento: sábado 7 y domingo 8 de noviembre de 2026, Utopía Elena Poniatowska, Coyoacán, CDMX. Entrega: **domingo 8 de noviembre, 13:00 (America/Mexico_City)**, por el portal del evento **y** por correo a hola@aibuilders.lat. Organizan Ben Kim (Codex Ambassador) y Esteban Constante (Codex Community Events), AI Builders México, UTOPÍAS, SEDECO CDMX y pey.
> Marcas: **[Decidido]** · **[Recomendación]** · **[Por validar]** (probar o citar antes del pitch). Toda cifra del pitch sale de §11 con fuente. Lo que no está en §11 no se dice en el escenario.
> Cada sección alimenta una pieza del backlog: §4 → tareas verticales · §6 → contrato · §7/§9 → spikes · §8 → criterios de aceptación · §12 → olas de `/hack-plan`.
> Repo nuevo (github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC): no hay proyecto anterior que limpiar. Stack instalado desde `.uak/stacks/fastapi-react/STACK.md`; el backlog vivo es `.uak/TASKS.md` (generado con `/uak-plan` a partir de este documento).

---

## 0. Contexto en 60 segundos (léelo aunque tengas prisa)

- **Qué construimos:** un sistema de pagos para comercios de barrio que **sigue funcionando cuando no hay red** (sismo, apagón, mercado sin señal) y cuya confirmación **no se puede falsificar** (ni con comprobantes editados, ni con bocinas falsas, ni con voces generadas por IA). Sin red, el cliente **firma un pagaré digital**; el pagaré **viaja de celular en celular** hasta que alguno tiene señal; entonces se **cobra por CoDi** con la API de pey y el dinero cae directo en la cuenta del comercio.
- **La frase que lo une todo:** *el pago digital en México falla justo cuando más se necesita, y cuando funciona, nadie le cree.* Cada pieza del sistema ataca una de esas dos fallas (tabla en §2.3). Si una tarea no ataca ninguna, no va.
- **Principio técnico no negociable:** sin red **no se mueve dinero**; se mueve **una deuda firmada criptográficamente**. El dinero se mueve sólo por CoDi, sólo con aprobación del pagador en su app bancaria, y sólo se da por pagado con confirmación de pey (webhook firmado o consulta a la API).
- **Lo que el jurado verá (wow):** tres celulares en modo avión; un pago por sonido y otro con pulsera NFC; un audio falso y una voz clonada **rechazados en vivo**; el pagaré saltando entre celulares; al recuperar señal, **un cobro CoDi real de $0.01** llega al celular de un juez, lo aprueba y todo se pone en verde.

---

## 1. Una línea

Para **comercios de barrio y sus clientes en la CDMX**, que **vuelven al efectivo cada vez que la red falla o que una transferencia no se puede comprobar** (el 85% de las operaciones de menos de 500 pesos se paga en efectivo; sólo 2.47 M de 21.79 M de cuentas CoDi validadas han pagado alguna vez), **SinSeñal** permite **vender y cobrar en digital sin señal, con pagarés firmados que nadie puede falsificar y que se cobran solos por CoDi al volver la red**, a diferencia de **el efectivo, las terminales con comisión y los comprobantes de transferencia que se editan o se fingen**.

**Diferencial frente a otros equipos del reto:**
- Varios equipos del evento propusieron "pagos sin conexión por sonido" (lo vimos en persona el sábado). Casi todos se quedan en **transmitir** algo por sonido. Nosotros nos separamos en tres puntos que ellos no tienen: (1) **lo que viaja es una deuda firmada con reto de un solo uso**, no un "aviso de pago", así que una grabación o una voz de IA no sirven; (2) **el pagaré se propaga entre celulares** (guarda y reenvía) y no depende de que el cliente vuelva a conectarse; (3) **la liquidación es real por CoDi con pey**, con webhook firmado, clave de rastreo de Banxico y manejo de deudas (topes, reputación, fondo de garantía).
- Antes de la demo: buscar en el canal del evento y en GitHub repos públicos con "pey", "codi", "offline", "ggwave" para afinar este párrafo **[Por validar]**.

---

## 2. Problema y usuarios

### 2.1 Las dos fallas (el problema, en concreto)

| Falla | Qué pasa en la calle | Por qué empuja al efectivo |
|---|---|---|
| **F1 · Sin red no hay pago** | Sismo, apagón, red saturada, mercado techado sin señal, zona rural. Se necesita comprar agua, medicinas, pilas, gasolina, comida. | Sin internet no hay SPEI, CoDi, terminal ni app bancaria. La **propia Ley de Economía Digital** sólo permite seguir cobrando en efectivo ante falla de conectividad o de luz (art. 15): la ley reconoce que el pago digital se cae y que entonces se vuelve al efectivo. |
| **F2 · Con red, la confirmación se falsifica** | Transferencias "fantasma", capturas de comprobante editadas, bocinas o apps que anuncian pagos falsos (caso India con bocinas y audios generados), cobros enviados desde lejos para presionar o extorsionar. | El tendero aprende que **sólo el efectivo no miente**. La desconfianza en la confirmación es una barrera de adopción documentada (ver evidencia de confianza en §11 y antecedentes de Bachas et al. 2021). |

### 2.2 Personas

| Persona (nombre + rol) | Momento | Qué necesita | Paso del flujo |
|---|---|---|---|
| **Lupita**, dueña de una tiendita en San Lucas, Coyoacán (usuaria de entrada) | Se cayó la red tras un sismo; hay fila para comprar agua y pilas. | Seguir vendiendo sin efectivo y **saber con certeza** que lo que le "pagan" es real y se le va a cobrar. | 1, 2, 3, 5 |
| **Mario**, cliente con smartphone (usuario central) | No tiene efectivo, no hay señal, necesita agua. | Pagar con su celular aunque no haya red, sin que le cobren de más ni dos veces. | 1, 2, 5 |
| **Doña Carmen**, 78 años, sin smartphone propio (prueba de que nadie se queda fuera) | Compra sus medicinas y agua en la misma tienda. | Pagar acercando la muñeca (pulsera NFC sin batería), con monto en grande y en voz alta, y que nadie pueda cobrarle desde lejos. | 2 |
| **Vecino relevo** (cualquier persona con la app) | Pasa por la tienda o vive cerca. | Nada: su celular carga pagarés cifrados de la tienda y los sube al recuperar señal. | 4 |
| **Defensor/fondo** (SEDECO o Protección Civil) | Desastre declarado. | Garantizar a los comercios lo no cobrado para que se animen a vender en digital en crisis. | 6 |

### 2.3 Cada pieza resuelve una de las dos fallas (regla de alcance)

| Pieza | Falla |
|---|---|
| Pagaré firmado en el celular del pagador | F1 y F2 |
| Transporte por sonido (ggwave), NFC (Web NFC) o QR | F1 |
| Reenvío entre celulares (guarda y reenvía), cifrado para el servidor | F1 (y "el cliente nunca vuelve a conectarse") |
| Cobro push CoDi vía pey + webhook firmado al reconectar | F1 (el dinero sí llega) |
| Reto de un solo uso + contador monótono + firma | F2 (grabaciones, audios, voces clonadas, doble gasto) |
| Vibración del celular del comercio **sólo** tras verificar | F2 (bocinas y anuncios falsos) |
| Bloqueo por ubicación (50 m) | F2 (cobros a distancia, extorsión) |
| Tope sin conexión, reputación, fondo de garantía | Riesgo de deuda no cobrada (consecuencia de F1) |
| Pulsera NFC sin batería | F1 para quien no trae celular |
| IA de OpenAI (captura por voz del comercio, explicación de anomalías) | Operación del comercio; **nunca decide montos ni confirma pagos** |

- Dolor con fuente: 85% en efectivo en operaciones < $500; 2.47 M de 21.79 M de cuentas CoDi han pagado; art. 15 de la ley (§11).
- Resultado que cambia: **de "se cayó la red → se vende sólo en efectivo o se fía de palabra" a "se vende en digital sin red, con prueba criptográfica, y se cobra por CoDi en cuanto vuelve la señal"**. Métrica de demo: pagarés emitidos sin red → % liquidados por CoDi → tiempo de reconexión a cobro.

---

## 3. Caso de demo

**Escenario:** sismo en la CDMX un sábado por la tarde. La red celular de San Lucas, Coyoacán, cae o se satura. Lupita sigue abierta. Mario compra agua y pilas con su celular; Doña Carmen compra agua con su pulsera. Un vecino pasa por la tienda y su celular se lleva, cifrados, los pagarés del día. Más tarde, el celular de un tercero recupera señal y los sube: a Mario le llega el cobro CoDi y lo aprueba; la deuda de Doña Carmen se cobra al pagador que ella designó.

**Por qué este caso:**
- Es el escenario que la ley deja fuera (art. 15) y el que motivó la idea original del equipo (sismos, terremotos, tsunamis).
- La CDMX tiene alerta sísmica (SASMEX): un "modo desastre" activado por la alerta es una extensión natural **[Recomendación P2]**.
- Tiene contraejemplo claro para el jurado: hoy, sin red, la tienda sólo puede aceptar efectivo o fiar "de palabra" sin prueba.
- **No usar cifras de sismos pasados** (caídas de red de 2017, etc.) sin fuente verificada en §11. **[Por validar]**

**Final bueno para el jurado:** la pantalla de Lupita pasa de "3 pagarés pendientes" a "3 cobrados por CoDi" con clave de rastreo, en vivo, con dinero real.

---

## 4. Flujo de demo (≤ 6 pasos, ≤ 3 min; cada paso = 1 tarea vertical)

| # | Usuario hace | Ve en pantalla (concreto) | API | Prio |
|---|---|---|---|---|
| 1 | Lupita (tienda) teclea $25, toca "Cobrar sin red". Mario acerca su celular; se oye el chirrido (ggwave). | En la tienda: "Reto enviado" → "Pagaré válido · $25.00 · Mario ···4321 · #17" en verde **y el celular vibra**. En el de Mario: "Firmaste un pagaré por $25 a Tienda Lupita". Todo en modo avión. | ninguna (offline, local) | P0 |
| 2 | Doña Carmen acerca su pulsera NFC al celular de la tienda. | Monto en grande "$18.00", voz local "dieciocho pesos", "Pagaré con pulsera · tope restante $82" y vibración. | ninguna (offline, Web NFC) | P0 |
| 3 | Ataques en vivo: (a) otro integrante reproduce con una bocina la grabación del paso 1; (b) reproduce una voz generada con IA que dice "pago recibido"; (c) se intenta un pagaré con ubicación a 2 km; (d) se reenvía el mismo pagaré #17. | **Wow:** cuatro rechazos con motivo legible: "reto vencido/ya usado", "audio sin firma válida", "fuera de 50 m", "contador repetido". **El celular de la tienda no vibra.** | ninguna (offline) | P0 |
| 4 | El celular de la tienda pasa sus pagarés a un vecino (QR animado o sonido) y el vecino a un tercero. | "Llevas 2 pagarés cifrados para entregar" en el celular del vecino; contador de saltos. | ninguna (offline) | P1 (P0 si sobra tiempo: es parte del wow) |
| 5 | El tercer celular quita modo avión. | En el servidor: "2 pagarés recibidos · 0 duplicados · firmas válidas". A un juez (o a Mario) le llega un **cobro CoDi real de $0.01** en su app bancaria; lo aprueba con huella; la tienda pasa a "Cobrado por CoDi · clave de rastreo …". | `POST /api/sync`, `POST /webhooks/pey`, `GET /api/deudas` | P0 |
| 6 | Se abre el tablero de la tienda. | Deudas pendientes/cobradas, reputación de cada pagador (tope que sube o baja), botón "Desastre declarado: fondo de garantía". | `GET /api/deudas`, `GET /api/reputacion/{id}` | P1 |

- **Momento wow en una frase:** "Le acabamos de poner una voz de IA y una grabación a la tienda, y no vibró; pagamos de verdad sin señal, y al volver la red le llegó un cobro CoDi real al juez." · segundos hasta el wow: ~70 (paso 3) **[Decidido]**. Si el jurado tiene poca paciencia, abrir con el ataque (paso 3) a los 30 s.
- **Monto real de la demo:** el pagaré puede decir $25 en pantalla, pero **el cobro push real a pey se manda por $0.01** en modo demo (bandera `DEMO_REAL_AMOUNT=0.01`, visible en la UI como "monto de prueba"). No ocultarlo. **[Decidido]**
- **Plan B de cada paso que depende de red, micrófono, NFC o cámara:**
  - Paso 1 (sonido): si el ruido de la sala impide ggwave → QR animado (el mismo pagaré en QR) con un clic. Probar en la sala a volumen real. **[Por validar]**
  - Paso 2 (NFC): si Web NFC no funciona en el Android disponible → tarjeta NFC alternativa → QR impreso en la pulsera (misma credencial).
  - Paso 4 (relevo): QR animado entre celulares (independiente de audio y de Bluetooth).
  - Paso 5 (pey): si el push no llega al banco del juez → `POST /codi/qr` con `amount: 0.01` en pantalla para que lo escanee; si falla la red del lugar → hotspot propio; si todo falla → video grabado del paso 5 + "Webhook Logs" del portal de pey.
  - Grabar el recorrido completo como plan B antes de las 11:30.

---

## 5. Núcleo técnico (lo que el jurado verá)

### 5.1 Principio
- **Sin red:** se emite un **pagaré** (IOU) firmado por el pagador. No hay dinero, saldo ni custodia; hay **una promesa verificable**.
- **Con red:** el servidor verifica, deduplica y **convierte el pagaré en un cobro CoDi push** por pey. El dinero va del banco del pagador a la CLABE del comercio. **Nadie custodia dinero** (ni nosotros ni el comercio de terceros). **[Decidido]**
- **El LLM no produce ningún número ni confirma nada.** Montos: los teclea o confirma la persona del comercio. Verificación: criptografía determinista. Confirmación de cobro: pey. **[Decidido]**

### 5.2 Identidad y llaves (alta, una vez, con red)
- El celular del pagador genera un par de llaves con **WebCrypto**, `extractable: false`, guardado en IndexedDB. Algoritmo: **ECDSA P-256 (SHA-256)** **[Decidido]** porque está en todos los navegadores modernos; Ed25519 en WebCrypto es opcional **[Por validar soporte en los celulares del equipo]**.
- El servidor registra: `payer_id` (ULID), llave pública, número CoDi (10 dígitos), pagador de respaldo opcional, tope sin conexión, `counter_base`.
- El servidor emite una **credencial firmada** con su propia llave (ECDSA P-256): `{payer_id, pubkey, tope_diario, valida_hasta, version_reputacion}`. El comercio verifica credenciales **sin red** con la llave pública del servidor, que la app trae embebida/cacheada. **[Decidido]**
- El comercio también tiene `merchant_id`, llave propia y credencial; su ubicación registrada (lat/lon) y su CLABE ligada a la API key de pey (o `bankAccountId`).

### 5.3 Protocolo de pago sin red (pagador con celular)
1. **Reto (comercio → pagador):** `{merchant_id, nonce(8 bytes aleatorios), ts, lat, lon, monto_centavos}` firmado por el comercio. Viaja por sonido (≈30–35 bytes + firma comercio) o QR. Válido **30 s**. **[Decidido]**
2. **Chequeos en el celular del pagador antes de firmar:** credencial del comercio válida; reto no vencido; **distancia GPS propia ↔ lat/lon del reto ≤ 50 m** (GNSS funciona sin datos; puede tardar en interiores **[Por validar]**); monto ≤ tope restante del día; usuario confirma con pantalla (monto en grande).
3. **Pagaré (pagador → comercio):** campos binarios compactos:
   `ver(1) | payer_id(16) | merchant_id(16) | monto_centavos(4) | counter(4) | ts(4) | nonce_reto(8) | lat_e6(4) | lon_e6(4)` = 61 bytes + **firma ECDSA P-256 64 bytes (formato r||s)** = **125 bytes**, dentro del máximo de **140 bytes** por mensaje de ggwave **[Por validar tiempo de transmisión: estimado 4–8 s según protocolo]**. La credencial del pagador no viaja cada vez: el comercio la tiene si el pagador ya le pagó antes, o se manda en un segundo mensaje/QR.
4. **Verificación en el comercio:** firma con la llave de la credencial; `nonce_reto` = el que emitió y no usado; `counter` > último visto para ese pagador en ese dispositivo; monto ≤ tope restante; reputación no revocada (lista local más reciente). Si todo pasa: guardar, **vibrar** con patrón propio y mostrar verde. Si no: motivo exacto en pantalla, sin vibración.
5. **Doble gasto entre comercios distintos sin red:** no se puede impedir al 100% offline (nadie puede). Se **acota** con el tope diario, que vale para todos los comercios juntos, y se **detecta** al sincronizar (mismo `counter` en dos comercios = fraude → revocación por la red). Explicarlo así de honesto en el pitch. **[Decidido]**

### 5.4 Pulsera NFC (sin celular del pagador)
- Pulsera con etiqueta NFC pasiva, **sin batería** (se alimenta del campo del lector). Contiene un registro NDEF con la **credencial firmada por el servidor** (payer_id, tope bajo, ej. $100/día, pagador designado).
- Lectura con **Web NFC** (`NDEFReader`) en **Chrome para Android**, HTTPS obligatorio y gesto del usuario; `serialNumber` disponible como UID. iOS/Safari no tiene Web NFC. **[Decidido: el celular de la tienda en la demo es Android]**
- Límite honesto: una etiqueta pasiva **no puede firmar cada transacción**, así que se puede clonar. Mitigación en la demo: tope bajo + ubicación del comercio + contador del lado del servidor + revocación. Producción: **NTAG 424 DNA** con SUN/SDM (cada lectura genera un código AES distinto con contador; los clones se detectan al sincronizar). **[Recomendación]**
- Para personas mayores: monto en grande, voz local que lee el monto (síntesis del navegador, generada **después** de verificar), vibración, y el cobro CoDi va **al pagador que la titular designó** (ella misma con tope bajo, o un familiar). Alta presencial (centro de día de la Utopía). **[Decidido]**

### 5.5 Por qué un audio falso o una voz clonada no funcionan (respuesta al caso India)
- En India la bocina anunciaba "pago recibido" y el tendero le creía al **audio**; reproducir un audio falso bastaba. **Aquí el audio nunca es la prueba.**
- El sonido transporta **bytes firmados**, no voz. Un audio alterado o una voz de ElevenLabs no decodifica como pagaré válido o no trae firma válida.
- El **reto de 30 s y un solo uso** inutiliza cualquier grabación de un pago anterior.
- El **contador** impide reusar un pagaré.
- El **bloqueo de 50 m** y, opcionalmente, el **tiempo de ida y vuelta acústico** (P2: medir reto→respuesta; un audio reenviado por llamada o red agrega cientos de ms) frenan el reenvío desde lejos. **[Por validar P2: jitter de audio en Android]**
- **La confirmación es la vibración y la pantalla del propio celular del comercio.** Una bocina externa no puede hacer vibrar un teléfono. Regla para el comercio, impresa en el mostrador: **"Si tu celular no vibró, no te pagaron."**
- **La voz nunca es contraseña.** Autorizan la llave del celular (y, al cobrar, la huella en la app del banco).

### 5.6 Propagación: la deuda viaja por el aire (guarda y reenvía)
- El comercio envuelve cada pagaré en un **sobre cifrado para el servidor**: ECDH P-256 efímero + HKDF + **AES-256-GCM** (WebCrypto). Los relevos no pueden leer (privacidad del pagador) ni alterar (GCM + firma interna). **[Decidido]**
- Los sobres se replican a cualquier celular con la app que esté cerca: **QR animado** (P0 de relevo en navegador), **sonido** (P1; sobres grandes requieren varios mensajes de 140 bytes), **Bluetooth/Wi-Fi directo** con **app Android nativa** (Google Nearby Connections) **[Recomendación P2: el navegador no puede anunciarse por Bluetooth (Web Bluetooth sólo es central)]**.
- Cada sobre tiene `envelope_id` = hash del pagaré; TTL de 7 días y máximo de saltos; los relevos guardan como máximo N sobres (cola FIFO).
- El primero que tiene señal hace `POST /api/sync`. El servidor **deduplica por (payer_id, counter)** y por `envelope_id`: 50 copias = una deuda. **[Decidido]**
- **De regreso** (servidor → red): una **lista firmada por el servidor** con `{version, revocados[], topes[]}` que también viaja de celular en celular. Así un deudor queda con tope cero en todos los comercios **aunque nunca vuelva a prender su teléfono**. Los relevos no pueden falsificarla (firma del servidor).

### 5.7 Liquidación por CoDi (con red)
1. `POST /api/sync` recibe sobres → descifra → verifica firma del pagaré y credencial → deduplica → crea `Deuda` en estado `REGISTRADA`.
2. Por cada deuda: `POST https://api.pey.mx/codi/pn` con `amount` (real o 0.01 en demo), `phoneNumber` del pagador (o del respaldo), `concept` corto (ej. "SinSeñal Tienda Lupita 7nov" **[Por validar longitud máxima del concepto CoDi; usar ≤ 40 caracteres]**), `numRef` (1–7 dígitos), `expiration` (≥ 360 s), `metadata` con `deuda_id` → respuesta `transactionId` (ULID) y `codiId` (folio de 20 dígitos). Estado `COBRO_ENVIADO`.
3. El pagador aprueba en su app bancaria. pey manda webhook `codi.pn.payment_received` (firmado con Standard Webhooks). Verificar firma sobre el cuerpo crudo, deduplicar por `webhook-id`, buscar la deuda por `transactionId` → estado `PAGADA` con `metadata.trackingKey` (clave de rastreo).
4. Respaldo de confirmación: si el webhook tarda, `GET /transaction/{id}` cada 3–5 s hasta `status: PAID`. **La pantalla verde sólo con una de esas dos confirmaciones.** **[Decidido]**
5. **Una sola solicitud cobrable activa por deuda** (pey no tiene reembolsos ni cancelación documentada de push). Al expirar sin pago: reintento al mismo pagador más tarde o al pagador de respaldo, **nunca dos solicitudes vivas a la vez**. Si llegan dos pagos para la misma deuda → `DUPLICADO` con alerta de devolución manual por transferencia.

### 5.8 Si el pagador nunca aprueba o nunca vuelve
CoDi **no tiene cargos automáticos** (Pix sí, con Pix Automático). Nadie puede sacar dinero sin aprobación. Por eso, cuatro capas **[Decidido]**:
1. El cobro llega al número del pagador **y**, si existe, a su **pagador de respaldo** (en cascada, sin solicitudes simultáneas).
2. **Pérdida máxima acotada** por el tope sin conexión (ej. $300/día; pulsera $100/día).
3. **Reputación que viaja:** deuda vencida → tope a cero en toda la red; pagar a tiempo → tope sube (incentivo: confianza que se gana; pey no puede dar reembolsos ni cashback).
4. **Prueba:** el pagaré firmado es un mensaje de datos con firma electrónica atribuible al dispositivo del pagador, útil para reclamar **[Por validar con fuente legal antes de decirlo en el pitch; si no hay fuente, decir "sirve como evidencia" sin citar ley]**.
5. **Fondo de garantía en desastre declarado** (SEDECO o Protección Civil) que cubre lo no cobrado: **propuesta de política, fuera de pey** (pey sólo cobra). En la demo es un botón y una línea del pitch, no dinero real. **[Recomendación]**

### 5.9 Reputación y topes (determinista, explicable)
- `tope_diario = base × factor`, con `base` = $300 (celular) o $100 (pulsera).
- `factor` = 1.0 al alta; +0.1 por cada deuda pagada en < 48 h (máx 2.0); = 0 si hay una deuda vencida > 7 días o doble gasto detectado.
- Se recalcula en el servidor y viaja en la lista firmada. Nada de esto lo decide un LLM. **[Decidido; números ajustables]**

### 5.10 Trampas que hay que probar con los aparatos reales (antes de las 03:00)
- ggwave en la sala con ruido: tasa de éxito a 30 cm y a 1 m, volumen medio. **[Por validar]**
- Web NFC en el Android de la tienda: lectura de la etiqueta que tengamos (cualquier NTAG reescribible, llavero de acceso, tarjeta de transporte puede no servir para escribir). **[Por validar]**
- GPS sin datos dentro del edificio: ¿da fix? Si no, en la demo usar la última ubicación conocida con antigüedad visible. **[Por validar]**
- Cobro push de pey de $0.01 a los celulares del equipo: qué bancos lo reciben, cuántos segundos tarda, qué nombre de comercio ve el pagador (anotar en `docs/pey-pruebas.md`). **[Por validar, primera tarea humana]**
- Firma P-256 WebCrypto en los celulares del equipo (Android Chrome e iPhone Safari). **[Por validar]**

### 5.11 Validación honesta
- Métricas que sí podemos reportar el domingo: pagarés emitidos en pruebas, % rechazados correctamente en ataques (grabación, voz IA, distancia, contador), tiempo reconexión→cobro, % de cobros push recibidos por banco del equipo.
- No reportar "adopción" ni "usuarios": no hay piloto todavía. Si da tiempo, 5–10 entrevistas a comercios cerca de la sede el domingo temprano, con preguntas en §13.

---

## 6. Datos (contrato `app/schemas/`)

| Entidad | Campos clave (nombre: tipo) | Fuente (licencia) |
|---|---|---|
| `Payer` | `id: str(ULID)`, `display_name: str`, `phone: str(10 díg.)`, `pubkey_jwk: dict`, `backup_payer_id: str\|None`, `kind: "phone"\|"band"`, `band_uid: str\|None`, `daily_cap_cents: int`, `reputation_factor: float`, `created_at: datetime` | Alta en la app (sintético en el repo público) |
| `Merchant` | `id: str`, `name: str`, `lat: float`, `lon: float`, `pubkey_jwk: dict`, `pey_bank_account_id: str\|None` | Alta (sintético) |
| `Credential` | `subject_id: str`, `subject_type: "payer"\|"merchant"`, `pubkey_jwk: dict`, `daily_cap_cents: int`, `valid_until: int`, `rep_version: int`, `server_sig: str(b64)` | Emitida por el servidor |
| `Challenge` | `merchant_id: str`, `nonce: str(hex 16)`, `ts: int`, `lat: float`, `lon: float`, `amount_cents: int`, `merchant_sig: str` | Generado offline |
| `Iou` (pagaré) | `ver: int`, `payer_id: str`, `merchant_id: str`, `amount_cents: int`, `counter: int`, `ts: int`, `nonce: str`, `lat: float`, `lon: float`, `sig: str(b64 r\|\|s)`, `raw: str(b64, 61 bytes)` | Generado offline |
| `Envelope` | `envelope_id: str(sha256)`, `epk: str(b64)`, `iv: str`, `ciphertext: str`, `hops: int`, `created_at: int`, `ttl_s: int` | Generado offline |
| `Debt` | `id: str`, `iou: Iou`, `status: "REGISTRADA"\|"COBRO_ENVIADO"\|"PAGADA"\|"VENCIDA"\|"DUPLICADA"\|"RECHAZADA"`, `charge_target: "payer"\|"backup"`, `pey_transaction_id: str\|None`, `pey_codi_id: str\|None`, `tracking_key: str\|None`, `paid_at: datetime\|None`, `attempts: list[ChargeAttempt]`, `alerts: list[str]` | Servidor |
| `ChargeAttempt` | `target_phone: str`, `sent_at: datetime`, `expires_at: datetime`, `state: "ACTIVO"\|"EXPIRADO"\|"PAGADO"\|"FALLIDO"`, `pey_transaction_id: str\|None`, `error: str\|None` | Servidor |
| `RevocationList` | `version: int`, `issued_at: int`, `revoked: list[str]`, `caps: dict[str,int]`, `server_sig: str` | Servidor, viaja por la red |
| `WebhookEvent` | `webhook_id: str (PK)`, `type: str`, `received_at: datetime`, `payload: dict` | pey |
| `AttackLog` | `ts: int`, `kind: "replay"\|"bad_sig"\|"distance"\|"counter"\|"cap"\|"revoked"`, `detail: str` | Celular del comercio (para el paso 3 y el tablero) |

- **Endpoints del backend (FastAPI)** **[Decidido nombres; ajustar en el contrato]**:
  - `POST /api/payers` (alta, devuelve credencial) · `POST /api/merchants` · `GET /api/server-key` (llave pública del servidor)
  - `POST /api/sync` → body `{envelopes: Envelope[]}` → `{accepted: n, duplicates: n, rejected: [{envelope_id, reason}], revocation_list: RevocationList}`
  - `GET /api/deudas?merchant_id=` · `GET /api/deudas/{id}` · `GET /api/deudas/{id}/eventos` (SSE)
  - `POST /api/deudas/{id}/plan-b` (`{canal: "qr"|"liga"}`)
  - `GET /api/reputacion/{payer_id}`
  - `POST /webhooks/pey` (cuerpo crudo, Standard Webhooks)
  - `POST /demo/simular-pago/{deuda_id}` **sólo con `DEMO_MODE=1`** (firma un webhook falso con el secreto local y lo pasa por el mismo verificador)
- **Frontend (React/Vite/Tailwind, PWA)**: rutas `/tienda` (cobrar, verificar, vibrar, lista local, relevo), `/pagar` (alta, firmar, tope restante), `/relevo` (cargar y entregar sobres), `/tablero` (deudas, reputación, ataques). Service worker + IndexedDB para funcionar sin red. **Todo en HTTPS** (Web NFC, cámara, micrófono y WebCrypto lo exigen).
- Capa ancha frente a capa profunda: no aplica (no hay datasets). Fixtures sintéticos en `app/fixtures/sinsenal/` (personas ficticias: Lupita, Mario, Doña Carmen, Luis). Nada de datos reales de terceros en el repo público.

---

## 7. IA y APIs externas (cada una = spike ≤ 30 min + fallback)

| Uso | Modelo/API [Por validar] | ¿Clave? quién la tiene | Fallback |
|---|---|---|---|
| Cobro CoDi push al reconectar | pey `POST /codi/pn` (base `https://api.pey.mx`, `Authorization: Bearer <PEY_API_KEY>`) | API key del portal de pey (dueño de integración) | `POST /codi/qr` en pantalla; video grabado |
| Confirmación de pago | Webhook `codi.pn.payment_received` (Standard Webhooks, secreto `whsec_…`) + `GET /transaction/{id}` | Secreto en el portal | Sondeo a `GET /transaction/{id}`; "Webhook Logs" del portal |
| Transmisión por sonido | ggwave (WASM en navegador; npm `ggwave`) | — | QR animado |
| NFC | Web NFC (`NDEFReader`), Chrome Android | — | QR impreso en la pulsera |
| Firma y cifrado | WebCrypto: ECDSA P-256, ECDH P-256, AES-GCM, HKDF | — | — (sin esto no hay producto) |
| Captura por voz del comercio ("anótale 25 al de la pulsera") | OpenAI Realtime `gpt-realtime-2.1` vía WebRTC (`client.realtime.calls.create(sdp, session)`) **o** Live API `gpt-live-1` (`POST /live/sessions`) | Clave de OpenAI (créditos del evento) | Teclado numérico grande |
| Explicación de anomalías y resumen del tablero en español sencillo | Responses API con salida estructurada, `gpt-6-luna` | Clave de OpenAI | Plantillas fijas |
| Clasificación rápida de alertas (opcional) | Decisions API con `gpt-6-luna` (existe en el SDK; estado beta/GA en conflicto entre fuentes) | Clave de OpenAI | Reglas deterministas |

- **IDs de modelo confirmados en el SDK oficial de Python `openai==3.46.0` (instalado desde PyPI el 7 de noviembre de 2026):** `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6.1-terra`, `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`; tiempo real: `gpt-realtime-2.1`, `gpt-realtime-2.1-mini`; Live API: `gpt-live-1`; transcripción: `gpt-transcribe`. Aun así, ponerlos **en variables de entorno** (`OPENAI_MODEL_TEXTO`, `OPENAI_MODEL_VOZ`) y confirmar en `developers.openai.com/api/docs/models` al primer error.
- **Prohibido usar** (apagados o por apagarse según la página de deprecaciones): Assistants API (apagada el 26-ago-2026), header `OpenAI-Beta: realtime=v1`, `whisper-1`, `gpt-4o-*-transcribe`, `gpt-4o-realtime-preview*`, `tts-1`, `gpt-4o-mini-tts`, Agent Builder. Usar Responses API y Agents SDK.
- **Regla anti-alucinación:** el agente de voz sólo puede llamar herramientas que **proponen** (`proponer_monto(centavos)`, `proponer_pagador(etiqueta)`); la persona confirma en pantalla con un toque. Ninguna herramienta del LLM firma, envía cobros a pey ni marca pagos. El texto que genera el LLM nunca contiene cifras que no vengan del registro (se insertan por plantilla).

### 7.1 Referencia rápida de pey (verificada el 7-nov-2026 en docs.pey.mx y openapi.json, versión 2026-10-20)
- **No hay sandbox** ("coming soon"): pey recomienda probar en producción con **$0.01 MXN**. El `llms.txt` menciona `https://api.dev.pey.mx` pero el OpenAPI y la portada dicen que no hay entorno de pruebas. **[Por validar]**
- `POST /codi/pn`: `amount` (> 0, máx. 1,000,000), `phoneNumber` (exactamente 10 dígitos), `concept`, `numRef` (1–7 dígitos), `expiration` (**mínimo 360 s**, por defecto 360), `bankAccountId` (opcional), `metadata` (máx. 50 pares, llaves ≤ 40 car., valores escalares ≤ 500 car.) → 200 `{transactionId (ULID), codiId (20 dígitos)}`.
- `POST /codi/qr`: `amount` (0 = el pagador escribe el monto), `concept`, `expiration` (0 = sin expiración; si se fija, ≥ 360), `numRef`, `generateImage` (PNG base64 en `qrImage`), `bankAccountId`, `metadata` → 201 `{id (IDC de Banxico), qrString, qrImage}`. **Un QR no es una transacción:** sus cobros se consultan en `GET /transaction/codi/qr/{id}`.
- `POST /payment-link/create`: `amount` (> 0), `successUrl` y `backUrl` (**HTTPS obligatorio**), `hasTip`, `clientReferenceId`, `metadata` → `{id, url}`. Con tarjeta hay comisión (`applicationFee`); con CoDi no.
- `GET /transaction/{id}` → `status` `PENDING|PAID`, `paymentMethod` `CARD|CODI`, `payableType` `PAYMENT_LINK|API_CODI_QR|API_CODI_PN`, `payableId`, `datePaid`, `metadata`.
- `POST /bank-account` (no documentado en el índice): registra CLABE (`alias`, `name`, `clabe`, `entity` `BUSINESS|PERSON`); **la activación tarda hasta 5 días hábiles** → para la demo usar la cuenta ligada a la API key o la CLABE preautorizada por los organizadores.
- Errores conocidos: `INVALID_AMOUNT`, `INVALID_STATE`, `PEY_CONSISTENCY_ERROR`, `INVALID_REQUEST`, `INVALID_PARAMETER`, 503 `SERVICE_UNAVAILABLE`/`FLAGS_UNAVAILABLE`; ligas: `INVALID_URL`, `INVALID_HAS_TIP`, `INVALID_CLIENT_REFERENCE_ID`, `AUTH_ERROR`.
- **No existen** (no documentados): reembolsos, pagos salientes, dispersiones, splits, cancelación de un push, política de reintentos de webhooks, rate limits.
- **Webhooks** (Standard Webhooks): headers `webhook-id`, `webhook-timestamp`, `webhook-signature` (`v1,<base64>` separados por espacio); firma HMAC-SHA256 sobre `"{webhook-id}.{webhook-timestamp}.{cuerpo crudo}"` con la llave base64 tras el prefijo `whsec_`; tolerancia 5 min; **`webhook-id` es la llave de idempotencia**. En Python: paquete `standardwebhooks` (`Webhook(secret).verify(raw_body, headers)`), pasando el cuerpo crudo, nunca el JSON parseado. Logs en `portal.mipey.mx/developers` → engrane de la API key → "Webhook Logs".
  - `codi.pn.payment_received`: `type`, `transactionId`, `amount`, `concept`, `numRef`, `datePaid` (unix s), `apiKeyId`, `bankAccountId?`, `metadata{clabe, bankCode, accountType, description, trackingKey, externalMetadata}`. **Lo que mandamos en `metadata` regresa en `metadata.externalMetadata`.**
  - `codi.qr.payment_received`: lo mismo + `codiQrId`.
  - `payment_link.status_updated`: `apiKeyId`, `type`, `paymentLinkId`, `status` (`paid|pending|processing|partial`), `clientReferenceId`, `transactions[]` con `amountBreakdown{base, tip, fee}`.

---

## 8. Rubric → evidencia

No hay rubric oficial publicado (Luma dice "se confirmará"). **Preguntar a los anfitriones el domingo a primera hora.** Mientras, optimizamos contra los criterios públicos más cercanos:

| Criterio (fuente) | Peso | Qué paso/artefacto lo demuestra |
|---|---|---|
| Producto funcional / producto completo y ejecutable (SEDECO "Hackathon SecretarIA"; OpenAI Build Week "Design") | sin peso | Recorrido completo pasos 1→5 en vivo; repo que corre con `DEMO_MODE=1` en 2 comandos |
| Claridad del problema (SEDECO) | sin peso | §2.1: las dos fallas; art. 15 de la ley; cifras de §11 en la primera diapositiva |
| Calidad de la solución / impacto real (SEDECO; Build Week) | sin peso | Paso 3 (ataques rechazados) + paso 5 (cobro CoDi real); tabla "cada pieza resuelve una falla" |
| Ejecución técnica / implementación tecnológica (SEDECO; Build Week) | sin peso | Criptografía en el navegador, propagación cifrada, webhook firmado verificado, idempotencia, cero custodia; tests |
| Originalidad / calidad de la idea (Build Week) | sin peso | Pagaré firmado con reto + propagación + liquidación CoDi; diferencial en §1 |
| Uso de Codex (Build Week; organizador Codex Ambassador) | sin peso | README: cómo trabajaron los agentes en paralelo (worktrees, revisión, Codex Security), commits |
| Lo que valora pey (inferencia de las notas) | — | Dinero real moviéndose en vivo con su API; tráfico y comercios nuevos para pey |
| Lo que valora SEDECO (economía como derecho, comercio pequeño, mercados) | — | Caso de tienda de barrio; fondo de garantía como política pública |
| Voto de la comunidad (lunes, 1–3 proyectos más) | — | Video de 30 s: "se cayó la red, seguimos pagando, y la voz de IA no pudo engañarnos" |

**Entregables oficiales:** prototipo funcionando, repo público (datos sintéticos, sin secretos) con README, video corto de respaldo, deck breve, envío por el portal del evento **y** a hola@aibuilders.lat antes de las 13:00. Premios: créditos de OpenAI (USD 500/300/200 según anuncios de los organizadores; Luma sólo lista 10 boletos a DevDay Exchange del 10-nov) **[Por validar]**.

---

## 9. Tecnología y cortes

| Pieza | Decisión | Por qué / qué se corta si falla |
|---|---|---|
| Pagaré firmado + verificación offline (WebCrypto P-256, IndexedDB) | P0 | Es el producto. Sin alternativa. |
| Cobro push pey + webhook firmado + sondeo | P0 | Es el "dinero real". Si el push no llega: QR de pey. |
| Transporte por QR (pagaré y sobres) | P0 | Respaldo universal de sonido, NFC y relevo. |
| Transporte por sonido (ggwave) | P0 | Es la idea original del equipo y el escenario del ataque con bocina. Si falla en sala: QR. |
| Reto 30 s + contador + 50 m + vibración tras verificar + log de ataques | P0 | Es el wow (paso 3). |
| Web NFC con pulsera | P1 | Si el Android no lee: QR impreso en la pulsera. |
| Sobre cifrado + relevo entre 3 celulares por QR/sonido | P1 | Si no da tiempo: relevo simulado con un solo salto (tienda → celular con señal). |
| Lista de revocación firmada que viaja | P1 | Si no da tiempo: mostrar sólo en el tablero. |
| Tablero de deudas y reputación (SSE) | P1 | Si no: la lista de la tienda con estados basta. |
| Agente de voz del comercio (OpenAI Realtime/Live) | P1 | Si falla: teclado grande. Necesario para la historia "OpenAI", pero no bloquea. |
| Explicación de anomalías con `gpt-6-luna` | P2 | Plantillas fijas. |
| Tiempo de ida y vuelta acústico (anti-reenvío) | P2 | El bloqueo de 50 m cubre el mensaje. |
| App Android nativa con Nearby Connections (Bluetooth/Wi-Fi directo) | P2 | Fuera de la demo; diapositiva de "siguiente paso". |
| NTAG 424 DNA (pulseras no clonables) | P2 | Diapositiva; no tenemos etiquetas. |
| Modo desastre por SASMEX + fondo de garantía | P2 | Botón en el tablero y línea del pitch. |
| Pago con rostro | Fuera | Datos biométricos sensibles (LFPDPPP 2025) y alto costo en 12 h. |

Stack: FastAPI + uv + pytest (backend), React + Vite + TS + Tailwind v4 (PWA), según `.uak/stacks/fastapi-react/STACK.md`. Despliegue HTTPS público del esqueleto **lo antes posible (es lo que permite probar en celulares)**; el webhook de pey se registra después, porque pey necesita una URL pública para los webhooks y el navegador exige HTTPS para NFC, micrófono, cámara y WebCrypto.

---

## 10. Alcance

- **Fuera:** custodia de dinero o saldos; fiado sin pagaré firmado; reembolsos automáticos (pey no los tiene); pago con rostro; app nativa (salvo P2); mapa de comercios (eso fue colonIA); bocina que "anuncia" pagos (descartado: es justo el vector de fraude).
- **Simulado con `demo_data` (etiquetado en la UI):** fondo de garantía; modo desastre SASMEX; personas y comercios ficticios; en `DEMO_MODE=1`, el webhook se simula pero pasa por el **mismo verificador** con un secreto local.
- **Real en la demo:** firma y verificación, sonido/QR/NFC, rechazo de ataques, sobres cifrados, `POST /codi/pn` a pey con $0.01, webhook real de pey, clave de rastreo.
- **Idioma de la UI:** español de México, letras grandes, alto contraste, montos siempre en pesos con dos decimales.
- **Ética y datos:**
  - Repo público con datos sintéticos. Ningún teléfono, CLABE ni nombre real en commits. Secretos sólo por variables de entorno (`PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `SERVER_SIGNING_KEY`).
  - Los relevos no pueden leer los pagarés (cifrado al servidor).
  - La ubicación se usa sólo para el chequeo de 50 m y se guarda redondeada.
  - Personas mayores: titulares de su pulsera, alta presencial, consentimiento explícito, tope bajo, pueden revocar.
  - Los organizadores compartieron CLABEs preautorizadas y contraseña de WiFi en sus anuncios: **no copiarlos al repo**.

---

## 11. Hechos citables (verificados el 7-nov-2026)

| Hecho | Fuente (URL) |
|---|---|
| CoDi: 21.79 M de cuentas validadas; sólo 2.47 M han hecho algún pago y 1.08 M han recibido alguno (sep-2025) | https://www.razon.com.mx/negocios/2025/09/30/acusan-falta-de-promocion-y-voluntad-en-impulso-de-codi/ |
| 85% de las operaciones menores a 500 pesos se pagan en efectivo; meta oficial de 50% de pagos digitales en 2027 | https://grupoanimal.mx/economia/ley-economia-digital-50-pagos-digitales-2027 |
| Ley de Economía Digital: el art. 15 sólo admite efectivo ante fallas de conectividad o de luz | https://idconline.mx/corporativo/2026/10/26/que-cambios-traera-consigo-la-ley-de-economia-digital |
| La ley fue aprobada por Diputados el 6-oct-2026 y por el Senado el 20-oct-2026; publicación en el DOF sin confirmar al 28-oct | https://expansion.mx/economia/2026/10/06/diputados-aprueban-ley-de-economia-digital |
| Banqueros: la implementación será paulatina; la ABM pidió considerar a las personas mayores | https://expansion.mx/economia/2026/10/28/ley-de-economia-digital-no-sera-draconiana-la-implementacion-de-pagos-digitales-sera-paulatina-dicen-banqueros |
| Banxico: todas las apps deben homologar transferencias y ligar el celular (DiMo) antes del 14-dic-2026 | https://ruptura360.mx/periodismo-de-servicio/banxico-nuevas-reglas-transferencias-bancarias-apps-2026/ |
| QR de Banxico sin terminal y sin comisión llega a los bancos entre noviembre y diciembre de 2026 | https://planoinformativo.com/1171907/mexico-impulsa-pagos-digitales-en-tienditas-con-nuevo-sistema-de-codigos-qr |
| SPEI movió más de 7,300 millones de transferencias en 2025 | https://elceo.com/negocios/banxico-va-por-mas-pagos-digitales-impulsara-uso-codi-y-dimo-en-apps-de-bancos/ |
| ENIF 2024: 38.0% de los adultos conoce CoDi y 12.8% de ellos lo ha usado | https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/enif/ENIF2024_CP.pdf |
| Las personas de 60+ concentran 32% de las quejas contra bancos por posible fraude | https://www.elimparcial.com/dinero/2026/04/13/adultos-mayores-concentran-3-de-cada-10-denuncias-bancarias-por-fraude-condusef-alerta-que-los-principales-agresores-suelen-estar-en-casa/ |
| Sólo 30.3% de las personas de 75+ usa internet (ENDUTIH 2025) | https://www.inegi.org.mx/contenidos/programas/endutih/2025/doc/presentacion_endutih2025.pdf |
| Pagar por proximidad con Pix fue sólo 0.01% de los Pix en enero de 2026 (la comodidad sola no genera adopción) | https://agenciabrasil.ebc.com.br/economia/noticia/2026-02/pix-por-aproximacao-completa-um-ano-com-baixa-adesao |
| API de pey: endpoints, límites, sin sandbox, prueba con $0.01 | https://docs.pey.mx/openapi.json · https://docs.pey.mx |
| Webhooks de pey: Standard Webhooks, `webhook-id` como idempotencia, eventos `codi.pn.payment_received` y `codi.qr.payment_received` | https://docs.pey.mx/en/docs/webhooks/introduction · https://docs.pey.mx/en/docs/webhooks/codi/pn · https://docs.pey.mx/en/docs/webhooks/codi/qr |
| Criterios de SEDECO en su hackathon de IA: producto funcional, calidad de la solución, claridad del problema, ejecución técnica; demo de 3 min | https://luma.com/ph1uk8xp |
| Página del evento | https://luma.com/f755f0k6 |

**No citar sin fuente** (no están verificados): cifras de caída de red en sismos pasados; montos de fraude con bocinas en India; validez legal específica del pagaré electrónico; Tailandia (26 M inscritos con copago) salvo que se agregue la URL.

---

## 12. Backlog propuesto (olas paralelas)

Hora actual de referencia: domingo 00:30. **Freeze 11:30 · ensayo limpio 12:00 · entrega interna 12:30 · límite 13:00.**

| Ola | ID | Tarea | Tipo | Prio | Depende | Archivos |
|---|---|---|---|---|---|---|
| 0 | HACK-001 | Limpiar el proyecto anterior: mover `app/routers/*`, `app/services/*`, `app/fixtures/*` y `web/src/*` del proyecto viejo a `legacy/` (o borrarlos en rama), dejar skeleton FastAPI + Vite corriendo, `.env.example` con `PEY_*`, `OPENAI_*`, `SERVER_SIGNING_KEY`, `DEMO_MODE`, `DEMO_REAL_AMOUNT` | setup | P0 | — | `app/main.py`, `app/config.py`, `.env.example`, `web/src/App.tsx` |
| 0 | HACK-002 | Prueba humana de pey: push de $0.01 a cada celular del equipo; anotar banco, llegada, segundos, nombre visible; capturar un webhook real de "Webhook Logs" | spike | P0 | — | `docs/pey-pruebas.md`, `app/fixtures/sinsenal/webhook_pn_real.json` (sin datos personales) |
| 1 | HACK-003 | Contrato: `app/schemas/` (§6) + fixtures sintéticos + formato binario del pagaré (61+64 bytes) documentado + `web/DESIGN.md` (letras grandes, verde/rojo, vibración) | contract | P0 | 001 | `app/schemas/`, `app/fixtures/sinsenal/`, `docs/protocolo.md`, `web/DESIGN.md` |
| 1 | HACK-004 | Spike ggwave en navegador: enviar/recibir 125 bytes entre dos Android en la sala; medir éxito y segundos; elegir protocolo | spike | P0 | 001 | `spikes/ggwave/` |
| 1 | HACK-005 | Spike Web NFC: leer/escribir NDEF en la etiqueta disponible desde Chrome Android sobre HTTPS | spike | P0 | 001 | `spikes/webnfc/` |
| 1 | HACK-006 | Spike WebCrypto: P-256 no extraíble, firma r‖s de 64 bytes, verificación en otro navegador y en Python (`cryptography`); ECDH+AES-GCM sobre | spike | P0 | 001 | `spikes/crypto/`, `app/services/crypto.py` |
| 2 | HACK-007 | Backend pey: cliente (`/codi/pn`, `/codi/qr`, `/transaction/{id}`), `POST /webhooks/pey` con Standard Webhooks sobre cuerpo crudo, idempotencia por `webhook-id`, sondeo de respaldo, `DEMO_MODE` que firma webhooks locales; tests | feature | P0 | 003 | `app/services/pey.py`, `app/routers/webhooks.py`, `tests/test_pey_webhooks.py` |
| 2 | HACK-008 | Backend alta y credenciales: `POST /api/payers`, `/api/merchants`, `GET /api/server-key`, emisión y verificación de credenciales firmadas | feature | P0 | 003, 006 | `app/routers/registry.py`, `app/services/credentials.py` |
| 2 | HACK-009 | Backend sync y deudas: `POST /api/sync` (descifrar, verificar, deduplicar por (payer, counter) y envelope_id), máquina de estados de `Debt` (una sola solicitud viva, cascada a respaldo, duplicados), `GET /api/deudas` + SSE | feature | P0 | 007, 008 | `app/routers/sync.py`, `app/services/debts.py`, `tests/test_debts.py` |
| 2 | HACK-010 | PWA núcleo offline: service worker, IndexedDB, llaves, alta de pagador y de tienda | feature | P0 | 003, 006 | `web/src/features/core/` |
| 3 | HACK-011 | Flujo de pago offline (tienda ↔ pagador): reto, chequeos (30 s, contador, 50 m, tope, revocación), pagaré, verificación, **vibración sólo tras verificar**, transporte QR + sonido | feature | P0 | 004, 010 | `web/src/features/pay/`, `web/src/features/store/` |
| 3 | HACK-012 | Panel de ataques: grabación, audio sin firma, distancia, contador repetido; `AttackLog` visible con motivo | feature | P0 | 011 | `web/src/features/store/attacks.tsx` |
| 3 | HACK-013 | Pulsera NFC: lectura de credencial, monto grande + voz local, tope de pulsera | feature | P1 | 005, 011 | `web/src/features/band/` |
| 3 | HACK-014 | Sobres cifrados + relevo entre celulares (QR animado y sonido), TTL, máximo de saltos, subida con `POST /api/sync` | feature | P1 | 009, 011 | `web/src/features/relay/` |
| 4 | HACK-015 | Lista de revocación firmada (servidor) que viaja con los sobres; topes y reputación (§5.9) | feature | P1 | 009, 014 | `app/services/reputation.py`, `web/src/features/relay/` |
| 4 | HACK-016 | Tablero: deudas, estados en vivo (SSE), clave de rastreo, reputación, botón "desastre declarado" (simulado) | feature | P1 | 009 | `web/src/features/dashboard/` |
| 4 | HACK-017 | Voz del comercio con OpenAI (Realtime `gpt-realtime-2.1` o Live `gpt-live-1`), herramientas que sólo proponen; fallback teclado | feature | P1 | 011 | `app/routers/voice.py`, `web/src/features/voice/` |
| 4 | HACK-018 | Despliegue HTTPS público backend + web; registrar URL de webhook en el portal de pey; prueba punta a punta con $0.01 | setup | P0 | 007 | `docs/deploy.md` |
| 5 | HACK-019 | QA: tests de criptografía, deduplicación, máquina de estados, verificador de webhooks; revisión de secretos; Codex Security | review | P0 | 009, 011 | `tests/` |
| 5 | HACK-020 | Demo: guion de 3 min, grabación del plan B completo antes de 11:30, video de 30 s para voto, deck de 6 láminas, README (problema, cómo correr, cómo se construyó con Codex) | demo | P0 | 011, 012, 018 | `README.md`, `docs/demo.md`, `docs/deck/` |
| 5 | HACK-021 | Entrevistas en campo 8:00–10:00 con 5–10 comercios cerca de la sede (preguntas §13); 1 lámina con resultados reales | research | P1 | — | `docs/campo.md` |

Relacionadas (para avisos automáticos): 003↔007, 003↔010, 006↔008, 006↔011, 007↔009, 009↔014, 009↔016, 011↔012, 011↔013, 011↔014, 014↔015, 007↔018, 011↔017.

**Ruta crítica:** 001 → 003 → 006 → 010 → 011 → 012 y, en paralelo, 007 → 009 → 018. Si a las 08:00 la 011 no está integrada, cortar 013, 014, 015 y 017 y concentrar todo en 011 + 012 + 018.

---

## 13. Decisiones abiertas

- [ ] Rubric oficial y canal de entrega exacto (portal + correo) · humano de entrega · **09:00**
- [ ] ¿Qué bancos del equipo reciben el push de pey y cuál es el más rápido para el celular del "juez"? · humano de integración · **02:00** (HACK-002)
- [ ] Protocolo ggwave elegido y si el sonido es P0 en la sala o sólo QR · dueño de HACK-004 · **03:00**
- [ ] ¿Tenemos etiqueta NFC escribible? Si no, la pulsera es QR impreso · dueño de HACK-005 · **03:00**
- [ ] Monto visible del pagaré en la demo ($25) vs. monto real cobrado ($0.01): confirmar que se muestra la etiqueta "monto de prueba" · humano de demo · **10:00**
- [ ] Voz: `gpt-realtime-2.1` (WebRTC, herramientas conocidas) o `gpt-live-1` (más nuevo) · dueño de HACK-017 · **06:00**
- [ ] Texto exacto del pitch sobre el valor legal del pagaré (sólo con fuente) · humano de demo · **10:00**
- [ ] Preguntas de campo (HACK-021), máximo 5:
  1. Cuando se cae la red o la luz, ¿cómo cobran?
  2. ¿Les han hecho pasar una transferencia o comprobante falso? ¿Cómo lo supieron?
  3. ¿Fiarían a un cliente sin red si queda una prueba firmada y se cobra sola por CoDi al volver la señal?
  4. ¿Cuánto es lo máximo que arriesgarían por cliente así?
  5. ¿Qué les daría miedo de esto?

---

## Apéndice A · Guion de pitch (3 min)

1. **(0:00–0:25) Problema.** "En México el pago digital falla justo cuando más se necesita, y cuando funciona, nadie le cree. La nueva ley sólo permite volver al efectivo cuando se cae la red. Por eso 85% de las compras chicas siguen en efectivo." (cifras §11)
2. **(0:25–1:10) Pago sin red.** Modo avión. Pago por sonido y con pulsera. Vibra. "No se movió dinero: se firmó una deuda que nadie puede falsificar."
3. **(1:10–1:40) Ataques.** Grabación, voz de IA, cobro a distancia, pagaré repetido. Rechazados. "Si tu celular no vibró, no te pagaron."
4. **(1:40–2:20) La deuda viaja y se cobra.** Relevo entre celulares. Un celular recupera señal. Cobro CoDi real de $0.01 al juez. Verde con clave de rastreo de Banxico.
5. **(2:20–2:45) Riesgo controlado.** Topes, reputación que viaja, fondo de garantía en desastre declarado.
6. **(2:45–3:00) Cómo lo hicimos.** Agentes en paralelo con Codex, pey para el cobro, OpenAI para la voz del comercio; nunca para decidir dinero.

## Apéndice B · Lo que aprendimos en este hack y que guía las decisiones

- **La comodidad no basta para adoptar.** Pagar por proximidad con Pix fue 0.01% de los Pix (§11). Por eso el pitch no es "es más cómodo", es "funciona sin red y no se puede falsificar".
- **Aceptar CoDi ya no distingue a nadie:** el QR sin terminal llega a todos los bancos en noviembre-diciembre. El valor está en lo que nadie más resuelve: sin red y confianza.
- **El cuello de botella de CoDi es el primer pago** (2.47 M de 21.79 M). Cada deuda liquidada por push es un pago CoDi real, muchas veces el primero del pagador.
- **pey sólo cobra.** Todo diseño que requiera devolver, dispersar o guardar dinero está prohibido. La liquidación es siempre "pagador → comercio" directo.
- **No hay sandbox:** se prueba con $0.01 en producción. Las cuentas bancarias nuevas tardan hasta 5 días hábiles: usar la cuenta de la API key.
- **Un push de pey vive mínimo 360 s y no se cancela:** nunca dos solicitudes vivas para la misma deuda.
- **Fraude por audio (India):** el error fue confiar en el audio. Aquí el audio sólo transporta bytes firmados y la confirmación es local (vibración + pantalla).
- **Los jueces** (por los criterios públicos de SEDECO y de OpenAI Build Week) premian producto funcional, problema claro, ejecución técnica, originalidad, uso de Codex y dinero real moviéndose en vivo. Los ganadores de Build Week usaron motores deterministas para lo crítico y la IA para la interfaz: lo mismo que hacemos aquí.
- **Ideas evaluadas y descartadas en este hack** (para no regresar a ellas): mapa de comercios (colonIA), alta por nota de voz, bocina de confirmación, pago con rostro, delegación a familiares como producto principal ("Paga por mí"), propinas, comida pendiente, cooperaciones, cobro por llamada. Algunas piezas viven aquí como modos (pagador de respaldo para personas mayores).
