# STATE

Phase: execution
Updated: 1794128223
AVAILABLE: HACK-017 HACK-018 HACK-023 HACK-024 HACK-025 HACK-026 HACK-028 HACK-029 HACK-030 HACK-031 HACK-032 HACK-033 HACK-034 
CLAIMED: HACK-020 
BLOCKED: -
REVIEW: HACK-015 HACK-019 HACK-027 
INTEGRATED: (17; last 12) ... HACK-006 HACK-007 HACK-008 HACK-009 HACK-010 HACK-011 HACK-012 HACK-013 HACK-014 HACK-016 HACK-021 HACK-022 
CANCELLED: -

Claims (first 24; status --task ID shows detail):
HACK-015 | REVIEW | victor-1 | until 1794141355
HACK-019 | REVIEW | joahanmorales-1 | until 1794142431
HACK-020 | CLAIMED | joahanmorales-1 | until 1794130923
HACK-027 | REVIEW | joahanmorales-1 | until 1794141365

Blockers: BLOCKED tasks; use status --task ID --summary.
Current decisions (last 5):
- 1794126303 | HACK-012 | credential window from payer.created_at+CREDENTIAL_TTL_S; cap per UTC day of IOU ts | Why: credential not in envelope; server rebuilds it from the payer r
- 1794126412 | HACK-015 | payer sends 125-byte IOU + credential JSON in one QR payload (packPayment) | Why: store needs payer pubkey/cap offline
- 1794126586 | HACK-016 | Inject GgwaveCodec/SoundIo; default AUDIBLE_FAST until spike decides | Why: Fakes in tests; spike results pending
- 1794126946 | HACK-015 | forged/expired credential -> firma_invalida, AttackLog bad_sig, no vibration | Why: reject #77 joahanmorales-1
- 1794128031 | HACK-019 | TTL inclusive; hops unsigned (server dedupes by id); queue cleared after one successful sync; headline uses display text-3xl (design-lint caps 6 sizes) | 

Global next step: available P0; else review PRs, tests, demo, rehearsal.
Why: bounded snapshot to resume without rereading history.
