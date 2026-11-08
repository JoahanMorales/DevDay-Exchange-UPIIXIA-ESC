# TASKS · stateless backlog · SinSeñal

State lives on the `claims` branch (`uak status`); this file holds only tasks. Source: `IDEA.md` (§4 flow, §5 protocol, §6 contract, §7 APIs, §9 cuts). Rubric IDs C1–C6 are the provisional ones in `.uak/PROJECT.md`.
Human-only steps (spending money with pey, the pey portal, publishing the deploy, handling phones, interviews) are done by the named human; the agent prepares everything and asks with `uak msg human`. Agents never run real pey charges.
Cut rule: if HACK-015 is not INTEGRATED by 08:00, cut HACK-018, HACK-019, HACK-020 and HACK-023 and put every agent on HACK-015, HACK-017, HACK-024.

## HACK-001 · Walking skeleton: FastAPI + Vite PWA served as one app, deployable

- **Type:** setup
- **Priority:** P0
- **Estimate:** 40 min
- **Rubric / Spec:** C1 · `.uak/stacks/fastapi-react/STACK.md`
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-003, HACK-008, HACK-009
- **Paths:** pyproject.toml, uv.lock, .python-version, app/__init__.py, app/main.py, app/config.py, app/routers/__init__.py, app/services/__init__.py, app/tests/__init__.py, app/tests/test_health.py, web/package.json, web/package-lock.json, web/index.html, web/vite.config.ts, web/tsconfig.json, web/tsconfig.app.json, web/tsconfig.node.json, web/eslint.config.js, web/src/main.tsx, web/src/App.tsx, web/src/index.css, web/src/lib/api.ts, web/src/vite-env.d.ts, web/src/test/, web/public/, Dockerfile, .dockerignore, render.yaml, .env.example, .github/workflows/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Backend per STACK.md (`app/main.py` auto-discovers routers, serves `web/dist`), plus every foreseeable dependency at once: `cryptography`, `standardwebhooks`, `openai`, `httpx`, `pydantic-settings`, `python-ulid`, `sse-starlette`.
  - Frontend per STACK.md plus `vite-plugin-pwa` (precaches the whole app shell so it opens in airplane mode), `idb`, `qrcode`, `jsqr`, `ggwave`, `vitest`, `fake-indexeddb`, `@testing-library/react`, `jsdom`; `npm --prefix web test` runs `vitest run --passWithNoTests`.
  - `web/src/App.tsx` mounts routes by auto-discovery: every `web/src/features/<f>/index.tsx` exporting `route = {path, element}` is picked up through `import.meta.glob`, so no feature task ever edits `App.tsx`.
  - Recipe: list · Hero: the route list placeholder (replaced by the design lock)
  - `config.py` reads `PEY_API_KEY`, `PEY_WEBHOOK_SECRET`, `PEY_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL_TEXTO`, `OPENAI_MODEL_VOZ`, `SERVER_SIGNING_KEY`, `DEMO_MODE`, `DEMO_REAL_AMOUNT`, `DATABASE_PATH`; `.env.example` lists the names only.
  - `bash .uak/bin/uak deploy --write` creates `Dockerfile`, `.dockerignore`, `render.yaml` (one web service: builds `web/`, FastAPI serves it; health `/api/health`).
  - `bash .uak/bin/uak init-smoke --command "uv run pytest -q && npm --prefix web run build"` and `bash .uak/bin/smoke` exits 0.
- **Tests:** test_health
- **Verify:** `uv run pytest -q app/tests/test_health.py && npm --prefix web run build && npm --prefix web test && test -f Dockerfile && test -f render.yaml`
- **Next step:** follow `.uak/stacks/fastapi-react/STACK.md` §Backend setup, then §Frontend setup.

## HACK-002 · pey probe: $0.01 push script for Fer, results doc

- **Type:** spike
- **Priority:** P0
- **Estimate:** 30 min (agent) + Fer runs it
- **Rubric / Spec:** C6 · IDEA §5.10, §7.1
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-010, HACK-024
- **Paths:** spikes/pey/, docs/pey-pruebas.md
- **Freeze-Allowed:** no
- **Acceptance:**
  - `spikes/pey/probe.py --phone 10DIGITS` sends `POST /codi/pn` with `amount` 0.01, `expiration` 360, `numRef`, `concept` ≤ 40 chars and `metadata`, then polls `GET /transaction/{id}` every 4 s until `PAID` or expiry, printing seconds elapsed. Reads `PEY_API_KEY` from the environment only; never prints it.
  - Tested against a Fake HTTP transport (no network in tests).
  - `docs/pey-pruebas.md`: a table for Fer (bank, arrived yes/no, seconds, merchant name shown, max concept length seen) and where to export one real `codi.pn.payment_received` webhook from "Webhook Logs" into `app/fixtures/sinsenal/webhook_pn_real.json` with personal data removed.
  - The agent never runs it against pey: `uak msg human "HACK-002 ready: Fer runs spikes/pey/probe.py"`.
- **Tests:** sends_push_with_one_cent_and_min_expiration, polls_until_paid_and_reports_seconds, never_prints_the_api_key
- **Verify:** `uv run --no-project --with pytest --with httpx python -m pytest -q spikes/pey/test_probe.py && test -s docs/pey-pruebas.md`
- **Next step:** write `spikes/pey/test_probe.py` with a Fake `httpx.MockTransport`.

## HACK-003 · Contract: schemas, binary IOU format, cross-language test vectors, TS types

- **Type:** contract
- **Priority:** P0
- **Estimate:** 50 min
- **Rubric / Spec:** C4 · IDEA §5.2–5.7, §6
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-010, HACK-011, HACK-012, HACK-013, HACK-014, HACK-022
- **Paths:** app/schemas/, app/fixtures/sinsenal/, app/tests/test_contract.py, docs/protocolo.md, web/src/lib/contract/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Pydantic models for every entity of IDEA §6 (`Payer`, `Merchant`, `Credential`, `Challenge`, `Iou`, `Envelope`, `Debt`, `ChargeAttempt`, `RevocationList`, `WebhookEvent`, `AttackLog`) and the request/response bodies of every endpoint in §6 (`SyncRequest`, `SyncResponse`, …), plus `ExplainResponse {texto, cifras, fuente: "openai"|"plantilla"}` for HACK-022.
  - `docs/protocolo.md`: the 61-byte IOU layout (big-endian, ULIDs as 16 raw bytes, lat/lon ×1e6 signed), the challenge layout, signature = raw `r||s` 64 bytes (WebCrypto), the envelope (ECDH P-256 ephemeral + HKDF-SHA256 info `sinsenal-v1` + AES-256-GCM 12-byte IV), and the merchant-credential QR the payer caches before going offline (a credential does not fit in one 140-byte ggwave message).
  - `app/fixtures/sinsenal/vectors.json`, generated by `app/fixtures/sinsenal/gen_vectors.py` (Python `cryptography`): server key, a payer key, one challenge, one IOU (raw bytes + raw r||s signature), one envelope with its plaintext. Python verifies its own vector after converting r||s → DER (`encode_dss_signature`).
  - Synthetic personas only (Lupita, Mario, Doña Carmen, Luis); no real phones or CLABEs.
  - `web/src/lib/contract/`: TS types mirroring the schemas, `transport.ts` (`interface Transport { send(bytes): Promise<void>; receive(): AsyncIterable<Uint8Array> }` for QR, sound and NFC), and a copy of `vectors.json`.
- **Tests:** iou_raw_is_61_bytes_and_roundtrips, vector_signature_verifies_after_rs_to_der, envelope_vector_decrypts_to_iou, debt_status_rejects_unknown_value, sync_response_has_accepted_duplicates_rejected
- **Verify:** `uv run --no-project --with pydantic --with pytest --with cryptography python -m pytest -q app/tests/test_contract.py`
- **Next step:** `app/schemas/protocol.py` with the IOU byte layout, then `gen_vectors.py`.

## HACK-004 · Spike ggwave: 125 bytes between two Android phones in the room

- **Type:** spike
- **Priority:** P0
- **Estimate:** 30 min
- **Rubric / Spec:** C1 · IDEA §5.3, §5.10
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-016
- **Paths:** spikes/ggwave/, docs/spikes/ggwave.md
- **Freeze-Allowed:** no
- **Acceptance:**
  - `spikes/ggwave/index.html` (standalone, no build): send a random 125-byte payload, receive it, show match yes/no and seconds; a selector for every ggwave protocol (audible normal/fast/fastest, ultrasound).
  - `docs/spikes/ggwave.md`: how Fer serves it over HTTPS (a tunnel from a laptop; mic needs a secure context) and a results table filled by Fer (lead) with Yojan: protocol, distance 30 cm / 1 m, room noise, success out of 10, seconds. Ends with the chosen protocol, or "QR only" if under 7/10.
- **Test-First:** no (device experiment; the results table is the evidence)
- **Verify:** `test -s spikes/ggwave/index.html && grep -qi "protocol" docs/spikes/ggwave.md`
- **Next step:** load ggwave's WASM build in `index.html` and wire send/receive buttons.

## HACK-005 · Spike Web NFC: read and write NDEF on the tag we have

- **Type:** spike
- **Priority:** P0
- **Estimate:** 30 min
- **Rubric / Spec:** C1 · IDEA §5.4, §5.10
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-018
- **Paths:** spikes/webnfc/, docs/spikes/webnfc.md
- **Freeze-Allowed:** no
- **Acceptance:**
  - `spikes/webnfc/index.html`: write a ~200-byte NDEF record, read it back, show `serialNumber`; clear message when `NDEFReader` is missing.
  - `docs/spikes/webnfc.md`: results by Fer (lead) with Yojan on Android Chrome over HTTPS (tag type, write ok, read ok, ms). Ends with "band = NFC" or "band = printed QR".
- **Test-First:** no (device experiment)
- **Verify:** `test -s spikes/webnfc/index.html && grep -qi "band =" docs/spikes/webnfc.md`
- **Next step:** `NDEFReader` write + scan behind two buttons.

## HACK-006 · Spike crypto: WebCrypto P-256 signature verified in Python, envelope round trip

- **Type:** spike
- **Priority:** P0
- **Estimate:** 30 min
- **Rubric / Spec:** C4 · IDEA §5.2, §5.6
- **Depends on:** None
- **Uses contract:** HACK-003
- **Related:** HACK-011, HACK-013
- **Paths:** spikes/crypto/, docs/spikes/crypto.md
- **Freeze-Allowed:** no
- **Acceptance:**
  - `spikes/crypto/sign.mjs` (Node's WebCrypto, the same API as browsers): non-extractable ECDSA P-256 key, signs 61 bytes → raw 64-byte r||s; ECDH P-256 + HKDF + AES-GCM envelope to a server public key; writes JSON.
  - `spikes/crypto/verify.py` verifies the signature (r||s → DER) and decrypts the envelope.
  - `spikes/crypto/index.html` does the same in a phone browser; `docs/spikes/crypto.md` records Android Chrome and iPhone Safari results (Fer (lead) with Yojan).
- **Test-First:** no (spike; the Verify is the experiment)
- **Verify:** `node spikes/crypto/sign.mjs spikes/crypto/out.json && uv run --no-project --with cryptography python spikes/crypto/verify.py spikes/crypto/out.json`
- **Next step:** `sign.mjs` with `crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"}, false, ["sign","verify"])`.

## HACK-007 · Spike GPS without data indoors

- **Type:** spike
- **Priority:** P0
- **Estimate:** 20 min
- **Rubric / Spec:** C3 · IDEA §5.3, §5.10
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-013
- **Paths:** spikes/geo/, docs/spikes/geo.md
- **Freeze-Allowed:** no
- **Acceptance:**
  - `spikes/geo/index.html`: `getCurrentPosition` with high accuracy in airplane mode; shows lat/lon, accuracy, seconds to fix, and the distance to a fixed point.
  - `docs/spikes/geo.md`: results by Fer (lead) with Yojan inside the venue. Ends with "fix ok" or "use last known position with visible age".
- **Test-First:** no (device experiment)
- **Verify:** `test -s spikes/geo/index.html && grep -qiE "fix ok|last known" docs/spikes/geo.md`
- **Next step:** a page with one button and the readings.

## HACK-008 · Design lock: one direction, shell, UI kit, three locked screens

- **Type:** feature
- **Priority:** P0
- **Estimate:** 40 min
- **Rubric / Spec:** C1, C2 · IDEA §10 (big type, high contrast, MXN with two decimals)
- **Depends on:** HACK-001
- **Uses contract:** HACK-003
- **Related:** HACK-014, HACK-015, HACK-021, HACK-026
- **Paths:** web/DESIGN.md, web/src/index.css, web/src/lib/ui/, web/src/App.tsx, web/public/design-lock/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Run `/uak-design-lock` with a single direction (time). The human (Victor) picks from screenshots.
  - Locked screens: store "Cobrar sin red" (big amount keypad), the verify result (green valid IOU / red reason), the dashboard list of debts.
  - `web/DESIGN.md` has the recipe table every UI task cites; keeps HACK-001's route auto-discovery in `App.tsx`.
- **Test-First:** no (design lock)
- **Verify:** `test -s web/DESIGN.md && ls web/public/design-lock/screens/*-1280.png && bash .uak/bin/uak lint`
- **Next step:** `/uak-design-lock`.

## HACK-009 · HTTPS deploy of the skeleton (Victor publishes)

- **Type:** setup
- **Priority:** P0
- **Estimate:** 30 min
- **Rubric / Spec:** C1 · IDEA §9 (phones need HTTPS for WebCrypto, mic, NFC and to cache the PWA before airplane mode)
- **Depends on:** HACK-001
- **Uses contract:** None
- **Related:** HACK-024
- **Paths:** docs/deploy.md
- **Freeze-Allowed:** yes
- **Acceptance:**
  - `docs/deploy.md`: the exact steps for Victor (Render Blueprint from `render.yaml`, env var names to set in the dashboard, not values), the public URL, and how to redeploy on each merge.
  - The agent never publishes: `uak msg human "HACK-009: Victor deploys with docs/deploy.md"`; after Victor answers, the agent checks `curl -fsS https://<url>/api/health`.
  - A phone opens the URL, installs the PWA, goes to airplane mode and still opens it (Fer confirms).
- **Test-First:** no (deploy)
- **Verify:** `test -s docs/deploy.md && grep -q "https://" docs/deploy.md`
- **Next step:** `bash .uak/bin/uak deploy` and write its output as steps.

## HACK-010 · pey backend: CoDi push client, signed webhook, polling fallback, demo mode

- **Type:** feature
- **Priority:** P0
- **Estimate:** 60 min
- **Rubric / Spec:** C6, C4 · IDEA §5.7, §7.1
- **Depends on:** HACK-001
- **Uses contract:** HACK-003
- **Related:** HACK-002, HACK-012, HACK-024
- **Paths:** app/services/pey.py, app/routers/webhooks.py, app/tests/test_pey.py, app/tests/test_webhooks.py
- **Freeze-Allowed:** no
- **Acceptance:**
  - `PeyClient` interface + real client (`/codi/pn`, `/codi/qr`, `/transaction/{id}`) + `FakePey` for other tasks' tests. Amount is `DEMO_REAL_AMOUNT` when set (0.01).
  - `POST /webhooks/pey` verifies Standard Webhooks over the raw body (`standardwebhooks`), stores `WebhookEvent` by `webhook-id` (idempotent), hands `transactionId` + `metadata.trackingKey` to a callback HACK-012 registers.
  - With `DEMO_MODE=1`, `POST /demo/simular-pago/{transaction_id}` signs a webhook with the local secret and sends it through the same verifier.
- **Tests:** sends_codi_push_with_demo_amount_phone_and_metadata, rejects_webhook_with_bad_signature, verifies_signature_over_raw_body_not_parsed_json, ignores_repeated_webhook_id, polls_transaction_until_paid, demo_webhook_goes_through_the_same_verifier
- **Verify:** `uv run pytest -q app/tests/test_pey.py app/tests/test_webhooks.py`
- **Next step:** `app/tests/test_webhooks.py` with a webhook signed by `standardwebhooks.Webhook(secret).sign`.

## HACK-011 · Registry and credentials: server key, payer/merchant enrollment, server-side crypto

- **Type:** feature
- **Priority:** P0
- **Estimate:** 50 min
- **Rubric / Spec:** C4 · IDEA §5.2, §6
- **Depends on:** HACK-001
- **Uses contract:** HACK-003
- **Related:** HACK-006, HACK-012, HACK-014, HACK-029
- **Paths:** app/routers/registry.py, app/services/credentials.py, app/services/crypto.py, app/services/db.py, app/tests/test_registry.py, app/tests/test_crypto.py
- **Freeze-Allowed:** no
- **Acceptance:**
  - `db.py`: SQLite at `DATABASE_PATH` (payers, merchants, debts, attempts, webhook events) shared by later backend tasks.
  - `crypto.py`: verify IOU (raw r||s → DER), sign/verify credentials with `SERVER_SIGNING_KEY`, decrypt envelopes; passes every vector in `app/fixtures/sinsenal/vectors.json`.
  - `POST /api/payers` (returns a signed credential), `POST /api/merchants`, `GET /api/server-key`.
- **Tests:** issues_credential_verifiable_with_server_key, verifies_iou_vector_after_rs_to_der, rejects_tampered_iou, rejects_tampered_credential, decrypts_envelope_vector
- **Verify:** `uv run pytest -q app/tests/test_registry.py app/tests/test_crypto.py`
- **Next step:** `app/tests/test_crypto.py` against `vectors.json`.

## HACK-012 · Sync and debts: dedupe, double-spend detection, one live charge per debt

- **Type:** feature
- **Priority:** P0
- **Estimate:** 60 min
- **Rubric / Spec:** C1, C4 · IDEA §5.6–5.8
- **Depends on:** HACK-010, HACK-011
- **Uses contract:** HACK-003
- **Related:** HACK-019, HACK-020, HACK-021, HACK-024
- **Paths:** app/routers/sync.py, app/routers/debts.py, app/services/debts.py, app/tests/test_sync.py, app/tests/test_debts.py
- **Freeze-Allowed:** no
- **Acceptance:**
  - `POST /api/sync`: decrypt → verify IOU and credential → dedupe by `(payer_id, counter)` and `envelope_id` → `Debt` REGISTRADA → push through `PeyClient` → COBRO_ENVIADO; response per contract.
  - Same counter at two merchants = double spend: `RECHAZADA` + alert.
  - Never two live charges for one debt; on expiry, retry later or cascade to the backup payer; a second payment marks `DUPLICADA` with a manual-refund alert.
  - PAGADA only from a verified webhook or a `PAID` poll, with `tracking_key`.
  - `GET /api/deudas?merchant_id=`, `GET /api/deudas/{id}`, `GET /api/deudas/{id}/eventos` (SSE).
- **Tests:** deduplicates_50_copies_into_one_debt, flags_same_counter_at_two_merchants_as_double_spend, keeps_one_live_charge_per_debt, cascades_to_backup_after_expiry, marks_paid_only_on_verified_webhook_or_paid_poll, marks_second_payment_duplicated
- **Verify:** `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
- **Next step:** `app/tests/test_debts.py` with `FakePey` from HACK-010.

## HACK-013 · TS protocol library: IOU codec, sign/verify, offline checks

- **Type:** feature
- **Priority:** P0
- **Estimate:** 60 min
- **Rubric / Spec:** C4, C3 · IDEA §5.3, §5.5
- **Depends on:** HACK-001, HACK-003
- **Uses contract:** HACK-003
- **Related:** HACK-006, HACK-015, HACK-016, HACK-017, HACK-019
- **Paths:** web/src/lib/protocol/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Pure functions, no UI: `encodeIou`/`decodeIou` (61 bytes), `signIou` (WebCrypto, 125 bytes total), `verifyIou`, `makeChallenge`/`verifyChallenge`, `checkIou(iou, state)` returning `ok` or one reason: `reto_vencido`, `reto_usado`, `firma_invalida`, `fuera_de_50m`, `contador_repetido`, `tope_excedido`, `revocado`.
  - Verifies the Python vectors in `web/src/lib/contract/vectors.json` (cross-language proof).
- **Tests:** encodes_iou_to_61_bytes_and_signs_to_125, verifies_python_vector, rejects_reused_challenge_nonce, rejects_expired_challenge, rejects_counter_not_greater_than_last, rejects_iou_over_50m, rejects_amount_over_remaining_cap
- **Verify:** `npm --prefix web test -- src/lib/protocol`
- **Next step:** `web/src/lib/protocol/codec.test.ts` against the vector.

## HACK-014 · PWA core offline: keys, IndexedDB, enrollment, cached credentials

- **Type:** feature
- **Priority:** P0
- **Estimate:** 50 min
- **Rubric / Spec:** C1 · IDEA §5.2, §6 (routes `/pagar` enrollment, `/tienda` enrollment)
- **Depends on:** HACK-008
- **Uses contract:** HACK-003, HACK-011
- **Related:** HACK-015, HACK-019
- **Paths:** web/src/features/core/, web/src/lib/storage/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Non-extractable P-256 key in IndexedDB; monotonic counter persisted; payer and merchant enrollment against `/api/payers` and `/api/merchants` (mock until HACK-011 lands, labeled `demo_data`).
  - Caches the server public key, the merchant credentials (scanned from the counter QR) and the latest revocation list for offline use.
  - Recipe: flow · Hero: the enrollment confirmation
- **Tests:** generates_non_extractable_p256_key, persists_key_and_counter_across_reload, enrolls_payer_and_caches_credential, caches_server_key_and_merchant_credential_for_offline
- **Verify:** `npm --prefix web test -- src/features/core src/lib/storage && npm --prefix web run build`
- **Next step:** `web/src/lib/storage/db.ts` with `idb` and its test on `fake-indexeddb`.

## HACK-015 · Offline payment store ↔ payer over QR, vibration only after verification

- **Type:** feature
- **Priority:** P0
- **Estimate:** 60 min
- **Rubric / Spec:** C1, C3 · IDEA §4 step 1, §5.3
- **Depends on:** HACK-013, HACK-014
- **Uses contract:** HACK-003
- **Related:** HACK-016, HACK-017, HACK-018, HACK-019, HACK-026
- **Paths:** web/src/features/store/, web/src/features/pay/, web/src/lib/transport/qr/
- **Freeze-Allowed:** no
- **Acceptance:**
  - `/tienda`: amount keypad → "Cobrar sin red" → challenge as animated QR → scan the IOU → `checkIou` → green "Pagaré válido · $25.00 · Mario ···4321 · #17" and `navigator.vibrate` pattern; on any reason, red text with the reason and **no vibration**; every rejection saved as `AttackLog`.
  - `/pagar`: scan challenge → checks (credential, 30 s, ≤ 50 m, cap) → big-amount confirm → sign → IOU as QR; "Firmaste un pagaré por $25 a Tienda Lupita".
  - Works in airplane mode; uses the `Transport` interface so HACK-016 plugs in sound.
  - Recipe: flow · Hero: the amount.
- **Tests:** store_vibrates_only_after_valid_iou, store_shows_reason_and_does_not_vibrate_on_invalid_iou, payer_refuses_to_sign_over_remaining_cap, qr_transport_roundtrips_the_same_125_bytes
- **Verify:** `npm --prefix web test -- src/features/store src/features/pay src/lib/transport/qr && npm --prefix web run build`
- **Next step:** `web/src/features/store/verify.test.tsx` with a Fake vibrate.

## HACK-016 · Sound transport (ggwave) behind the Transport interface

- **Type:** feature
- **Priority:** P0
- **Estimate:** 45 min
- **Rubric / Spec:** C5, C3 · IDEA §4 step 1, §5.5
- **Depends on:** HACK-004, HACK-013
- **Uses contract:** HACK-003, HACK-015
- **Related:** HACK-015, HACK-017
- **Paths:** web/src/lib/transport/sound/
- **Freeze-Allowed:** no
- **Acceptance:**
  - `SoundTransport` implements `Transport` with the protocol chosen in `docs/spikes/ggwave.md`; one 125-byte message per IOU; a decode error never yields an IOU (so a recording or AI voice is "audio sin firma válida").
  - If the spike said "QR only", the adapter still exists and the store hides the sound button.
- **Tests:** sends_iou_as_one_message_under_140_bytes, garbage_audio_never_yields_an_iou, receive_yields_exact_bytes_from_fake_decoder
- **Verify:** `npm --prefix web test -- src/lib/transport/sound`
- **Next step:** a Fake ggwave module for the tests.

## HACK-017 · Live attacks panel: replay, unsigned audio, 2 km, repeated counter

- **Type:** feature
- **Priority:** P0
- **Estimate:** 45 min
- **Rubric / Spec:** C3, C5 · IDEA §4 step 3 (the wow), §5.5
- **Depends on:** HACK-015
- **Uses contract:** HACK-003
- **Related:** HACK-016, HACK-021, HACK-022
- **Paths:** web/src/features/attacks/
- **Freeze-Allowed:** no
- **Acceptance:**
  - `/ataques`: the four attacks of step 3 run against the real store verifier (replayed recording of #17, AI-voice audio, IOU signed 2 km away, same #17 again); each shows its readable reason and the store does not vibrate.
  - The `AttackLog` list with time and reason; counter of rejected vs accepted for the pitch.
  - Recipe: list · Hero: the four red rejections.
- **Tests:** replayed_recording_is_rejected_as_used_challenge, ai_voice_audio_is_rejected_without_signature, iou_2km_away_is_rejected, repeated_counter_is_rejected, each_rejection_is_logged_with_reason_and_no_vibration
- **Verify:** `npm --prefix web test -- src/features/attacks && npm --prefix web run build`
- **Next step:** reuse `checkIou` from `web/src/lib/protocol/` in `attacks.test.tsx`.

## HACK-018 · NFC band for Doña Carmen

- **Type:** feature
- **Priority:** P1
- **Estimate:** 45 min
- **Rubric / Spec:** C3 · IDEA §4 step 2, §5.4
- **Depends on:** HACK-005, HACK-015
- **Uses contract:** HACK-003
- **Related:** HACK-029
- **Paths:** web/src/features/band/, web/src/lib/transport/nfc/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Reads the server-signed band credential (Web NFC, or the printed QR if the spike said so); big amount, local speech of the amount generated after verification, vibration, "tope restante $82"; band cap $100/day.
  - Recipe: flow · Hero: the amount.
- **Tests:** accepts_band_credential_signed_by_server, rejects_band_over_daily_cap, speaks_amount_only_after_verification
- **Verify:** `npm --prefix web test -- src/features/band src/lib/transport/nfc && npm --prefix web run build`
- **Next step:** Fake `NDEFReader` for the tests.

## HACK-019 · Encrypted envelopes and phone-to-phone relay

- **Type:** feature
- **Priority:** P1
- **Estimate:** 60 min
- **Rubric / Spec:** C5, C1 · IDEA §4 step 4, §5.6
- **Depends on:** HACK-013, HACK-014
- **Uses contract:** HACK-003, HACK-012
- **Related:** HACK-020
- **Paths:** web/src/features/relay/, web/src/lib/envelope/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Envelopes per `docs/protocolo.md` (matches the Python envelope vector); FIFO of at most N, TTL 7 days, max hops; hand-off by animated QR; "Llevas 2 pagarés cifrados para entregar" and hop count; on network, `POST /api/sync` and shows accepted/duplicates.
  - Receives and stores the server-signed revocation list returned by sync and passes it on.
  - Recipe: flow.
- **Tests:** envelope_matches_python_vector, relay_cannot_read_or_alter_envelope, drops_envelopes_past_ttl_or_max_hops, uploads_once_and_reports_duplicates
- **Verify:** `npm --prefix web test -- src/features/relay src/lib/envelope && npm --prefix web run build`
- **Next step:** `web/src/lib/envelope/seal.test.ts` against the vector.

## HACK-020 · Reputation, caps and the signed revocation list

- **Type:** feature
- **Priority:** P1
- **Estimate:** 45 min
- **Rubric / Spec:** C3 · IDEA §5.8, §5.9
- **Depends on:** HACK-012
- **Uses contract:** HACK-003
- **Related:** HACK-019, HACK-021
- **Paths:** app/services/reputation.py, app/routers/reputation.py, app/tests/test_reputation.py
- **Freeze-Allowed:** no
- **Acceptance:**
  - `daily_cap = base × factor` per §5.9 (deterministic); `GET /api/reputacion/{payer_id}`; a server-signed `RevocationList` included in every sync response.
- **Tests:** factor_rises_point_one_per_debt_paid_within_48h, factor_is_zero_after_debt_overdue_7_days, double_spend_revokes_payer, revocation_list_is_signed_by_server
- **Verify:** `uv run pytest -q app/tests/test_reputation.py`
- **Next step:** `app/tests/test_reputation.py`.

## HACK-021 · Live dashboard: debts, CoDi tracking key, OpenAI explanation

- **Type:** feature
- **Priority:** P0
- **Estimate:** 50 min
- **Rubric / Spec:** C1, C6 · IDEA §3 "final bueno", §4 steps 5–6
- **Depends on:** HACK-008
- **Uses contract:** HACK-003, HACK-012, HACK-020, HACK-022
- **Related:** HACK-017, HACK-026
- **Paths:** web/src/features/dashboard/
- **Freeze-Allowed:** no
- **Acceptance:**
  - `/tablero`: "3 pagarés pendientes" → "3 cobrados por CoDi" live over SSE, each with its tracking key; "monto de prueba $0.01" label when the real amount differs; reputation per payer (P1 part); "Desastre declarado: fondo de garantía" button labeled `demo_data`.
  - Shows the HACK-022 explanation with its source ("OpenAI" or "plantilla").
  - Mock data labeled `demo_data` until HACK-012 lands. Recipe: dashboard · Hero: pending → paid count.
- **Tests:** turns_debt_green_on_paid_event_with_tracking_key, shows_test_amount_label_when_demo_amount_differs, shows_explanation_source
- **Verify:** `npm --prefix web test -- src/features/dashboard && npm --prefix web run build`
- **Next step:** `dashboard.test.tsx` with a Fake EventSource.

## HACK-022 · OpenAI: plain-Spanish explanation of a sync and its attacks (numbers only from records)

- **Type:** feature
- **Priority:** P0
- **Estimate:** 45 min
- **Rubric / Spec:** C6 · IDEA §7 (Responses API with structured output), §7 anti-hallucination rule
- **Depends on:** HACK-001
- **Uses contract:** HACK-003, HACK-012
- **Related:** HACK-021, HACK-023
- **Paths:** app/services/explain.py, app/routers/explain.py, app/tests/test_explain.py
- **Freeze-Allowed:** no
- **Acceptance:**
  - `GET /api/resumen?merchant_id=` → `ExplainResponse`: the Responses API with structured output, model from `OPENAI_MODEL_TEXTO`, explains what happened (debts registered/paid/duplicated, attacks rejected and why) for Lupita.
  - Every number in the text is inserted by template from the records; text from the model containing any other digit is discarded and the template answer is returned (`fuente: "plantilla"`). Same fallback on timeout or error.
  - `OpenAIClient` interface + Fake; tests never call the network.
- **Tests:** explains_sync_result_in_spanish_from_records, falls_back_to_template_when_openai_fails, discards_model_text_with_numbers_not_in_records, reads_model_from_env
- **Verify:** `uv run pytest -q app/tests/test_explain.py`
- **Next step:** `app/tests/test_explain.py` with a Fake client.

## HACK-023 · OpenAI voice for the merchant (with network): propose amount and payer, human confirms

- **Type:** feature
- **Priority:** P1
- **Estimate:** 60 min
- **Rubric / Spec:** C6 · IDEA §7 (Realtime `OPENAI_MODEL_VOZ`), §7 anti-hallucination rule
- **Depends on:** HACK-015
- **Uses contract:** HACK-003
- **Related:** HACK-022
- **Paths:** app/routers/voice.py, app/tests/test_voice.py, web/src/features/voice/
- **Freeze-Allowed:** no
- **Acceptance:**
  - Backend mints a short-lived Realtime session (key never reaches the browser); tools only `proponer_monto(centavos)` and `proponer_pagador(etiqueta)`; the merchant confirms with one tap. No tool signs, charges or marks a payment.
  - Only offered when online; offline the keypad stays (the store in the demo is in airplane mode).
  - Recipe: flow.
- **Tests:** session_endpoint_never_returns_the_api_key, only_proposal_tools_are_registered, proposed_amount_needs_a_tap_to_apply
- **Verify:** `uv run pytest -q app/tests/test_voice.py && npm --prefix web test -- src/features/voice && npm --prefix web run build`
- **Next step:** `app/tests/test_voice.py`.

## HACK-024 · End to end with real pey: webhook registered, $0.01 push from a real sync

- **Type:** integration
- **Priority:** P0
- **Estimate:** 30 min
- **Rubric / Spec:** C6, C1 · IDEA §4 step 5
- **Depends on:** HACK-009, HACK-012
- **Uses contract:** None
- **Related:** HACK-002, HACK-028
- **Paths:** docs/e2e-pey.md
- **Freeze-Allowed:** yes
- **Acceptance:**
  - Fer registers `https://<url>/webhooks/pey` in the pey portal and sets the secret in Render (Victor); the agent writes the steps and never touches the portal.
  - One sync from a phone produces a real $0.01 push; Fer approves it; the dashboard shows PAGADA with the tracking key. Seconds measured, recorded in `docs/e2e-pey.md` with no personal data.
- **Test-First:** no (integration with the real service, done by humans)
- **Verify:** `test -s docs/e2e-pey.md && grep -qi "tracking" docs/e2e-pey.md`
- **Next step:** write the portal steps and `uak msg human`.

## HACK-025 · Security pass: /uak-secure, secrets, public repo check

- **Type:** docs
- **Priority:** P0
- **Estimate:** 30 min
- **Rubric / Spec:** C4 · IDEA §10 ethics and data
- **Depends on:** HACK-012, HACK-015
- **Uses contract:** None
- **Related:** HACK-028
- **Paths:** docs/security.md
- **Freeze-Allowed:** yes
- **Acceptance:**
  - `/uak-secure` against the launch checklist; no phone, CLABE, name or key in the history; `DEMO_MODE` endpoints refuse without the flag; findings fixed by followups of their tasks.
- **Test-First:** no (audit)
- **Verify:** `test -s docs/security.md && bash .uak/bin/smoke`
- **Next step:** `/uak-secure`.

## HACK-026 · Landing: the two failures, the wow, three steps

- **Type:** feature
- **Priority:** P0
- **Estimate:** 45 min
- **Rubric / Spec:** C2 · IDEA §0, §1, §11 (sourced numbers only)
- **Depends on:** HACK-008, HACK-015
- **Uses contract:** None
- **Related:** HACK-028
- **Paths:** web/src/features/landing/
- **Freeze-Allowed:** yes
- **Acceptance:**
  - Skill `landing-story`: the one line, 85% cash under $500 and 2.47 M of 21.79 M CoDi accounts with their sources, the wow as a real screenshot, three steps, links to `/tienda`, `/pagar`, `/tablero`.
  - Recipe: landing · screenshots at 1280×720 and 390×844.
- **Tests:** shows_each_number_with_its_source_link
- **Verify:** `npm --prefix web test -- src/features/landing && npm --prefix web run build && bash .uak/bin/design-lint`
- **Next step:** load skill `landing-story`.

## HACK-027 · Pitch script and deck draft (from IDEA Appendix A)

- **Type:** docs
- **Priority:** P0
- **Estimate:** 40 min
- **Rubric / Spec:** C2, C5 · IDEA Appendix A, §8, §11
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-028
- **Paths:** docs/demo/guion.md, docs/deck/
- **Freeze-Allowed:** yes
- **Acceptance:**
  - 3-minute script mapped to IDEA §4 steps, with the plan B per step; a 6-slide deck draft; every number cites §11; nothing from the "do not cite" list.
- **Test-First:** no (docs)
- **Verify:** `test -s docs/demo/guion.md && ls docs/deck/`
- **Next step:** copy Appendix A into `docs/demo/guion.md` and add timings.

## HACK-028 · Demo and submission: plan-B video, README, 30-s video, email (Victor)

- **Type:** demo
- **Priority:** P0
- **Estimate:** 60 min
- **Rubric / Spec:** C1, C2, C6 · `/uak-demo`, IDEA §8 deliverables
- **Depends on:** HACK-015, HACK-017, HACK-024
- **Uses contract:** None
- **Related:** HACK-025, HACK-026, HACK-027
- **Paths:** README.md, docs/demo/checklist.md
- **Freeze-Allowed:** yes
- **Acceptance:**
  - `/uak-demo`: plan-B video of the full flow before the freeze (11:12), clean rehearsal 12:02, internal submission 12:31.
  - README: problem, how to run with `DEMO_MODE=1` in 2 commands, how it was built with agents in parallel (Codex, Claude Code, Cursor, worktrees, reviews).
  - Victor sends the portal submission and the email to hola@aibuilders.lat (the agent prepares the text, never sends).
- **Test-First:** no (demo)
- **Verify:** `test -s README.md && test -s docs/demo/checklist.md`
- **Next step:** `/uak-demo`.

## HACK-029 · Demo seed and printables: reset endpoint, counter QR, band QR, "Si tu celular no vibró"

- **Type:** feature
- **Priority:** P0
- **Estimate:** 40 min
- **Rubric / Spec:** C1 · IDEA §3, §5.4, §5.5
- **Depends on:** HACK-011
- **Uses contract:** HACK-003
- **Related:** HACK-018, HACK-024
- **Paths:** app/routers/demo.py, app/services/demo.py, app/tests/test_demo.py, docs/print/
- **Freeze-Allowed:** no
- **Acceptance:**
  - `POST /demo/reset` (only with `DEMO_MODE=1`): seeds Lupita's store, Mario, Doña Carmen (band) and Luis with synthetic data and fresh credentials.
  - `docs/print/`: printable PDF/PNG of the merchant-credential QR for the counter, the band QR fallback and the sign "Si tu celular no vibró, no te pagaron".
- **Tests:** reset_refuses_without_demo_mode, reset_seeds_the_four_personas_with_valid_credentials
- **Verify:** `uv run pytest -q app/tests/test_demo.py && ls docs/print/`
- **Next step:** `app/tests/test_demo.py`.

## HACK-030 · Field interviews 08:00–10:00 (Fer lead, Yojan)

- **Type:** docs
- **Priority:** P1
- **Estimate:** 2 h (humans)
- **Rubric / Spec:** C2 · IDEA §13 questions
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-027
- **Paths:** docs/campo.md
- **Freeze-Allowed:** yes
- **Acceptance:**
  - 5–10 merchants near the venue, the 5 questions of §13, answers anonymized; one slide line with real results. An agent only formats what the humans bring.
- **Test-First:** no (field research)
- **Verify:** `test -s docs/campo.md`
- **Next step:** print the 5 questions.

## HACK-031 · Differential scan: public repos with pey, CoDi, offline, ggwave

- **Type:** docs
- **Priority:** P2
- **Estimate:** 30 min
- **Rubric / Spec:** C5 · IDEA §1 [Por validar]
- **Depends on:** None
- **Uses contract:** None
- **Related:** HACK-027
- **Paths:** docs/diferencial.md
- **Freeze-Allowed:** no
- **Acceptance:**
  - Public GitHub search for "pey", "codi", "offline", "ggwave"; each finding with URL and what it does; the §1 paragraph updated only from what was found (no invented competitors).
- **Test-First:** no (research)
- **Verify:** `test -s docs/diferencial.md`
- **Next step:** `gh search repos pey codi`.
