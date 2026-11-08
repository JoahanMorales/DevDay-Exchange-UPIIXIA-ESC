# PROJECT · DevDay Exchange Community Hackathon: Mexico City (sprint mode)

> Filled in by `/uak-setup` with the human at minute 0. uak reads the flat fields of the last block from
> the remote `main`, so a stale worktree can never change permissions.

## Event
| Field | Value |
|---|---|
| Event / challenge | DevDay Exchange Community Hackathon: Mexico City · challenge: prototype public-good tools with OpenAI and CoDi (Banco de México's free instant payments) through pey's free open-source API; examples: neighborhood merchant charges, community commerce, QR codes and payment-request flows, business flows on instant payments · https://luma.com/f755f0k6 · https://events.openai.com/devdayexchange2026 |
| Start | 2026-11-07 10:00 America/Mexico_City |
| Official deadline | 2026-11-08 13:00 America/Mexico_City · platforms: email to hola@aibuilders.lat (video + repo), repo github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC |
| Freeze | Sun 2026-11-08 11:12 (`uak clock` from the real build start Sun 01:00 to the 13:00 deadline, Freeze-Epoch 1794157920) |
| Schedule (uak clock) | build start Sun 01:00 · design lock 01:36 · first claim by 01:57 · walking skeleton 02:12 · plan-B video 07:00 · freeze 11:12 |
| Clean rehearsal / plan B | Sun 2026-11-08 12:02 |
| Internal submission | Sun 2026-11-08 12:31 (Victor) |
| Humans | Fanny, Yael, Yojan, Fer, Andy, Victor · submission owner: Victor (starts at T−8 h, Sun 05:00) · pey owner: Fer · deploy owner: Victor · human-only tasks (pey, Android device tests, field interviews): Fer (lead) with Yojan |
| Agents | fanny-1, fanny-2, yael-1, yael-2, yojan-1, yojan-2, fer-1, fer-2, andy-1, andy-2, victor-1, victor-2 |
| Machines | 3 Macs, 3 Windows (Git Bash) · ports already taken: `<pending>` |

## Official rubric (weights sum to 100)
Not published yet (as of 2026-11-08 01:00). Provisional criteria from IDEA.md §8 (SEDECO and OpenAI Build Week public criteria), no weights. Victor asks the hosts at 09:00 and replaces this table.
| ID | Criterion | Weight | Evidence in the demo |
|---|---|---:|---|
| C1 | Working product: full flow steps 1→5 live, repo runs with DEMO_MODE=1 | - | IDEA §4 steps 1–5 |
| C2 | Problem clarity: the two failures (no network, forged confirmations) | - | landing, pitch, IDEA §2.1 and §11 |
| C3 | Solution quality and public-good impact | - | step 3 (attacks rejected) + step 5 (real CoDi charge) |
| C4 | Technical execution: in-browser crypto, encrypted relay, signed webhook, idempotency, tests | - | tests, sync, webhook verifier |
| C5 | Originality: signed IOU + relay + CoDi settlement | - | IDEA §1 differential |
| C6 | Use of the challenge tech: OpenAI + CoDi via pey (and Codex) | - | real $0.01 push, OpenAI explanation and voice, README on Codex |

## Event rules
| Topic | Confirmed rule | Source |
|---|---|---|
| AI use / prior code | Both allowed | organizers (told to Victor) |
| Data and licenses | Payments through pey's free open-source CoDi API; `<other data rules pending>` | https://luma.com/f755f0k6 |
| Format and video limits | A video is required; no length limit announced yet | organizers |

## Plan B
- A video of the whole flow at `docs/demo/plan-b.mp4` (v1 Sun 07:00, final before the 11:12 freeze). Use it if the network, the pey/CoDi sandbox or the OpenAI API fails during the demo.

## Executable config
A human sets `yes`. A missing field means `no`.

```text
Mode: sprint
UI-Paths: web/src/features/, web/src/App.tsx, web/src/lib/ui/, web/src/index.css
Backlog-Proposed-Epoch: 0
Backlog-Approved: yes
Autonomy: yes
Auto-Merge: yes
Review-Mode: claims
Plan-Channel: claims
Freeze-Epoch: 1794157920
Lease-Seconds: 2700
Review-Lease-Seconds: 14400
Events-Per-Session: 100
Checkpoint-Percent: 60
Merge-Lease-Seconds: 1800
Merge-Wait-Seconds: 180
Merge-Adopt-Seconds: 300
Max-Parallel-Subagents: 4
Opus-Subagents-Per-Session: 2
Pace: auto
Subagent-Hard-Cap: 6
Strong-Hard-Cap: 3
Subagents-Per-Session: 40
Subagents-Per-Machine: 8
Subagent-Burst-Per-Minute: 6
Max-Worktree-Agents: 6
Blackbox: on
Additive-Paths: -
Test-First: yes
```
