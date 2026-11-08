# worklog/WL-1794163353-victor-2-HACK-036-hack.9nQOLJ.md · HACK-036

## Live summary
- Done: PR #33, REVIEW, Verify 13 passed
- Decision: poller thread per COBRO_ENVIADO debt started from debts.sync; PAID without trackingKey uses pey:txId
- Why: pey webhook never arrives
- Failing: none
- Commands: uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py
- Next: wait for review of PR #33

## History
- 1794163353 | CLAIMED | victor-2 | claim; next: Write its tests, see them fail (uak red HACK-036), then implement until this passes: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
- 1794163365 | CLAIMED | victor-2 | heartbeat; lease until 1794166065
- 1794163523 | REVIEW | victor-2 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/33; evidence: uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py exit 0 (13 passed); background poll 5s/6min after push; POST /api/deudas/{id}/verificar forces poll · red at 1c74895: E   assert 0 == 1; reviewer: -
- 1794163539 | REVIEW | victor-2 | checkpoint; next: wait for review of PR #33
- 1794163615 | REVIEW | victor-1 | review; approve; SHA ed7ab8f3b303b834b21682000e3b0c320c187776; reviewer victor-1
