# Completeness pass — plan wiring and explicit gaps

Assessment time: **2026-11-09T21:03:23.438307+00:00**. This pass checks the current on-disk planning artifacts, including concurrent additions; it does not attest application implementation or readiness to move money.

**Planning coverage confirmed: all104 `KITA-*` feature IDs and all39 archive `F-*` IDs currently listed in [02-traceability-matrix.md](02-traceability-matrix.md) appear below.** Each production feature has a named UI/API or internal entry, handler, storage intent, task and acceptance test. **Runtime wiring remains a gap for every feature (CP-11)** until implemented and tested. Original user-spec conformance remains **blocked by DEP-00/CP-00**. No release gate is marked passed by this report.

## 1. Checked deliverables and limits

| Artifact | Checked planning result |
|---|---|
| [Tests and gates](12-tests-gates.md) | REQ-SC-01–REQ-SC-21 cover every scenario in the current request; each has DB, ledger, provider, UI and audit expectations. All104 feature TEST IDs are registered; six release stages G1–G6 are explicit in L9. Existing M01–M104 and SC-01–SC-56 catalogs remain intact and retain their meanings. |
| [Backlog](13-backlog.md) | 120 tasks:104 feature tasks plus16 shared/integration/release tasks. Every task specifies objective, role, estimate, dependencies, create/change/remove files, signatures, I/O/errors, DB, tests, observability, rollback and evidence. Principal full-stack architect owns integration; contract freeze precedes parallel implementation. |
| [Traceability](02-traceability-matrix.md) | All104 matrix IDs, operations, handlers, storage and TEST/T IDs carried forward; source/provider/activation annex retained as the scope reference;39 archive IDs crosswalked without pretending they are the missing original spec IDs. |
| [OpenAPI](openapi/kita-v1.yaml) | Current snapshot has114 distinct operations. Every primary or supplemental operation is assigned in M; this is ownership coverage, not generated-client/runtime validation. |
| [Core SQL](sql/001_core.sql) | Read-only inspection recognizes current money_operations, auth/instrument/mandate, wallet quote, limit, period and servicing tables. Domain authority and execution evidence remain gaps below. No SQL was changed or executed in this task. |
| [README](README.md) | Index links the requested deliverables; source/approval limits remain explicit. |

Checks actually performed by this pass: parse the feature matrix and OpenAPI; compare exact ID sets; check task fields and dependency references; verify all114 operation names have task ownership; inspect all21 scenario blocks for five outcome oracles; resolve local links/anchors; hash the checked inputs and detect changes during validation. These are documentation/structural checks. No product tests, full generated-client build, DB migration, provider transaction, penetration test, live deployment or GitHub publication was performed.

The only workspace deliverables authored by this session are12,13,COMPLETENESS-PASS and the README index. Other sessions changed protected source documents, SQL, OpenAPI and evidence while this work was active; this session did not write or revert those files. The final snapshot below identifies what was reviewed. A future edit invalidates affected structural conclusions and gate evidence.

## 2. Gap register and closure ownership

“PLAN WIRED” below confirms the explicit design chain; “GAP” names work still required before that chain may be called implemented. CP-00 and CP-11 apply globally, even when omitted from an individual row. CP-10 requires a coherent contract freeze; no permission is requested to alter protected files in this task.

| Gap | Finding | Affected scope | Owner / task | Closure evidence |
|---|---|---|---|---|
| CP-00 | Original user-spec source and original feature IDs unavailable; archive F IDs do not close DEP-00. | All original-spec conformance claims | T-SCOPE-01 / Product/coordinator | Restore/hash original; map all original requirements/scenarios, review delta without renumbering stable IDs. |
| CP-01 | Session/contact/instrument tables now exist; complete and prove auth/device/refresh/mandate lifecycle, effective approvals and cross-object ownership. | AUTH; FUND-01; sensitive admin/mobile access | T-IDENTITY-01, T-AUTH-01–07, T-FUND-01 / Identity + Security | Runtime token/revocation/device/hosted-instrument tests, REQ-SC-14/15/16; signed IdP/SDK bindings. |
| CP-02 | Core holds still require transfer_id. Customer recovery/re-KYC, wallet operation and route/global controls need a frozen explicit subject-scope model and shared dispatch lock proof. | AUTH-04; KYC-02/05/06; ADM-03/12; PAY-01; wallet spending | T-CORE-02, T-ADM-03/12 / architect + Compliance | Supplemental subject hold contract/migration, scope FKs, both hold/dispatch interleavings, REQ-SC-04/05. |
| CP-03 | money_operations, wallet_quotes, attempts/refunds/reservations exist. Their command layer, response recovery, immutable intent/economic-event dedup, safe parent binding and one-authority lifecycle need execution evidence. | TX/FUND/PAY/WAL and treasury/automation commands | T-CORE-02, T-PLAT-03/04/05 / financial backend | Scoped command functions, current authority guards, all crash boundaries, REQ-SC-01–05/17/20. No fake remittance parent. |
| CP-04 | Core posting/period checks are an invariant foundation; approved economic templates, active evidence/policy, period nonoverlap/close and cumulative allocation guards still need implementation and Controller proof. | FIN; refunds/disputes; funding short/excess; wallet; treasury | T-LEDGER-02, T-FIN-01–08 / Controller | E4–E11 plus short/excess/net settlements, exact template/account assertions, real-role runtime tests, REQ-SC-07–12/19. |
| CP-05 | Every current API operation has planned ownership; generated clients, runtime validators, controllers/read projections, events, shared lock order and typed internal task inputs/outputs are still future work. | All HTTP and worker features | T-CONTRACT-01, T-PLAT-01, T-INTEGRATE-01 / architect | Freeze114 operation contracts plus worker ports; compile web/native clients; backward compatibility, IDOR and connected end-to-end tests. |
| CP-06 | Case messages/notification preferences/attempts and FX allocations exist; complete restricted filing/assignment, signed document/receipt/export access, report jobs, legal calendars and allocation command controls. | KYC-03/07; TX-04/07–09; ADM-02/09/11; GROW-07–09; FIN-03/06/07 | T-IDENTITY-01 and named feature owners / Ops + Security + Finance | Immutable receipt/clock, correct projection/ACL, document expiry, report as-of/CSV escaping, signed close/archive evidence. |
| CP-07 | Point events/lots/campaign tables are not proof of conserved units or atomic entitlement. Paired posting, FIFO/expiry/reversal, caps and financial provision bridge remain to implement. | GROW-01–04/09 | T-REWARD-01 and GROW tasks / Finance + growth engineer | P1 approved policy, REQ-SC-18 concurrent budget/lot/expiry tests and independently reconciled points/provision statements. |
| CP-08 | Extension storage and API shells need full product contracts, domain workflows and activation evidence, including mandate bounds, biller proof, KYB/signatory authority and custody asset/finality policy. | TX-10; PAY-04/06; WAL; GROW-06; EXT-02–04 | Feature owners + T-DEPEND-01 / Product, counsel, Treasury | PACK-AUTOMATION/PROVIDER, exact mandate/asset/item schemas, REQ-SC-13/18; applicable DEP-08/11/12 and capability-specific gates. |
| CP-09 | No provider/public documentation alone proves Kita commercial authority, production outcome semantics, real opening capital or country/product permission. | Every live financial/identity/messaging capability; EXT-01 | T-DEPEND-01, T-CERT-01 / accountable owners in N | Current entity/account/method evidence, DEP approvals, actual sandbox statements and signed capped live pilot before enablement. |
| CP-10 | Concurrent plan revisions changed source bytes during this session. Preserve protected files; reconcile any stale prose/anchors and re-freeze one coherent snapshot before coding. Earlier F persistence prose said some tables were absent; E13/current SQL now include them. | Contract/schema/prose consistency and all gate evidence | T-CONTRACT-01, T-RELEASE-01 / architect + Sol | Recheck current snapshot hashes, schema/prose/generator agreement and local anchors; no older PASS reused after a change. |
| CP-11 | No application implementation, DB execution, actual provider certification, physical-device/security/load/restore run or live pilot is certified by this document. | All104 production feature IDs | T-INTEGRATE-01, T-CERT-01, T-LIVE-01, T-GA-01 / QA + gate signers | Execute and retain L1 evidence through G1–G6; DEP-15 for real PostgreSQL. Structural documentation checks alone cannot close this gap. |

## 3. Every production feature ID

The chain column states the concrete plan wiring. Worker handlers shown beside read operations are internal reducers; the HTTP read returns their projection and cannot invoke a payment. Admin authorization inherits I's permission matrix and the feature-specific controls in B/M; no generic admin role substitutes for them. Every row also inherits CP-00 and CP-11.

| Feature ID | Planned UI / API → domain / storage | Task / acceptance evidence | Disposition |
|---|---|---|---|
| `KITA-PUB-01` | `/` / `getContent` → `publishContent` → `policies` | `T-PUB-01` / `TEST-PUB-01` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-PUB-02` | `/` / `createEstimate` → `estimateQuote` → `policies` | `T-PUB-02` / `TEST-PUB-02` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-PUB-03` | `/locations` / `listCorridors` → `listCapabilities` → `capabilities` | `T-PUB-03` / `TEST-PUB-03` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-PUB-04` | `/fees` / `listPayoutOptions` → `describeDelivery` → `capabilities`, `policies` | `T-PUB-04` / `TEST-PUB-04` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-PUB-05` | `all customer screens` / `getContent` → `resolveLocale` → `receipts`, `policies` | `T-PUB-05` / `TEST-PUB-05` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-PUB-06` | `all clients` / internal worker/control → `applyKitaTokens` → `none` | `T-PUB-06` / `TEST-PUB-06` | PLAN WIRED; GAP CP-05, CP-11 |
| `KITA-AUTH-01` | `/signup` / `createContactVerification` → `verifyContact` → `customers` | `T-AUTH-01` / `TEST-AUTH-01` | PLAN WIRED; GAP CP-01, CP-05 |
| `KITA-AUTH-02` | `/login` / `logout` → `revokeSession` → `customers` | `T-AUTH-02` / `TEST-AUTH-02` | PLAN WIRED; GAP CP-01, CP-05 |
| `KITA-AUTH-03` | `/profile/security` / `createStepUp` → `requireStepUp` → `consents` | `T-AUTH-03` / `TEST-AUTH-03` | PLAN WIRED; GAP CP-01, CP-05 |
| `KITA-AUTH-04` | `/recovery` / `startRecovery` → `recoverAccount` → `cases`, `holds` | `T-AUTH-04` / `TEST-AUTH-04` | PLAN WIRED; GAP CP-01, CP-02 |
| `KITA-AUTH-05` | `/profile/devices` / `listSessions` → `listSessions` → `customers` | `T-AUTH-05` / `TEST-AUTH-05` | PLAN WIRED; GAP CP-01, CP-05 |
| `KITA-AUTH-06` | `/profile` / `requestClosure` → `requestClosure` → `customers`, `cases` | `T-AUTH-06` / `TEST-AUTH-06` | PLAN WIRED; GAP CP-01, CP-05 |
| `KITA-AUTH-07` | `mobile login` / `createMobileSession` → `exchangeMobileCode` → `customers` | `T-AUTH-07` / `TEST-AUTH-07` | PLAN WIRED; GAP CP-01, CP-09 |
| `KITA-KYC-01` | `/verification` / `createIdentitySession` → `startIdentity` → `identity_decisions`, `documents` | `T-KYC-01` / `TEST-KYC-01` | PLAN WIRED; GAP CP-02, CP-06, CP-09 |
| `KITA-KYC-02` | `/verification` / `getIdentityStatus` → `applyIdentityEvidence` → `identity_decisions` | `T-KYC-02` / `TEST-KYC-02` | PLAN WIRED; GAP CP-02, CP-06, CP-09 |
| `KITA-KYC-03` | `/verification` / `createDocumentUpload` → `quarantineUpload` → `documents`, `cases` | `T-KYC-03` / `TEST-KYC-03` | PLAN WIRED; GAP CP-02, CP-06, CP-09 |
| `KITA-KYC-04` | `admin/compliance` / `createScreeningReview` → `evaluateScreening` → `screenings`, `cases` | `T-KYC-04` / `TEST-KYC-04` | PLAN WIRED; GAP CP-02, CP-06, CP-09 |
| `KITA-KYC-05` | `admin/compliance` / internal worker/control → `rescreenDelta` → `screenings`, `holds` | `T-KYC-05` / `TEST-KYC-05` | PLAN WIRED; GAP CP-02, CP-06, CP-09 |
| `KITA-KYC-06` | `admin/risk` / `createRiskDecision` → `evaluateRisk` → `policies`, `cases` | `T-KYC-06` / `TEST-KYC-06` | PLAN WIRED; GAP CP-02, CP-06, CP-09 |
| `KITA-KYC-07` | `admin/aml` / `recordRegulatoryFiling` → `recordFiling` → `cases`, `documents` | `T-KYC-07` / `TEST-KYC-07` | PLAN WIRED; GAP CP-02, CP-06, CP-09 |
| `KITA-REC-01` | `/recipients` / `createRecipient` → `createRecipient` → `recipients`, `recipient_versions` | `T-REC-01` / `TEST-REC-01` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-REC-02` | `/recipients` / `createRecipientVersion` → `validateWalletRecipient` → `recipient_versions` | `T-REC-02` / `TEST-REC-02` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-REC-03` | `/recipients` / `archiveRecipient` → `archiveRecipient` → `recipients`, `recipient_versions` | `T-REC-03` / `TEST-REC-03` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-REC-04` | `/home` / `createDraft` → `repeatTransfer` → `drafts`, `recipient_versions` | `T-REC-04` / `TEST-REC-04` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-QUOTE-01` | `/send` / `createQuote` → `buildQuote` → `quotes` | `T-QUOTE-01` / `TEST-QUOTE-01` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-QUOTE-02` | `/send` / `createQuote` → `solveReceive` → `quotes` | `T-QUOTE-02` / `TEST-QUOTE-02` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-QUOTE-03` | `/send` / `createQuote` → `priceFees` → `policies`, `quotes` | `T-QUOTE-03` / `TEST-QUOTE-03` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-QUOTE-04` | `/send` / `createQuote` → `validateRate` → `quotes`, `evidence` | `T-QUOTE-04` / `TEST-QUOTE-04` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-QUOTE-05` | `/send/review` / `acceptTransfer` → `acceptQuote` → `quotes`, `transfers` | `T-QUOTE-05` / `TEST-QUOTE-05` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-QUOTE-06` | `/transfers/[id]` / `getTransfer` → `reserveFxExposure` → `quotes`, `liquidity_reservations` | `T-QUOTE-06` / `TEST-QUOTE-06` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-QUOTE-07` | `/send/review` / `createQuote` → `renderQuoteTerms` → `quotes`, `consents` | `T-QUOTE-07` / `TEST-QUOTE-07` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-QUOTE-08` | `/send` / `updateDraft` → `saveDraft` → `drafts` | `T-QUOTE-08` / `TEST-QUOTE-08` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-TX-01` | `/send/review` / `acceptTransfer` → `acceptTransfer` → `command_keys`, `transfers` | `T-TX-01` / `TEST-TX-01` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-TX-02` | `/transfers/[id]` / `streamTransferEvents` → `deriveCustomerStatus` → `transfer_events`, `provider_attempts` | `T-TX-02` / `TEST-TX-02` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-TX-03` | `/activity` / `listTransfers` → `listTransfers` → `transfers` | `T-TX-03` / `TEST-TX-03` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-TX-04` | `/transfers/[id]` / `getReceipt` → `renderReceipt` → `receipts`, `documents`, `consents` | `T-TX-04` / `TEST-TX-04` | PLAN WIRED; GAP CP-05, CP-06 |
| `KITA-TX-05` | `/transfers/[id]` / `requestCancellation` → `requestCancellation` → `cases`, `holds` | `T-TX-05` / `TEST-TX-05` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-TX-06` | `/transfers/[id]` / `requestRefund` → `authorizeRefund` → `refund_obligations`, `refund_allocations` | `T-TX-06` / `TEST-TX-06` | PLAN WIRED; GAP CP-03, CP-04, CP-05 |
| `KITA-TX-07` | `/support` / `createErrorClaim` → `openErrorClaim` → `cases`, `documents` | `T-TX-07` / `TEST-TX-07` | PLAN WIRED; GAP CP-06, CP-09 |
| `KITA-TX-08` | `/support` / `createSupportMessage` → `appendSupportMessage` → `cases`, `documents` | `T-TX-08` / `TEST-TX-08` | PLAN WIRED; GAP CP-05, CP-06 |
| `KITA-TX-09` | `/transfers/[id]` / `respondCase` → `respondToRfi` → `cases`, `documents` | `T-TX-09` / `TEST-TX-09` | PLAN WIRED; GAP CP-05, CP-06 |
| `KITA-TX-10` | `/schedules` / `createSchedule` → `executeOccurrence` → `schedules`, `schedule_runs` | `T-TX-10` / `TEST-TX-10` | PLAN WIRED; GAP CP-03, CP-08 |
| `KITA-FUND-01` | `/profile/funding` / `createFundingInstrumentSession` → `createInstrumentSession` → `consents`, `evidence` | `T-FUND-01` / `TEST-FUND-01` | PLAN WIRED; GAP CP-01, CP-03, CP-04, CP-09 |
| `KITA-FUND-02` | `/send/funding` / `createFundingSession` → `applyAchSettlement` → `provider_attempts`, `journals` | `T-FUND-02` / `TEST-FUND-02` | PLAN WIRED; GAP CP-01, CP-03, CP-04, CP-09 |
| `KITA-FUND-03` | `/send/funding` / `createFundingSession` → `applyCardEvidence` → `provider_attempts`, `journals` | `T-FUND-03` / `TEST-FUND-03` | PLAN WIRED; GAP CP-01, CP-03, CP-04, CP-09 |
| `KITA-FUND-04` | `/send/funding` / `createFundingSession` → `validateFundingCapability` → `capabilities`, `provider_attempts` | `T-FUND-04` / `TEST-FUND-04` | PLAN WIRED; GAP CP-01, CP-03, CP-04, CP-09 |
| `KITA-FUND-05` | `/transfers/[id]` / `getOperation` → `recoverFunding` → `provider_attempts`, `inbox` | `T-FUND-05` / `TEST-FUND-05` | PLAN WIRED; GAP CP-01, CP-03, CP-04, CP-09 |
| `KITA-FUND-06` | `admin/disputes` / `createDisputeResponse` → `applyFundingReturn` → `disputes`, `journals` | `T-FUND-06` / `TEST-FUND-06` | PLAN WIRED; GAP CP-01, CP-03, CP-04, CP-09 |
| `KITA-FUND-07` | `admin/reconciliation` / `resolveBreak` → `attributeIncomingCash` → `reconciliation_breaks`, `journals` | `T-FUND-07` / `TEST-FUND-07` | PLAN WIRED; GAP CP-01, CP-03, CP-04, CP-09 |
| `KITA-PAY-01` | `admin/routes` / `requestReroute` → `selectRoute` → `provider_attempts`, `liquidity_reservations` | `T-PAY-01` / `TEST-PAY-01` | PLAN WIRED; GAP CP-02, CP-03, CP-09 |
| `KITA-PAY-02` | `/send` / `listPayoutOptions` → `resolveBankRoute` → `capabilities`, `policies` | `T-PAY-02` / `TEST-PAY-02` | PLAN WIRED; GAP CP-02, CP-03, CP-09 |
| `KITA-PAY-03` | `/transfers/[id]` / `getTransfer` → `applyWalletPayout` → `provider_attempts`, `evidence` | `T-PAY-03` / `TEST-PAY-03` | PLAN WIRED; GAP CP-02, CP-03, CP-09 |
| `KITA-PAY-04` | `/transfers/[id]` / `getPickupInstructions` → `applyCashPickup` → `provider_attempts`, `documents` | `T-PAY-04` / `TEST-PAY-04` | PLAN WIRED; GAP CP-03, CP-08, CP-09 |
| `KITA-PAY-05` | `admin/transfers` / `inquireAttempt` → `applyPayoutReturn` → `provider_attempts`, `refund_obligations` | `T-PAY-05` / `TEST-PAY-05` | PLAN WIRED; GAP CP-02, CP-03, CP-09 |
| `KITA-PAY-06` | `/bills` / `createBillPayment` → `applyBillPosting` → `bill_payments`, `transfers` | `T-PAY-06` / `TEST-PAY-06` | PLAN WIRED; GAP CP-03, CP-08, CP-09 |
| `KITA-WAL-01` | `/wallet` / `listWallets` → `getWalletBalances` → `ledger_accounts`, `account_balances` | `T-WAL-01` / `TEST-WAL-01` | PLAN WIRED; GAP CP-02, CP-03, CP-04, CP-08 |
| `KITA-WAL-02` | `/wallet` / `createWalletTopup` → `creditWalletFromEvidence` → `provider_attempts`, `journals` | `T-WAL-02` / `TEST-WAL-02` | PLAN WIRED; GAP CP-02, CP-03, CP-04, CP-08 |
| `KITA-WAL-03` | `/send` / `acceptTransfer` → `reserveWallet` → `journals`, `liquidity_reservations` | `T-WAL-03` / `TEST-WAL-03` | PLAN WIRED; GAP CP-02, CP-03, CP-04, CP-08 |
| `KITA-WAL-04` | `/wallet/convert` / `createWalletConversion` → `convertWallet` → `quotes`, `journals` | `T-WAL-04` / `TEST-WAL-04` | PLAN WIRED; GAP CP-02, CP-03, CP-04, CP-08 |
| `KITA-WAL-05` | `/wallet` / `createWithdrawal` → `withdrawWallet` → `refund_obligations`, `provider_attempts` | `T-WAL-05` / `TEST-WAL-05` | PLAN WIRED; GAP CP-02, CP-03, CP-04, CP-08 |
| `KITA-WAL-06` | `/wallet/send` / `createWalletTransfer` → `transferWallet` → `journals`, `screenings` | `T-WAL-06` / `TEST-WAL-06` | PLAN WIRED; GAP CP-02, CP-03, CP-04, CP-08 |
| `KITA-GROW-01` | `/rewards` / `getPoints` → `vestPoints` → `point_lots`, `point_events` | `T-GROW-01` / `TEST-GROW-01` | PLAN WIRED; GAP CP-07, CP-08 |
| `KITA-GROW-02` | `/rewards` / `reservePoints` → `reservePoints` → `point_events`, `reward_reservations` | `T-GROW-02` / `TEST-GROW-02` | PLAN WIRED; GAP CP-07, CP-08 |
| `KITA-GROW-03` | `/send` / `validatePromotion` → `reservePromotion` → `campaigns`, `reward_reservations` | `T-GROW-03` / `TEST-GROW-03` | PLAN WIRED; GAP CP-07, CP-08 |
| `KITA-GROW-04` | `/referrals` / `createReferral` → `qualifyReferral` → `referrals`, `point_lots` | `T-GROW-04` / `TEST-GROW-04` | PLAN WIRED; GAP CP-07, CP-08 |
| `KITA-GROW-05` | `/alerts` / `createRateAlert` → `evaluateAlerts` → `rate_alerts`, `notifications` | `T-GROW-05` / `TEST-GROW-05` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-GROW-06` | `/auto-conversions` / `createAutoConversion` → `executeAutoConversion` → `schedules`, `schedule_runs` | `T-GROW-06` / `TEST-GROW-06` | PLAN WIRED; GAP CP-03, CP-08 |
| `KITA-GROW-07` | `/profile/notifications` / `updateNotificationPreferences` → `sendNotification` → `notifications`, `outbox` | `T-GROW-07` / `TEST-GROW-07` | PLAN WIRED; GAP CP-05, CP-06, CP-09 |
| `KITA-GROW-08` | `/profile/notifications` / `updateNotificationPreferences` → `applyCommunicationConsent` → `consents`, `notifications` | `T-GROW-08` / `TEST-GROW-08` | PLAN WIRED; GAP CP-01, CP-06 |
| `KITA-GROW-09` | `/rewards` / `listRewardEvents` → `reportRewardLiability` → `point_events`, `journals` | `T-GROW-09` / `TEST-GROW-09` | PLAN WIRED; GAP CP-04, CP-06, CP-07 |
| `KITA-ADM-01` | `admin/login` / `createAdminSession` → `authorizeStaff` → `staff_people`, `staff_grants` | `T-ADM-01` / `TEST-ADM-01` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-02` | `admin/transfers` / `listAdminTransfers` → `queryOpsQueue` → `transfers`, `cases` | `T-ADM-02` / `TEST-ADM-02` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-03` | `admin/transfers` / `createHold` → `setHold` → `holds`, `transfer_events` | `T-ADM-03` / `TEST-ADM-03` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-04` | `admin/compliance` / `decideCase` → `decideCase` → `cases`, `identity_decisions` | `T-ADM-04` / `TEST-ADM-04` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-05` | `admin/approvals` / `decideApproval` → `decideApproval` → `approvals`, `approval_decisions` | `T-ADM-05` / `TEST-ADM-05` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-06` | `admin/transfers` / `createAdjustmentRequest` → `requestAdjustment` → `approvals`, `journals` | `T-ADM-06` / `TEST-ADM-06` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-07` | `admin/transfers` / `submitProviderEvidence` → `ingestManualEvidence` → `evidence`, `provider_attempts` | `T-ADM-07` / `TEST-ADM-07` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-08` | `admin/configuration` / `createConfigRelease` → `releasePolicy` → `policies`, `approvals` | `T-ADM-08` / `TEST-ADM-08` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-09` | `admin/customers` / `requestPiiReveal` → `revealPii` → `audit_events`, `documents` | `T-ADM-09` / `TEST-ADM-09` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-10` | `admin/access` / `requestAccessChange` → `changeAccess` → `staff_grants`, `approvals` | `T-ADM-10` / `TEST-ADM-10` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-11` | `admin/audit` / `listAuditEvents` → `archiveAudit` → `audit_events` | `T-ADM-11` / `TEST-ADM-11` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-ADM-12` | `admin/routes` / `pauseRoute` → `pauseRoute` → `capabilities`, `holds` | `T-ADM-12` / `TEST-ADM-12` | PLAN WIRED; GAP CP-01, CP-02, CP-05, CP-06 |
| `KITA-FIN-01` | `admin/ledger` / `getJournal` → `postBusinessEvent` → `journals`, `journal_lines` | `T-FIN-01` / `TEST-FIN-01` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-FIN-02` | `admin/ledger` / `createAdjustmentRequest` → `allocateCorrection` → `journals`, `refund_allocations` | `T-FIN-02` / `TEST-FIN-02` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-FIN-03` | `admin/reconciliation` / `importStatement` → `reconcileStatements` → `statement_files`, `statement_lines`, `reconciliation_matches` | `T-FIN-03` / `TEST-FIN-03` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-FIN-04` | `admin/reconciliation` / `resolveBreak` → `resolveBreak` → `reconciliation_breaks`, `cases` | `T-FIN-04` / `TEST-FIN-04` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-FIN-05` | `admin/treasury` / `getTreasuryPositions` → `reserveLiquidity` → `liquidity_reservations`, `account_balances` | `T-FIN-05` / `TEST-FIN-05` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-FIN-06` | `admin/treasury` / `requestTreasuryMovement` → `allocateFxTrade` → `treasury_movements`, `journals` | `T-FIN-06` / `TEST-FIN-06` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-FIN-07` | `admin/reports` / `createReportExport` → `closePeriod` → `journals`, `documents` | `T-FIN-07` / `TEST-FIN-07` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-FIN-08` | `admin/disputes` / `createDisputeResponse` → `resolveCreditOverlap` → `disputes`, `refund_allocations` | `T-FIN-08` / `TEST-FIN-08` | PLAN WIRED; GAP CP-03, CP-04, CP-06 |
| `KITA-PLAT-01` | `engineering` / internal worker/control → `validateBuildBaseline` → `none` | `T-PLAT-01` / `TEST-PLAT-01` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-02` | `engineering` / internal worker/control → `migrateCore` → `all core tables` | `T-PLAT-02` / `TEST-PLAT-02` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-03` | `operations` / internal worker/control → `applyEvent` → `outbox`, `inbox`, `consumer_inbox` | `T-PLAT-03` / `TEST-PLAT-03` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-04` | `provider ingress` / `receiveWebhook` → `receiveWebhook` → `inbox`, `evidence` | `T-PLAT-04` / `TEST-PLAT-04` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-05` | `admin/exceptions` / `replayDeadLetter` → `replayTask` → `timers`, `outbox` | `T-PLAT-05` / `TEST-PLAT-05` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-06` | `operations` / internal worker/control → `observeFinancialHealth` → `audit_events` | `T-PLAT-06` / `TEST-PLAT-06` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-07` | `engineering` / internal worker/control → `validateEnvironment` → `books`, `provider_accounts` | `T-PLAT-07` / `TEST-PLAT-07` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-08` | `operations` / internal worker/control → `recoverFinancialAuthority` → `all financial tables` | `T-PLAT-08` / `TEST-PLAT-08` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-09` | `/profile/privacy` / `requestPrivacyAction` → `applyRetention` → `documents`, `cases` | `T-PLAT-09` / `TEST-PLAT-09` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-PLAT-10` | `engineering` / internal worker/control → `evaluateReleaseGates` → `none` | `T-PLAT-10` / `TEST-PLAT-10` | PLAN WIRED; GAP CP-05, CP-10, CP-11 |
| `KITA-EXT-01` | `/locations` / `listCorridors` → `evaluateMarketPermission` → `capabilities`, `policies` | `T-EXT-01` / `TEST-EXT-01` | PLAN WIRED; GAP CP-05, CP-09 |
| `KITA-EXT-02` | `admin/treasury` / `requestTreasuryMovement` → `settleCustodyLeg` → `treasury_movements`, `journals` | `T-EXT-02` / `TEST-EXT-02` | PLAN WIRED; GAP CP-08, CP-09 |
| `KITA-EXT-03` | `/business` / `createBusinessProfile` → `verifyBusiness` → `business_profiles`, `cases` | `T-EXT-03` / `TEST-EXT-03` | PLAN WIRED; GAP CP-08, CP-09 |
| `KITA-EXT-04` | `/business/batches` / `createBatch` → `executeBatch` → `batches`, `batch_items`, `transfers` | `T-EXT-04` / `TEST-EXT-04` | PLAN WIRED; GAP CP-08, CP-09 |

## 4. Every archive feature ID

These39 IDs are the archive-research crosswalk added to B. “CROSSWALK WIRED” confirms each target resolves to the production-feature table above, its task and its test; it does not validate prototype security or move prototype money into production. The target's CP gaps apply. Unsafe prototype capabilities are replaced or removed exactly as stated in B/C; no feature is silently retained as a simulator.

| Archive feature ID | Production target IDs | Disposition / wiring |
|---|---|---|
| `F-AUTH-01` | `KITA-AUTH-01`, `KITA-AUTH-02` | CROSSWALK WIRED; Replace Kimi identity/session/bootstrap with scoped OIDC, revocation and workforce lifecycle; target gaps apply. |
| `F-AUTH-02` | `KITA-AUTH-02`, `KITA-AUTH-05` | CROSSWALK WIRED; Replace Kimi identity/session/bootstrap with scoped OIDC, revocation and workforce lifecycle; target gaps apply. |
| `F-AUTH-03` | `KITA-AUTH-02` | CROSSWALK WIRED; Replace Kimi identity/session/bootstrap with scoped OIDC, revocation and workforce lifecycle; target gaps apply. |
| `F-AUTH-04` | `KITA-ADM-01`, `KITA-ADM-10` | CROSSWALK WIRED; Replace Kimi identity/session/bootstrap with scoped OIDC, revocation and workforce lifecycle; target gaps apply. |
| `F-CORE-01` | `KITA-PUB-01`, `KITA-PUB-02`, `KITA-QUOTE-04` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-CORE-02` | `KITA-QUOTE-01`, `KITA-QUOTE-02`, `KITA-QUOTE-03`, `KITA-GROW-03` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-CORE-03` | `KITA-AUTH-06`, `KITA-KYC-02`, `KITA-REC-01`, `KITA-TX-03`, `KITA-WAL-01`, `KITA-GROW-01`, `KITA-GROW-05` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-CORE-04` | `KITA-TX-04` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-CORE-05` | `KITA-PLAT-02`, `KITA-PLAT-07` | CROSSWALK WIRED; Move fictional fixtures to isolated test-only package; remove all production seeds of money/KYC; target gaps apply. |
| `F-KYC-01` | `KITA-KYC-01`, `KITA-KYC-02`, `KITA-KYC-03` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-KYC-02` | `KITA-ADM-04`, `KITA-KYC-07` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-KYC-03` | `KITA-KYC-04`, `KITA-KYC-05`, `KITA-KYC-06` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-LEDGER-01` | `KITA-FIN-01` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-LEDGER-02` | `KITA-TX-01`, `KITA-FIN-01`, `KITA-PLAT-03` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-LEDGER-03` | `KITA-FUND-01`, `KITA-FUND-02`, `KITA-FUND-03` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-LEDGER-04` | `KITA-FIN-06`, `KITA-PAY-03`, `KITA-GROW-01` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-LEDGER-05` | `KITA-WAL-01`, `KITA-WAL-02` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-LEDGER-06` | `KITA-FIN-03`, `KITA-FIN-04`, `KITA-FIN-07` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-RATE-01` | `KITA-QUOTE-03`, `KITA-QUOTE-04`, `KITA-ADM-08` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-RATE-02` | `KITA-GROW-05` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-PAYOUT-01` | `KITA-TX-01`, `KITA-KYC-06`, `KITA-PAY-01` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-PAYOUT-02` | `KITA-REC-01`, `KITA-REC-02`, `KITA-REC-03` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-PAYOUT-03` | `KITA-TX-05`, `KITA-TX-06` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-PAYOUT-04` | `KITA-PAY-03`, `KITA-ADM-07`, `KITA-PLAT-07` | CROSSWALK WIRED; Remove customer simulation endpoint; replace with authenticated provider evidence and inquiry; target gaps apply. |
| `F-PAYOUT-05` | `KITA-ADM-03`, `KITA-ADM-04`, `KITA-ADM-06`, `KITA-ADM-07` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-PAYOUT-06` | `KITA-PAY-01`, `KITA-ADM-06` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-FUNDING-01` | `KITA-FUND-01`, `KITA-FUND-02`, `KITA-FUND-03`, `KITA-FUND-04` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-FUNDING-02` | `KITA-PAY-02` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-ADMIN-01` | `KITA-ADM-02`, `KITA-FIN-07` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-ADMIN-02` | `KITA-ADM-02` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-ADMIN-03` | `KITA-ADM-01`, `KITA-ADM-10` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-ADMIN-04` | `KITA-ADM-05`, `KITA-ADM-08` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-ADMIN-05` | `KITA-ADM-11` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-NOTIF-01` | `KITA-TX-02`, `KITA-GROW-07` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-COMPLIANCE-01` | `KITA-KYC-06`, `KITA-TX-01` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-COMPLIANCE-02` | `KITA-TX-01`, `KITA-TX-04` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-COMPLIANCE-03` | `KITA-ADM-12` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-COMPLIANCE-04` | `KITA-PLAT-06` | CROSSWALK WIRED; Replace unsafe implementation; preserve intended experience through production controls; target gaps apply. |
| `F-COMPLIANCE-05` | `KITA-AUTH-07`, `KITA-PUB-06`, `KITA-PLAT-07` | CROSSWALK WIRED; Modify: installable public shell plus Expo native; no cached financial pages or offline command replay; target gaps apply. |

## 5. Required-scenario crosswalk

| User-requested scenario | Explicit test scenario | Principal implementation owners |
|---|---|---|
| Double click / tap | REQ-SC-01 | T-TX-01, T-CORE-02 |
| Duplicate workers | REQ-SC-02 | T-PLAT-03/05, T-CORE-02 |
| Provider accept-before-timeout | REQ-SC-03 | T-ADAPTER-01, T-FUND-05, T-PAY-01, T-TX-06 |
| Hold race | REQ-SC-04 | T-ADM-03, T-KYC-05, T-PAY-01 |
| Last-funds race | REQ-SC-05 | T-FIN-05, T-WAL-03, T-KYC-06 |
| Quote expiry | REQ-SC-06 | T-QUOTE-04/05/06, T-TX-01 |
| Late funding | REQ-SC-07 | T-FUND-07, T-TX-06 |
| Short funding | REQ-SC-08 | T-FUND-07, T-LEDGER-02 |
| Excess funding | REQ-SC-09 | T-FUND-07, T-TX-06 |
| ACH return after PHP payout | REQ-SC-10 | T-FUND-06, T-FIN-08 |
| Refund/chargeback overlap | REQ-SC-11 | T-TX-06, T-FIN-02/08 |
| Cancellation versus payout | REQ-SC-12 | T-TX-05/06, T-PAY-01 |
| Uncollected cash | REQ-SC-13 | T-PAY-04 |
| KYC tamper | REQ-SC-14 | T-KYC-01/02/03, T-PLAT-04 |
| IDOR | REQ-SC-15 | T-IDENTITY-01, T-ADM-01, all feature controllers |
| Dual-account approve | REQ-SC-16 | T-ADM-05/10 |
| Not-found after accept | REQ-SC-17 | T-PAY-01, T-FUND-05, T-ADAPTER-01 |
| Promo race | REQ-SC-18 | T-GROW-01–04, T-REWARD-01 |
| Statement breaks | REQ-SC-19 | T-FIN-03/04/07 |
| Restore versus external instruction | REQ-SC-20 | T-PLAT-08, T-FIN-03, T-CORE-02 |
| Production-unreachable simulators | REQ-SC-21 | T-MIG-01, T-PLAT-01/07/10 |

## 6. Review disposition and next evidence

No original requirement is inferred from research numbering. Existing H/N source qualifications and provider-specific certification limits remain controlling, including the distinction between published APIs and contracted capability. The earlier source review's security/visual qualifications remain: a locally executed wallet action is not proof of unauthenticated access, a possible scope defect is not a demonstrated exploit, and rendered Kita contrast still requires measurement. This pass adds no external/provider verification claim.

Close contract gaps through the architect's freeze, implement the dependency-ordered tasks through the authorized GPU coding workflow, and obtain exact-candidate Sol review plus QA/Finance/Security evidence. Progress through code complete → internally verified → sandbox certified → limited live pilot → pilot reconciled → GA only for the approved scope. Separate commercial approvals and explicit live authorization remain required by L/N; no structural PASS substitutes for them.

## 7. Reviewed input snapshot

SHA-256 values identify the source snapshot for this assessment. The report does not hash itself; the README index is checked separately after its update. The final validation must confirm these inputs stayed stable during the check.

| Input | SHA-256 |
|---|---|
| `02-traceability-matrix.md` | `e1a9bf6ec7e816fc37759d9296c5ecc165d3a633c3eea2c76d196b0c8d7e7c5e` |
| `05-data-ledger.md` | `09855e04b6909da4c27baa698e5883ae24d881da3e12c81d8cb54f2cea7cfe3d` |
| `06-api-contracts.md` | `50eebb64bcf93051b243d38567adc612925eb023e79971ad80a05fe40a10b416` |
| `12-tests-gates.md` | `2f844b6930f91b3243a9a5864208d6dbdb1a9d912e7376e324a1eda45b6db657` |
| `13-backlog.md` | `ef34cb80c5f956f0867bc183f9815faa3bfca47298e9089ca924c9ddc44632cf` |
| `14-external-deps.md` | `f557059927dadb43c74fe30147c23c77a91e7e251c2b31f9a941ff5d8b23fc76` |
| `sql/001_core.sql` | `da4b3e0e9ea259d3389298411603c2a0b026e90fd8fdb56066c5d74e6ef92123` |
| `openapi/kita-v1.yaml` | `f8f98d45c4c09098412da2504ed140211471859b3dee2be1d27be724d65eb49c` |
| `evidence/features.json` | `1373b6288a7b9f5d02cd4de953d81e7018a717a797bf89a87f9bf576158dfef9` |
| `evidence/operations.json` | `5ca365add22d25ce12018dac56c2eecd0f1f9d98c6b7e6e2914ae8778d62fe53` |
