# Backlog published on claims (uak plan)

Append-only; added to .uak/TASKS.md from main. Why: adding tasks never waits for a PR.
## HACK-032 · OpenAI collections assistant for the store (with network): read-only tools over the records

- **Type:** feature
- **Priority:** P1
- **Estimate:** 60 min
- **Rubric / Spec:** C6, C3 · IDEA §7 (Responses API, anti-hallucination rule)
- **Depends on:** HACK-012, HACK-022
- **Uses contract:** HACK-003
- **Related:** HACK-021, HACK-023
- **Paths:** app/services/assistant.py, app/routers/assistant.py, app/tests/test_assistant.py, web/src/features/assistant/
- **Freeze-Allowed:** no
- **Acceptance:** `POST /api/asistente` answers Lupita's questions in plain Spanish ("¿quién me debe?", "¿por qué rechazó el pagaré #17?", "redáctame un recordatorio para Mario") with the Responses API and function tools, model from `OPENAI_MODEL_TEXTO`; uses the `openai` SDK already in the lockfile (no new dependency)., Tools are read-only: `listar_deudas(merchant_id)`, `explicar_rechazo(attack_id)`, `redactar_recordatorio(debt_id)`. No tool signs, sends a pey charge, marks a payment or changes a cap., Every amount, counter or date in an answer is inserted by template from the records; model text with other digits is discarded and a template answer is returned (`fuente: "plantilla"`), same as HACK-022. Same fallback on timeout or error., Only offered when online. Recipe: detail · Hero: the answer with its source.
- **Tests:** answers_who_owes_from_records_only, registers_only_read_only_tools, discards_answer_with_numbers_not_in_records, falls_back_to_template_when_openai_fails
- **Verify:** `uv run pytest -q app/tests/test_assistant.py && npm --prefix web test -- src/features/assistant && npm --prefix web run build`
- **Next step:** `app/tests/test_assistant.py` with a Fake OpenAI client returning a tool call.

## HACK-033 · Spike OpenAI Decisions API: label sync alerts for the dashboard (rules still decide)

- **Type:** spike
- **Priority:** P2
- **Estimate:** 45 min
- **Rubric / Spec:** C6 · IDEA §7 (Decisions API, status in conflict between sources)
- **Depends on:** HACK-012
- **Uses contract:** HACK-003
- **Related:** HACK-021, HACK-022
- **Paths:** app/services/alerts.py, app/tests/test_alerts.py, docs/spikes/decisions.md
- **Freeze-Allowed:** no
- **Acceptance:** First 15 min: check in the installed `openai` SDK and developers.openai.com whether the Decisions API is available to our key; record the answer in `docs/spikes/decisions.md`. If not available, stop there (deterministic labels only) and say so., If available: each sync alert (double spend, duplicated payment, expired charge, revoked payer) gets a priority and a one-line Spanish label for the dashboard. The deterministic rule decides the alert and its state; the model only labels and orders. Fallback: rule-based labels.
- **Tests:** rule_decides_alert_even_when_model_disagrees, falls_back_to_rule_labels_when_api_unavailable
- **Verify:** `uv run pytest -q app/tests/test_alerts.py && test -s docs/spikes/decisions.md`
- **Next step:** search the installed SDK for the Decisions client (`uv run python -c "import openai; print(openai.__version__)"`).

## HACK-034 · CI: install web deps (npm --prefix web ci) before Product smoke in .github/workflows/uak.yml; main CI fails with tsc: not found (follow-up of HACK-001)

- **Type:** follow-up
- **Priority:** P1
- **Depends on:** HACK-001
- **Follow-up of:** HACK-001
- **Paths:** pyproject.toml, uv.lock, .python-version, app/__init__.py, app/main.py, app/config.py, app/routers/__init__.py, app/services/__init__.py, app/tests/__init__.py, app/tests/test_health.py, web/package.json, web/package-lock.json, web/index.html, web/vite.config.ts, web/tsconfig.json, web/tsconfig.app.json, web/tsconfig.node.json, web/eslint.config.js, web/src/main.tsx, web/src/App.tsx, web/src/index.css, web/src/lib/api.ts, web/src/vite-env.d.ts, web/src/test/, web/public/, Dockerfile, .dockerignore, render.yaml, .env.example, .github/workflows/
- **Freeze-Allowed:** no
- **Acceptance:**
  - CI: install web deps (npm --prefix web ci) before Product smoke in .github/workflows/uak.yml; main CI fails with tsc: not found
- **Verify:** `uv run pytest -q app/tests/test_health.py && npm --prefix web run build && npm --prefix web test && test -f Dockerfile && test -f render.yaml`
