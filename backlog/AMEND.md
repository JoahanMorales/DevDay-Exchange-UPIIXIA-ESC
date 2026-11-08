# Amended tasks (uak plan --amend)

Append-only; the last section of an ID replaces its section in the backlog. Why: Paths can grow before review.

## HACK-028 · Demo and submission: plan-B video, README, 30-s video, email (Victor)

- **Type:** demo
- **Priority:** P0
- **Estimate:** 60 min
- **Rubric / Spec:** C1, C2, C6 · `/uak-demo`, IDEA §8 deliverables
- **Depends on:** HACK-015, HACK-017
- **Uses contract:** None
- **Related:** HACK-025, HACK-026, HACK-027
- **Paths:** README.md, docs/demo/checklist.md
- **Freeze-Allowed:** yes
- **Acceptance:** `/uak-demo`: plan-B video of the full flow before the freeze (11:12), clean rehearsal 12:02, internal submission 12:31., README: problem, how to run with `DEMO_MODE=1` in 2 commands, how it was built with agents in parallel (Codex, Claude Code, Cursor, worktrees, reviews)., Victor sends the portal submission and the email to hola@aibuilders.lat (the agent prepares the text, never sends).
- **Test-First:** no (demo)
- **Verify:** `test -s README.md && test -s docs/demo/checklist.md`
- **Next step:** `/uak-demo`.

## HACK-040 · UI wave 4: Cobrar and Pagar polish

- **Type:** feature
- **Priority:** P1
- **Estimate:** 30 min
- **Rubric / Spec:** C1 · skills `product-ui` §5 (3-second judge test)
- **Depends on:** HACK-037, HACK-038
- **Uses contract:** None
- **Related:** HACK-041
- **Paths:** web/src/features/store/, web/src/features/pay/
- **Freeze-Allowed:** yes
- **Acceptance:** `/tienda` and `/pagar` fill the viewport with intent (no dead space under the keypad), keep one primary action, and every state (loading, error, offline) reads in plain Spanish., Behavior and existing tests unchanged. (The landing moved to HACK-041.)
- **Test-First:** no (layout and copy over existing behavior; existing tests must keep passing)
- **Verify:** `npm --prefix web test -- src/features && npm --prefix web run build && bash .uak/bin/design-lint`
- **Next step:** dead space under the keypad on /tienda first.
