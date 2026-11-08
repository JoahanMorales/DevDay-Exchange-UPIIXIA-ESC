# HACK-020
ID: HACK-020
State: REVIEW
Owner: joahanmorales-1
Branch: feat/hack-020
Worktree: /home/joahan/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-020
Worklog: worklog/WL-1794128223-joahanmorales-1-HACK-020-hack.tNjI9X.md
Priority: P1
Paths: app/services/reputation.py, app/routers/reputation.py, app/tests/test_reputation.py
Depends: HACK-012
Verify: `uv run pytest -q app/tests/test_reputation.py`
Lease-Until: 1794142725
Updated: 1794128325
Task-Base: 04453b3727de3d20d0b7234d15d9cc40513e3ac8
Next: Wait for review PR #21; wiring of debts.py is a request to victor-1
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/21
Evidence: uv run pytest -q app/tests/test_reputation.py exit 0 (5 passed); full suite 35 passed; ruff clean · red at 04453b3: E   AssertionError: assert 0.0 == 1.3
Events: 3
Checkpoints: 1
Sessions: 1
Last-Checkpoint: 1794128325
Task-Tip: 1ad18cdfa105de2d7b03014b01a9e07ae842c759
