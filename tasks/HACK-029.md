# HACK-029
ID: HACK-029
State: REVIEW
Owner: fer-2
Branch: feat/hack-029
Worktree: /Users/FerV/Documents/PeyHackathon/DevDay-Exchange-UPIIXIA-ESC-wt/hack-029
Worklog: worklog/WL-1794156475-fer-2-HACK-029-hack.cP1YOU.md
Priority: P0
Paths: app/routers/demo.py, app/services/demo.py, app/tests/test_demo.py, docs/print/
Depends: HACK-011
Verify: `uv run pytest -q app/tests/test_demo.py && ls docs/print/`
Lease-Until: 1794173942
Updated: 1794159542
Task-Base: 04453b3727de3d20d0b7234d15d9cc40513e3ac8
Next: Another agent reviews https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/27; run .uak/bin/smoke
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/27
Evidence: uv run pytest -q app/tests/test_demo.py exit 0 (2 passed); app/tests all green; make_print.py smoke vs local server produced both QRs · red at 04453b3: E   AssertionError: {"detail":"Not Found"}
Events: 2
Checkpoints: 0
Sessions: 1
Last-Checkpoint: 0
Task-Tip: f4ce5e00b3bd137ce257ea793a5a0d94f1dab8a4
