BATCH-OK

Authorize T-PUB-04 only: implement the describeDelivery PURE checker through the established GPU Qoder coding workflow. Reuse Pub01CommandContext.

Allowed files only:
- packages/domain/catalog/describe-delivery.ts
- tests/features/test-pub-04.spec.ts
- packages/contracts/src/catalog.ts — additive Pub04 types only

Required behavior:
- Never return ok:true or disclose fees/deadlines that disagree with accepted terms.
- feeOrDeadlineMismatch === true => POLICY_UNAVAILABLE, HTTP 409. Message: "Fee and deadline must agree with accepted terms."
- Otherwise => dependency_unavailable, HTTP 503, because the pricing/calendar store is not implemented (T-QUOTE-03 HOLD).
- No DB access, money handling, or executeCommand.

TEST-PUB-04 must cover the mismatch 409 rejection and the otherwise 503 dependency_unavailable response, with no ok:true outcome or conflicting fee/deadline disclosures.

Landed:
- T-PUB-03: disabledUsStateOrOrigin => CAPABILITY_UNAVAILABLE, HTTP 403; otherwise HTTP 503.
- TEST-PUB-03: 2 passed.

Holds remain: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04. T-QUOTE-03 remains HOLD.

Authorization is limited to this exact checker and these three files. HOLD if implementation requires broader scope.
