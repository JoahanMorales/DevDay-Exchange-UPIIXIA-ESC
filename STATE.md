# STATE

Phase: feature freeze; authorized fixes, rehearsal and submission only
Updated: 1794157988
AVAILABLE: HACK-017 HACK-018 HACK-023 HACK-025 HACK-026 HACK-028 
CLAIMED: HACK-024 HACK-029 
BLOCKED: -
REVIEW: HACK-015 HACK-019 HACK-020 HACK-027 HACK-030 HACK-031 HACK-032 HACK-033 HACK-034 
INTEGRATED: (17; last 12) ... HACK-006 HACK-007 HACK-008 HACK-009 HACK-010 HACK-011 HACK-012 HACK-013 HACK-014 HACK-016 HACK-021 HACK-022 
CANCELLED: -

Claims (first 24; status --task ID shows detail):
HACK-015 | REVIEW | victor-1 | until 1794141355
HACK-019 | REVIEW | joahanmorales-1 | until 1794142431
HACK-020 | REVIEW | joahanmorales-1 | until 1794142725
HACK-024 | CLAIMED | fer-1 | until 1794158968
HACK-027 | REVIEW | joahanmorales-1 | until 1794141365
HACK-029 | CLAIMED | fer-2 | until 1794159175
HACK-030 | REVIEW | joahanmorales-1 | until 1794142939
HACK-031 | REVIEW | joahanmorales-1 | until 1794144194
HACK-032 | REVIEW | joahanmorales-1 | until 1794143557
HACK-033 | REVIEW | joahanmorales-1 | until 1794144501
HACK-034 | REVIEW | joahanmorales-1 | until 1794143881

Blockers: BLOCKED tasks; use status --task ID --summary.
Current decisions (last 5):
- 1794128031 | HACK-019 | TTL inclusive; hops unsigned (server dedupes by id); queue cleared after one successful sync; headline uses display text-3xl (design-lint caps 6 sizes) | 
- 1794128325 | HACK-020 | daily_cap_cents stays base; effective = base×factor; list version = sum(rep_version) | Why: monotonic version for clients
- 1794128923 | HACK-032 | tools return marker names only; merchant forced from request; no tool call -> template | Why: anti-hallucination, no cross-shop leak
- 1794156268 | HACK-024 | agent writes steps only | Why: acceptance: humans run portal/Render
- 1794157988 | deadline freeze/event/1794157920 | FREEZE_DEMO_FIXES_ONLY | New claims only with Freeze-Allowed: yes; respect authorization.

Global next step: available P0; else review PRs, tests, demo, rehearsal.
Why: bounded snapshot to resume without rereading history.
