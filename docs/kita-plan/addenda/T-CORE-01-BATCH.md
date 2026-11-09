BATCH-OK

# T-CORE-01: Qoder Efficient coding batch

## Objective and execution

Implement only the database pool, serializable transaction helper, runtime
binding validation, and fail-closed API bootstrap described below. This batch
does not authorize starting T-CORE-02 or T-LEDGER-02.

The coordinator syncs the repository to GPU `gpu-fqaf` and routes this batch
through `~/.coordinator/run-batch.sh`. Product code is implemented there by
Qoder CLI using `Efficient` Agent Teams/subagents. Bundle/download the result
to the VM for review by Codex `gpt-6.1-sol` at `max` effort. Failed review returns
to Qoder as a scoped fix batch. Cursor Grok coordinates routing, synchronization,
and GitHub operations only. This document authorizes implementation and review;
it does not request a merge or deployment.

## Allowed files

- `apps/kita/packages/database/src/pool.ts`
- `apps/kita/packages/database/src/transaction.ts`
- `apps/kita/packages/config/runtime.ts`, or the equivalent existing runtime
  binding module under `apps/kita/packages/platform/`. Choose one location;
  do not create competing configuration layers.
- The existing/conventional main entry under `apps/kita/apps/api/`, implemented
  as a minimal bootstrap stub.
- Focused tests for these modules, with only the minimal exports or test wiring
  necessary to run them using existing repository conventions.

Do not broaden this into a package reorganization, schema/migration change,
dependency upgrade, or unrelated configuration cleanup. If a missing prerequisite
requires substantive work outside this scope, report the concrete blocker.

## Required implementation

### Pool ownership and isolation

Expose an explicit pool factory that receives validated configuration and can
be tested with an injected/mock driver. Avoid import-time connections, hidden
global pools, mutable process-wide binding caches, or implicit database URLs.
Each factory instance owns its pool and lifecycle; creating or closing one
must not change another instance's configuration or connections. Expose explicit
shutdown behavior and keep credentials out of logs and errors.

### `withSerializable`

- Accept a pool and an async callback receiving a transaction-scoped client.
  Check out one client per attempt. Use that same client for `BEGIN`, all
  callback SQL, `COMMIT`, and any necessary `ROLLBACK`.
- Start each attempt at PostgreSQL `SERIALIZABLE` isolation before executing
  callback queries. Return the callback result only after successful commit.
- Retry SQLSTATE `40001` (serialization failure) and `40P01` (deadlock), including
  errors raised by `COMMIT`. Inspect the driver's structured error code; do not
  infer retryability from message text. Propagate other errors without retrying.
- Use a finite attempt budget: default three total attempts, including the
  initial attempt. Validate any exposed override as a positive finite integer.
  When exhausted, throw the final transaction error with its code/cause intact.
- On a failed attempt, attempt rollback when a transaction may be active and
  always release the client exactly once. A cleanup failure must not replace
  the primary transaction error. Discard unusable clients according to the
  driver's API. Acquire a fresh checkout and rerun the full callback on retry.
- Release the failed attempt's client before bounded backoff. No backoff may
  hold an open transaction. Make any timing dependency deterministic in tests.
- Document that callbacks may execute multiple times. A callback may perform
  transaction SQL only: no HTTP/RPC calls, external-service requests, emails,
  queue publishing, or other irreversible side effects. The transaction's own
  database connection is the necessary transport; no other network work is
  permitted inside the transaction.

### Runtime bindings and API stub

Keep runtime binding validation explicit and independently testable. Require a
nonempty, non-whitespace `DATABASE_URL`; provide no development, localhost,
in-memory, sandbox, or test fallback in production code. Validate all bindings
actually required by this stub before constructing a pool or opening a listener.

The API main must fail closed when a required binding is absent: produce a
clear diagnostic naming the missing binding without exposing secret values,
and terminate startup unsuccessfully. It must not start a server, advertise
readiness, create a database connection, or fabricate bindings on this path.
With valid bindings, keep bootstrap minimal and dependency-explicit. Importing
the configuration/database modules must not itself start the application.

## Hard scope boundaries

- No journal posting or ledger mutation APIs.
- No refunds or refund orchestration.
- No `addSandboxFunds` implementation, export, endpoint, or call.
- No network/service side effects within transaction callbacks.
- No T-CORE-02 or T-LEDGER-02 implementation, scaffolding, or placeholder APIs.

## Required tests and acceptance gates

Use existing test tooling and mock database clients; these tests must not require
a running database or external network access.

1. **Pool isolation mock:** create pools A and B with distinct bindings. Assert
   their driver construction/configuration and client ownership stay separate;
   using or closing A must not redirect, mutate, release, or close B.
2. **Fail-closed missing `DATABASE_URL`:** cover absent, empty, and whitespace
   values. Assert startup fails with a useful sanitized diagnostic before pool
   construction, database connection, listener startup, or readiness publication.
   Also verify a valid binding passes validation.
3. **Transaction lifecycle:** assert serializable begin, callback queries, commit,
   result delivery after commit, and exactly-once client release. Cover rollback
   and propagation for a non-retryable callback error.
4. **Retry behavior:** exercise both `40001` and `40P01`, including a commit-time
   failure. Assert rollback/release precedes another checkout, the callback runs
   again, and eventual success returns the successful attempt's result. Verify
   the finite attempt limit and propagation of the final error on exhaustion.
5. **Cleanup failure:** verify rollback failure preserves the original error and
   causes the unusable client to be discarded without leaking its checkout.

Run the focused tests and the existing applicable typecheck/lint/build commands
for affected packages. Inspect the final diff for scope and prohibited side
effects. Do not add infrastructure or begin another task to make a check pass;
report any pre-existing or environment-related failure precisely.

## Handoff and stop condition

Return the implementation bundle/commit reference, changed-file list, checks run
with results, and any blockers to the VM reviewer. The reviewer checks ownership
isolation, retry/cleanup correctness, fail-closed startup, and scope compliance.
Return defects to Qoder for correction and re-review the updated head. Stop when
T-CORE-01 passes review; do not start T-CORE-02 or T-LEDGER-02.
