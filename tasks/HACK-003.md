# HACK-003
ID: HACK-003
State: INTEGRATED
Owner: joahanmorales-1
Branch: feat/hack-003
Worktree: /home/joahan/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-003
Worklog: worklog/WL-1794122725-joahanmorales-1-HACK-003-hack.QcZzvO.md
Priority: P0
Paths: app/schemas/, app/fixtures/sinsenal/, app/tests/test_contract.py, docs/protocolo.md, web/src/lib/contract/
Depends: None
Verify: `uv run --no-project --with pydantic --with pytest --with cryptography python -m pytest -q app/tests/test_contract.py`
Lease-Until: 0
Updated: 1794123767
Task-Base: bf793f9ad893ea58f5200994f61a768a4b616850
Next: Integrated in main: 935d53aa68de2b1fcce844b2b8f8e20c83d2d25d
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/1
Evidence: pytest test_contract.py exit 0 (5 passed); vectors verified py-side; paths within HACK-003 · red at bf793f9: >       assert len(raw) == 61
Events: 6
Checkpoints: 1
Sessions: 2
Last-Checkpoint: 1794122893
Task-Tip: af26c5def93aea877a65d9c7e7d2ce87f582164e
Progress: 1 commit(s) since the claim · last: af26c5d feat(contract): IOU format, pydantic schemas, vectors, TS types (HACK-003) (14 minutes ago) · 0 uncommitted tracked file(s) · at 1794123711
Progress-Head: af26c5d/4294967295
Progress-Changed: 1794123711
Merge-Commit: 935d53aa68de2b1fcce844b2b8f8e20c83d2d25d
Reviewer: victor-2
Integration-Proof: ancestry
