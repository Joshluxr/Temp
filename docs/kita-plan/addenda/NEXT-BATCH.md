BATCH-OK

Authorize only T-ADAPTER-01: PURE fail-closed transport checker.

T-REC-04 landed: reuseOldPayment => 409; otherwise => 503.
TEST-REC-04: 2 passed.

HOLD: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04, T-QUOTE-01.
T-REWARD-01: HOLD (ledger).

Only permitted files:
- packages/providers/transport.ts — submit and inquire only.
- packages/providers/evidence.ts — verifyWebhook only.
- tests/providers/outcome-contract.spec.ts — focused outcome-contract checks.

Required behavior:
- submit and inquire return Unknown, or an equivalent explicit problem outcome, because transport is unimplemented. Never guess Confirmed or Rejected. No unsigned success.
- verifyWebhook returns a VerificationResult that is not verified / is rejected for unsigned input or a missing signature. Never treat an unsigned body as success.

Checker acceptance:
- Focused tests prove submit and inquire fail closed without implemented transport.
- Focused tests prove unsigned webhook input and missing signatures cannot produce a verified result.
- No HTTP, DB, money operations, executeCommand, real provider calls, or persistence.
- Keep the checker pure and changes confined to the three permitted files. All listed holds remain in force.

Use the established Qoder Efficient coding / Sol max review workflow. No broader implementation is authorized.
