# worklog/WL-1794122725-joahanmorales-1-HACK-003-hack.QcZzvO.md · HACK-003

## Live summary
- Done: Claim created; implementation pending
- Decision: Own branch and worktree
- Why: Parallel work without touching the main checkout
- Failing: No validation run yet
- Commands: `uv run --no-project --with pydantic --with pytest --with cryptography python -m pytest -q app/tests/test_contract.py`
- Next: `app/schemas/protocol.py` with the IOU byte layout, then `gen_vectors.py`.

## History
- 1794122725 | CLAIMED | joahanmorales-1 | claim; next: `app/schemas/protocol.py` with the IOU byte layout, then `gen_vectors.py`.
