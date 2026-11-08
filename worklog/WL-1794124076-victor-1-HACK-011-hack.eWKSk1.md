# worklog/WL-1794124076-victor-1-HACK-011-hack.eWKSk1.md · HACK-011

## Live summary
- Done: registry, credentials, crypto, db; PR #8
- Decision: SERVER_SIGNING_KEY is a private JWK JSON; no ephemeral fallback
- Why: credentials must verify across restarts
- Failing: none
- Commands: uv run pytest -q app/tests/test_registry.py app/tests/test_crypto.py
- Next: Wait for review of SHA b1f46fc

## History
- 1794124076 | CLAIMED | victor-1 | claim; next: `app/tests/test_crypto.py` against `vectors.json`.
- 1794124087 | CLAIMED | victor-1 | heartbeat; lease until 1794126787
- 1794124354 | REVIEW | victor-1 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/8; evidence: uv run pytest -q app/tests/test_registry.py app/tests/test_crypto.py exit 0 (5 tests); smoke PRODUCT_PASS; all vectors.json pass · red at effb5ac: E   AssertionError: {"detail":"Not Found"} · red at effb5ac: E   AssertionError: {"detail":"Not Found"}; reviewer: -
- 1794124362 | REVIEW | victor-1 | checkpoint; next: Wait for review of SHA b1f46fc
- 1794124730 | REVIEW | joahanmorales-1 | review; approve; SHA b1f46fc8ac93d34507c768e92368f15f09d97452; reviewer joahanmorales-1
- 1794124739 | REVIEW | victor-1 | heartbeat; lease until 1794139139
- 1794125021 | REVIEW | victor-1 | heartbeat; lease until 1794139421
