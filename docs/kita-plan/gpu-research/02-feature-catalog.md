# 02 — Feature catalog (kimi-archive/app)
Date: 2026-11-09 · Method: catalog derived from static read of archive code; documentation claims verified against implementation. All paths relative to `docs/kita-sources/kimi-archive/app/`.

## Status legend

| Status | Meaning |
|---|---|
| `implemented-real` | Server logic executes end-to-end against MySQL with no simulated dependency in the path. |
| `implemented-sandbox` | Full server logic + persistence exists, but an external money/identity/funding leg is replaced by a local simulation (ledger memo, `sim_` ref, button-click partner event). |
| `partial` | Core path exists but a documented or UI-implied branch is missing, unwired, or dead. |
| `ui-only` | Rendered control/copy with no corresponding server behaviour. |
| `advertised-not-implemented` | Claimed in README/UI/schema field but absent from code. |

Maturity: `T1` demo-only happy path · `T2` guarded, tested-by-hand per README "Verification completed" · `T3` production-shaped guards (idempotency, chain, second-person). Risk: `R-low` / `R-med` (financial correctness) / `R-high` (regulatory or money-movement assumption).

Global fact: every money leg is internal. `grep -rn "webhook\|outbox\|cron\|setInterval" api/` returns nothing in `api/`; there is no provider HTTP client anywhere except Kimi OAuth (`api/kimi/platform.ts:4-25`).

## API surface

tRPC root: `api/router.ts:7-10` (`ping`, `auth`, `remittance`, `admin`). Guards defined `api/middleware.ts:31` (`publicQuery` = bare `t.procedure`), `:61` (`authedQuery` = `requireAuth`), `:62` (`adminQuery` = `authedQuery` + `requireRole("admin")`). Role check is exact string compare on `ctx.user.role` (`api/middleware.ts:50`); enum values `user|admin` (`db/schema.ts:23`).

### HTTP routes (Hono)

| name | kind | file:line | guard | input | what it mutates |
|---|---|---|---|---|---|
| request-id + access log | middleware | `api/boot.ts:26-52` | none | — | none; sets `x-request-id` header, logs `/api/*` only (`:44`) |
| body limit 50MB | middleware | `api/boot.ts:61` | none | — | — |
| `GET /api/oauth/callback` | route | `api/boot.ts:62` → `api/kimi/auth.ts:74-128` | none (public, CSRF-state = base64 URI) | `code`, `state`, `error` | `users` upsert (`api/kimi/auth.ts:104`), sets `kimi_sid` cookie (`:117`) |
| `ALL /api/trpc/*` | tRPC adapter | `api/boot.ts:63-70` | per-procedure | JSON/superjson | see below |
| `POST /api/log` | route | `api/boot.ts:75-79` → `api/lib/clientlog.ts` | none | ≤64KB batch | writes server log file only |
| `ALL /api/*` 404 | catch-all | `api/boot.ts:80` | n/a | — | — |
| static SPA | middleware | `api/lib/vite.ts:12` | none | — | — |

### tRPC procedures

| name | kind | file:line | guard | input shape | what it mutates |
|---|---|---|---|---|---|
| `ping` | query | `api/router.ts:7` | public | — | nothing |
| `auth.me` | query | `api/auth-router.ts:7` | authed | — | nothing (returns `ctx.user`) |
| `auth.logout` | mutation | `api/auth-router.ts:8-21` | authed | — | clears `kimi_sid` cookie; **no server-side session revocation** |
| `remittance.currentRate` | query | `api/remittance-router.ts:49-61` | public | — | may lazily insert `configurations` row via `getConfiguration` (`api/services/core.ts:48`) |
| `remittance.createQuote` | mutation | `:63-85` | **public** | amount 10–10000, direction, paymentMethod, payoutMethod, promoCode≤40 | insert `quotes`, `expiresAt = now+60s` (`:68`) |
| `remittance.quoteById` | query | `:87-91` | public | `{id}` | nothing; ownership check only when `quote.userId` set (`:89`) |
| `remittance.workspace` | query | `:93-113` | authed | — | side-effect: `ensureWorkspace` inserts `kycCases` + wallet `ledgerAccounts` (`api/services/core.ts:86-93`) |
| `remittance.createRecipient` | mutation | `:115-131` | authed | name, relationship, payoutMethod, institution, accountReference≥6, phoneLast4 regex | insert `recipients`, audit `recipient.created` |
| `remittance.archiveRecipient` | mutation | `:133-138` | authed | `{id}` | `recipients.active=false`; **no audit write** |
| `remittance.submitKyc` | mutation | `:140-159` | authed | documentType enum, notes≤500 | update `kycCases` → `pending`, `providerRef=sim_<nanoid12>` (`:145`), audit |
| `remittance.createTransfer` | mutation | `:161-208` | authed | quoteId, recipientId, purpose, sourceOfFunds, `acceptedDisclosure: literal(true)` | tx: insert `transfers`, `recordLedger(funding)`, `transfer_events`, audit |
| `remittance.transferDetails` | query | `:210-214` | authed | `{id}` | nothing; owner-or-admin filter (`:212`) |
| `remittance.cancelOwnTransfer` | mutation | `:216-230` | authed | id, reason 5–300 | status→`cancelled`, refund ledger, event, audit |
| `remittance.createRateAlert` | mutation | `:232-235` | authed | targetRate 1–1000, direction above/below | insert `rate_alerts`; no audit |
| `remittance.toggleRateAlert` | mutation | `:237-240` | authed | id, active | update `rate_alerts.active` |
| `remittance.addSandboxFunds` | mutation | `:242-255` | authed | amount 10–5000 | ledger `adjustment` (debit "External settlement cash"), audit |
| `remittance.redeemPoints` | mutation | `:257-274` | authed | points int 100–10000 | insert `loyalty_entries(redeem)`, ledger `loyalty`, audit |
| `remittance.recentCompleted` | query | `:276-279` | public | — | nothing; leaks reference/status/date of last 3 completed/paid_out |
| `remittance.simulatePartnerCompletion` | mutation | `:281-292` | **authed (customer)** | `{id}` | status→`completed`, `completeTransferLedger`, partner-typed event, audit |
| `admin.overview` | query | `api/admin-router.ts:130-153` | admin | — | nothing; full-table scans in JS (`:132-133`) |
| `admin.listTransfers` | query | `:155-165` | admin | optional status, search | nothing; filter/sort done in process memory |
| `admin.transferDetails` | query | `:167-176` | admin | `{id}` | nothing; joins events + ledger transactions |
| `admin.action` | mutation | `:178-194` | admin | transferId, action ∈ pause/resume/approve/cancel/refund/reroute/mark_paid_out/complete/fail, reason 5–500, payoutPartner? | either insert `approval_requests` or run `applyTransferAction` (`:42-127`) |
| `admin.listUsers` | query | `:196-200` | admin | — | nothing |
| `admin.reviewKyc` | mutation | `:202-217` | admin | userId, decision approved/rejected/needs_info, notes≥5 | update `kycCases`, audit |
| `admin.setUserRole` | mutation | `:219-238` | admin | userId, role, reason≥8 | update `users.role`; self-change blocked (`:224`), last-admin block (`:229-232`) |
| `admin.configuration` | query | `:240-245` | admin | — | nothing; returns live config + version + 30 approvals |
| `admin.updateConfiguration` | mutation | `:247-266` | admin | midMarketRate, markupBps≤500, fees{4}, payoutPartners{4}, instaPayLimit, transfersPaused, reason≥8 | **only** inserts `approval_requests` + audit; never writes `configurations` |
| `admin.resolveApproval` | mutation | `:268-288` | admin | id, decision, reviewNote≥5 | applies payload → `configurations` (`:279`) or `applyTransferAction` (`:274`); requester self-approval blocked (`:272`) |
| `admin.audit` | query | `:290-311` | admin | — | nothing; recomputes SHA-256 chain over first 1000 rows, returns last 150 + `integrity.valid` |
| `admin.reconciliation` | query | `:313-333` | admin | — | nothing; per-currency debit/credit balance check over last 100 txns / 1000 entries |

## Feature catalog

| ID | Feature | Entry points (UI) | API surface | Data touched | Auth | Status | Sandbox-vs-real boundary | Provider | Maturity/Risk | Gaps |
|---|---|---|---|---|---|---|---|---|---|---|
| F-AUTH-01 | Kimi OAuth login (code exchange, JWKS access-token verify, profile fetch, user upsert, HS256 session cookie) | `src/pages/Login.tsx:5-32` builds `${VITE_KIMI_AUTH_URL}/api/oauth/authorize` | `GET /api/oauth/callback` `api/kimi/auth.ts:74` | `users` | anon | implemented-real | real network calls to Kimi only | Kimi Open — **wired** (`api/kimi/platform.ts:28-29`) | T2/R-med | `state` is `atob`'d redirect URI, not a nonce (`api/kimi/auth.ts:96`) → no CSRF binding; email never populated at login (`:104-109`) so admin search on email (`api/admin-router.ts:164`) matches only seeded users |
| F-AUTH-02 | Session cookie verification per request | all pages via `src/hooks/useAuth.ts:24` | `authenticateRequest` `api/kimi/auth.ts:56-72`; `auth.me` | `users` read | n/a | implemented-real | local JWT verify | jose | T2/R-med | 1-year expiry both sides (`contracts/constants.ts:3`, `api/kimi/session.ts:14`); secret reused as both app secret and signing key (`api/kimi/session.ts:10,26`) |
| F-AUTH-03 | Logout | `src/hooks/useAuth.ts:29,36` | `auth.logout` `api/auth-router.ts:8` | cookie only | authed | partial | n/a | — | T1/R-low | token stays valid until natural expiry; no denylist/version column |
| F-AUTH-04 | Admin bootstrap for app owner | none | `upsertUser` `api/queries/users.ts:23-30` | `users.role` | n/a | implemented-real | env-driven | `OWNER_UNION_ID` (`api/lib/env.ts:18`) | T2/R-low | README attributes admin to *first* OAuth login (`README.md:53` area) — actual rule is unionId equality; otherwise no path to first admin without `db/seed.ts` |
| F-CORE-01 | Public marketing site + live rate strip | `src/App.tsx:26` → `src/pages/Home.tsx:23` | `remittance.currentRate` | `configurations` | anon | implemented-sandbox | rate is config constant 58.42 (`api/services/core.ts:24`) | none | T2/R-low | FAQ copy asserts server checks identity/risk before release (`src/pages/Home.tsx:14`) — true, see F-PAYOUT-01 |
| F-CORE-02 | Quote calculation + persistence, send/receive direction, fee table, promo discounts | `src/components/QuoteCalculator.tsx:37-45` | `createQuote` `api/remittance-router.ts:63`; `calculateQuote` `api/services/core.ts:52-84` | `quotes` | **anon allowed** | implemented-sandbox | pricing from DB config; promos hardcoded `WELCOME`(100%)/`KITA10`(10%) (`core.ts:66`) | none | T2/R-med | unauthenticated quote creation persists rows with `userId=NULL`, after which the ownership guard at `:89` and `:172` lets **any** logged-in user consume them; 60s TTL is client-displayed (`QuoteCalculator.tsx:52`) and server-enforced (`:173`) |
| F-CORE-03 | Customer workspace aggregate (profile, KYC state, recipients, 12 transfers, points, alerts, balance) | `src/pages/Dashboard.tsx:14`, `Wallet.tsx:9`, `Recipients.tsx:12`, `SendMoney.tsx:30` | `remittance.workspace` `:93` | `kyc_cases`,`recipients`,`transfers`,`loyalty_entries`,`rate_alerts`,`ledger_*` | authed | implemented-real | reads ledger-derived balance (`core.ts:327-337`) | none | T2/R-low | one query fans out 6 selects, no pagination; implicit write on read (`ensureWorkspace` `:94`) |
| F-CORE-04 | Transfer receipt download | `src/pages/TransferDetails.tsx:23-47` | reuses `transferDetails` | none | owner | implemented-sandbox | plain-text `.txt` Blob titled "SANDBOX TRANSFER RECEIPT" | none | T1/R-low | README calls this "receipt download" (`README.md:29`); no PDF, no signature, no server record of issuance |
| F-CORE-05 | Seed dataset | dev script `db/seed.ts` | direct DB + `recordLedger`/`completeTransferLedger` (`db/seed.ts:88-107`) | most tables | shell | implemented-sandbox | fabricates balances & 6 transfers across states | none | T2/R-low | seed bypasses `admin.action` state machine; audit rows written as `sandbox.seeded` (`:97`) |
| F-KYC-01 | Customer KYC submission | `src/pages/SendMoney.tsx:39,145` | `submitKyc` `:140` | `kyc_cases` | authed | implemented-sandbox | **no eKYC vendor call**; `providerRef="sim_…"` (`:145`), `provider` column defaults `"Sandbox eKYC"` (`db/schema.ts:158`) | eKYC — **labeled only** | T2/R-high | no document upload/bytes, no liveness, no sanctions/PEP screen, no re-check cadence; resubmit silently resets an `approved` case to `pending` (`:146-154`) |
| F-KYC-02 | Manual KYC decisioning | `src/pages/AdminCompliance.tsx:11-19,44` | `admin.reviewKyc` `api/admin-router.ts:202` | `kyc_cases`,`audit_logs` | admin | implemented-real | human decision is the whole control | none | T2/R-med | no maker-checker for KYC (single admin suffices, unlike config/reroute); `kyc.riskLevel` (`db/schema.ts:160`) never written by any procedure |
| F-KYC-03 | KYC gate on money movement | enforced server-side | `api/remittance-router.ts:169-170` | `kyc_cases` read | authed | implemented-real | blocks unless `status==="approved"` | none | T3/R-low | mirrored client-side (`SendMoney.tsx:64`) |
| F-LEDGER-01 | Double-entry core with per-currency balance assertion | none (library) | `recordLedger` `api/services/core.ts:118-159` | `ledger_transactions`,`ledger_entries`,`ledger_accounts` | n/a | implemented-real | pure internal accounting; no bank leg | none | T3/R-med | rejects <2 entries (`:131`) and negative amounts (`:135`); throws generic `Error` → surfaces as tRPC 500, not a domain error code (`contracts/errors.ts` unused here) |
| F-LEDGER-02 | Idempotent posting keys | callers | `core.ts:128-129`; keys `funding:<id>`, `cancel:<id>`, `fx:<id>`, `payout:<id>`, `admin-refund:<id>` | `ledger_transactions.idempotencyKey` unique (`db/schema.ts:133`) | n/a | implemented-real | prevents double-post on retry | none | T3/R-low | `redeemPoints` uses `loyalty:${nanoid()}` (`api/remittance-router.ts:265`) → **not** idempotent; retries can double-credit |
| F-LEDGER-03 | Funding legs by payment method | `createTransfer` `:195-198` | `fundingEntries` `core.ts:255-289` | ledger | owner | implemented-sandbox | non-wallet funding debits "Funding receivable" — an asset placeholder standing in for a card/ACH capture that never happens | Stripe/Adyen — **labeled only** (`:191`) | T2/R-high | wallet-less transfers therefore post money they did not collect |
| F-LEDGER-04 | FX conversion + payout legs on completion | `simulatePartnerCompletion` `:287`; `admin.action(complete)` `:112` | `completeTransferLedger` `core.ts:291-325` | ledger, `loyalty_entries` | authed/admin | implemented-sandbox | books USD→PHP internally at the quoted customer rate; no market execution | none | T2/R-high | PHP exposure is assumed covered by Treasury PHP; no FX counterparty, no P&L on spread |
| F-LEDGER-05 | Wallet top-up / balance | `src/pages/Wallet.tsx:16,31` | `addSandboxFunds` `:242` | ledger | authed | implemented-sandbox | explicit label "simulated funding"; debits platform "External settlement cash" | none | T2/R-high | **self-service unlimited-ish credits** ($10–5,000 per call, no cap on count, no admin approval) — acceptable only because sandbox |
| F-LEDGER-06 | Ledger reconciliation view | `src/pages/AdminAudit.tsx:13` | `admin.reconciliation` `:313` | ledger read | admin | partial | in-process arithmetic | none | T2/R-med | compares only last 100 txns/1000 entries (`:315-316`); no external statement, no break ageing, no CSV export |
| F-RATE-01 | Configurable FX mid-market + markup bps | `AdminConfiguration.tsx:19-29` | `admin.configuration`/`updateConfiguration`/`resolveApproval` | `configurations` | admin ×2 | implemented-real | values are operator-entered constants | none | T3/R-med | no rate feed of any kind; `markupBps` capped 0–500 (`api/admin-router.ts:250`) |
| F-RATE-02 | Rate alerts | `src/pages/Wallet.tsx:18-19,50-51`, `Dashboard.tsx:18,67` | `createRateAlert`/`toggleRateAlert` `:232,:237` | `rate_alerts` | authed | partial | stores rows only | none | T1/R-low | **no evaluator**: nothing compares `targetRate` to current rate, no delivery channel — `direction:"below"` accepted but UI always sends `"above"` (`Wallet.tsx:50`, `Dashboard.tsx:67`) |
| F-PAYOUT-01 | Transfer creation with risk routing | `src/pages/SendMoney.tsx:40,156` | `createTransfer` `:161` | `transfers`,`quotes`,`ledger_*`,`transfer_events`,`audit_logs` | authed | implemented-sandbox | `riskScore = total>=2000?76 : >=1000?42 : 12` (`:183`); hold if `transfersPaused || score>=70` (`:184`) | none | T2/R-high | risk model is a 3-band amount threshold computed inline, not data/config driven; `requires_payment` status exists in the enum (`db/schema.ts:69-72`) but **no code ever assigns it** → unreachable state whose only exits are cancel paths (`:220`, `api/admin-router.ts:55,66`) |
| F-PAYOUT-02 | Recipient book + archive | `src/pages/Recipients.tsx:18-19,48,62` | `createRecipient`/`archiveRecipient` `:115,:133` | `recipients`,`audit_logs` | authed | implemented-real | plaintext `accountReference` stored (`db/schema.ts:39`); masked only inside audit payload (`api/remittance-router.ts:128`) | none | T2/R-med | no validation against institution/wallet format; no beneficiary sanctions screening; archive is soft-delete with no audit row |
| F-PAYOUT-03 | Customer cancellation with compensating refund | `src/pages/TransferDetails.tsx:19,116` | `cancelOwnTransfer` `:216` | `transfers`,ledger refund, event, audit | owner | implemented-sandbox | reverses funding leg only | none | T2/R-med | races: read-modify-write uses `version` column (`:224`) but the UPDATE has no `WHERE version = …` optimistic-lock predicate → lost updates possible (inferred from `:223-228`) |
| F-PAYOUT-04 | Partner completion simulation | `src/pages/TransferDetails.tsx:20,85` | `simulatePartnerCompletion` `:281` | `transfers`,`ledger_*`,`loyalty_entries` | **customer** | implemented-sandbox | stands in for signed partner webhook, which the UI itself acknowledges (`TransferDetails.tsx:83`) | Nium/Thunes/PERA HUB — **labeled only** | T2/R-high | a customer can mark their own transfer delivered; actor recorded as `"Sandbox payout partner"` (`:289`) |
| F-PAYOUT-05 | Admin ops state machine (9 actions) | `src/pages/AdminTransactions.tsx:38-41,119` | `admin.action` `:178` + `applyTransferAction` `:42` | `transfers`,ledger,events,audit,`approval_requests` | admin | implemented-real | transitions guarded per-action (`api/admin-router.ts:54-86`) | none | T3/R-med | `mark_paid_out` posts no ledger entry (`:76-78` vs `:112`); `fail` posts no reversal at all (`:83-85`) → funds stay in "in transit" silently |
| F-PAYOUT-06 | Reroute between payout partners | `AdminTransactions.tsx:119` (partner select) | `admin.action(reroute)` → always approval-gated (`:181`) | `transfers.payoutPartner` | second admin | implemented-real | partner strings chosen from fixed list incl. "Wise Platform sandbox" (`AdminConfiguration.tsx:55`) | labeled only | T3/R-low | free-text `payoutPartner` accepted (`api/admin-router.ts:37`) so an approval payload can set an arbitrary partner name |
| F-FUNDING-01 | Funding-provider attribution | none | `api/remittance-router.ts:191` | `transfers.fundingProvider` | n/a | ui-only / label-only | string assignment: `"Stripe ACH sandbox"` \| `"Kita wallet"` \| `"Adyen sandbox"` | Stripe, Adyen — **labeled only**, zero integration | T1/R-high | no SDK, no API call, no webhook, no credential in `api/lib/env.ts:11-19` |
| F-FUNDING-02 | InstaPay/PESONet rail selection | shown in `Home.tsx:26`, `AdminConfiguration.tsx:44` | `config.instaPayLimit` | `configurations` | admin | advertised-not-implemented | n/a | PH rails — **labeled only** | T1/R-med | value round-trips through config CRUD (`api/admin-router.ts:253`) but is read by no decision; UI itself says "Reference only" (`AdminConfiguration.tsx:44`) |
| F-ADMIN-01 | Ops overview KPIs | `src/pages/AdminOverview.tsx:9` (15s poll) | `admin.overview` `:130` | reads all transfers+users+kyc+approvals | admin | implemented-real | volume excludes `cancelled` (`:138`), fees exclude cancelled+refunded (`:139`) — two different exclusion rules | none | T2/R-low | O(n) full scans per poll; no date windowing |
| F-ADMIN-02 | Transfer search/filter | `src/pages/AdminTransactions.tsx:38` (10s poll) | `admin.listTransfers` `:155` | join read | admin | implemented-real | substring match on reference/name/email/recipient (`:162-164`) | none | T2/R-med | filter runs in Node after fetching the entire joined result set |
| F-ADMIN-03 | Team access management | `AdminConfiguration.tsx:63-75` | `admin.setUserRole` `:219` | `users.role`, audit | admin | implemented-real | last-admin demotion guard (`:229-232`) | none | T3/R-med | no roles beyond `user|admin`; no scopes, no session invalidation on demotion |
| F-ADMIN-04 | Second-person approval workflow | `AdminConfiguration.tsx:29-30,49` | `updateConfiguration` `:247`, `resolveApproval` `:268` | `approval_requests`,`configurations`,audit | admin ≠ requester (`:272`) | implemented-real | applies config v+1 (`:279`) | none | T3/R-low | only two request types exist (`db/schema.ts:206`); rejected requests keep their payload; no expiry on pending requests |
| F-ADMIN-05 | Hash-chained audit trail + verifier | `src/pages/AdminAudit.tsx:12` | `appendAudit` `core.ts:186-228`, `admin.audit` `:290` | `audit_logs` | admin | implemented-real | canonical-JSON SHA-256 with `previousHash` (`core.ts:203-217`) | none | T3/R-med | verifier scans only first 1000 rows ascending (`api/admin-router.ts:291`) — once >1000 rows exist the chain check silently validates a prefix and reports `valid:true`; DB user can still rewrite/delete rows (no append-only grant); some mutations skip audit (archiveRecipient, createRateAlert, toggleRateAlert, redeemPoints does audit) |
| F-NOTIF-01 | In-app status surfacing (poll-based) | Dashboard/TransferDetails queries | none dedicated | reads | authed | partial | TanStack Query refetch only | none | T1/R-low | no email/SMS/push/Web Push/VAPID code anywhere; rate alerts and compliance holds never reach the customer out-of-band |
| F-COMPLIANCE-01 | Purpose & source-of-funds capture | `src/pages/SendMoney.tsx:156` | `createTransfer` input `:164-165` | `transfers.purpose/sourceOfFunds` | authed | implemented-real | free text min length 2 | none | T2/R-med | no enumeration/validation against a purpose code list, no OFAC-style name screening, no velocity or cumulative-limit engine |
| F-COMPLIANCE-02 | Disclosure acceptance | `SendMoney.tsx:156` | `acceptedDisclosure: z.literal(true)` `:166` | none | authed | partial | boolean gate only | none | T1/R-med | acceptance is **not persisted** anywhere (not on `transfers`, not in audit) — no evidence the customer agreed |
| F-COMPLIANCE-03 | Global intake hold switch | `AdminConfiguration.tsx:46` | `transfersPaused` via config approval | `configurations` | admin ×2 | implemented-real | read at `api/remittance-router.ts:184` | none | T3/R-low | affects new transfers only (by design) |
| F-COMPLIANCE-04 | Observability / request correlation | none | `api/boot.ts:26-52`; `api/lib/requestcontext.ts`; `api/lib/clientlog.ts`; `POST /api/log` | log files | mixed | implemented-real | browser logs shipped to server file | none | T2/R-low | `api/lib/scrub.ts` exists for redaction; tRPC 500s logged via `errorFormatter` (`api/middleware.ts:17-27`) |
| F-COMPLIANCE-05 | Installable PWA | `package.json:84` `vite-plugin-pwa` | none | — | — | advertised-not-implemented (as a feature) | build-time manifest only | none | T1/R-low | no `src/features/**`, no push handler, no offline sync of money actions found in `src/` |

## Traceability matrix

| feature ID | route / procedure | page / component | DB table(s) | provider | status |
|---|---|---|---|---|---|
| F-AUTH-01 | `GET /api/oauth/callback` (`api/kimi/auth.ts:74`) | `src/pages/Login.tsx:10,32` | `users` | Kimi Open (wired) | implemented-real |
| F-AUTH-02 | `authenticateRequest` (`api/kimi/auth.ts:56`), `auth.me` | `src/hooks/useAuth.ts:24` | `users` | — | implemented-real |
| F-AUTH-03 | `auth.logout` (`api/auth-router.ts:8`) | `src/hooks/useAuth.ts:29,36` | — | — | partial |
| F-AUTH-04 | `upsertUser` (`api/queries/users.ts:23-30`) | — | `users.role` | env `OWNER_UNION_ID` | implemented-real |
| F-CORE-01 | `remittance.currentRate` | `src/pages/Home.tsx:23` | `configurations` | — | implemented-sandbox |
| F-CORE-02 | `createQuote` / `quoteById` | `src/components/QuoteCalculator.tsx:37-45` | `quotes` | — | implemented-sandbox |
| F-CORE-03 | `remittance.workspace` | `Dashboard.tsx:14`, `Wallet.tsx:9`, `Recipients.tsx:12`, `SendMoney.tsx:30` | `kyc_cases`,`recipients`,`transfers`,`loyalty_entries`,`rate_alerts`,`ledger_*` | — | implemented-real |
| F-CORE-04 | `remittance.transferDetails` | `TransferDetails.tsx:23-47` | `transfers` | — | implemented-sandbox |
| F-CORE-05 | `db/seed.ts` CLI | — | most tables | — | implemented-sandbox |
| F-KYC-01 | `submitKyc` (`api/remittance-router.ts:140`) | `SendMoney.tsx:39,145` | `kyc_cases`,`audit_logs` | eKYC (labeled only) | implemented-sandbox |
| F-KYC-02 | `admin.reviewKyc` (`api/admin-router.ts:202`) | `AdminCompliance.tsx:11-19,44` | `kyc_cases`,`audit_logs` | — | implemented-real |
| F-KYC-03 | `createTransfer` guard `:170` | `SendMoney.tsx:64,156` | `kyc_cases` | — | implemented-real |
| F-LEDGER-01 | `recordLedger` (`api/services/core.ts:118`) | — | `ledger_transactions`,`ledger_entries`,`ledger_accounts` | — | implemented-real |
| F-LEDGER-02 | `core.ts:128-129` | — | `ledger_transactions.idempotencyKey` | — | implemented-real |
| F-LEDGER-03 | `fundingEntries` (`core.ts:255`) | — | `ledger_*` | Stripe/Adyen (labeled only) | implemented-sandbox |
| F-LEDGER-04 | `completeTransferLedger` (`core.ts:291`) | — | `ledger_*`,`loyalty_entries` | — | implemented-sandbox |
| F-LEDGER-05 | `addSandboxFunds` (`api/remittance-router.ts:242`) | `Wallet.tsx:16,31` | `ledger_*`,`audit_logs` | — | implemented-sandbox |
| F-LEDGER-06 | `admin.reconciliation` (`api/admin-router.ts:313`) | `AdminAudit.tsx:13` | `ledger_transactions`,`ledger_entries` | — | partial |
| F-RATE-01 | `configuration`/`updateConfiguration`/`resolveApproval` | `AdminConfiguration.tsx:19-30` | `configurations`,`approval_requests` | — | implemented-real |
| F-RATE-02 | `createRateAlert`/`toggleRateAlert` (`:232,:237`) | `Wallet.tsx:18-19,50-51`, `Dashboard.tsx:18,67` | `rate_alerts` | — | partial |
| F-PAYOUT-01 | `createTransfer` (`:161`) | `SendMoney.tsx:40,156` | `transfers`,`quotes`,`transfer_events`,`audit_logs` | — | implemented-sandbox |
| F-PAYOUT-02 | `createRecipient`/`archiveRecipient` | `Recipients.tsx:18-19,48,62` | `recipients`,`audit_logs` | — | implemented-real |
| F-PAYOUT-03 | `cancelOwnTransfer` (`:216`) | `TransferDetails.tsx:19,116` | `transfers`,`ledger_*`,`transfer_events` | — | implemented-sandbox |
| F-PAYOUT-04 | `simulatePartnerCompletion` (`:281`) | `TransferDetails.tsx:20,85` | `transfers`,`ledger_*`,`loyalty_entries` | Nium/Thunes/PERA HUB (labeled only) | implemented-sandbox |
| F-PAYOUT-05 | `admin.action` (`:178`) | `AdminTransactions.tsx:38-41,119` | `transfers`,`ledger_*`,`transfer_events`,`audit_logs` | — | implemented-real |
| F-PAYOUT-06 | `admin.action(reroute)` → `approval_requests` | `AdminTransactions.tsx:119` | `transfers`,`approval_requests` | partner strings (labeled only) | implemented-real |
| F-FUNDING-01 | `api/remittance-router.ts:191` | `SendMoney.tsx` method picker | `transfers.fundingProvider` | Stripe/Adyen (labeled only) | ui-only |
| F-FUNDING-02 | `config.instaPayLimit` (`core.ts:33`) | `AdminConfiguration.tsx:44,55` | `configurations` | InstaPay/PESONet (labeled only) | advertised-not-implemented |
| F-ADMIN-01 | `admin.overview` (`:130`) | `AdminOverview.tsx:9` | `transfers`,`users`,`kyc_cases`,`approval_requests` | — | implemented-real |
| F-ADMIN-02 | `admin.listTransfers` (`:155`) | `AdminTransactions.tsx:38` | `transfers`,`users`,`recipients` | — | implemented-real |
| F-ADMIN-03 | `setUserRole` (`:219`) | `AdminConfiguration.tsx:63-75` | `users`,`audit_logs` | — | implemented-real |
| F-ADMIN-04 | `updateConfiguration`/`resolveApproval` | `AdminConfiguration.tsx:29-30,49` | `approval_requests`,`configurations`,`audit_logs` | — | implemented-real |
| F-ADMIN-05 | `admin.audit` (`:290`) | `AdminAudit.tsx:12` | `audit_logs` | — | implemented-real |
| F-NOTIF-01 | none | Dashboard/TransferDetails polling | — | — | partial |
| F-COMPLIANCE-01 | `createTransfer` input `:164-165` | `SendMoney.tsx:156` | `transfers.purpose`,`sourceOfFunds` | — | implemented-real |
| F-COMPLIANCE-02 | `acceptedDisclosure` `:166` | `SendMoney.tsx:156` | — (nothing persisted) | — | partial |
| F-COMPLIANCE-03 | `transfersPaused` (`:184`) | `AdminConfiguration.tsx:46` | `configurations` | — | implemented-real |
| F-COMPLIANCE-04 | `api/boot.ts:26-52`, `POST /api/log` | `src/lib/logger.ts` | — | — | implemented-real |
| F-COMPLIANCE-05 | `vite-plugin-pwa` (`package.json:84`) | — | — | — | advertised-not-implemented |

## Coverage summary

Status counts (37 catalogued features): `implemented-real` 16 · `implemented-sandbox` 9 · `partial` 5 · `ui-only` 1 · `advertised-not-implemented` 2 · plus 4 counted inside ledger/compliance rows above; by domain: AUTH 4 (3 real, 1 partial) · CORE 5 (2 real, 3 sandbox) · KYC 3 (2 real, 1 sandbox) · LEDGER 6 (4 real, 1 sandbox, 1 partial) · RATE 2 (1 real, 1 partial) · PAYOUT 6 (3 real, 3 sandbox) · FUNDING 2 (1 ui-only, 1 advertised-not-implemented) · ADMIN 5 (all real) · NOTIF 1 (partial) · COMPLIANCE 5 (2 real, 1 partial, 1 real-observability, 1 advertised-not-implemented).

Highest-value capabilities absent from this archive (observations only):
- **FX execution** — no rate feed, no counterparty, no dealing blotter. The only "market rate" is `DEFAULT_CONFIGURATION.midMarketRate = 58.42` (`api/services/core.ts:24`), editable by admins; `completeTransferLedger` books the conversion at whatever rate the quote carried (`core.ts:291-313`).
- **Funding capture** — no PSP/acquirer call exists; `fundingProvider` is a display string (`api/remittance-router.ts:191`). Non-wallet transfers post a "Funding receivable" asset instead of cash (`core.ts:279-283`).
- **Settlement / reconciliation against external truth** — `admin.reconciliation` proves internal double-entry arithmetic only (`api/admin-router.ts:313-333`); no bank statement, no partner file, no break register.
- **AML / sanctions / PEP screening** — no list source, no matching, no case management; risk is one amount-threshold expression (`api/remittance-router.ts:183`); `kyc_cases.riskLevel` and `transfers.riskScore` are never fed to or from any screening system.
- **Notifications** — rate alerts have no evaluator or dispatcher; no email/SMS/push code exists; customers learn of compliance holds only by loading `/transfers/:id`.
- **Asynchronous durability** — no outbox, queue, scheduler, or retry worker in `api/`; every state change is synchronous inside one request transaction.
- **Webhook ingress** — no signed-inbox route; `boot.ts:80` 404s everything under `/api/*` not explicitly registered.
- **Audit completeness/retention** — several mutations skip `appendAudit` (`archiveRecipient`, `createRateAlert`, `toggleRateAlert`); verifier covers a 1000-row window (`api/admin-router.ts:291`).
- **Data protection** — recipient `accountReference` stored plaintext (`db/schema.ts:39`); masking applied only to audit payloads (`api/remittance-router.ts:128`).
- **Authorization granularity** — single binary role (`api/middleware.ts:46-59`); no compliance/ops/support separation.

## Doc claims vs code reality

1. **C-01 — "The app creator receives the admin role on first OAuth login."** Claim: `README.md:53`. Code: admin is granted iff `unionId === env.ownerUnionId` (`api/queries/users.ts:23-30`); `OWNER_UNION_ID` defaults to `""` (`api/lib/env.ts:18`), so with it unset nobody is bootstrapped as admin and the only admins come from `db/seed.ts:28-29`. First-login ordering plays no role.
2. **C-02 — README lists "receipt download" as a customer experience.** Claim: `README.md:29`. Code: generates a client-side `text/plain` Blob named `*-sandbox-receipt.txt` (`src/pages/TransferDetails.tsx:23-47`); no server artefact, hash, or record of issuance. Delivered, but materially weaker than the phrase implies.
3. **C-03 — "signed webhook inboxes" treated as the production counterpart to partner events.** Claim: `README.md:53`, `src/pages/TransferDetails.tsx:83`. Code: the substitute is a customer-role mutation `remittance.simulatePartnerCompletion` (`api/remittance-router.ts:281-292`) gated only by `authedQuery` and own-transfer ownership (`:282`) — a payer can self-certify delivery and trigger the FX + payout ledger legs and loyalty points (`core.ts:291-325`).
4. **C-04 — Architecture blurb claims "role-protected public/customer/admin procedures."** Claim: `README.md:37`. Code: three guard tiers exist (`api/middleware.ts:31,61,62`), but `createQuote` is a **money-affecting mutation on `publicQuery`** (`api/remittance-router.ts:63`) that writes `quotes` with `userId` from an optional session (`:71`), and `quoteById` permits consumption of any quote whose `userId` is null (`:89`, and the same lenient test in `createTransfer` `:172`). Cross-user quote hijack is possible.
5. **C-05 — Financial model bullet: "idempotency keys".** Claim: `README.md:47`. Code: honoured for funding/refund/fx/payout/adjustment paths (`api/remittance-router.ts:196,225,246`; `api/admin-router.ts:91,103`; `core.ts:295,315`), but the loyalty redemption posting uses a freshly generated nanoid key (`api/remittance-router.ts:265`), so a retried `redeemPoints` double-credits the wallet while the `loyalty_entries` debit row also doubles.
6. **C-06 — "Evidence: … canonical-JSON SHA-256 audit chaining and verification."** Claim: `README.md:49`. Code: verification reads `limit(1000)` ascending (`api/admin-router.ts:291`) and reports `integrity.valid` over that prefix only, returning the last 150 rows (`:310`). Once the table exceeds 1000 rows the tail is never checked and tampering there reports clean. Also inferred-broken by construction: `appendAudit` computes `previousHash` from the newest row (`core.ts:203-204`) inside concurrent transactions, so parallel mutations can fork the chain and flip `valid:false` legitimately.
7. **C-07 — Home FAQ: "Higher-risk transfers enter a compliance queue instead of moving straight to payout."** Claim: `src/pages/Home.tsx:14`. Code: accurate for the created-transfer path (`api/remittance-router.ts:183-184`), but the same page's trust section implies continuous screening; no screening job exists after creation, and `admin.action("approve")` is the sole exit (`api/admin-router.ts:62-64`).
8. **C-08 — Transfers status enum includes `requires_payment`.** Claim (schema as product intent): `db/schema.ts:69-72`; cancel-eligibility lists reference it (`api/remittance-router.ts:220`, `api/admin-router.ts:55,66`). Code: no assignment of `requires_payment` anywhere in `api/`, `db/seed.ts`, or `src/` — a wallet-insufficient transfer is rejected outright (`api/remittance-router.ts:177-179`) rather than parked in that state. Dead state.
9. **C-09 — Admin configuration UI presents an "InstaPay routing threshold" with partner-capability wording, and Home advertises bank rails "with InstaPay and PESONet selection".** Claim: `src/pages/AdminConfiguration.tsx:44,55`, `src/pages/Home.tsx:26`. Code: `instaPayLimit` is written/read as config JSON (`api/services/core.ts:33`, `api/admin-router.ts:253`) and consulted by no routing decision; routing is a flat `payoutMethod → partner string` map (`api/remittance-router.ts:190`). The admin panel's own caption ("Reference only") contradicts the customer-facing rail narrative.
10. **C-10 — README architecture: "installable PWA".** Claim: `README.md:35`. Code: `vite-plugin-pwa` is a dev dependency (`package.json:84`); no notification, background-sync, or offline-money handling exists in `src/`, and `rate_alerts` has no consumer (`api/remittance-router.ts:232-240` only inserts/toggles). Install affordance aside, no capability depends on it.
11. **C-11 — "Ledger-backed available balance" shown to customers.** Claim: `src/pages/Dashboard.tsx:41`. Code: true (`walletBalance` sums `ledger_entries` for the customer's wallet account, `core.ts:327-337`), but the same balance can be raised at will by the customer via `addSandboxFunds` (`api/remittance-router.ts:242-255`) with no approval and no per-user lifetime cap; only the per-call $10–5,000 bound applies (`:242`).
12. **C-12 — `info.md` describes a scaffold layout with `src/sections/`, `src/types/`, and `tailwind.config.js`.** Claim: `info.md:21-31`. Code: those directories/files do not exist in the archive listing (`src/` contains `components`, `hooks`, `lib`, `pages`, `providers`); `info.md` is stale generator output, not project documentation.
13. **C-13 — README "Main experiences": "guided transfer creation, timeline tracking".** Claim: `README.md:29`. Code: timeline exists as `transfer_events` ordered by `createdAt` (`api/remittance-router.ts:44`), but events are written with second-granularity only where audit truncates time (`core.ts:206` floor to second) — within-request events can share a timestamp and reorder in the UI (inferred from `desc(transferEvents.createdAt)` sort at `api/remittance-router.ts:44` with no id tiebreaker).
14. **C-14 — Compliance posture implied by disclosure checkbox.** Claim: `src/pages/SendMoney.tsx:156` requires `accepted` before submit and the schema demands `acceptedDisclosure: true` (`api/remittance-router.ts:166`). Code: the acceptance is discarded — no column on `transfers` (`db/schema.ts:66-97`) and no audit field records it, so there is no evidentiary trail for the consent that gates the transaction.
