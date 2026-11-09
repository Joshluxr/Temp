BATCH-OK

Authorize only T-TX-09 `respondToRfi` as a PURE checker within this exact scope.

T-TX-08 landed: `wrongAccountOrCrossCaseAttachment === true` returns `unauthorized` / 403; otherwise 503. TEST-TX-08: 2 passed.

Allowed files only:
- `packages/domain/transfers/respond-to-rfi.ts`
- `tests/features/test-tx-09.spec.ts`
- `packages/contracts/src/transfers.ts` — additive Tx09 types only.

Required behavior:
- Never return `ok: true`.
- Never project confidential risk details publicly; confidential risk details must be absent from the public projection, including error responses.
- When `confidentialRiskInPublicProjection === true`, return `unauthorized` / 403. This denial takes precedence over dependency unavailability.
- Otherwise return `dependency_unavailable` / 503 because the case/RFI store is not implemented.
- Reuse `Tx08CommandContext`.
- Keep the checker pure: no DB access, no money operations, and no `executeCommand`.
- Tests must cover the 403 denial, the 503 fallback, the absence of confidential risk details in public projection, and the absence of any `ok: true` outcome.

Holds: T-ADM-03, T-ADM-06, T-ADM-08, T-CORE-02, T-QUOTE-01, T-FIN-01, T-REWARD-01, T-PLAT-08, T-EXT-02, T-EXT-04, T-GROW-06, T-TX-01 through T-TX-07.

Only this exact checker is authorized.
