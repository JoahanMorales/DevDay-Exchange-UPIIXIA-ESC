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
Lease-Until: 1794140658
Updated: 1794126258
Task-Base: f9105fc493c91cdee519adc1fc369447585ec791
Next: Another agent reviews https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/15; run .uak/bin/smoke
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/15
Evidence: uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py exit 0 (9 passed); credential checks expired/bad_credential/cap_exceeded each tested · red at f9105fc: E   AssertionError: {"detail":"Not Found"}
Events: 7
Checkpoints: 1
Sessions: 3
Last-Checkpoint: 1794125714
Progress: 1 commit(s) since the claim · last: 9da068f HACK-012: sync dedupe, double-spend detection, one live charge, cascade, verified payment (8 minutes ago) · 0 uncommitted tracked file(s) · at 1794126167
Progress-Head: 9da068f/4294967295
Progress-Changed: 1794126167
Away: 1794125474
Task-Tip: d1c47147f037bc7084d224952a8b7df1eb27b444
