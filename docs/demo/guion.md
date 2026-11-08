# Guion de pitch · SinSeñal (3:00)

Fuente: IDEA Apéndice A, §4 (pasos), §8 (rúbrica), §11 (cifras). **Toda cifra cita una fila de §11; lo que no está ahí no se dice.**
Regla de honestidad: el pagaré dice $25 en pantalla pero el cobro CoDi real es de **$0.01** ("monto de prueba", visible en la UI). Se dice en voz alta.

| Tiempo | Beat | Paso de IDEA §4 | Qué se dice (resumen) | Qué se ve | Plan B |
|---|---|---|---|---|---|
| 0:00–0:25 | 1. Problema | (diapositiva 1) | "El pago digital falla justo cuando más se necesita, y cuando funciona, nadie le cree." 85% de las operaciones menores a 500 pesos se pagan en efectivo; la meta oficial es 50% digital en 2027. La Ley de Economía Digital (aprobada por Diputados y Senado en octubre) sólo admite efectivo ante fallas de conectividad o luz. | Diapositiva 1 con las dos fallas y 3 cifras con fuente al pie | Sin red/audio: es solo voz y diapositiva |
| 0:25–1:10 | 2. Pago sin red | Pasos 1 y 2 | Modo avión. Lupita teclea $25, Mario acerca el celular, suena el chirrido. Vibra. "No se movió dinero: se firmó una deuda que nadie puede falsificar." Después Doña Carmen con su pulsera. | Tienda: "Pagaré válido · $25.00 · Mario ···4321 · #17" en verde + vibración; en Mario: "Firmaste un pagaré por $25 a Tienda Lupita" | Paso 1: ruido de sala → mismo pagaré por **QR animado** con un clic. Paso 2: NFC no sirve → **QR impreso en la pulsera** (misma credencial) |
| 1:10–1:40 | 3. Ataques (wow, ~70 s) | Paso 3 | Cuatro ataques: grabación del paso 1, voz de IA que dice "pago recibido", pagaré a 2 km, pagaré #17 repetido. Todos rechazados con motivo. **"Si tu celular no vibró, no te pagaron."** | Cuatro motivos legibles: reto vencido/ya usado · audio sin firma válida · fuera de 50 m · contador repetido. La tienda no vibra | Si el sonido falla en vivo: los mismos ataques con QR; el panel de ataques (HACK-017) funciona sin audio. Video grabado del paso 3 |
| 1:40–2:20 | 4. La deuda viaja y se cobra | Pasos 4 y 5 | El celular de la tienda pasa los pagarés cifrados a un vecino y a un tercero. El tercero recupera señal: "2 pagarés recibidos · 0 duplicados · firmas válidas". Al juez le llega un **cobro CoDi real de $0.01** en su app bancaria; lo aprueba con huella. | Contador de saltos; en el servidor las firmas válidas; la tienda pasa a "Cobrado por CoDi · clave de rastreo …" | Relevo: QR animado entre celulares. Push no llega al banco del juez → `POST /codi/qr` con $0.01 para escanear. Red del lugar falla → hotspot propio. Todo falla → video del paso 5 + "Webhook Logs" del portal de pey |
| 2:20–2:45 | 5. Riesgo controlado | Paso 6 | Topes por persona, reputación que viaja con la lista firmada por el servidor, fondo de garantía en desastre declarado (**propuesta de política, fuera de pey; en la demo es un botón**). Honesto: el doble gasto offline no se impide al 100%, se acota con el tope y se detecta al sincronizar. | Tablero: deudas pendientes/cobradas, reputación, botón "Desastre declarado" | Capturas del tablero en el deck (diapositiva 5) |
| 2:45–3:00 | 6. Cómo lo hicimos | (diapositiva 6) | Agentes en paralelo con Codex y worktrees, pey para el cobro, OpenAI para explicar y para la voz del comercio; **nunca para decidir dinero ni confirmar un pago**. | Diapositiva 6: arquitectura en una imagen | — |

## Si el jurado tiene poca paciencia
Abrir con el ataque (beat 3) a los 30 s, y contar el problema después.

## Cifras permitidas (con su fuente de IDEA §11)
- 85% de las operaciones menores a 500 pesos en efectivo; meta de 50% de pagos digitales en 2027 → grupoanimal.mx (Ley Economía Digital 50%).
- CoDi: 21.79 M de cuentas validadas, 2.47 M han pagado alguna vez (sep-2025) → La Razón.
- Art. 15 de la Ley de Economía Digital: efectivo sólo ante fallas de conectividad o luz → idconline.mx. Aprobada por Diputados (6-oct-2026) y Senado (20-oct-2026); **publicación en el DOF sin confirmar al 28-oct**: decir "aprobada", no "vigente".
- 60+ concentran 32% de las quejas contra bancos por posible fraude → El Imparcial/Condusef. 75+ con internet: 30.3% → ENDUTIH 2025.
- Pix por proximidad: 0.01% de los Pix en enero de 2026 → Agência Brasil (la comodidad sola no genera adopción).

## Prohibido decir (sin fuente verificada, IDEA §11)
Cifras de caída de red en sismos pasados · montos de fraude con bocinas en India · validez legal específica del pagaré electrónico (decir "sirve como evidencia", sin citar ley) · Tailandia · adopción o usuarios (no hay piloto) · "lo usan N comercios".

## Antes de subir al escenario (checklist)
- [ ] Cada beat se probó de principio a fin con los aparatos reales; lo que no se probó se dice como "prototipo", no como hecho.
- [ ] Modo avión real en los celulares de Lupita/Mario/Carmen; red de respaldo (hotspot) lista.
- [ ] El monto de $0.01 está visible en la UI y el pitch lo dice.
- [ ] Servicio de Render despierto (plan free: abrir la URL 2 min antes) y datos resembrados (HACK-029).
- [ ] Video plan B (`docs/demo/plan-b.mp4`) abierto en otra pestaña.
- [ ] Cierre del beat 3: "Si tu celular no vibró, no te pagaron."
