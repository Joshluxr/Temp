# 03 — Sandbox & unsafe paths (kimi-archive/app)

Date: 2026-11-09 · Method: static read only; nothing executed, nothing deployed, no provider behaviour asserted. All paths relative to `docs/kita-sources/kimi-archive/app/`.

Consolidated from `_scratch/coder-03.md` (procedure-by-procedure mutation audit), `coder-06.md` (fabrication inventory), `coder-08.md` (ledger/money trace), `coder-13.md` (authZ findings F1–F13), `coder-18.md` (runtime entrypoint exposure), `coder-02.md` (customer procedures).

**Scope guard:** this document identifies unsafe paths. It does not implement fixes, does not choose a replacement design, and does not claim any listed sandbox substitute corresponds to a working external integration.

---

## 0. Headline verdicts

| # | Verdict | Proof |
|---|---|---|
| V1 | **Sandbox behaviour is nowhere env-gated.** Every "sandbox" mutation executes identically under `NODE_ENV=production`. | Complete env-branch inventory: `api/lib/env.ts:5` (presence check only), `:14` `isProduction` whose **only consumer** is `api/boot.ts:98` (whether to call `serve()`); `:18` `OWNER_UNION_ID`; `api/lib/logger.ts:30-31`; `api/boot.ts:103`; `src/pages/Login.tsx:5-6`; `drizzle.config.ts:4` (CLI-only). Nothing else in `api/` reads `env.isProduction`. (`coder-18 §3`) |
| V2 | The strings `"sandbox"` are **cosmetic labels**, never read as guards. | `metadata:{sandbox:true}` written at `api/remittance-router.ts:202` and `:117`; description literal `"Sandbox wallet top-up"` at `:248`; `"environment":"sandbox"` hardcoded const returned at `:59` and `api/admin-router.ts:151` regardless of mode. |
| V3 | An authenticated **customer can complete their own payout** and cause the FX + payout ledger legs and loyalty earn to post, with no money moved. | `api/remittance-router.ts:281-292` → `completeTransferLedger` (`api/services/core.ts:291-325`); audit row written with `actorType:"partner"` at `:288`. |
| V4 | An authenticated **customer can print money**: $10–$5,000 USD per call into their own wallet, unlimited calls. | `api/remittance-router.ts:242-255`; idempotency key deliberately randomized `wallet-funding:${nanoid()}` (`:246`), defeating the archive's only real duplicate control (`core.ts:128-130`). |
| V5 | Admin `complete` / `mark_paid_out` / `fail` **post no ledger** or post unconditionally on human click, so "delivered" is an opinion rather than an evidenced fact. | `api/admin-router.ts:76-78` (`mark_paid_out`) and `:83-85` (`fail`) write status + event only; `complete` path `:68-71,102-110` can double-pay when applied to an already-completed transfer. |
| V6 | There is **no webhook/callback receiver anywhere**, so the only ways a transfer can advance are a human admin click or the customer's own self-completion button. | grep `webhook\|outbox\|cron\|setInterval` over `api/` → zero server hits; `api/boot.ts:98-107` is the entire startup graph (`coder-18 §4`). |
| V7 | **No DELETE statement exists anywhere in `api/`/`db/`** — right-to-erasure cannot be honoured by this system as written. | Only `.delete(` occurrences are in-memory map evictions in `api/lib/clientlog.ts:53,59`; recipients are soft-flagged `active:false` (`api/remittance-router.ts:136`). (`coder-18 §6`) |

---

## 1. Reachable entry-point inventory (attack surface)

Router composition `api/router.ts:6-11` → `ping` + `auth` + `remittance` + `admin`. Guard tiers: `publicQuery` = bare `t.procedure` (`api/middleware.ts:31`), `authedQuery` (`:61`), `adminQuery` = `authedQuery` + exact-string `ctx.user.role === "admin"` (`:62`, `:50`).

**Total: 31 tRPC procedures (5 public, 14 customer, 12 admin) + 4 non-tRPC HTTP surfaces = 35 reachable entry points.**

### Non-tRPC HTTP surface

| Method/Path | Auth | Effect | file:line |
|---|---|---|---|
| `*` global middleware | none | mints `crypto.randomUUID()`, sets `x-request-id`, logs `/api/*` | `api/boot.ts:26-52` |
| `POST/GET /api/trpc/*` | per-procedure | 50 MiB `bodyLimit` | `api/boot.ts:61-70` |
| `GET /api/oauth/callback` | none (this *is* the login webhook) | code exchange; attacker-controlled `state` | `api/boot.ts:62` → `api/kimi/auth.ts:74-128` |
| `POST /api/log` | **none — public log sink** | appends attacker JSON lines to `/tmp/kimi-logs/app.log`; 64 KiB cap | `api/boot.ts:75-79`, `api/lib/clientlog.ts:130-182` |
| `ALL /api/*` | none | 404 JSON, registered before static | `api/boot.ts:80` |
| `*` static + SPA fallback | none | serves `dist/public`; prod-only | `api/lib/vite.ts:12-22` |
| `onError` | n/a | generic 500; stack to log only | `api/boot.ts:86-94` |

No health/readiness endpoint exists (grep `health` over `api/` → nothing); liveness oracle is the tRPC `ping` procedure (`api/router.ts:7`). No upload endpoints, no payment receivers.

### Public tier (no session)

| Procedure | Kind | file:line | Reachable effect |
|---|---|---|---|
| `ping` | query | `api/router.ts:7` | liveness |
| `remittance.currentRate` | query | `:49-61` | full pricing config: mid-market rate, markup bps, all fee tiers, partner names |
| `remittance.createQuote` | **mutation** | `:63-85` | unauthenticated INSERT into `quotes`; promo codes `WELCOME`/`KITA10` enumerated in the error message (`:66`); anonymous rows get `userId: undefined` |
| `remittance.quoteById` | query | `:87-91` | ownership test fires only `if (quote.userId && …)` (`:89`) → any null-owner quote readable forever |
| `remittance.recentCompleted` | query | `:276-279` | leaks transfer references `KT-YYMMDD-XXXXX` + completion timestamps |

### Customer tier (`authedQuery`)

`auth.me :7`, `auth.logout :8-21`, `workspace :93-113`, `createRecipient :115-131`, `archiveRecipient :133-138`, `submitKyc :140-159`, `createTransfer :161-208`, `transferDetails :210-214`, `cancelOwnTransfer :216-230`, `createRateAlert :232-235`, `toggleRateAlert :237-240`, **`addSandboxFunds :242-255`**, `redeemPoints :257-274`, **`simulatePartnerCompletion :281-292`**.

### Admin tier (`adminQuery`)

`overview :130-153`, `listTransfers :155-165`, `transferDetails :167-176`, **`action :178-194`** (→ `applyTransferAction :42-127`, 9 inline actions), `listUsers :196-200`, `reviewKyc :202-217`, `setUserRole :219-238`, `configuration :240-245`, `updateConfiguration :247-266`, `resolveApproval :268-288`, `audit :290-311`, `reconciliation :313-333`.

---

## 2. Sandbox money-manufacture paths (the four named routes)

### 2.1 `remittance.addSandboxFunds` — `api/remittance-router.ts:242-255`

- Guard: `authedQuery` only. No admin, no approval, no KYC-state requirement, no lifetime cap.
- Input bound: amount clamped to $10–$5,000 **per call** (`:242`); call count unbounded.
- Ledger effect: posts funding entries via `fundingEntries` (`core.ts:255-289`) against account `"External settlement cash"` with memo `"Sandbox wallet top-up"`.
- Duplicate control defeated: idempotency key is `wallet-funding:${nanoid()}` (`:246`) — freshly random on every request, so the dedupe SELECT at `core.ts:128` can never fire. Contrast the deterministic keys used elsewhere (`funding:${id}` `:196`, `cancel:${id}` `:225`).
- Production consequence: free customer balances indistinguishable in the journal from real pay-in activity, except by a text memo.

### 2.2 `remittance.simulatePartnerCompletion` — `api/remittance-router.ts:281-292`

- Guard: `authedQuery` + own-transfer ownership (`:282`). A payer — not a partner, not an admin — satisfies it.
- Effect: flips `transfers.status` to `completed`, calls `completeTransferLedger` (`core.ts:291-325`) which posts the FX conversion leg and the payout leg, and awards loyalty points.
- Audit forgery by construction: writes the row with `actorType:"partner"` and actor name `"Sandbox payout partner"` (`:288`), i.e. the integrity chain records a partner action that no partner performed. Any regulator-facing reconstruction built on this chain is materially false.
- Metadata label `{sandbox:true}` is written but never tested (`:202` precedent).
- Directly contradicts `docs/kita-plan/01-architecture.md:33` ("Raw provider callbacks authenticate at a dedicated ingress; client redirects are never evidence of payment").

### 2.3 `admin.action` — `api/admin-router.ts:178-194` → `applyTransferAction :42-127`

Nine actions behind one procedure (`pause`, `resume`, `approve`, `cancel`, `refund`, `reroute`, `mark_paid_out`, `complete`, `fail`). Per-action ledger behaviour (from `coder-03`/`coder-08`):

| Action | Lines | Status write | Event | Ledger | Approval required | Unsafe because |
|---|---|---|---|---|---|---|
| `pause` / `resume` | `:46-59` | `paused` ↔ `pausedFromStatus` | yes | none | no | `pausedFromStatus` is free-text varchar(32) (`db/schema.ts:76`); resume trusts it, no state-machine validation |
| `approve` | `:60-64` | out of `compliance_review` | yes | none | no | sole exit from the compliance queue, single signature |
| `cancel` | `:65-67` | `cancelled` | yes | refund leg only if funded | no | does not reverse a prior payout leg |
| `refund` | `:68-71` | `refunded` | yes | posts refund (`:102-110`) | only if `total ≥ 1000` (`needsApproval :181`) | applicable to an already-`completed` transfer → **double-pays** |
| `reroute` | `:72-75` | — | yes | none | **yes** (`:181`) | the only other gated action |
| `mark_paid_out` | `:76-78` | `paid_out` | yes | **none** | no | marks money as externally delivered with zero journal evidence |
| `complete` | `:79-82` | `completed` | yes | unconditional `completeTransferLedger` | no | "delivered" asserted by a click, not by a callback or reconciliation |
| `fail` | `:83-85` | `failed` | yes | **none** | no | a funded transfer can be failed without returning the customer's money to available balance |
| (unlisted) | `:86-127` | — | — | — | — | fallthrough returns success-shaped response for unknown verbs |

`needsApproval :181` covers **2 of 9** actions (`(refund && total>=1000) || reroute`), so four-eyes governance exists but does not touch payout release, failure marking, or paid-out marking — the three highest-consequence transitions.

### 2.4 Fake-provider accounting baked into persisted columns

- `api/remittance-router.ts:191`: `fundingProvider` recorded as the literal `"Stripe ACH sandbox"` or `"Adyen sandbox"` chosen by branch, not by any integration.
- `api/services/core.ts:27-32`: `DEFAULT_CONFIGURATION` partners `"Nium sandbox"`, `"Thunes sandbox"`, `"PERA HUB sandbox"`.
- `api/remittance-router.ts:145`: KYC `providerRef = "sim_${nanoid(12)}"`; `db/schema.ts:158`: `kycCases.provider` default `"Sandbox eKYC"`.
- These values are stored in the same columns production reporting would read, so downstream reports silently inherit placeholder provenance.

---

## 3. Full fabrication inventory (coder-06, 9 classes)

| Class | Where | Nature |
|---|---|---|
| Wallet funding | `remittance-router.ts:242-255` | free money, random idem key |
| Partner completion | `remittance-router.ts:281-292` | customer-triggered delivery + `actorType:"partner"` audit |
| Funding providers | `remittance-router.ts:191` | `"Stripe ACH sandbox"` / `"Adyen sandbox"` string literals persisted |
| eKYC | `remittance-router.ts:145`, `schema.ts:158` | `sim_` ref, self-asserted document type, no document upload path |
| Rate source | `services/core.ts:23-35` | configured `midMarketRate: 58.42` + `markupBps: 55`; no live feed, no snapshot table |
| Promo codes | `services/core.ts:66` | `WELCOME` / `KITA10` hardcoded in the router-level quote math |
| Loyalty redemption | `remittance-router.ts:257-274` | points→USD credit with `loyalty:${nanoid()}` (`:265`) — retried calls double-credit |
| Environment claim | `remittance-router.ts:59`, `admin-router.ts:151` | `"environment":"sandbox"` constant returned even in prod |
| Seed state | `db/seed.ts:27-31,63-68,104-109` | deterministic ids `demo-*`/`seed-transfer-001..006`, known starting balances; CLI-only, not HTTP-reachable (grep `seed` in `api/`, scripts, vite/drizzle configs → zero hits) |

---

## 4. Correctness defects on the money path (independent of sandbox labels)

| ID | Defect | Evidence | Why unsafe |
|---|---|---|---|
| D1 | Float money arithmetic despite `decimal(20,2)` storage | `services/core.ts:41-42` (`money = value.toFixed(2)`, `round = Math.round((v+EPSILON)*100)/100`); `Number(entry.amount)` throughout `recordLedger` | sub-cent drift × volume = unreconcilable breaks |
| D2 | Balance check outside the transaction (TOCTOU overdraft) | `remittance-router.ts:177-179` (`walletBalance(...) < Number(quote.total)`) vs tx start at `:184` | concurrent transfers can both pass the check and spend beyond balance |
| D3 | Zero row locks | grep `FOR UPDATE` over `api/` → nothing | no serialization point for any posting |
| D4 | `version` column decorative | written at `remittance-router.ts:224,286`; columns `schema.ts:89,199`; **never appears in a WHERE predicate** | lost updates on cancel/complete |
| D5 | Account create-or-get race | `core.ts:105-114` | duplicate accounts under concurrency; unique index `ledger_account_unique(ownerType,ownerId,name,currency)` (`schema.ts:125`) has a NULL-distinctness gap |
| D6 | Audit chain head read unlocked | `core.ts:199-204` computes `previousHash` from newest row inside concurrent transactions; `createdAt` floored to seconds (`:201,206`) | chain forks legitimately → `valid:false` noise, and within-request events can reorder in the UI (`remittance-router.ts:44` sorts `desc(createdAt)` with no id tiebreaker) |
| D7 | Verification window truncation | `admin-router.ts:291` `limit(1000)` ascending then `slice(-150)` at `:310` | tampering past row 1000 reports clean |
| D8 | Deterministic idem keys suppress legitimate repeats | `funding:${transferId}` `:196`, `cancel:${id}` `:225` | a genuine second funding/refund silently returns the first result → missing posting |
| D9 | No API-boundary idempotency | `createTransfer` input schema `:161-167` accepts no client key | any retry duplicates money movement |
| D10 | Fraud scoring is 3 static amount bands | `remittance-router.ts:182` | trivially evaded below the threshold; no velocity/device/screening signal |
| D11 | Reconciliation is a bounded float sum | `admin-router.ts:313-333`: capped at 100 txns / 1000 entries, float accumulation, `0.001` epsilon | breaks invisible above the cap; not a 3-way reconciliation |
| D12 | Config applied unvalidated | `admin-router.ts:279` writes approval payload straight into configuration JSON | arbitrary pricing/partner values reach quote math (`core.ts:44-50`, which also self-heals by INSERT) |

---

## 5. Authorization / privilege findings (coder-13 F-series, reconciled)

| Finding | Verdict | Evidence |
|---|---|---|
| Is admin enforced server-side? | **Yes.** `adminQuery` requires role from the DB user row. | `api/middleware.ts:50,62`; role loaded by `authenticateRequest` (`api/kimi/auth.ts:56-72`) via `api/context.ts:16` |
| Is the client-side admin gate a security control? | **No — cosmetic.** | `src/components/AppShell.tsx:33` hides nav only; route table `src/App.tsx:22-42` has no guard element |
| Self-demote / last-admin protection present | Yes | `admin-router.ts:224` blocks self-demote, `:229-232` blocks removing the last admin |
| Four-eyes coverage | Partial — 2 of 9 actions | `admin-router.ts:181`; requester-cannot-approve-own at `:272` |
| Money-moving procedures unauthenticated | Yes: `createQuote` (mutation), `quoteById`, `recentCompleted`, `currentRate` | `remittance-router.ts:63,87,276,49` on `publicQuery` |
| OAuth CSRF/PKCE | Absent; `state` decoded with `atob` and used as `redirect_uri` | `api/kimi/auth.ts:96-97`; no stored nonce, no `code_verifier` |
| Session key confusion | HS256 signed with `APP_SECRET`, the same value used as the OAuth `client_secret` | `api/kimi/session.ts:10-15`; `api/lib/env.ts:13`; `api/kimi/auth.ts:23` |
| Session revocability | None: 1-year expiry, no denylist; logout clears cookie only | `session.ts:14-15`; `api/auth-router.ts:8-21` |
| Error leakage to clients | `errorFormatter` returns `shape` unchanged → raw messages + stacks in prod | `api/middleware.ts:17-27` (tRPC v11 gates these behind `isDev` only when no custom formatter is supplied); raw `Error`s thrown at `core.ts:131,141` |
| Log injection | Public sink keyed by spoofable `cf-connecting-ip`/`x-forwarded-for` | `api/lib/clientlog.ts:153-155`; caps at `:21-33` |
| PII scrubbing gaps | No PAN / account-number / government-ID / unionId rules | `api/lib/scrub.ts:14-19` |
| Plaintext PII persistence | `recipients.accountReference varchar(255)` | `db/schema.ts:39`; display masks last-4 (`remittance-router.ts:124`) but the row stays plaintext |

---

## 6. Missing runtime machinery that makes the unsafe paths the *only* paths

Absent entirely from the archive (verified by targeted greps, `coder-18 §4`, `coder-06`, `coder-09`): transactional outbox / inbox, `provider_attempts`, holds/reservations, saga/workflow persistence, leases/fencing, timers/sweeps, sanctions screening, FX rate snapshots, reconciliation batches/break taxonomy/suspense, webhook signature verification, rate limiting (only `bodyLimit` on `/api/log`), pagination, error boundaries, notification dispatch, tests.

Consequences stated in the archive itself: expired quotes (`quotes.expiresAt` 60 s TTL, `remittance-router.ts:68`) are never swept, so the unauthenticated `createQuote` endpoint grows the table unboundedly; `rate_alerts` is a dead table (inserted `:233`, listed `:101`, toggled `:238`, never compared to any rate); a production transfer would sit in `processing` forever absent a human click. `README.md:53` acknowledges the missing asynchronous outbox/worker and signed webhook inboxes as external dependencies.

---

## 7. Remediation *classes* (identified, not implemented)

Per the coordinator brief ("Provider gaps are external dependencies with gates"), each unsafe path maps to a class of remedy plus an external dependency gate. No class below is implemented in this batch.

| Path | Class | Gate |
|---|---|---|
| `addSandboxFunds`, `simulatePartnerCompletion`, `redeemPoints` random key | Remove from the production route table entirely (feature-flagged at the router mount, not merely hidden in UI) | DEP-03/DEP-04 real pay-in & payout contracts |
| `admin.action` `complete` / `mark_paid_out` / `fail` | Replace click-driven status writes with callback/reconciliation-derived state transitions under four-eyes | DEP-04 partner evidence + DEP-02 ops sign-off |
| Fake provider strings | Move provenance to a capability registry populated only from verified contract artifacts | DEP-01/DEP-04 |
| `sim_` KYC refs, `Sandbox eKYC` default | Require a real vendor reference before approval; add document storage policy | DEP-01/DEP-07 |
| Configured `midMarketRate` | Snapshot-per-quote with source attribution; block quote creation when feed age exceeds limit | DEP-04 FX provider |
| D1–D4 float/lock/version | Integer minor units + real locking + enforced compare-and-set | DEP-05 data-layer decision |
| D8/D9 idempotency | Boundary-level key table with retained responses; business-event + attempt-generation keys internally | DEP-05/DEP-06 |
| OAuth/session (F-series) | Server-issued single-use `state`, PKCE, distinct session key set, short TTL + revocation | DEP-06 security review |
| Error/log leakage | Sanitizing formatter; scrubber extension; authenticated or removed `/api/log` | DEP-06 |
| Missing deletion path | Retention schedule + erasure job with lawful-basis register | DEP-07 legal/DPO |

Blocking precondition for any migration work (from `coder-19`): gate **M0** requires disabling `simulatePartnerCompletion`, `addSandboxFunds`, and admin `complete` / `mark_paid_out` / `fail` / `reroute` before target-state cutover, because those paths write journal rows that no external truth supports.
