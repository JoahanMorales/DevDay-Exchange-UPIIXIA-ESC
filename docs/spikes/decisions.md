# Spike Decisions API (HACK-033)

## Pregunta
¿La Decisions API está disponible para nuestra llave? (IDEA §7: etiquetar y ordenar las alertas de una sincronización.)

## Qué comprobé (8-nov-2026, SDK instalado `openai` 3.46.0)
- **El SDK la trae:** `client.decisions.create(...)` existe (`openai/resources/decisions.py`).
- **Solo acepta el modelo `gpt-6-luna`** (lo dice la propia documentación del método en el SDK).
- **Qué hace:** responde de 1 a 400 preguntas de clasificación sobre un texto: `predicate` (sí/no), `choice` (elegir entre 2 y 255 opciones, con
  confianza y probabilidades) o `score`. No genera texto libre. Eso encaja con "el modelo solo etiqueta y ordena".
- Un `refusal` puede venir como respuesta a una pregunta; el código lo ignora.

## Qué NO comprobé
- **Si NUESTRA llave tiene acceso.** Ningún agente toca las llaves (`.env` es solo de humanos), y no hice una llamada real. Que el SDK traiga el
  método no prueba que la cuenta lo tenga habilitado ni que `gpt-6-luna` esté en nuestro proyecto.
- **developers.openai.com:** no consulté la documentación web; solo el SDK instalado.

## Prueba de 1 minuto para un humano (con su llave, en su terminal)
```bash
uv run python -c "
from openai import OpenAI
r = OpenAI().decisions.create(model='gpt-6-luna', input='Doble gasto detectado con $25 en riesgo',
    questions=[{'type':'choice','name':'t','instructions':'¿Urgencia?','choices':[{'value':'alta'},{'value':'media'},{'value':'baja'}]}])
print(r.answers[0])"
```
Si responde una `choice`, anotar aquí **"disponible"**; si da 403/404, anotar **"no disponible"** y no hace falta cambiar nada.

## Decisión
**Disponibilidad: pendiente de la prueba de arriba.** Mientras tanto el producto no depende de ella:
- `app/services/alerts.py`: **las reglas deciden qué alertas existen** (doble gasto, pago duplicado, cobro vencido, pagador revocado) y su estado.
- La etiqueta es **siempre la línea en español de la regla**; ningún texto libre del modelo llega a la pantalla.
- Con `DecisionsRanker` el modelo solo puede **subir** la urgencia de una alerta (alta/media/baja); nunca quitarla, añadirla ni bajarla.
- Sin llave, sin acceso, con error o con rechazo: se quedan las prioridades de las reglas (`alerts.label(found, None)`).
- Al modelo no se le envían teléfonos ni montos.

## Estado del cableado
`alerts.py` (detección, etiquetas, ranker) está probado con un cliente falso. **No está conectado** a una ruta ni al tablero: el tablero
(HACK-021) y el cliente `DecisionsRanker` real no se han ejercitado contra la API. Conectarlo es un cambio pequeño fuera de los `Paths` de esta tarea.
