# HACK-015
ID: HACK-015
State: REVIEW
Owner: victor-1
Branch: feat/hack-015
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-015
Worklog: worklog/WL-1794126147-victor-1-HACK-015-hack.ZKhG7k.md
Priority: P0
Paths: web/src/features/store/, web/src/features/pay/, web/src/lib/transport/qr/
Depends: HACK-013, HACK-014
Verify: `npm --prefix web test -- src/features/store src/features/pay src/lib/transport/qr && npm --prefix web run build`
Lease-Until: 1794141355
Updated: 1794126955
Task-Base: 50f9136f4a2c59d9c8e79fe5342ddfd99249e78c
Next: Humano: FREEZE: HACK-015 is not allowed after the freeze (human: uak allow HACK-015 --reason TEXT)
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/17
Evidence: Verify at 94b33f1: 7 tests passed + build ok; critic SHIP 94b33f1 · red at 50f9136: AssertionError: expected 0 to be greater than 1
Events: 10
Checkpoints: 2
Sessions: 4
Last-Checkpoint: 1794126946
Progress: 1 commit(s) since the claim · last: b9b8a62 HACK-015: offline store↔payer over animated QR, vibrate only after checkIou (68 seconds ago) · 0 uncommitted tracked file(s) · at 1794126435
Progress-Head: b9b8a62/4294967295
Progress-Changed: 1794126435
Away: 1794126435
Task-Tip: 94b33f18112e9efd22623fc81a5e4924c5979aae
