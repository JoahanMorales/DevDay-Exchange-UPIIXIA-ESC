# worklog/WL-1794126147-victor-1-HACK-015-hack.ZKhG7k.md · HACK-015

## Live summary
- Done: reject fixed at 94b33f1: verifyPayment checks payer credential server_sig (canonical JSON, cached server key) + valid_until + subject; 7 tests + build green; pushed
- Decision: forged/expired credential -> firma_invalida, AttackLog bad_sig, no vibration
- Why: reject #77 joahanmorales-1
- Failing: uak done refused: critic.txt stale (needs SHIP 94b33f1); CI smoke fails on main too (tsc not found)
- Commands: npm --prefix web test -- src/features/store src/features/pay src/lib/transport/qr && npm --prefix web run build
- Next: design-critic on 94b33f1 (shots retaken) -> uak done HACK-015 --pr https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/17 --note 'credential verified offline'

## History
- 1794126147 | CLAIMED | victor-1 | claim; next: `web/src/features/store/verify.test.tsx` with a Fake vibrate.
- 1794126163 | CLAIMED | victor-1 | heartbeat; lease until 1794128863
- 1794126412 | CLAIMED | victor-1 | checkpoint; next: design-critic verdict then gh pr + uak done
- 1794126509 | REVIEW | victor-1 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/17; evidence: Verify: 4 tests passed (store_vibrates_only_after_valid_iou, store_shows_reason_and_does_not_vibrate_on_invalid_iou, payer_refuses_to_sign_over_remaining_cap, qr_transport_roundtrips_the_same_125_bytes) + build ok at 8a8a07c; critic SHIP 8a8a07c · red at 50f9136: AssertionError: expected 0 to be greater than 1; reviewer: -
- 1794126713 | REVIEW | joahanmorales-1 | review; reject; SHA 8a8a07cd0106ae139e6dde78c6663aae05206119; reviewer joahanmorales-1
- 1794126946 | REVIEW | victor-1 | checkpoint; next: design-critic on 94b33f1 (shots retaken) -> uak done HACK-015 --pr https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/17 --note 'credential verified offline'
