# HACK-036
ID: HACK-036
State: CLAIMED
Owner: victor-2
Branch: feat/hack-036
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-036
Worklog: worklog/WL-1794163353-victor-2-HACK-036-hack.9nQOLJ.md
Priority: P1
Paths: app/routers/sync.py, app/routers/debts.py, app/services/debts.py, app/tests/test_sync.py, app/tests/test_debts.py
Depends: HACK-012
Verify: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
Lease-Until: 1794166053
Updated: 1794163353
Task-Base: 1c74895da68a3dadf4696fdf750dd2badbee4bb7
Next: Write its tests, see them fail (uak red HACK-036), then implement until this passes: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
PR: -
Evidence: -
Events: 1
Checkpoints: 0
Sessions: 1
Last-Checkpoint: 0
