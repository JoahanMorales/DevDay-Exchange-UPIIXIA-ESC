# worklog/WL-1794125470-victor-1-HACK-012-hack.EGORdm.md · HACK-012

## Live summary
- Done: 6 tests green, PR #15
- Decision: debts service owns state machine; webhook handler via debts.install()
- Why: webhooks.reset clears handlers
- Failing: none
- Commands: uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py
- Next: await review

## History
- 1794125470 | CLAIMED | victor-1 | claim; next: `app/tests/test_debts.py` with `FakePey` from HACK-010.
- 1794125498 | CLAIMED | victor-1 | heartbeat; lease until 1794128198
- 1794125714 | CLAIMED | victor-1 | checkpoint; next: await review
