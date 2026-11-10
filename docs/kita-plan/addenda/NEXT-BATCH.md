BATCH-HOLD

Money closed. Never `ok:true`. No live pilot, launch, production activation, live traffic, bank/provider calls, money movement or G1-G6 closure.

Baseline: `d43cea13f46cf4ab521333f46a679a026eb2675b` (`d43cea1`, PR #122). The LIMITED PURE `checkLaunchEvidence` checker is implemented. Full T-GA-01 remains HOLD. The leftover LIMITED PURE boolean checkers are exhausted, including CORE-01/02, FIN-01, LEDGER-02, REWARD-01, LIVE-01, GA-01 and the earlier feature IDs. Their refusal tests establish bounded checker behavior; they do not establish production readiness, persistence, verified identity, command execution or release evidence. Do not select another checker, rename an existing checker, add more blocker flags or wrap several checkers as the next batch.

This rewrite supersedes the completed GA-01 checker authorization in the previous NEXT-BATCH.md. It preserves [T-CORE-02-BATCH.md](T-CORE-02-BATCH.md), all other addenda, existing implementations and prior bounded review results. It neither reopens T-CORE-02 nor closes any full task.

Implementation allowlist: `[]` — empty. No implementation, migration, test, contract, export, configuration, dependency, runtime wiring or generated artifact is authorized. The only permitted edit in this turn is `docs/kita-plan/addenda/NEXT-BATCH.md`. Existing untracked files are outside this work. No coding swarm, database execution, provider exercise, merge or deployment starts from this document.

No implementation BATCH-OK is issued at this baseline: executeCommand/money remains HOLD, so the requested HOLD fallback applies. The next useful engineering direction is a separately bounded **non-money command-key persistence slice**, with an exact storage contract and real PostgreSQL permission, replay, concurrency and crash tests. It would advance durable infrastructure beyond supplied booleans. It is a candidate for a later scope decision, not an authorized implementation batch here.

The current [T-CORE-02 addendum](T-CORE-02-BATCH.md) says “Do not start T-CORE-02” and gives the reason “executeCommand would touch money_operations.” The earlier sessions/contacts schema-only slice is already present in the identity migration; it grants no session-binding authority. The [identity review](../SOL-IDENTITY-REVIEW.md) explicitly retains the T-CORE-02 HOLD. The current request does not lift executeCommand/money HOLD and requires this fallback while it persists.

A command-key table can be used without moving money in principle. The existing table alone does not establish a safe, scoped store. Likewise, a session is security authority even when it changes no balance. “No KYC success” does not supply authenticated ownership, single-use OIDC/PKCE evidence, safe token rotation or durable command atomicity. Do not replace missing authority with client assertions, a fabricated identity, an in-memory store or a success result.

The exact source boundaries inspected are below. All paths are existing repository files cited as evidence; they authorize no edits.

| Existing file | Current behavior and boundary |
|---|---|
| `apps/kita/packages/database/migrations/001_core.sql` | Already defines `command_keys`: unique `(book_id, actor_id, operation, key)`, request hash, state, optional resource and JSON response. The table accepts generic operation text and states including `succeeded`; that shape is not a restriction to non-money commands. Runtime roles have no generic table writes; API/worker command-key read/write grants and scoped command functions are absent here. Do not recreate the table, edit this existing migration or broaden grants to make a store work. |
| `apps/kita/packages/contracts/src/commands.ts` | Contains the command envelope/receipt, operation registry, key rules and canonical JSON helper. These are not a durable store, authenticated context, atomic executor or proof of safe replay. No private operation or money authority may be inferred from them. |
| `apps/kita/packages/database/src/transaction.ts` | Provides serializable transaction machinery and bounded retries. It supplies no actor/book authorization or command semantics. Do not turn a generic callback into an unrestricted domain executor. |
| `apps/kita/packages/database/migrations/004_identity_access.sql` | Adds identity-support DDL without implementing runtime session binding or command authority. Another schema-only copy would not complete the missing lifecycle. |
| `apps/kita/packages/domain/identity/session-store.ts` | `bindSession` is an unavailable gate; its local CommandContext is opaque and unused. It creates no session and mints, rotates or revokes no token. Preserve that behavior. |
| `apps/kita/packages/contracts/src/auth.ts` | Identity/session types and an unavailable helper do not verify IdP evidence or implement token effects. Preserve the failure boundary and prohibit KYC success. |
| `apps/kita/packages/platform/check-durable-command-evidence.ts` | Classifies supplied blockers and refuses the all-clear input. It does not implement `executeCommand`, response recovery, ownership, holds, limits or atomic persistence. |
| `apps/kita/packages/platform/check-launch-evidence.ts` | The landed LIMITED GA-01 checker refuses every input. It supplies no pilot, launch or G1-G6 authority. |

The proposed full-task `002_command_authority.sql`, `command-authority.ts`, `executeCommand` and `authorizeDispatch` in [T-CORE-02](../13-backlog.md#t-core-02--implement-durable-commands-operations-subject-holds-limit-buckets-and-non-transfer-financial-work-identities) remain outside the batch. Do not create partial executors, callable placeholders, generic reducers or dispatch permits under those names.

A later non-money proposal would have to freeze and prove the following requirements. They authorize no files or test execution now. No exact implementation file set is approved at this baseline.

1. **A specific non-money operation and trusted scope.** Freeze the exact operation, server-established actor/book binding, allowed record fields and storage effects. No caller-selected role, arbitrary operation name, financial payload, generic response JSON or arbitrary execution callback. Decide explicitly whether the slice records refusals only; never represent a durable write or replay as business success. `executeCommand`, session creation and money commands remain disabled. A `void` return, alternate result shape or renamed success flag must not bypass the never-`ok:true` boundary.
2. **An additive storage boundary.** Identify exact new migration/source/test paths in a later reviewed allowlist; preserve frozen SQL and existing migrations. Use the existing `command_keys` identity only if the new restriction can be enforced for every reachable path. Freeze immutable scope/hash fields, canonicalization and hash version, key validation, conflict errors, stored refusal shape and retention. Do not add a second competing idempotency table or accept existing arbitrary responses as safe evidence.
3. **Scoped database authority.** Specify the actual restricted runtime role and narrow SQL entry points, search path and authenticated context. Enforce actor/book/operation isolation in the database. No owner/superuser runtime, broad table grants, trust in caller-set session variables or path to financial functions. Restrict writes to the explicitly approved non-money records; no reads or writes of `money_operations`, transfers, attempts, holds, limit/liquidity reservations, ledger, balances, points or provider state.
4. **Durability and failure semantics.** Freeze how identical same-key requests recover the original permitted refusal, changed payload/scope conflicts, concurrent contenders converge and retries preserve one identity. Define behavior before/after commit and on lost commit acknowledgment. A timeout must not authorize a fresh key, clear an unresolved key, invent a committed result or rerun a side effect. Keep any approved record changes and refusal result atomic. No HTTP/RPC, provider call or irreversible external effect inside a transaction.
5. **Session binding stays out of this first candidate.** Preserve the unavailable gate, all identity/KYC pending states and disabled money capabilities. A later session-specific proposal must separately prove verified issuer/audience/subject, nonce/PKCE/challenge single use, expiry, customer/book/device ownership, HMAC-only secret lookup, rotation/reuse detection and revocation. A supplied `verified` Boolean or synthetic successful session cannot substitute for that work.

The future test design must exercise actual persistence rather than enumerate blocker flags:

| Required future test | Observable requirement |
|---|---|
| Restricted-role and ownership isolation | Real PostgreSQL runtime connections cannot read/replay another actor/book/operation's record or invoke an unapproved command. Actual SQL statements fail where forbidden; owner-only success and catalog inspection are insufficient. |
| Same-key replay and mismatch | Independent connections and process restart recover the same permitted refusal; changed canonical payload conflicts without overwriting the original identity, hash, state or result. Malformed keys/hashes and unsupported operations are rejected before a write. |
| Concurrent contention | At least 100 synchronized contenders for one scoped key yield one durable permitted result, with deterministic mismatch handling and no duplicate effects. Reproducible barriers must exercise lock acquisition and commit. |
| Crash and commit faults | Rollback before commit leaves no partial key/result; a committed record survives restart and lost acknowledgment; serialization/deadlock retries and exhaustion preserve identity and do not report an unproven commit. |
| Financial and identity isolation | Test SQL is limited to approved non-money records. A restricted test role has no financial access; independent permission and query observations verify no financial SQL or mutation. No active session/token, verified contact/instrument, KYC approval, command receipt granting execution or dispatch permit is created or returned. |
| Existing refusal regressions | Preserve the current session unavailable behavior and all landed LIMITED checkers, including GA-01 and CORE-02. No new success path, runtime wiring or capability activation. |

Use an isolated PostgreSQL environment with explicit test bindings and independent connections. Existing database tests include opt-in PostgreSQL cases; default mock/static runs and skipped cases cannot establish this evidence. A future proposal must identify exact test paths, harness/migration compatibility and runnable commands before BATCH-OK. It must report exact base/head, full diff, actual-role logs, failures and skips. No new tests or PostgreSQL runs are authorized by this HOLD document.

The remaining full-task HOLDs are listed below. Existing limited implementations and conditional subset reviews remain recorded. None of these full production-task acceptance holds is cleared by a checker, its tests or this rewrite.

| Full task | Remaining requirement |
|---|---|
| T-CORE-01 | Target/API and server/client boundaries, safe bindings, actual-role isolation, transaction lifecycle and independent current execution evidence. Existing pool helpers/exports and mock tests do not close full runtime acceptance. |
| T-CORE-02 | Durable scoped commands and recovery, real stores, immutable intent, atomic command/state/event/outbox/audit, subject holds, limits, parent ownership, fenced dispatch and real-role concurrency/crash proof. `executeCommand` and money remain HOLD. |
| T-IDENTITY-01 | Real sessions/contacts/instruments/consent/access stores, verified identity/provider evidence, ownership and token lifecycle. No KYC success. |
| T-FIN-01 | Working immutable balanced ledger and independent reconstruction/reconciliation with actual-role enforcement. A supplied-evidence checker is not posting or a journal store. |
| T-LEDGER-02 | Approved typed templates, evidence/policy/period enforcement, correction/allocation limits and Controller-reviewed real-engine evidence. |
| T-REWARD-01 | Conserved paired points, lots/reservations/reversal caps and the Finance-approved provision bridge; no points posting or money by implication. |
| T-ADAPTER-01 | Authenticated provider transport/evidence, immutable references, unknown-outcome handling and scoped contract proof. |
| T-SCOPE-01, T-BASE-01, T-CONTRACT-01, T-MIG-01 | Remaining source/crosswalk, reproducible workspace, coherent contract/typecheck and complete migration/isolation evidence. Retain prior bounded passes; no full-target completeness claim. |
| T-DEPEND-01 | Actual applicable entity/country/state/product/provider permissions, signed owner evidence, expiry/renewal controls and dependency closure. |
| T-INTEGRATE-01, T-RELEASE-01 | Connected implementation and exact-artifact coverage, independent execution evidence and review. No release verdict. |
| T-CERT-01 | Actual chosen provider/account/method sandbox and native/device certification and independent reconciliation. |
| T-LIVE-01 | Separately authorized, capped actual pilot and independently reconciled movements, remedies, daily close and late-return controls. No pilot is authorized. |
| T-GA-01 | Current exact-artifact evidence, reconciled pilot, signed scope, operational/capital/security/legal readiness and staged exposure approval. No launch is authorized. |

Connected full-feature acceptance also remains HOLD for the earlier families: **T-PUB-01–06, T-AUTH-01–07, T-KYC-01–07, T-REC-01–04, T-QUOTE-01–08, T-TX-01–10, T-FUND-01–07, T-PAY-01–06, T-WAL-01–06, T-GROW-01–09, T-ADM-01–12, T-FIN-02–08, T-PLAT-01–10 and T-EXT-01–04**. A reviewed UI, scaffold, schema, type or PURE refusal subset retains only its stated limited scope.

All unclosed CP-00–11 gaps, applicable PACK/REQ-SC/TEST obligations and DEP-00–15 conditions remain unclosed. In particular, preserve DEP-00/CP-00 original-spec limitations, CP-01 identity, CP-02/03 command authority, CP-04 ledger, CP-05/10 contract coherence, CP-07 rewards, CP-11 connected runtime acceptance, Finance P1/DEP-08 and actual PostgreSQL/DEP-15 proof. No skipped database test, existing package diagnostic or missing external approval becomes a waiver.

**G1-G6 cannot close without real stores, implemented and independently verified money workflows, actual provider evidence and, for the later stages, a separately authorized and reconciled live pilot.** The [L9 release stages](../12-tests-gates.md#l9-six-sequential-release-stages) remain unclosed:

- G1 needs complete connected in-scope code and coherent frozen contracts.
- G2 needs real-database, race/fault/security/recovery evidence and independent financial verification.
- G3 needs actual provider sandbox and device certification.
- G4 needs separate signed live-pilot authorization, legal/provider approvals, funded assets/reserves, limits, staffing and stop controls.
- G5 needs the actual pilot's independent bank/provider/ledger reconciliation and remedy/late-return evidence.
- G6 needs current exact-artifact approvals, signed launch scope and operational readiness.

These requirements describe remaining work; they authorize none of it. US-PH scope cannot inherit another market/product's permission, and internal tests cannot replace legal/commercial approvals or a real pilot. Current money closure prevents the money/pilot work required for later closure. This document grants no G1-G6 pass, production-ready claim or instruction to start that work.

This turn performs documentation checks only: first-line HOLD, empty implementation allowlist, valid local references, whitespace and a diff confined to NEXT-BATCH.md. No application, database, provider, build or typecheck results are asserted.

Stop with BATCH-HOLD. Do not dispatch Qoder or manufacture a follow-on checker. A later concrete scope decision would be required before a non-money persistence implementation could receive BATCH-OK; it would not reopen money or close the full T-CORE-02 task. Future authorized work must retain the operator roles: Astra/xhigh planning, Sol/max directing and independent review, GPU Qoder Efficient implementation and coordinator GitHub handling. No merge or deployment is authorized here.
