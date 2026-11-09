BATCH-OK

Authorize only T-ADM-12: a PURE pauseRoute checker that MUST NOT persist a live pause affecting money.

T-ADM-11 landed: archiveUnavailable/chainMismatch => SECURITY_FAILURE, HTTP 409; otherwise HTTP 503. TEST-ADM-11: 4 passed (reported).

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04.

Files allowed for the next implementation batch only:
- packages/domain/admin/pause-route.ts
- tests/features/test-adm-12.spec.ts
- packages/contracts/src/admin.ts — additive Adm12 types only

Required behavior:
- Never return ok:true.
- Never persist a route pause or reenable; no live money-affecting state changes.
- reenableWithoutApproval === true => APPROVAL_REQUIRED, HTTP 409, retryable false.
- Otherwise => HTTP 503, dependency_unavailable, because the capabilities/holds store and T-CORE-02 are not implemented.
- Do not claim new commands are stopped in production.

Verification must cover both response branches, no ok:true, and absence of pause/reenable persistence or side effects. Keep every listed hold in place.

Execution follows the established roles: Qoder Efficient swarm codes on GPU gpu-fqaf; Sol max reviews the returned batch. This authorization is limited to the exact checker above.
