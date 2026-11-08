# HACK-006
ID: HACK-006
State: CLAIMED
Owner: joahanmorales-1
Branch: feat/hack-006
Worktree: /home/joahan/Proyectos/DevDay-Exchange-UPIIXIA-ESC-wt/hack-006
Worklog: worklog/WL-1794123436-joahanmorales-1-HACK-006-hack.ZIHJKH.md
Priority: P0
Paths: spikes/crypto/, docs/spikes/crypto.md
Depends: None
Verify: `node spikes/crypto/sign.mjs spikes/crypto/out.json && uv run --no-project --with cryptography python spikes/crypto/verify.py spikes/crypto/out.json`
Lease-Until: 1794126136
Updated: 1794123436
Task-Base: d11f2b3f7f0cb81e73574d28319ebad2d6e9d77b
Next: `sign.mjs` with `crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"}, false, ["sign","verify"])`.
PR: -
Evidence: -
Events: 1
Checkpoints: 0
Sessions: 1
Last-Checkpoint: 0
