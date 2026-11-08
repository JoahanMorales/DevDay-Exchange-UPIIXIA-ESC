# worklog/WL-1794128223-joahanmorales-1-HACK-020-hack.tNjI9X.md · HACK-020

## Live summary
- Done: reputation.py + router + 5 tests, PR #21
- Decision: daily_cap_cents stays base; effective = base×factor; list version = sum(rep_version)
- Why: monotonic version for clients
- Failing: none
- Commands: uv run pytest -q app/tests/test_reputation.py
- Next: Wait for review PR #21; wiring of debts.py is a request to victor-1

## History
- 1794128223 | CLAIMED | joahanmorales-1 | claim; next: `app/tests/test_reputation.py`.
- 1794128318 | REVIEW | joahanmorales-1 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/21; evidence: uv run pytest -q app/tests/test_reputation.py exit 0 (5 passed); full suite 35 passed; ruff clean · red at 04453b3: E   AssertionError: assert 0.0 == 1.3; reviewer: -
- 1794128325 | REVIEW | joahanmorales-1 | checkpoint; next: Wait for review PR #21; wiring of debts.py is a request to victor-1
- 1794160260 | REVIEW | victor-2 | review; approve; SHA 1ad18cdfa105de2d7b03014b01a9e07ae842c759; reviewer victor-2
