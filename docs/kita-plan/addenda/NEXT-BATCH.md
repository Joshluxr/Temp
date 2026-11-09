BATCH-OK

Authorize only T-ADM-10: changeAccess PURE checker.

Heartbeat (operator reported): Codex logged in, GPU disk 41%, astra gone. Plan A-N complete.

T-ADM-09 landed: missing step-up/reason/expiry => 403; otherwise 503 with no PII. TEST-ADM-09: 4 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Files allowed for this batch only:
- packages/domain/admin/change-access.ts
- tests/features/test-adm-10.spec.ts
- packages/contracts/src/admin.ts — additive Adm10 types only.

Required behavior:
- Never return ok:true. Never leave a revoked approver able to execute a queued request.
- financialSelfGrant === true => unauthorized, HTTP 403. No financial self-grant bypass, including when both flags are true.
- revokedApprover === true => unauthorized, HTTP 403, or APPROVAL_STALE, HTTP 409; retryable:false.
- Otherwise => dependency_unavailable, HTTP 503, because the staff_grants store is not implemented.

Scope: pure checking only. No DB, money, executeCommand, command execution, or state mutation.

TEST-ADM-10 must cover revoked approver, financial self-grant, both flags, and the otherwise-503 path; assert no result is ok:true and revoked-approver denials are retryable:false.

Route implementation through the GPU Qoder Efficient swarm under the established workflow; Sol max reviews the returned batch. This authorizes only the exact checker above. All listed holds remain in force.
