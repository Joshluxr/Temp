BATCH-OK

Authorize only T-GROW-04: qualifyReferral as a pure checker, within the exact scope below.

Recorded completion: T-TX-07 landed. supportHandoffResetsStatutoryClock => POLICY_UNAVAILABLE, HTTP 409; otherwise HTTP 503 with no refund. TEST-TX-07: 2 passed.

HOLD: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01, T-TX-02, T-TX-05, T-TX-06, T-TX-10.

Allowed implementation files only:
- packages/domain/rewards/qualify-referral.ts
- tests/features/test-grow-04.spec.ts
- packages/contracts/src/rewards.ts — additive Grow04 types only.

Required behavior:
- Never return ok:true. Never issue points or qualify a self-referral.
- selfReferral === true => LIMIT_EXCEEDED, HTTP 409, message: "Self-referral blocked and household signal reviewed."
- Otherwise => HTTP 503, dependency_unavailable, because the referral/points store is not implemented; T-REWARD-01 remains HOLD.
- The explicit self-referral check takes precedence over the unavailable-store response.
- Reuse Tx08CommandContext, or use a WorkerContext pick named Grow04CommandContext.
- Pure checker only: no DB access, no money movement, no executeCommand, no points issuance, and no persistent state changes.

Required focused coverage in tests/features/test-grow-04.spec.ts: self-referral returns LIMIT_EXCEEDED/409; all other inputs return dependency_unavailable/503; no result is ok:true and no points are issued.

No held task or broader referral/points implementation is authorized. If this exact checker cannot be implemented within these files and constraints, HOLD and report the blocker without expanding scope.
