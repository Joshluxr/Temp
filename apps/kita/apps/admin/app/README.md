# @kita/admin — placeholder (T-PLAT-01, Sol CONDITIONAL-PASS batch 1)

This app is a disabled placeholder scaffold only. It renders static text and a
list of actions that are intentionally unimplemented because they are FORBIDDEN
IN PRODUCTION per `docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md`:

- `addSandboxFunds`
- `simulatePartnerCompletion`
- admin transfer `complete` / `fail` / `mark_paid_out`

There are no buttons that mutate anything, no API imports, and no tRPC wiring.

Status: pending Sol re-review before any second-batch work. Role-based access
control and any real admin operations (the T-ADM tasks) are out of batch-1
scope and must not be added here until approved.
