# STATE

Phase: execution
Updated: 1794124739
AVAILABLE: (23; last 12) ... HACK-023 HACK-024 HACK-025 HACK-026 HACK-027 HACK-028 HACK-029 HACK-030 HACK-031 HACK-032 HACK-033 HACK-034 
CLAIMED: HACK-007 HACK-008 HACK-010 
BLOCKED: -
REVIEW: HACK-004 HACK-011 
INTEGRATED: HACK-001 HACK-002 HACK-003 HACK-005 HACK-006 HACK-013 
CANCELLED: -

Claims (first 24; status --task ID shows detail):
HACK-004 | REVIEW | victor-1 | until 1794139137
HACK-007 | CLAIMED | joahanmorales-1 | until 1794127389
HACK-008 | CLAIMED | victor-2 | until 1794127403
HACK-010 | CLAIMED | victor-1 | until 1794127433
HACK-011 | REVIEW | victor-1 | until 1794139139

Blockers: BLOCKED tasks; use status --task ID --summary.
Current decisions (last 5):
- 1794123622 | HACK-005 | doc band = PENDIENTE, no invented results | Why: device results are Fer's
- 1794123886 | HACK-004 | seeded payload per trial 1-10 so receiver matches without copying; ASCII payload | Why: embind std::string; two phones can't share clipboard
- 1794124111 | HACK-034 | follow-up of HACK-001 by victor-1: CI: install web deps (npm --prefix web ci) before Product smoke in .github/workflows/uak.yml; main CI fails with tsc: n
- 1794124362 | HACK-011 | SERVER_SIGNING_KEY is a private JWK JSON; no ephemeral fallback | Why: credentials must verify across restarts
- 1794124409 | HACK-008 | One direction; fixture in lib/ui/locked; locked routes /design-lock/:screen | Why: Short event; public/ JSON cannot be imported by Vite

Global next step: available P0; else review PRs, tests, demo, rehearsal.
Why: bounded snapshot to resume without rereading history.
