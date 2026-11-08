# worklog/WL-1794125844-victor-2-HACK-021-hack.E4eKjj.md · HACK-021

## Live summary
- Done: Dashboard /tablero with SSE, tracking key, test amount label, explanation source, demo_data fallback; Verify green
- Decision: openEvents injected (Fake in tests, EventSource adapter in page); demo SSE when no merchant_id
- Why: Testable without backend; HACK-012 contract wired via /api/deudas?merchant_id=
- Failing: none
- Commands: npm --prefix web test -- src/features/dashboard && npm --prefix web run build
- Next: design-critic SHIP then gh pr + uak done

## History
- 1794125844 | CLAIMED | victor-2 | claim; next: `dashboard.test.tsx` with a Fake EventSource.
- 1794125854 | CLAIMED | victor-2 | heartbeat; lease until 1794128554
- 1794126041 | CLAIMED | victor-2 | checkpoint; next: design-critic SHIP then gh pr + uak done
