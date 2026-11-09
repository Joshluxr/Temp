BATCH-OK

Authorize only T-PLAT-07: implement validateEnvironment as a pure, fail-closed checker.

Review recorded: T-PLAT-06 stub landed; observeFinancialHealth always returns 503. TEST-PLAT-06: 4 passed. No audit, alerts, or journals.

Allowed files only:
- packages/platform/validate-environment.ts
- tests/features/test-plat-07.spec.ts
- packages/contracts/src/platform.ts (additive Plat07 types only)

Required behavior:
- If claimedEnvironment is production and any of sandboxCapabilityPresent, fixtureAdapterPresent, or addSandboxFundsPresent is true, return err CAPABILITY_UNAVAILABLE (or the existing problem helper), retryable false, with status 409 or 503 as supported by the contracts.
- If claimedEnvironment is production and all three flags are false, still return 503 dependency_unavailable: live IaC/KMS isolation is not implemented.
- If claimedEnvironment is sandbox, return 503 dependency_unavailable until real sandbox isolation exists, regardless of those flags.
- Never return ok:true success claiming an isolated deployment. Keep the checker pure and free of side effects.

Tests must verify the production flag rejection paths, production with no flags, and sandbox failure paths; every supported combination must fail closed. Follow existing contract/problem conventions.

No Terraform apply, cloud APIs, DB access, money operations, infra/terraform file changes, T-CORE-02, T-LEDGER-02, or executeCommand. No audit, alerts, or journals. This authorization covers only the three files and checker behavior above.
