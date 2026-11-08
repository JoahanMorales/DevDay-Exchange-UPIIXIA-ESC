# HACK-003
ID: HACK-003
State: REVIEW
Owner: joahanmorales-1
Branch: feat/hack-003
Worktree: /home/joahan/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-003
Worklog: worklog/WL-1794122725-joahanmorales-1-HACK-003-hack.QcZzvO.md
Priority: P0
Paths: app/schemas/, app/fixtures/sinsenal/, app/tests/test_contract.py, docs/protocolo.md, web/src/lib/contract/
Depends: None
Verify: `uv run --no-project --with pydantic --with pytest --with cryptography python -m pytest -q app/tests/test_contract.py`
Lease-Until: 1794138111
Updated: 1794123711
Task-Base: bf793f9ad893ea58f5200994f61a768a4b616850
Next: Wait for review of PR #1; then uak merge HACK-003
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/1
Evidence: -
Thread-Read: 0
