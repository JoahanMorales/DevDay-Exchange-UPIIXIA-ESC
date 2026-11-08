# worklog/WL-1794159939-victor-1-HACK-017-hack.G0elfk.md · HACK-017

## Live summary
- Done: scenarios + /ataques page, Verify green
- Decision: attacks run via store verifyIncoming
- Why: real verifier, no reimplementation
- Failing: none
- Commands: npm --prefix web test -- src/features/attacks && npm --prefix web run build
- Next: design-critic SHIP then uak done

## History
- 1794159939 | CLAIMED | victor-1 | claim; next: reuse `checkIou` from `web/src/lib/protocol/` in `attacks.test.tsx`.
- 1794159951 | CLAIMED | victor-1 | heartbeat; lease until 1794162651
- 1794160109 | CLAIMED | victor-1 | checkpoint; next: design-critic SHIP then uak done
