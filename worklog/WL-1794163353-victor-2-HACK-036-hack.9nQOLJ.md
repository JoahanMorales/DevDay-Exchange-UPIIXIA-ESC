# worklog/WL-1794163353-victor-2-HACK-036-hack.9nQOLJ.md · HACK-036

## Live summary
- Done: Claim created; implementation pending
- Decision: Own branch and worktree
- Why: Parallel work without touching the main checkout
- Failing: No validation run yet
- Commands: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
- Next: Write its tests, see them fail (uak red HACK-036), then implement until this passes: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`

## History
- 1794163353 | CLAIMED | victor-2 | claim; next: Write its tests, see them fail (uak red HACK-036), then implement until this passes: `uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py`
