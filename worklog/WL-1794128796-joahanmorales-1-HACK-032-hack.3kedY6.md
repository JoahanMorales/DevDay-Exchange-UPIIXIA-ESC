# worklog/WL-1794128796-joahanmorales-1-HACK-032-hack.3kedY6.md · HACK-032

## Live summary
- Done: backend: services/assistant.py + routers/assistant.py, 6 tests green, ruff clean
- Decision: tools return marker names only; merchant forced from request; no tool call -> template
- Why: anti-hallucination, no cross-shop leak
- Failing: none
- Commands: uv run pytest -q app/tests/test_assistant.py
- Next: web/src/features/assistant: page + ask.test.ts, build, design-lint, shots, critic, then done

## History
- 1794128796 | CLAIMED | joahanmorales-1 | claim; next: `app/tests/test_assistant.py` with a Fake OpenAI client returning a tool call.
- 1794128923 | CLAIMED | joahanmorales-1 | checkpoint; next: web/src/features/assistant: page + ask.test.ts, build, design-lint, shots, critic, then done
