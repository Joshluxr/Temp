# N. External dependencies, approvals, and evidence register

**As of 2026-11-09, all regulatory and provider claims are unverified for Kita pending the named accountable owner and counsel.** Browsing public documentation checks a source, not applicability or commercial permission. No provider account/production credential was accessed. A disabled feature must return a truthful unavailable result; an external dependency is never permission for fake business logic.

## N1. Dependency and release gates

| ID | Required input | Accountable owner | Exact reviewable evidence / gate | Safe work while absent |
|---|---|---|---|---|
| DEP-00 | Missing full user spec sections1–13 and original feature IDs | Coordinator/Product | Restore referenced file; hash it; map every original ID and scenario to B/L/M; Sol review of coverage diff | Complete available-source plan; do not attest exact original-spec completeness |
| DEP-01 | Actual regulated operating entity and funds flow, US state scope, PH handoffs | CEO + US/PH counsel + Compliance | Signed legal perimeter, contracting parties, account ownership/beneficial interest, agent duties, permission register, market/state list, remittance and wallet separation | Disabled production capabilities, sandbox engineering |
| DEP-02 | Approved chart of accounts, revenue, safeguarding, tax, loss and reserve policies | Controller/Finance + principal accountant | Sign E journals including every exception, actual account mapping, opening trial balance, period policy and real bank/provider evidence | Unit fixtures and finance review; no live seed balances |
| DEP-03 | ACH/card acquiring approval and mandates | Payments owner + bank/acquirer + counsel | Explicit C2C/remittance/MCC underwriting; collection/return/dispute/refund data; ownership/mandate text; reserve/capital and timing; exact provider account scope | Hosted-flow contracts and sandbox; hide unapproved methods |
| DEP-04 | FX and Philippine payout contracts | Integrations lead + Treasury + Compliance | Contracted bank/GCash/Maya/cash endpoint list, limits/calendars, quote/FX promises, idempotency/lookup/nonacceptance, authenticated events, statements, refunds/support | Provider adapter skeleton cannot simulate success; certified sandbox only |
| DEP-05 | IDV and screening services | MLRO + Privacy/Security | Population benchmark, list coverage/deltas, liveness/injection signals, manual cases, evidence export, lawful processing/retention and region DPA | Mock fixtures only in tests; no customer approved from browser |
| DEP-06 | Consumer disclosures/cancellation/error/complaint rules | Product + counsel + Compliance | Per-market approved text, calendar/timing policy, terms versions, receipt templates, after-hours support and remedy funding | Screen templates and exact clock tests on identified planning assumptions |
| DEP-07 | Production security and infrastructure readiness | Security + Platform + independent assessor | Threat model, pen test, access review, PCI scope decision, encryption/rotation, restore/fencing rehearsal, signed artifacts, audit retention | Staging build and controlled fault tests |
| DEP-08 | Wallet, points, promotions, referrals economics/legal scope | Product + Finance + counsel | Stored-value permission/redemption/safeguarding; approved P1 value/vesting/expiry; campaign budget; promo/tax accounting, fair terms | Complete disabled workflows, no unlicensed wallet or cash bonus |
| DEP-09 | Messaging channels and localizations | Support/Product + Privacy | Verified email/SMS sender/domain, push app keys, opt-in categories, approved English/Filipino templates and actual service roster | In-app sandbox delivery, test inboxes |
| DEP-10 | CA/UK/EU-EEA/JP/SG/AU expansion | Market owner + local counsel | Individual country/state service and bank permissions, local rails, privacy/retention, tax, support and language, provider certification | Disabled catalog entries, currency/calendar tests |
| DEP-11 | Stablecoin institutional treasury | Treasury + Security + counsel | Custody/issuer/network allowlists, lawful activity, Travel Rule allocation, chain/finality policy, off-ramp, reserve/redemption/depeg/reorg/refund treatment | Disabled adapter and test vectors, no retail crypto claims |
| DEP-12 | Cash pickup/bills/KYB/batches and recurring/auto-conversion product terms | Product + Integrations + counsel | Exact network/biller schemas, collected/posted proof, KYB owners/signatories, mandate bounds/revocation/notices, reports and returns | Full contract design and sandbox; feature disabled until its scope passes |
| DEP-13 | Original archive/PDF source completeness | Coordinator | Source manifest hashes; enterprise file full replacement if required; record that its4 lines are truncated; compare nested Kita PDF | No invented missing source contents |
| DEP-14 | Native SDK/app-store eligibility and exact build pins | Mobile lead + Integrations | Payment/IDV SDK versions on Expo58/RN0.88, physical device matrix, store signing/review, supported patched lockfile | Port nonnative screens/contracts; no unsupported SDK assumption |
| DEP-15 | Runnable PostgreSQL verification environment | Platform/QA | Fresh PostgreSQL18.6 install; run core DDL/smoke plus multiconnection concurrency/permissions suite, store exit logs | Static checks only; do not mark DB execution passed |

No engineering discretion substitutes for DEP-01–06. Concrete planning defaults in G/E are reviewed as one policy package; approval may change parameters but any changed financial behavior needs journal examples and tests updated before coding. Dependency rejection requires a recorded alternative and contract adjustment, not silent provider substitution.

## N2. Primary-source verification leads

Sources below were either browsed during planning or are official follow-up entry points, distinguished explicitly. Every applicability conclusion still has status **unverified pending owner/counsel2026-11-09**.

| Subject | Source | Evidence state / owner use |
|---|---|---|
| US cancellation/refund | [CFPB1005.34](https://www.consumerfinance.gov/rules-policy/regulations/1005/34/) | Browsed; proposed ordinary-rule implementation in I, counsel confirms scope/exceptions |
| US error resolution | [CFPB1005.33](https://www.consumerfinance.gov/rules-policy/regulations/1005/33/) | Browsed; deadlines/exception policy signed by counsel |
| US disclosures | [CFPB1005.31](https://www.consumerfinance.gov/rules-policy/regulations/1005/31/) | Official follow-up; retain signed rendered templates and legal analysis |
| US MSB | [FinCEN MSB registration](https://www.fincen.gov/money-services-business-msb-registration) | Official follow-up; not state authority |
| Sanctions | [OFAC compliance framework](https://ofac.treasury.gov/media/16331/download?inline) | Official follow-up; MLRO validates current lists and procedures |
| Canada | [FINTRAC registration](https://fintrac-canafe.canada.ca/msb-esm/register-inscrire/reg-ins-eng), [Bank of Canada framework](https://www.bankofcanada.ca/regulatory-oversight/retail-payments/supervisory-framework/) | Official follow-up; separate AML and payment-supervision analyses |
| UK | [FCA payment/e-money](https://www.fca.org.uk/firms/payment-services-regulations-e-money-regulations) | Official follow-up; agent/activity and safeguarding scope |
| EU/EEA | [EBA institutions register](https://www.eba.europa.eu/risk-and-data-analysis/data/registers/payment-institutions-register) | Official follow-up; confirm home/host permissions, not merely presence in register |
| Japan | [Japan FSA](https://www.fsa.go.jp/en/) | Official follow-up; classification/caps/current rules require local counsel, no research deadline assumed |
| Singapore | [MAS payment service licensing](https://www.mas.gov.sg/regulation/payments/licensing-for-payment-service-providers) | Official follow-up; confirm activity/class/capital rather than conflicting source figures |
| Australia | [AUSTRAC remittance providers](https://www.austrac.gov.au/business/industry-specific-guidance/remittance-service-providers) | Official follow-up; actual operating activity and additional obligations |
| Philippines | [BSP1206](https://www.bsp.gov.ph/Regulations/Issuances/2024/1206.pdf), [BSP1108](https://www.bsp.gov.ph/Regulations/Issuances/2021/1108.pdf) | Official follow-up; current consolidated rules, wallet/VASP perimeter and any entry restrictions |
| Philippine privacy | [NPC implementing rules](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/) | Official follow-up; processing/outsourcing/retention/incidents |
| Payout protocol | [Thunes v2](https://docs.thunes.com/money-transfer/v2/) | Browsed; technical candidate only, obtain contracted account-specific semantics |
| Restricted acquiring | [Stripe restrictions](https://stripe.com/legal/restricted-businesses) | Browsed; regional page/contract applicability must be checked for actual US entity |
| Next.js security | [November2026 security release](https://nextjs.org/blog/november-2026-security-release) | Browsed; Next16.4.5 patch baseline, private cache isolation tests required |
| Runtime | [Node24.22.2](https://nodejs.org/en/blog/release/v24.22.2), [PostgreSQL policy](https://www.postgresql.org/support/versioning/), [Expo58](https://expo.dev/changelog/sdk-58) | Browsed; production package integrity/compatibility and managed-engine availability still need build evidence |

## N3. Claim registry schema and review cadence

Maintain `claimId, statement, sourceUrl, retrievedAt, sourceVersion/hash, published/quoted/contracted status, applicability(entity/country/product), owner, counselReviewer, evidenceDocumentId, validFrom, reviewBy, enablementCapabilityIds, decision`. A dated source is not a permanent permission. Recheck provider APIs on releases and quarterly, rail limits/calendars monthly and on announcements, legal permissions before each market/product and renewal, security advisories every release, commercials at renewal/price change. On expired critical evidence disable new exposure for the affected capability; keep existing-obligation servicing.

Unresolved source statements explicitly excluded from production assumptions: stablecoin always cheaper, automatic timeout failover, fixed InstaPay cap changes, purported branch counts, licensing capital/deadline numbers, competitor internal stacks, universal PCI questionnaire scope, all-provider KYC pass rates, guaranteed settlement times, and “SSR keeps PII out of the client.” None is necessary to execute this architecture safely.

## N4. Activation and evidence handoff

Every dependency is **open until its scoped evidence is supplied and independently accepted**. Assign the accountable role to a named human; attach entity/provider account/environment, exact country/state/product/method/currency scope, artifact hash, valid-from/until, policy/contract/API versions, named reviewer, certification run and decision. Public documentation or a sandbox key alone cannot close a commercial/legal gate. Secrets belong in the vault, not evidence attachments or chat.

US→PH launch requires DEP-01…DEP-07, applicable messaging/native/build readiness under DEP-09/14, actual PostgreSQL verification under DEP-15, and the staffed Finance/Ops rights, unknown-outcome and recovery exercises in L. Bank deposit and one approved GCash route activate only with actual route evidence. ACH settlement gates payout. Debit Express adds underwriting, corporate capital and exposure proof. DEP-08/10/11/12 apply independently to the corresponding optional products; absent approval keeps them disabled without inventing success. DEP-00/13 preserve the separate source-completeness limitations.

Before enabling a tuple, the activation command validates current scoped evidence, approved policy, deployment/test hashes and funded exposure limits. Expiry or revocation stops new exposure and alerts the owner; preserve lawful inquiry, returns, refunds, support and reporting for existing obligations. Provider changes require recertification, without changing accepted customer promises. Production pilot requires a separately authorized capped real-money run and three-way reconciliation; this planning pass conducts no such transaction.

Procurement records distinguish published, quoted and contracted price: setup/monthly minimum, collection/payout/FX/refund/dispute fees, reserve percentage/release, settlement timetable, holiday support, prefund ownership/insolvency, statement completeness, data-export/deletion and exit terms. Record measured cloud cost separately from capital, prefund and customer money. A missing commercial number stays unverified; E's worked rates and amounts are test fixtures.
