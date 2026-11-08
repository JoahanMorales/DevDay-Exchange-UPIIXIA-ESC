# STATE

Phase: execution
Updated: 1794126437
AVAILABLE: (16; last 12) ... HACK-023 HACK-024 HACK-025 HACK-026 HACK-027 HACK-028 HACK-029 HACK-030 HACK-031 HACK-032 HACK-033 HACK-034 
CLAIMED: HACK-015 HACK-016 
BLOCKED: -
REVIEW: HACK-009 HACK-012 HACK-021 
INTEGRATED: HACK-001 HACK-002 HACK-003 HACK-004 HACK-005 HACK-006 HACK-007 HACK-008 HACK-010 HACK-011 HACK-013 HACK-014 HACK-022 
CANCELLED: -

Claims (first 24; status --task ID shows detail):
HACK-009 | REVIEW | joahanmorales-1 | until 1794140476
HACK-012 | REVIEW | victor-1 | until 1794140703
HACK-015 | CLAIMED | victor-1 | until 1794129112
HACK-016 | CLAIMED | victor-2 | until 1794129137
HACK-021 | REVIEW | victor-2 | until 1794140679

Blockers: BLOCKED tasks; use status --task ID --summary.
Current decisions (last 5):
- 1794125714 | HACK-012 | debts service owns state machine; webhook handler via debts.install() | Why: webhooks.reset clears handlers
- 1794126041 | HACK-021 | openEvents injected (Fake in tests, EventSource adapter in page); demo SSE when no merchant_id | Why: Testable without backend; HACK-012 contract wired vi
- 1794126234 | HACK-021 | 2-col stats at 390; full tracking key wraps | Why: critic P1s
- 1794126303 | HACK-012 | credential window from payer.created_at+CREDENTIAL_TTL_S; cap per UTC day of IOU ts | Why: credential not in envelope; server rebuilds it from the payer r
- 1794126412 | HACK-015 | payer sends 125-byte IOU + credential JSON in one QR payload (packPayment) | Why: store needs payer pubkey/cap offline

Global next step: available P0; else review PRs, tests, demo, rehearsal.
Why: bounded snapshot to resume without rereading history.
