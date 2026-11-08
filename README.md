# SinSeñal

**Cobra en digital aunque no haya red, con pagarés firmados que nadie puede falsificar, y liquídalos por CoDi cuando vuelve la señal.**

DevDay Exchange Community Hackathon: Mexico City (7–8 nov 2026) · reto: herramientas de bien público con OpenAI + CoDi vía la API de [pey](https://docs.pey.mx).
Demo en vivo: https://sinsenal-9lb5.onrender.com (plan free de Render: la primera visita puede tardar ~1 min en despertar).

## El problema

*El pago digital en México falla justo cuando más se necesita, y cuando funciona, nadie le cree.*

| Falla | Qué pasa en la calle |
|---|---|
| **F1 · Sin red no hay pago** | Sismo, apagón, red saturada, mercado sin señal: sin internet no hay SPEI, CoDi ni terminal. La Ley de Economía Digital (art. 15) sólo admite seguir en efectivo ante falla de conectividad o luz. |
| **F2 · Con red, la confirmación se falsifica** | Comprobantes editados, bocinas o apps que "anuncian" pagos falsos, voces generadas con IA. El tendero aprende que sólo el efectivo no miente. |

El 85% de las operaciones de menos de $500 se paga en efectivo, y sólo 2.47 M de 21.79 M de cuentas CoDi validadas han pagado alguna vez (fuentes en `IDEA.md` §11).

## La solución

Sin red **no se mueve dinero: se mueve una deuda firmada**.

1. **Pago sin red.** La tienda manda un reto de un solo uso; el celular del cliente firma un pagaré (ECDSA P-256 en el navegador, WebCrypto) y lo entrega por sonido (ggwave) o QR. *Diseñado, aún no en esta versión:* pulsera NFC sin batería para quien no trae celular (`IDEA.md` §5.4).
2. **Ataques rechazados.** Una grabación, una voz de IA, un pagaré a 2 km o un pagaré repetido se rechazan con motivo legible. El celular de la tienda **sólo vibra tras verificar la firma**: *si tu celular no vibró, no te pagaron.*
3. **La deuda viaja por el aire.** Los pagarés, cifrados para el servidor, saltan de celular en celular (guarda y reenvía) hasta que alguno tiene señal (el relevo entre celulares está en revisión; el servidor ya acepta sobres por `POST /api/sync`).
4. **Cobro por CoDi.** Al reconectar, `POST /api/sync` verifica firmas y duplicados y manda un cobro push CoDi por pey; sólo se da por pagado con el webhook firmado de pey. En la demo el cobro real es de **$0.01** ("monto de prueba", visible en la UI).
5. **IA de OpenAI** para la captura por voz del comercio y para explicar anomalías. **Nunca decide montos ni confirma pagos.**

Detalle técnico: [`docs/protocolo.md`](docs/protocolo.md). Idea completa: [`IDEA.md`](IDEA.md). Guion del pitch: [`docs/demo/guion.md`](docs/demo/guion.md).

## Correrlo en 2 comandos (`DEMO_MODE=1`)

Con Docker (lo mismo que corre en Render):

```bash
docker build -t sinsenal .
docker run --rm -p 8000:8000 -e DEMO_MODE=1 sinsenal
```

Sin Docker (Python 3.12 + [uv](https://docs.astral.sh/uv/), Node 22):

```bash
uv sync && (cd web && npm ci && npm run build)
DEMO_MODE=1 uv run uvicorn app.main:app --port 8000
```

Abre http://localhost:8000 y siembra los datos de demo (personas 100% sintéticas) con `curl -X POST http://localhost:8000/demo/reset`.
Health: `curl http://localhost:8000/api/health` → `{"status":"ok"}`.

- `DEMO_MODE=1` habilita `/demo/reset` y `/demo/simular-pago/{id}` (simula el webhook de pey sin dinero real). Sin él, esas rutas responden 404.
- Para el cobro CoDi real y la IA, copia `.env.example` a `.env` y llena `PEY_*` y `OPENAI_*` (los secretos nunca entran al repo).
- WebCrypto, micrófono y Web NFC exigen HTTPS fuera de `localhost`: para probar con celulares usa la URL de Render.
- Tests: `uv run pytest -q` (backend) y `cd web && npm test` (frontend).

## Cómo lo construimos: agentes en paralelo

Seis personas y hasta doce agentes de código trabajando a la vez sobre el mismo repo, coordinados con **UPIIXIA Agentic Kit** (`.uak/`):

- **Agentes:** Claude Code, Codex y Cursor, con la misma regla compartida (`AGENTS.md`) y configuración por herramienta (`.claude/`, `.codex/`, `.cursor/`). Cada humano corre hasta dos agentes con identidad propia (`victor-1`, `fer-2`, …).
- **Una tarea = una rama + un worktree + un claim.** `IDEA.md` se convirtió en un backlog de tareas verticales (`.uak/TASKS.md`) con criterios verificables, `Paths` reservados y un comando `Verify` exacto. `wt new HACK-0XX` crea rama, worktree, puerto y claim, así que ningún agente pisa los archivos de otro.
- **Estado compartido en Git**, en la rama `claims`: leases con heartbeat, mensajes entre agentes (contratos, peticiones, rechazos) y handoffs cuando un agente se queda sin contexto.
- **Test primero:** las pruebas de cada criterio fallan en su aserción antes de implementar, y las pruebas sólo crecen.
- **Reviews cruzadas:** el autor nunca revisa su PR. Otro agente revisa el SHA exacto, corre el `Verify` y aprueba o rechaza con `archivo:línea`; el merge a `main` pasa por esa compuerta. `main` redespliega solo en Render.
- **Humanos donde importa:** pruebas con pey, con Android y NFC reales, entrevistas de campo, deploy y la entrega. Los agentes nunca publican, gastan dinero ni manejan secretos.

## Equipo

UPIIXIA · ESC: Fanny, Yael, Yojan, Fer, Andy y Victor.
