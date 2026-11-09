BATCH-OK

Authorize only T-ADM-01: the pure authorizeStaff checker described below.

T-ADAPTER-01 landed: submit/inquire Unknown; unsigned webhook quarantined. TEST 4 passed.

Holds remain: T-CORE-02, T-PLAT-08, T-EXT-02, T-EXT-04, T-QUOTE-01, T-REWARD-01.

Allowed implementation files only:
- packages/domain/admin/authorize-staff.ts
- tests/features/test-adm-01.spec.ts
- packages/contracts/src/admin.ts (new additive Adm01 types only)

Required behavior:
- Never return ok:true and never issue a staff session that can mutate money.
- audience === 'customer' => unauthorized, HTTP 403. Customer tokens are denied.
- unrelatedEntity === true => unauthorized, HTTP 403. Unrelated entities are denied.
- Otherwise => dependency_unavailable, HTTP 503, because workforce SSO/OIDC is not implemented.
- Default-deny. No owner auto-admin.

Keep the checker pure: no DB, no money operations, no executeCommand. Tests must cover these denial branches and the absence of any successful authorization path. No other implementation scope is authorized; any required expansion remains HOLD.
