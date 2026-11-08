# HACK-012
ID: HACK-012
State: CLAIMED
Owner: victor-1
Branch: feat/hack-012
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-012
Worklog: worklog/WL-1794125470-victor-1-HACK-012-hack.EGORdm.md
Priority: P0
Paths: app/routers/sync.py, app/routers/debts.py, app/services/debts.py, app/tests/test_sync.py, app/tests/test_debts.py
Depends: HACK-010, HACK-011
Verify: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
Lease-Until: 1794128198
Updated: 1794125498
Task-Base: f9105fc493c91cdee519adc1fc369447585ec791
Next: `app/tests/test_debts.py` with `FakePey` from HACK-010.
PR: -
Evidence: -
Thread-Read: 0
