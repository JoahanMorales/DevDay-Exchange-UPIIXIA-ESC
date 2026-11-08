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
Lease-Until: 1794137293
Updated: 1794122893
Task-Base: bf793f9ad893ea58f5200994f61a768a4b616850
Next: Wait for review of PR #1; then uak merge HACK-003
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/1
Evidence: pytest test_contract.py exit 0 (5 passed); vectors verified py-side; paths within HACK-003 · red at bf793f9: >       assert len(raw) == 61
Events: 3
Checkpoints: 1
Sessions: 1
Last-Checkpoint: 1794122893
Task-Tip: af26c5def93aea877a65d9c7e7d2ce87f582164e
