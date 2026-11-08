# worklog/WL-1794159939-victor-1-HACK-017-hack.G0elfk.md · HACK-017

## Live summary
- Done: Claim created; implementation pending
- Decision: Own branch and worktree
- Why: Parallel work without touching the main checkout
- Failing: No validation run yet
- Commands: `npm --prefix web test -- src/features/attacks && npm --prefix web run build`
- Next: reuse `checkIou` from `web/src/lib/protocol/` in `attacks.test.tsx`.

## History
- 1794159939 | CLAIMED | victor-1 | claim; next: reuse `checkIou` from `web/src/lib/protocol/` in `attacks.test.tsx`.
