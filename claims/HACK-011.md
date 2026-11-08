# HACK-011
ID: HACK-011
State: CLAIMED
Owner: victor-1
Branch: feat/hack-011
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-011
Worklog: worklog/WL-1794124076-victor-1-HACK-011-hack.eWKSk1.md
Priority: P0
Paths: app/routers/registry.py, app/services/credentials.py, app/services/crypto.py, app/services/db.py, app/tests/test_registry.py, app/tests/test_crypto.py
Depends: HACK-001
Verify: `uv run pytest -q app/tests/test_registry.py app/tests/test_crypto.py`
Lease-Until: 1794126776
Updated: 1794124076
Task-Base: effb5ace5314411fd07ef005d0b688e7619ae6c0
Next: `app/tests/test_crypto.py` against `vectors.json`.
PR: -
Evidence: -
Thread-Read: 0
