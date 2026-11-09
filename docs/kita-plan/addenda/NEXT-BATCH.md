BATCH-OK

Authorize only T-TX-02: deriveCustomerStatus as a PURE projection checker, within the exact scope below.

Recorded completion: T-GROW-04 landed. selfReferral => LIMIT_EXCEEDED, HTTP 409; otherwise HTTP 503 with no points. TEST-GROW-04: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-05, T-TX-06, T-TX-10.

Allowed implementation files only:
- packages/domain/transfers/derive-customer-status.ts
- tests/features/test-tx-02.spec.ts
- packages/contracts/src/transfers.ts — additive Tx02 types only.

Required behavior:
- Never return ok:true and never authorize money from a projection.
- lateReturnErasesPaidHistory === true => POLICY_UNAVAILABLE, HTTP 409. Late return preserves paid history.
- Otherwise => HTTP 503, dependency_unavailable, because the transfer_events store is not implemented; T-TX-01 remains HOLD.
- The explicit lateReturnErasesPaidHistory check takes precedence over the unavailable-store response.
- Reuse Tx08CommandContext.
- Pure projection checker only: no DB access, no money movement, no executeCommand, no SSE live stream, and no persistent state changes.

Required focused coverage in tests/features/test-tx-02.spec.ts: lateReturnErasesPaidHistory === true returns POLICY_UNAVAILABLE/409 and preserves paid history; all other inputs return dependency_unavailable/503; no result is ok:true and no projection authorizes money.

No held task or broader transfer implementation is authorized. If this exact checker cannot be implemented within these files and constraints, HOLD T-TX-02 and report the blocker without expanding scope.
