# HACK-034
ID: HACK-034
State: REVIEW
Owner: joahanmorales-1
Branch: feat/hack-034
Worktree: /home/joahan/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-034
Worklog: worklog/WL-1794129423-joahanmorales-1-HACK-034-hack.5XOiL1.md
Priority: P1
Paths: pyproject.toml, uv.lock, .python-version, app/__init__.py, app/main.py, app/config.py, app/routers/__init__.py, app/services/__init__.py, app/tests/__init__.py, app/tests/test_health.py, web/package.json, web/package-lock.json, web/index.html, web/vite.config.ts, web/tsconfig.json, web/tsconfig.app.json, web/tsconfig.node.json, web/eslint.config.js, web/src/main.tsx, web/src/App.tsx, web/src/index.css, web/src/lib/api.ts, web/src/vite-env.d.ts, web/src/test/, web/public/, Dockerfile, .dockerignore, render.yaml, .env.example, .github/workflows/
Depends: HACK-001
Verify: `uv run pytest -q app/tests/test_health.py && npm --prefix web run build && npm --prefix web test && test -f Dockerfile && test -f render.yaml`
Lease-Until: 1794174811
Updated: 1794160411
Task-Base: 04453b3727de3d20d0b7234d15d9cc40513e3ac8
Next: Humano: Shared resource/CI needs a human: .github/workflows/uak.yml
PR: https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/24
Evidence: clean worktree: npm build -> 'tsc: not found'; after npm --prefix web ci, bash .uak/bin/smoke-project exit 0 (pytest + build) · no visible change: diff only touches .github/workflows/uak.yml (no UI files) · no red: CI config; reproduced tsc not found on a clean worktree, fixed by npm ci
Events: 6
Checkpoints: 0
Sessions: 2
Last-Checkpoint: 0
Task-Tip: 416047fa0d2c10229c1a885404431d4b26d14330
Progress: 1 commit(s) since the claim · last: 416047f ci: install web deps before Product smoke (HACK-034) (9 hours ago) · 0 uncommitted tracked file(s) · at 1794160411
Progress-Head: 416047f/4294967295
Progress-Changed: 1794160411
