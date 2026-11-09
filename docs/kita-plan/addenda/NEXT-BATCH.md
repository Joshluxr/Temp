BATCH-OK

Authorize only the exact T-FUND-01 createInstrumentSession pure checker below. No other implementation is authorized by this batch.

T-TX-02 landed: lateReturnErasesPaidHistory returns POLICY_UNAVAILABLE 409; otherwise 503, with no money from projection. Reported validation: TEST-TX-02, 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10.

Allowed files only:
- packages/domain/funding/create-instrument-session.ts
- tests/features/test-fund-01.spec.ts
- packages/contracts/src/funding.ts — additive Fund01 types only

Required behavior and constraints:
- Pure checker only: no DB access, no money movement, no fund collection, no executeCommand, and no persistence.
- Never return ok:true. Never persist or log raw PAN/CVV; none may enter app server logs or the DB.
- rawPanOrCvvPresent === true returns CAPABILITY_UNAVAILABLE with HTTP 409.
- Otherwise return dependency_unavailable with HTTP 503 because the hosted instrument session store is not implemented.
- Reuse Tx08CommandContext, or a WorkerContext pick named Fund01CommandContext.
- Tests must cover both failure branches and verify that neither returns ok:true.

Route implementation through the prescribed GPU Qoder Efficient coding swarm, then Sol max review. Any expansion beyond this checker or the allowed files requires HOLD.
