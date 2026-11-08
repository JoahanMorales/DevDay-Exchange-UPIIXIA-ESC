# HACK-010
ID: HACK-010
State: CLAIMED
Owner: victor-1
Branch: feat/hack-010
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-010
Worklog: worklog/WL-1794124722-victor-1-HACK-010-hack.jY692K.md
Priority: P0
Paths: app/services/pey.py, app/routers/webhooks.py, app/tests/test_pey.py, app/tests/test_webhooks.py
Depends: HACK-001
Verify: `uv run pytest -q app/tests/test_pey.py app/tests/test_webhooks.py`
Lease-Until: 1794127422
Updated: 1794124722
Task-Base: f33dbae8bf55b38a072660f877506495ae14f001
Next: `app/tests/test_webhooks.py` with a webhook signed by `standardwebhooks.Webhook(secret).sign`.
PR: -
Evidence: -
Thread-Read: 0
