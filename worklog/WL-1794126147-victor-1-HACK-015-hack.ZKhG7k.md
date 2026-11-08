# worklog/WL-1794126147-victor-1-HACK-015-hack.ZKhG7k.md · HACK-015

## Live summary
- Done: 4 tests green, build ok, /tienda + /pagar pushed b9b8a62, shots taken
- Decision: payer sends 125-byte IOU + credential JSON in one QR payload (packPayment)
- Why: store needs payer pubkey/cap offline
- Failing: none
- Commands: npm --prefix web test -- src/features/store src/features/pay src/lib/transport/qr && npm --prefix web run build
- Next: design-critic verdict then gh pr + uak done

## History
- 1794126147 | CLAIMED | victor-1 | claim; next: `web/src/features/store/verify.test.tsx` with a Fake vibrate.
- 1794126163 | CLAIMED | victor-1 | heartbeat; lease until 1794128863
- 1794126412 | CLAIMED | victor-1 | checkpoint; next: design-critic verdict then gh pr + uak done
