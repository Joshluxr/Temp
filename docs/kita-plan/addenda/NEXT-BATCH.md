BATCH-OK

Authorize only T-REC-01: createRecipient PURE checker, through the established Qoder Efficient GPU workflow.

T-KYC-07 landed: support 403; compliance 503; no AML text. TEST-KYC-07: 2 passed (operator-reported).

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04.

Only permitted implementation files:
- packages/domain/recipients/create-recipient.ts
- tests/features/test-rec-01.spec.ts
- packages/contracts/src/recipients.ts — new additive Rec01 types only; preserve existing contracts. CommandContext may be a minimal local type here if not already exported.

Required behavior:
- createRecipient is a pure checker: no DB access, no money operations, no executeCommand, and no recipient persistence.
- Never return ok: true. All paths fail closed.
- Apply these branches in order:
  1. serverSideOwned === false returns unauthorized, HTTP 403. Ownership must be enforced server-side.
  2. Otherwise, clientClaimedValidated === true returns CAPABILITY_UNAVAILABLE, HTTP 409, retryable: false. Name/account validation must be server-side; client claims are ignored as proof.
  3. Otherwise return dependency_unavailable, HTTP 503, because T-ADAPTER-01 institution catalog is not implemented.
- Do not echo full account numbers in responses or problem details. No plaintext account numbers in traces.

TEST-REC-01 must verify all three outcomes, ownership precedence when both flags match, retryable: false for the 409, absence of successful results, and non-disclosure of full account numbers in responses, problem details, or any emitted traces. Confirm purity, no persistence, and the exact file allowlist during review.

Anything beyond this exact checker requires a new authorization; the listed holds remain in force.
