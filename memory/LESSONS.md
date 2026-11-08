# Lessons (uak learn)

Append-only. Format: - N | epoch | agent | task | paths | text. `uak recall` and `uak next` show the ones for your paths.

- 1 | 1794123620 | victor-2 | HACK-005 | spikes/webnfc/,docs/spikes/webnfc.md | smoke fails 'tsc: command not found' in a fresh worktree · web/ · run npm ci in web/ before smoke or merge
- 2 | 1794123926 | joahanmorales-1 | HACK-013 | web/src/lib/protocol/ | Node 20 + vitest jsdom env crashes the worker (undici 'bind' of undefined) · web/vite.config.ts · pure-logic tests: add '// @vitest-environment node' as first line
- 3 | 1794124360 | victor-1 | HACK-011 | app/routers/registry.py,app/services/credentials.py,app/services/crypto.py,app/services/db.py,app/tests/test_registry.py,app/tests/test_crypto.py | registry/crypto need SERVER_SIGNING_KEY=private P-256 JWK JSON and get_settings.cache_clear() in fixtures · app/services/crypto.py · copy the client fixture in app/tests/test_registry.py
- 4 | 1794169392 | joahanmorales-1 | - | * | vitest DOM tests (dashboard, landing, enroll) crash on Node 20 (undici needs Node 22) and the merge gate counts them as red · web/ · verify with: cd web && npx -y node@22 ./node_modules/vitest/vitest.mjs run <paths>; a human merges the PR on GitHub then uak integrate
