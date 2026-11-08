# HACK-003
ID: HACK-003
State: CLAIMED
Owner: joahanmorales-1
Branch: feat/hack-003
Worktree: /home/joahan/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-003
Worklog: worklog/WL-1794122725-joahanmorales-1-HACK-003-hack.QcZzvO.md
Priority: P0
Paths: app/schemas/, app/fixtures/sinsenal/, app/tests/test_contract.py, docs/protocolo.md, web/src/lib/contract/
Depends: None
Verify: `uv run --no-project --with pydantic --with pytest --with cryptography python -m pytest -q app/tests/test_contract.py`
Lease-Until: 1794125425
Updated: 1794122725
Task-Base: bf793f9ad893ea58f5200994f61a768a4b616850
Next: `app/schemas/protocol.py` with the IOU byte layout, then `gen_vectors.py`.
PR: -
Evidence: -
Events: 1
Checkpoints: 0
Sessions: 1
Last-Checkpoint: 0
