# HACK-012
ID: HACK-012
State: REVIEW
Owner: victor-1
Branch: feat/hack-012
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-012
Worklog: worklog/WL-1794125470-victor-1-HACK-012-hack.EGORdm.md
Priority: P0
Paths: app/routers/sync.py, app/routers/debts.py, app/services/debts.py, app/tests/test_sync.py, app/tests/test_debts.py
Depends: HACK-010, HACK-011
Verify: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
Lease-Until: 1794140703
Updated: 1794126303
Task-Base: f9105fc493c91cdee519adc1fc369447585ec791
Next: wait HACK-012 --for approve
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/15
Evidence: -
Thread-Read: 72
