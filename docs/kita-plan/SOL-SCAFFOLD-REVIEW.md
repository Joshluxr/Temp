CONDITIONAL-PASS

- apps/kita is T-PLAT-01/02 scaffold only. money.ts has no posting/arithmetic for refunds. migrate/migrate-core refuse sandbox import. command-recovery is GET-only. No addSandboxFunds/simulatePartnerCompletion function implementations found.
- FAIL items to fix next Qoder batch: pnpm-lock.yaml missing; tests/features/test-plat-01.spec.ts missing (partial test-plat-02 under packages/database); docker-compose.test.yml missing; CI workflow lives under apps/kita/.github not repo .github; CI grep of addSandboxFunds in comments will false-fail.
- Money-path coding MUST NOT start. R1 freeze exists. T-CORE-02/T-LEDGER-02 not implemented. Production NOT APPROVED.
