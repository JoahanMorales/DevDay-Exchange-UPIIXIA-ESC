# Checklist de demo y entrega · SinSeñal

Dueño de la entrega: **Victor**. Los agentes preparan textos; **sólo Victor envía** el portal y el correo.
Horario (domingo 8-nov, America/Mexico_City): freeze 11:12 · ensayo limpio 12:02 · entrega interna 12:31 · **cierre oficial 13:00**.

## 1. Antes del ensayo (12:02)
- [ ] Render *Live* con el último `main`: `curl -fsS https://sinsenal-9lb5.onrender.com/api/health` → `{"status":"ok"}`. Abrir la URL 2 min antes (el plan free se duerme a los 15 min).
- [ ] Resembrar datos: `curl -X POST https://sinsenal-9lb5.onrender.com/demo/reset` (requiere `DEMO_MODE=1` en Render; datos sintéticos).
- [ ] `DEMO_REAL_AMOUNT=0.01` en Render y la etiqueta "monto de prueba" visible en la UI.
- [ ] Celulares cargados, volumen al máximo, modo avión listo; impresos de `docs/print/` (QR de mostrador, "Si tu celular no vibró").
- [ ] Hotspot propio encendido como respaldo de la red del lugar.
- [ ] Video plan B en `docs/demo/plan-b.mp4` (o enlace) abierto en una pestaña.

## 2. Ensayo limpio (12:02) · guion en `docs/demo/guion.md`
- [ ] Paso 1: pago sin red por sonido → "Pagaré válido" + vibración. Plan B: QR animado.
- [ ] Paso 3: los cuatro ataques rechazados con motivo; la tienda **no** vibra.
- [ ] Paso 5: sync → cobro CoDi real de $0.01 al juez → "Cobrado por CoDi". Plan B: `POST /codi/qr` para escanear → video del paso 5.
- [ ] Cronometrar: ≤ 3:00.
- [ ] Anotar lo que falló y qué plan B se usa en vivo.

## 3. Videos
- [ ] Plan B: recorrido completo grabado (pasos 1→5).
- [ ] Video de entrega de **30 s** (el que va en el correo): problema (5 s) → pago sin red y vibración (10 s) → ataque rechazado (7 s) → cobro CoDi real (8 s). Subirlo como enlace público (YouTube no listado o Drive con acceso por enlace) y probar el enlace en una ventana privada.

## 4. Repo
- [ ] `README.md` en `main`: problema, cómo correr con `DEMO_MODE=1` en 2 comandos, cómo se construyó con agentes.
- [ ] Repo público: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC (verificar en ventana privada).
- [ ] Sin secretos en el repo: `.env` ignorado; sólo `.env.example` con nombres.

## 5. Entrega interna (12:31) y oficial (antes de 13:00)
- [ ] Portal del evento: subir nombre, descripción, repo y video (textos abajo).
- [ ] Correo a **hola@aibuilders.lat** con video + repo (texto abajo). Enviarlo **Victor**, desde su cuenta.
- [ ] Confirmar recepción (captura del correo enviado y del portal) y avisar al equipo.

## Texto para el portal

**Nombre:** SinSeñal

**Una línea:** Cobra en digital aunque no haya red, con pagarés firmados que nadie puede falsificar, y liquídalos por CoDi con pey cuando vuelve la señal.

**Descripción:**
El pago digital en México falla justo cuando más se necesita (sismo, apagón, mercado sin señal) y, cuando funciona, nadie le cree (comprobantes editados, bocinas falsas, voces de IA). Por eso el 85% de las compras de menos de $500 siguen en efectivo.
SinSeñal no mueve dinero sin red: mueve una deuda firmada. El celular del cliente firma un pagaré (ECDSA P-256 en el navegador) contra un reto de un solo uso y lo entrega por sonido o QR; el celular de la tienda sólo vibra si la firma es válida, así que una grabación o una voz clonada se rechazan en vivo. Al volver la señal, el servidor verifica firmas y duplicados y manda un cobro push CoDi con la API de pey; sólo se marca pagado con el webhook firmado de pey. OpenAI ayuda al comercio a capturar por voz y explica anomalías, pero nunca decide montos ni confirma pagos.
Lo construimos seis personas con agentes de código en paralelo (Claude Code, Codex y Cursor), una rama y un worktree por tarea, y reviews cruzadas antes de cada merge.

## Texto del correo (Victor lo envía)

**Para:** hola@aibuilders.lat
**Asunto:** Entrega DevDay Exchange CDMX · SinSeñal · UPIIXIA ESC

> Hola, equipo de AI Builders:
>
> Enviamos nuestro proyecto para el DevDay Exchange Community Hackathon: Mexico City.
>
> **Proyecto:** SinSeñal: pagos digitales para comercios de barrio que funcionan sin red, con pagarés firmados que no se pueden falsificar y liquidación por CoDi con la API de pey.
> **Video (30 s):** <ENLACE DEL VIDEO>
> **Repositorio:** https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC
> **Demo en vivo:** https://sinsenal-9lb5.onrender.com
> **Equipo:** Fanny, Yael, Yojan, Fer, Andy y Victor (UPIIXIA · ESC).
>
> El README explica el problema, cómo correrlo con `DEMO_MODE=1` en dos comandos y cómo lo construimos con agentes en paralelo.
>
> Gracias,
> Victor
