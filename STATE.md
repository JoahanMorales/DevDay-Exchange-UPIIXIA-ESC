# STATE

Phase: execution
Updated: 1794125790
AVAILABLE: (19; last 12) ... HACK-023 HACK-024 HACK-025 HACK-026 HACK-027 HACK-028 HACK-029 HACK-030 HACK-031 HACK-032 HACK-033 HACK-034 
CLAIMED: -
BLOCKED: -
REVIEW: HACK-009 HACK-012 HACK-014 HACK-022 
INTEGRATED: HACK-001 HACK-002 HACK-003 HACK-004 HACK-005 HACK-006 HACK-007 HACK-008 HACK-010 HACK-011 HACK-013 
CANCELLED: -

Claims (first 24; status --task ID shows detail):
HACK-009 | REVIEW | joahanmorales-1 | until 1794139943
HACK-012 | REVIEW | victor-1 | until 1794140124
HACK-014 | REVIEW | victor-2 | until 1794140067
HACK-022 | REVIEW | victor-1 | until 1794139901

Blockers: BLOCKED tasks; use status --task ID --summary.
Current decisions (last 5):
- 1794124982 | HACK-008 | Direction Cempasúchil (Victor) | Why: Human pick by looking
- 1794125150 | HACK-022 | model writes placeholders, digits rejected, template fills numbers | Why: IDEA §7 anti-hallucination
- 1794125470 | deadline decision/HACK-008-1794124432/1794125332 | BLOCKED_OTHER_TASK | Option: Direction 1 Cempasúchil; Why: Victor picked it by looking at the gallery (AskUserQue
- 1794125667 | HACK-014 | no UI in this task; demo_data fallback when backend down | Why: routes /pagar,/tienda own the screens
- 1794125714 | HACK-012 | debts service owns state machine; webhook handler via debts.install() | Why: webhooks.reset clears handlers

Global next step: available P0; else review PRs, tests, demo, rehearsal.
Why: bounded snapshot to resume without rereading history.
