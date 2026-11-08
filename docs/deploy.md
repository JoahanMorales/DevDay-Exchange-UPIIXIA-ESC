# Deploy HTTPS (HACK-009) · lo publica Victor

Por qué: WebCrypto, micrófono, NFC y la instalación del PWA exigen HTTPS. Los agentes **no publican ni crean cuentas**; Victor sigue estos pasos.
Ya existen `Dockerfile`, `.dockerignore` y `render.yaml` (los creó HACK-001 con `uak deploy --write`): un solo servicio web que
construye `web/` y FastAPI sirve `/api` y la app.

## Decisiones de Victor (resueltas)
**Resultado real:** plan **free** (sin pago), servicio `sinsenal`, SQLite en `/tmp` (efímera: cada redeploy y cada reposo borran los datos). Los secretos (`PEY_*`, `OPENAI_API_KEY`, `SERVER_SIGNING_KEY`) los pone un humano en el dashboard de Render.
Consecuencias: el demo debe resembrarse con el endpoint de HACK-029 tras cada redeploy, y el plan free se duerme a los 15 min: despertarlo (abrir la URL) 2 min antes de la demo.

### Opciones que se evaluaron
1. **Plan:** `render.yaml` dice `plan: starter` (de pago). Un plan gratis se duerme a los 15 min y la primera petición del demo tarda ~1 min.
   Para la demo conviene uno que no duerma. Pagarlo es decisión de Victor, no del agente.
2. **Nombre del servicio:** el Blueprint lo llama `hack-001` (nombre heredado de la tarea). Cambiarlo a `sinsenal` define la URL pública;
   `render.yaml` es de HACK-001, así que pídelo con `uak msg HACK-001 --kind request "render.yaml · name: sinsenal · URL pública"` o edítalo en el dashboard.
3. **Disco para SQLite:** el contenedor pierde su disco en cada redeploy. Si `DATABASE_PATH` apunta al disco efímero, **se pierden payers, deudas y
   credenciales** al hacer merge. Opciones: añadir un disco persistente (`uak deploy --disk /data` y `DATABASE_PATH=/data/sinsenal.db`) o aceptar
   que el demo se resiembra con el endpoint de HACK-029.

## Pasos (Render Blueprint)
1. render.com → **New → Blueprint** → conectar `github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC`, rama `main`, archivo `render.yaml`.
2. Rellenar en el dashboard las variables marcadas `sync: false` (**solo nombres aquí; los valores nunca entran al repo**):
   `PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `PEY_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL_TEXTO`, `OPENAI_MODEL_VOZ`,
   `SERVER_SIGNING_KEY`, `DEMO_MODE`, `DEMO_REAL_AMOUNT`, `DATABASE_PATH`.
   - `DEMO_MODE=1` hasta HACK-024 (cobro real); `DEMO_REAL_AMOUNT=0.01`.
   - `SERVER_SIGNING_KEY`: generar una llave P-256 propia de producción; **no** usar la de `vectors.json` (es solo de prueba).
3. **Create**. Render construye el `Dockerfile` (Node 22 para `web/`, Python 3.12 con `uv`).
4. Anotar la URL pública, de la forma `https://sinsenal-9lb5.onrender.com`, en este archivo (sección siguiente) y avisar con `uak msg all`.

## URL pública
**https://sinsenal-9lb5.onrender.com** (servicio `sinsenal`, desplegado por Victor desde `main`, `autoDeploy` activo).
`GET /api/health` → `200 {"status":"ok"}` comprobado por el agente (0.7 s).

## Cada merge
`autoDeploy: true`: cada push a `main` redespliega solo. Tras un merge esperar a que Render marque *Live* y comprobar
`curl -fsS https://sinsenal-9lb5.onrender.com/api/health`.

## Webhook de pey (HACK-024)
En el portal de pey registrar `https://sinsenal-9lb5.onrender.com/webhooks/pey` y copiar el secreto a `PEY_WEBHOOK_SECRET`.

## Verificación en el celular (Fer confirma)
1. Abrir la URL en Android Chrome, instalar el PWA ("Agregar a pantalla de inicio").
2. Abrirla una vez con red, activar modo avión y volver a abrirla: debe cargar. Registrar el resultado aquí.

| Dispositivo | Instala | Abre en modo avión | Notas |
|---|---|---|---|
| (pendiente) | | | |

## Después de que Victor conteste
El agente revisa `curl -fsS https://sinsenal-9lb5.onrender.com/api/health` y reporta el resultado real.
