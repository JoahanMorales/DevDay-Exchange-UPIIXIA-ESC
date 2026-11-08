# HACK-032
ID: HACK-032
State: CLAIMED
Owner: joahanmorales-1
Branch: feat/hack-032
Worktree: /home/joahan/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-032
Worklog: worklog/WL-1794128796-joahanmorales-1-HACK-032-hack.3kedY6.md
Priority: P1
Paths: app/services/assistant.py, app/routers/assistant.py, app/tests/test_assistant.py, web/src/features/assistant/
Depends: HACK-012, HACK-022
Verify: `uv run pytest -q app/tests/test_assistant.py && npm --prefix web test -- src/features/assistant && npm --prefix web run build`
Lease-Until: 1794131623
Updated: 1794128923
Task-Base: 04453b3727de3d20d0b7234d15d9cc40513e3ac8
Next: web/src/features/assistant: page + ask.test.ts, build, design-lint, shots, critic, then done
PR: -
Evidence: -
Thread-Read: 0
