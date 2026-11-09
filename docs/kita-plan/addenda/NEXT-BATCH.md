BATCH-OK

Authorize only the limited T-PLAT-09 applyRetention fail-closed checker below.

Operator-reported status: T-PLAT-10 landed; evaluateReleaseGates never returns ok:true; TEST-PLAT-10: 10 passed. T-CORE-02 remains HOLD. T-PLAT-08 remains HOLD.

Exact checker contract:
- applyRetention(ctx: WorkerContext, input: Plat09Input): Promise<Result<Plat09Output>> uses the existing Result/Problem helpers and always returns ok:false. Never return ok:true or claim deletion, export, key destruction, or retention completion.
- legalHoldActive === true: return POLICY_UNAVAILABLE, status 409, retryable:false. The legal hold blocks deletion; do not fall through to the no-hold branch.
- legalHoldActive === false: return dependency_unavailable, status 503, retryable:true, because retention workers and the PII key lifecycle are not implemented. Absence of a hold never authorizes deletion in this batch.
- No database access or writes, including documents or cases; no deletion, journals, money effects, executeCommand, storage/KMS/provider calls, worker execution, or PII in diagnostics.

Only these implementation files are authorized, relative to apps/kita/:
- packages/platform/apply-retention.ts
- tests/features/test-plat-09.spec.ts
- packages/contracts/src/platform.ts: additive Plat09 types only, including legalHoldActive:boolean on Plat09Input. Preserve existing contracts and shared problem codes.

TEST-PLAT-09 must exercise both legalHoldActive values and assert the exact code, status, retryable value, and ok:false above. Verify that every path blocks without deletion or other side effects, and that the checker has no persistence, money, executeCommand, or live retention/key-lifecycle dependencies. This checker does not satisfy the full feature's deletion/export acceptance or close T-PLAT-09.

Qoder Efficient implements on GPU gpu-fqaf through the established sync/bundle workflow; Sol max reviews the returned exact head for scope, completeness, and correctness. Run TEST-PLAT-09, retain the passing TEST-PLAT-10 regression, and run applicable type checks. Any required scope expansion, shared-contract change beyond additive Plat09 types, or failure to preserve these blocking guarantees is HOLD. No worker, controller, migration, package/export, infrastructure, or CI changes are authorized.

This file records authorization only; this session does not dispatch or implement the batch.
