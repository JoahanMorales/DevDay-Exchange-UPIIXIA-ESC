# HACK-023
ID: HACK-023
State: CLAIMED
Owner: victor-2
Branch: feat/hack-023
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-023
Worklog: worklog/WL-1794162494-victor-2-HACK-023-hack.izKLaJ.md
Priority: P1
Paths: app/routers/voice.py, app/tests/test_voice.py, web/src/features/voice/
Depends: HACK-015
Verify: `uv run pytest -q app/tests/test_voice.py && npm --prefix web test -- src/features/voice && npm --prefix web run build`
Lease-Until: 1794165194
Updated: 1794162494
Task-Base: 1c74895da68a3dadf4696fdf750dd2badbee4bb7
Next: `app/tests/test_voice.py`.
PR: -
Evidence: -
Thread-Read: 0
