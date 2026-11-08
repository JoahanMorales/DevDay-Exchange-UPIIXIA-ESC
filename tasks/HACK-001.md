# HACK-001
ID: HACK-001
State: CLAIMED
Owner: victor-1
Branch: feat/hack-001
Worktree: /Users/victor/Documents/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-001
Worklog: worklog/WL-1794122698-victor-1-HACK-001-hack.jsjiMQ.md
Priority: P0
Paths: pyproject.toml, uv.lock, .python-version, app/__init__.py, app/main.py, app/config.py, app/routers/__init__.py, app/services/__init__.py, app/tests/__init__.py, app/tests/test_health.py, web/package.json, web/package-lock.json, web/index.html, web/vite.config.ts, web/tsconfig.json, web/tsconfig.app.json, web/tsconfig.node.json, web/eslint.config.js, web/src/main.tsx, web/src/App.tsx, web/src/index.css, web/src/lib/api.ts, web/src/vite-env.d.ts, web/src/test/, web/public/, Dockerfile, .dockerignore, render.yaml, .env.example, .github/workflows/
Depends: None
Verify: `uv run pytest -q app/tests/test_health.py && npm --prefix web run build && npm --prefix web test && test -f Dockerfile && test -f render.yaml`
Lease-Until: 1794125398
Updated: 1794122698
Task-Base: bf793f9ad893ea58f5200994f61a768a4b616850
Next: follow `.uak/stacks/fastapi-react/STACK.md` §Backend setup, then §Frontend setup.
PR: -
Evidence: -
Events: 1
Checkpoints: 0
Sessions: 1
Last-Checkpoint: 0
