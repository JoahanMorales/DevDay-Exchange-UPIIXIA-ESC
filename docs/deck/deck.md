# Deck SinSeñal · borrador de 6 diapositivas

Una idea por diapositiva. Cifras con fuente al pie (IDEA §11). Las capturas reales se agregan cuando existan las pantallas; hasta entonces `[CAPTURA: …]` marca el hueco, no se inventa.

## 1 · El pago digital falla justo cuando más se necesita, y cuando funciona, nadie le cree
- **85%** de las operaciones menores a 500 pesos se pagan en efectivo · meta oficial: 50% digital en 2027.
- Sólo **2.47 M de 21.79 M** de cuentas CoDi validadas han hecho algún pago (sep-2025).
- La Ley de Economía Digital (aprobada por el Senado el 20-oct-2026) admite efectivo sólo ante fallas de conectividad o luz.
- Fuentes: grupoanimal.mx · razon.com.mx · idconline.mx (IDEA §11).

## 2 · SinSeñal: pagar sin señal con un pagaré firmado que se cobra solo por CoDi
- Sin red: el cliente firma una **deuda** en su celular (ECDSA P-256), no mueve dinero.
- Con red: el servidor verifica, deduplica y la cobra por **CoDi con pey**; el dinero va directo a la cuenta del comercio. Nadie custodia dinero.
- [CAPTURA: tienda en verde "Pagaré válido · $25.00 · Mario ···4321 · #17"]

## 3 · La confirmación no se puede falsificar
- El sonido lleva **bytes firmados**, no voz: una grabación o una voz de IA no decodifica como pagaré válido.
- Reto de 30 s y un solo uso · contador creciente · ≤ 50 m del comercio.
- **"Si tu celular no vibró, no te pagaron."**
- [CAPTURA: panel con cuatro ataques rechazados y su motivo]

## 4 · La deuda viaja de celular en celular y se cobra al volver la red
- Sobre cifrado (ECDH P-256 + AES-GCM): los relevos no pueden leer ni alterar.
- 50 copias = una deuda (dedupe por `(payer_id, counter)`).
- Cobro CoDi real de **$0.01** (monto de prueba) con webhook firmado y clave de rastreo de Banxico.
- [CAPTURA: tienda "Cobrado por CoDi · clave de rastreo …"]

## 5 · Riesgo acotado y explicable
- Tope diario por persona ($300 celular, $100 pulsera) · reputación determinista que viaja en una lista firmada.
- Honestidad: el doble gasto offline no se impide al 100%; se **acota** con el tope y se **detecta** al sincronizar.
- Fondo de garantía en desastre declarado: **propuesta de política**, fuera de pey.
- [CAPTURA: tablero de deudas y reputación]

## 6 · Cómo lo hicimos
- Agentes en paralelo con Codex y worktrees, con revisión cruzada y tests primero.
- pey para el cobro · OpenAI para explicar y para la voz del comercio; **nunca decide dinero ni confirma un pago**.
- [DIAGRAMA: celular → sobre cifrado → relevos → servidor → pey/CoDi]
- Repo público con datos sintéticos · demo en https://sinsenal-9lb5.onrender.com
