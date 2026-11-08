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

## HACK-035 · Sync uses reputation: revocation_list from reputation.py (monotonic version, caps base x factor) and recompute_all after sync (follow-up of HACK-012)

- **Type:** follow-up
- **Priority:** P1
- **Depends on:** HACK-012
- **Follow-up of:** HACK-012
- **Paths:** app/routers/sync.py, app/routers/debts.py, app/services/debts.py, app/tests/test_sync.py, app/tests/test_debts.py
- **Freeze-Allowed:** no
- **Acceptance:**
  - Sync uses reputation: revocation_list from reputation.py (monotonic version, caps base x factor) and recompute_all after sync
- **Verify:** `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`

## HACK-036 · URGENTE: conectar el sondeo de respaldo: tras enviar el push CoDi, sondear GET /transaction/{id} en segundo plano (cada 5 s, hasta 6 min) y marcar PAGADA con debts.poll; y POST /api/deudas/{id}/verificar para forzarlo. El webhook de pey no llega. (follow-up of HACK-012)

- **Type:** follow-up
- **Priority:** P1
- **Depends on:** HACK-012
- **Follow-up of:** HACK-012
- **Paths:** app/routers/sync.py, app/routers/debts.py, app/services/debts.py, app/tests/test_sync.py, app/tests/test_debts.py
- **Freeze-Allowed:** no
- **Acceptance:**
  - URGENTE: conectar el sondeo de respaldo: tras enviar el push CoDi, sondear GET /transaction/{id} en segundo plano (cada 5 s, hasta 6 min) y marcar PAGADA con debts.poll; y POST /api/deudas/{id}/verificar para forzarlo. El webhook de pey no llega.
- **Verify:** `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
## HACK-037 · UI wave 1: navigation in flow order, icons, mobile bar that fits, 404, skip link

- **Type:** feature
- **Priority:** P0
- **Estimate:** 35 min
- **Rubric / Spec:** C1, C3 · web/DESIGN.md §Shell, skills `redesign-existing-projects` + `product-ui` §6 ("a bare row of text links clipped at 390")
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-038, HACK-039, HACK-040
- **Paths:** web/src/lib/ui/Shell.tsx, web/src/lib/ui/nav.ts, web/src/lib/ui/nav.test.ts, web/src/App.tsx, web/index.html, web/src/features/notfound/
- **Freeze-Allowed:** yes
- **Acceptance:** Nav order follows the demo flow, not the alphabet: Cobrar, Pagar, Ataques, Relevo, Tablero, Asistente (`lib/ui/nav.ts` exports the order and a sort used by App.tsx; unknown routes go last)., Every nav entry has a Phosphor icon (one set, one weight). At 390 px the bottom bar shows icon + short label for all 6 entries with no clipping at 360 and 390; the current page is clearly marked at both sizes, including on the landing (where no entry is active the brand mark is)., The brand mark always links home. A "Saltar al contenido" skip link exists and is visible on focus. An unknown URL shows a designed 404 inside the shell with a way back., `<title>` per route and a meta description.
- **Tests:** nav_follows_demo_flow_not_alphabet, unknown_routes_sort_last
- **Verify:** `npm --prefix web test -- src/lib/ui && npm --prefix web run build && bash .uak/bin/design-lint`
- **Next step:** `web/src/lib/ui/nav.test.ts` for the order, then NavBar icons.

## HACK-038 · UI wave 2: kit polish: hover, focus, press, balanced headings, tinted shadows, EmptyState and Skeleton

- **Type:** feature
- **Priority:** P0
- **Estimate:** 30 min
- **Rubric / Spec:** C1 · skill `redesign-existing-projects` §Interactivity and Surface, `product-ui` §2 (empty, loading, error)
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-037, HACK-039
- **Paths:** web/src/lib/ui/kit.tsx, web/src/lib/ui/index.ts, web/src/index.css
- **Freeze-Allowed:** yes
- **Acceptance:** Every Button variant has hover, a visible `focus-visible` ring and a pressed state; list rows get a quiet hover; transitions 150-250 ms, none under `prefers-reduced-motion`., Headings use `text-wrap: balance` and body copy `text-wrap: pretty`; the card shadow is tinted with the paper hue instead of black., New kit components `EmptyState` (icon, one sentence, one action) and `Skeleton` (shaped like a row or a stat), exported from `lib/ui`., Tokens only; no new colors, sizes or fonts (design-lint keeps the scale at 6 sizes).
- **Test-First:** no (styling and kit components, verified by design-lint, build and screenshots)
- **Verify:** `npm --prefix web run build && bash .uak/bin/design-lint`
- **Next step:** Button hover/focus/pressed in `kit.tsx`, then `EmptyState` and `Skeleton`.

## HACK-039 · UI wave 3: designed empty and loading states on the demo screens

- **Type:** feature
- **Priority:** P0
- **Estimate:** 35 min
- **Rubric / Spec:** C1 · skill `product-ui` §2 "Empty, loading, error: designed like the screen"
- **Depends on:** HACK-038
- **Uses contract:** None
- **Related:** HACK-037
- **Paths:** web/src/features/attacks/, web/src/features/dashboard/, web/src/features/relay/, web/src/features/assistant/
- **Freeze-Allowed:** yes
- **Acceptance:** `/ataques`, `/tablero`, `/relevo` and `/asistente` show `EmptyState` (one sentence, one action) when there is no data and `Skeleton` while loading, instead of blank space; no screen leaves more than a third of the viewport empty at 1280x720 or 390x844 on first load., Behavior, props and existing tests are unchanged.
- **Test-First:** no (visual states over existing behavior; existing tests must keep passing)
- **Verify:** `npm --prefix web test -- src/features && npm --prefix web run build && bash .uak/bin/design-lint`
- **Next step:** replace the blank block of `/ataques` first (largest empty area).

## HACK-040 · UI wave 4: landing, Cobrar and Pagar polish

- **Type:** feature
- **Priority:** P1
- **Estimate:** 35 min
- **Rubric / Spec:** C1, C2 · skills `landing-story` + `product-ui` §5 (3-second judge test)
- **Depends on:** HACK-037, HACK-038
- **Uses contract:** None
- **Related:** HACK-039
- **Paths:** web/src/features/landing/, web/src/features/store/, web/src/features/pay/
- **Freeze-Allowed:** yes
- **Acceptance:** Landing: the wow screenshot and the one line are the biggest things at 1280x720 and 390x844; one primary action (Cobrar sin red), the second action a text link; the sourced figures (85%, 2.47 M of 21.79 M) visible below the fold with their source; a footer with the real repo and the plan-B note., `/tienda` and `/pagar` fill the viewport with intent (no dead space under the keypad), keep one primary action, and every state (loading, error, offline) reads in plain Spanish., Behavior and existing tests unchanged.
- **Test-First:** no (layout and copy over existing behavior; existing tests must keep passing)
- **Verify:** `npm --prefix web test -- src/features && npm --prefix web run build && bash .uak/bin/design-lint`
- **Next step:** landing hierarchy at 390 px first.
## HACK-041 · Landing wow: a Three.js scene that tells the idea in 14 seconds

- **Type:** feature
- **Priority:** P0
- **Estimate:** 50 min
- **Rubric / Spec:** C1, C2, C5 · skills `landing-story`, `frontend-design`, `product-ui` §5 (3-second judge test)
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-040
- **Paths:** web/package.json, web/package-lock.json, web/src/features/landing/
- **Freeze-Allowed:** yes
- **Acceptance:** A new landing section right under the hero, "La idea en 14 segundos": a WebGL scene (`three`, loaded with a dynamic import so the hero and text paint first) with four beats, each with a live caption and the matching step highlighted: 1 Sin señal: Mario firma un pagaré y la tienda vibra; 2 Nadie puede falsificarlo: a replayed ticket is rejected; 3 Viaja de celular en celular; 4 Con señal se cobra por CoDi ($0.01 test amount shown as "monto de prueba")., Colors read from the CSS tokens at runtime (no hex in feature code); pauses when the tab is hidden or the section is off screen; pause/replay control reachable by keyboard; `prefers-reduced-motion` and no-WebGL both show a still frame with the same captions; frame time stays smooth on a phone (device pixel ratio capped at 2); the scene is disposed on unmount., The existing hero, the real attack-log capture and the sourced figures stay as they are.
- **Tests:** timeline_covers_the_whole_loop_in_four_beats, reduced_motion_shows_the_last_beat
- **Verify:** `npm --prefix web test -- src/features/landing && npm --prefix web run build && bash .uak/bin/design-lint`
- **Next step:** `web/src/features/landing/scene/timeline.test.ts` for the pure beat timeline, then the scene.
