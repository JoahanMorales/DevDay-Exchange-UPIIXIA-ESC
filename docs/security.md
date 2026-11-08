# Seguridad · pasada previa a la publicación (HACK-025)

Fecha: 2026-11-08 · alcance: lo que se publica (repo **PUBLIC** `JoahanMorales/DevDay-Exchange-UPIIXIA-ESC`, historial de git, endpoints `DEMO_MODE`). Auditoría a mano con comandos; no se hizo una revisión completa de todo el checklist de lanzamiento por falta de tiempo antes del freeze.

## Resultado

| Ítem | Estado | Evidencia | Arreglo |
|---|---|---|---|
| Secretos en archivos versionados | PASS | `bash .uak/bin/secret-scan --tracked` → `SECRET_SCAN_PASS files=569` | — |
| `.env` fuera de git | PASS | `.gitignore:1:.env`; en el historial solo se agregó `.env.example` (todas las variables vacías) | — |
| Llaves en el historial (`sk-…`, `whsec_…`) | PASS | `git log --all -p` con grep: sin coincidencias reales (solo el texto `sk-assignment-notification-service` del kit) | — |
| CLABE (18 dígitos) en el historial | PASS | `git log --all -p` con grep `\b[0-9]{18}\b`: 0 coincidencias | — |
| Teléfonos en el historial | PASS | Solo números sintéticos: `5512345678` (tests/probe), `5512344321` (`web/src/features/pay/index.tsx:79`, marcado `demo_data`), `55000000xx` (fixtures) | — |
| Nombres reales en los datos | PASS | Solo personas sintéticas (Ana, Mario, Lupita, Doña Carmen, Luis); `docs/campo.md` y `docs/protocolo.md` exigen anonimizar | — |
| `POST /demo/reset` sin `DEMO_MODE` | PASS | `app/routers/demo.py:15` → 404; `app/tests/test_demo.py:30` | — |
| `POST /demo/simular-pago/{id}` sin `DEMO_MODE` | PASS | `app/routers/webhooks.py:72` → 404; `app/tests/test_webhooks.py:78` | — |
| Webhook pey firmado | PASS | `app/routers/webhooks.py:32` Standard Webhooks sobre el cuerpo crudo, 401 con firma mala, 503 sin secreto; idempotente por `webhook-id` | — |
| Entrada del asistente (OpenAI) | PASS (con nota) | `app/routers/assistant.py:17` pregunta 1–500 caracteres; exige `merchant_id` existente | Nota: sin rate limit → en un deploy público alguien podría gastar créditos de OpenAI. No crítico para la demo; vigilar el uso. |
| Validación de esquemas | PASS | `app/schemas/models.py`: teléfono `^\d{10}$`, montos `gt=0`, nonce hex, coordenadas acotadas | — |

Verificación de los gates: `bash .uak/bin/q uv run pytest -q --tb=short -x app/tests/test_demo.py app/tests/test_webhooks.py` → `OK exit=0`.

**Hallazgos críticos: ninguno.** No hizo falta abrir tareas de seguimiento.

## Solo para humanos (márquenlos ustedes)

- [ ] En el deploy público, `DEMO_MODE` encendido solo durante la demo; apagarlo después.
- [ ] Rotar `PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `OPENAI_API_KEY` y `SERVER_SIGNING_KEY` después del evento (se usaron en máquinas compartidas).
- [ ] Poner un límite de gasto en la cuenta de OpenAI.
- [ ] 2FA en GitHub, Render y pey.
- [ ] El historial muestra los correos personales de los autores de los commits (algo normal en un repo público); cada quien decide si le parece bien.
- [ ] Revisar los logs del deploy durante la demo.
