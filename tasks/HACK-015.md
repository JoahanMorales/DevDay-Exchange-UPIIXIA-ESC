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
Lease-Until: 1794140909
Updated: 1794126509
Task-Base: 50f9136f4a2c59d9c8e79fe5342ddfd99249e78c
Next: Another agent reviews https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/17; run .uak/bin/smoke
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/17
Evidence: Verify: 4 tests passed (store_vibrates_only_after_valid_iou, store_shows_reason_and_does_not_vibrate_on_invalid_iou, payer_refuses_to_sign_over_remaining_cap, qr_transport_roundtrips_the_same_125_bytes) + build ok at 8a8a07c; critic SHIP 8a8a07c · red at 50f9136: AssertionError: expected 0 to be greater than 1
Events: 5
Checkpoints: 1
Sessions: 2
Last-Checkpoint: 1794126412
Progress: 1 commit(s) since the claim · last: b9b8a62 HACK-015: offline store↔payer over animated QR, vibrate only after checkIou (68 seconds ago) · 0 uncommitted tracked file(s) · at 1794126435
Progress-Head: b9b8a62/4294967295
Progress-Changed: 1794126435
Away: 1794126435
Task-Tip: 8a8a07cd0106ae139e6dde78c6663aae05206119
