BATCH-OK

Authorize only T-DEPEND-01: the pure evaluateActivation checker described below.

Recorded status: T-EXT-03 landed. individualKycOnly returns APPROVAL_REQUIRED
with HTTP 409; otherwise HTTP 503. TEST-EXT-03: 4 passed.
Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Allowed implementation files only:
- packages/domain/catalog/activation-policy.ts
- tests/features/test-depend-01.spec.ts
- packages/contracts/src/activation.ts (additive types; new file allowed)

Required contract:
- evaluateActivation(scope, evidence, now) -> ActivationDecision, or a Result
  wrapping ActivationDecision.
- Pure and deterministic from its inputs: no DB, no money, no executeCommand,
  no side effects, and no fabricated approvals.
- Never return an enabled decision or activation=true.
- Missing, expired, rejected, or wrong-entity evidence must produce a disabled
  decision with explicit reasons. Missing evidence never defaults to approval.
- Complete-looking evidence must still produce a disabled decision with a reason
  that live DEP-00–15 owner/counsel/Finance signatures are not on file. Supplied
  evidence must not be treated as those approvals. Do not enable US→PH.

Verification must cover missing, expired, rejected, wrong-entity, and
complete-looking evidence, asserting disabled decisions and reasons throughout.
Use the supplied now argument for time evaluation.

No production activation or enablement is authorized. No docs or activation JSON
claiming production enablement in this batch. Keep all listed holds in place.
Implementation follows the established GPU Qoder Efficient coding and VM Sol max
review flow.
