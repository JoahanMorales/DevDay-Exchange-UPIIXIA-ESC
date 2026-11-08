# worklog/WL-1794122725-joahanmorales-1-HACK-003-hack.QcZzvO.md · HACK-003

## Live summary
- Done: contract: protocol.py, models.py, vectors, docs/protocolo.md, TS types; 5 tests green; PR #1
- Decision: vectors.json committed (ECDSA random); envelope plaintext = 125B signed IOU; envelope_id=sha256(signed IOU)
- Why: cross-language reuse by HACK-011/013/014
- Failing: none
- Commands: uv run --no-project --with pydantic --with pytest --with cryptography python -m pytest -q app/tests/test_contract.py
- Next: Wait for review of PR #1; then uak merge HACK-003

## History
- 1794122725 | CLAIMED | joahanmorales-1 | claim; next: `app/schemas/protocol.py` with the IOU byte layout, then `gen_vectors.py`.
- 1794122885 | REVIEW | joahanmorales-1 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/1; evidence: pytest test_contract.py exit 0 (5 passed); vectors verified py-side; paths within HACK-003 · red at bf793f9: >       assert len(raw) == 61; reviewer: -
- 1794122893 | REVIEW | joahanmorales-1 | checkpoint; next: Wait for review of PR #1; then uak merge HACK-003
- 1794123081 | REVIEW | victor-2 | review; approve; SHA af26c5def93aea877a65d9c7e7d2ce87f582164e; reviewer victor-2
