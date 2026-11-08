# worklog/WL-1794125470-victor-1-HACK-012-hack.EGORdm.md · HACK-012

## Live summary
- Done: credential checks expired/bad_credential/cap_exceeded at d1c4714, PR #15 back in REVIEW; reviewed HACK-009 approve
- Decision: credential window from payer.created_at+CREDENTIAL_TTL_S; cap per UTC day of IOU ts
- Why: credential not in envelope; server rebuilds it from the payer row
- Failing: none
- Commands: uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py
- Next: Integrated in main: 954a874223010d2254f68ca410b879f4b3eb25ce

## History
- 1794125470 | CLAIMED | victor-1 | claim; next: `app/tests/test_debts.py` with `FakePey` from HACK-010.
- 1794125498 | CLAIMED | victor-1 | heartbeat; lease until 1794128198
- 1794125714 | CLAIMED | victor-1 | checkpoint; next: await review
- 1794125724 | REVIEW | victor-1 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/15; evidence: uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py exit 0 (6 passed); full app/tests 23 passed; all 5 acceptance criteria covered by the 6 named tests · red at f9105fc: E   AssertionError: {"detail":"Not Found"}; reviewer: -
- 1794125849 | REVIEW | joahanmorales-1 | review; reject; SHA 9da068f2776bf7d2b522a97fb81e345e69e3e2e1; reviewer joahanmorales-1
- 1794126167 | REVIEW | victor-1 | heartbeat; lease until 1794140567
- 1794126258 | REVIEW | victor-1 | done; PR https://github.com/JoahanMorales/DevDay-Exchange-UPIIXIA-ESC/pull/15; evidence: uv run pytest -q app/tests/test_sync.py app/tests/test_debts.py exit 0 (9 passed); credential checks expired/bad_credential/cap_exceeded each tested · red at f9105fc: E   AssertionError: {"detail":"Not Found"}; reviewer: -
- 1794126303 | REVIEW | victor-1 | checkpoint; next: wait HACK-012 --for approve
- 1794126349 | REVIEW | victor-2 | review; approve; SHA d1c47147f037bc7084d224952a8b7df1eb27b444; reviewer victor-2
- 1794126769 | INTEGRATED | victor-2 | merge; smoke and Verify PASS; commit 954a874223010d2254f68ca410b879f4b3eb25ce; reviewer victor-2
