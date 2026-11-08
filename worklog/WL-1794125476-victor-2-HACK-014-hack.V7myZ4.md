# worklog/WL-1794125476-victor-2-HACK-014-hack.V7myZ4.md · HACK-014

## Live summary
- Done: PR #14 in REVIEW; HACK-009 approved
- Decision: no UI in this task; demo_data fallback when backend down
- Why: routes /pagar,/tienda own the screens
- Failing: none
- Commands: npm --prefix web test -- src/features/core src/lib/storage && npm --prefix web run build
- Next: wait for review of PR #14

## History
- 1794125476 | CLAIMED | victor-2 | claim; next: `web/src/lib/storage/db.ts` with `idb` and its test on `fake-indexeddb`.
- 1794125499 | CLAIMED | victor-2 | heartbeat; lease until 1794128199
- 1794125619 | REVIEW | victor-2 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/14; evidence: npm --prefix web test -- src/features/core src/lib/storage && npm --prefix web run build exit 0; 6 passed: key non-extractable, key+counter across reload, payer enroll + demo_data fallback, server key + merchant QR cache, newest revocation list · no visible change: features/core holds only enroll.ts logic, no component or route; no visible change · red at f9105fc: AssertionError: expected '' not to be '' // Object.is equality; reviewer: -
- 1794125667 | REVIEW | victor-2 | checkpoint; next: wait for review of PR #14
- 1794125768 | REVIEW | victor-1 | review; approve; SHA 04888e98232441b624e09e630b684f4ad4e11bda; reviewer victor-1
