# Kita CI Branch Policy (T-PLAT-01 / kita-ci-branches)

Scope: the Kita slice in `apps/kita` only. This document describes which branches
run which checks and what must be green before a Kita change lands on `main`.

Authoritative sources:
- `.github/workflows/kita-ci.yml` in this workspace (`apps/kita/.github/workflows/kita-ci.yml`) —
  the Kita CI lane itself, including its header comments with the hard constraints.
- [`WORKSPACE.md`](../../../WORKSPACE.md), "Kita slice (apps/kita)" section — the isolation rules.
- [`docs/kita-plan/SOL-REVIEW.md`](../../../docs/kita-plan/SOL-REVIEW.md) — the review gate
  (`CONDITIONAL-PASS`, second batch only after Sol re-review).
- [`docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md`](../../../docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md) and
  [`FORBIDDEN.md`](./FORBIDDEN.md) — the outcome-manufacturing register the guard enforces.

## 1. Branch model

| Branch | Role | Kita CI trigger |
| --- | --- | --- |
| `main` | Reviewed trunk. Only merges that passed every required check below. | `push` + `pull_request` |
| `kita/<task>` | Feature branch named after one backlog id, e.g. `kita/T-PLAT-03`, `kita/TEST-PLAT-02`. Short-lived; opened from `main`, merged back by PR. | `push` (glob `kita/**`) + `pull_request` |
| swarm integration branch (currently `dong`) | Batch-swarm integration branch that accumulates coder lanes before they are reviewed into `main`. | `push` + `pull_request` |
| tags `kita-v*` | Release-ish markers for the Kita workspace; **no publish job exists**, tagging only re-runs validation. | `push` |

Two rules keep this predictable:

1. **Feature branches run exactly the PR jobs.** `push.branches` covers `main`, `kita/**` and the
   swarm branch, so a push to `kita/T-PLAT-03` gets the same lint/typecheck/test/build + guard run
   that the eventual PR into `main` would get. Nothing is "first validated at merge time".
2. **PRs are filtered by path, not by branch.** `pull_request` carries no `branches:` filter, so any
   PR whose diff touches `apps/kita/**` runs this lane whatever its base branch is (PRs between two
   feature branches included). The `paths: [apps/kita/**]` filter is what scopes the lane — it never
   fires for security-product-only changes.

`workflow_dispatch` is available for a manual rerun of the identical lane. It adds no capability:
there is nothing deployable to reach.

## 2. Required checks before merge into `main`

All of the following must be green in `apps/kita/.github/workflows/kita-ci.yml` (job `kita`, which
runs with `working-directory: apps/kita` — installs and scripts are never executed from the repo
root, per WORKSPACE.md):

1. `npm ci` in `apps/kita` (independent npm workspace; root install is prohibited).
2. Guard: `node scripts/guard-no-outcome-manufacturing.mjs` — fail-closed scan for the forbidden
   production endpoints (`addSandboxFunds`, `simulatePartnerCompletion`, admin `complete`/`fail`,
   `mark_paid_out`, fake-KYC/live-provider money paths). Metric:
   `prohibited_runtime_reference_count` must stay 0 outside denylist/comment occurrences.
3. Guard: no cloud/managed DB hostname and no `postgres(ql)://` DSN outside the isolated loopback
   test clusters (`:54339` `kita_core_test`, `:55432` `kita_plan_test`).
4. Guard: this workflow stays deploy-free, and no root workflow may reference Kita.
5. `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` — each fan-out script runs
   `npm run --workspaces --if-present <script>` over `apps/*` and `packages/*`.

A merge into `main` additionally requires that the same checks were already green on the source
`kita/<task>` branch push (branch parity above), so no check is first-seen in the merge queue.

## 3. Sol-review gate

Per `docs/kita-plan/SOL-REVIEW.md`, batch 1 is **CONDITIONAL-PASS**: green CI is necessary but not
sufficient. A Kita PR into `main` also needs a human Sol review of the scaffold against the
SOL-REVIEW conditions (refund FX rounding must not independently round cost and spread above the
refunded principal; OpenAPI vs `13-backlog.md` method/path mismatches frozen in one contract before
payout/funding workers are written). **A second batch starts only after Sol re-reviews the
scaffold** — merging more Kita code without that re-review is out of policy even if every check
above passes.

## 4. Kita CI can never publish or deploy

Hard, mechanically enforced rule:

- `permissions: contents: read` — the minimum. No `id-token: write`, no `packages: write`, no
  `contents: write`.
- No `environment:`, no `secrets.*`, no OIDC role assumption, no registry login, no artifact upload,
  no deploy/rollback/release step anywhere in the file. Every job here is validation only.
- The third guard step greps this workflow for `environment`, `id-token: write` and
  `packages: write` and fails the build if any appear, and greps the repository-root workflows for
  `kita` so the security product's production CI cannot be wired to this slice either way.
- The repository-root `.github/workflows/ci.yml` belongs to the t3mp3st security product and is the
  repo's only production target. Kita work must never modify it (WORKSPACE.md "Kita slice" bullet:
  the security product at the repository root remains the only production target of this repo).
- Money rule inherited from batch 1: no real money, no fake KYC, no sandbox balance imported as live
  cash (T-PLAT-02 / TEST-PLAT-02). Publishing or deploying from this lane would violate that rule by
  construction, which is why the lane has no path to do it.

If a future task genuinely needs deployment, it must be a separate workflow with its own review,
its own permissions, and an explicit operator decision — not an edit to this file.
