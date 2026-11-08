# DECISIONS

Coordination decisions on the claims branch.
Why: a reversible option after 15 min keeps work moving.
- 1794076748 | deadline backlog/proposed/1794074104 | ALLOW_P0 | Only P0 with active autonomy; a timeout grants no permissions.
- 1794122476 | plan | victor/victor | tasks added: HACK-032 HACK-033 | Why: backlog without PR (Plan-Channel: claims)
- 1794122763 | HACK-002 | fake clock/sleep injected; extra expiry test | Why: no network in tests
- 1794122826 | HACK-001 | route={path,element} glob; react-router-dom added | Why: per acceptance
- 1794122893 | HACK-003 | vectors.json committed (ECDSA random); envelope plaintext = 125B signed IOU; envelope_id=sha256(signed IOU) | Why: cross-language reuse by HACK-011/013/014
- 1794123033 | HACK-002 | smoke-project missing: project-level, not in Paths | Why: spike only
- 1794123097 | HACK-001 | --no-ui: placeholder only; dropped template files | Why: outside Paths; no DESIGN.md
- 1794123622 | HACK-005 | doc band = PENDIENTE, no invented results | Why: device results are Fer's
- 1794123886 | HACK-004 | seeded payload per trial 1-10 so receiver matches without copying; ASCII payload | Why: embind std::string; two phones can't share clipboard
- 1794124111 | HACK-034 | follow-up of HACK-001 by victor-1: CI: install web deps (npm --prefix web ci) before Product smoke in .github/workflows/uak.yml; main CI fails with tsc: not found | Why: same Paths, no scope change
