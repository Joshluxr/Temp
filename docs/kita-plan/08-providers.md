# H. Provider contracts and certification

**All claims in this section: unverified for Kita, pending provider owner and counsel, 2026-11-09.** Public API availability establishes an evaluation lead, not a contract, license, C2C approval, specific Philippine endpoint, price, or settlement guarantee.

## H1. Concrete selection path

| Need | First integration candidate | Alternative / acceptance gate |
|---|---|---|
| US regulated principal/bank, ACH collection | Sponsor-approved ACH originator; evaluate Plaid Transfer under its approved program | Written remittance use, funds ownership, mandates, returns, statements and underwriting required; Plaid Auth alone is not collection |
| Debit acquiring / wallet buttons | Adyen under explicitly approved money-movement arrangement | Checkout.com or bank-sponsored acquirer if approved; debit/credit/Apple Pay/Google Pay each separately certified |
| PHP payout + FX | Thunes primary adapter candidate | Nium secondary candidate; neither enabled until exact corridor/account/method contract |
| PHP direct bank payout | Netbank/approved bank via sponsored rails | No claim of direct InstaPay/PESONet participation by Kita |
| GCash/Maya | Contracted aggregator endpoint first | Direct agreement only if justified by economics and documented eligibility |
| Cash pickup | Aggregator's contracted PERA HUB/Cebuana/Palawan/M Lhuillier route | Obtain actual network/location/name/ID/expiry and collected-status contract |
| Bills | Bayad/ECPay contracted API | Biller catalog, validation, posting, proof, settlement and reversal required |
| Executable FX | Launch payout partner's firm quote | Currencycloud/Nium/Wise Platform only under agreed integration model |
| IDV | Persona candidate for US | Entrust/Sumsub/Veriff evaluated with actual sender document/device population |
| Screening | ComplyAdvantage candidate | Compare licensed alternative on test corpus; list scope, delta feed and evidence SLA |
| Messaging | SES email, APNs/FCM push, contracted Twilio SMS | Verified domains/sender identities, consent and country delivery qualification |
| Workforce/customer identity | Separate managed OIDC tenants/clients | Vendor procurement with passkeys, PKCE, token rotation, revocation and audit export |
| Optional treasury stablecoin | Institutional managed settlement/custody provider, evaluate Circle | Approved fiat/asset/network/off-ramp and refund liquidity; no assumed PHP coverage |

Stripe is not the launch default merely because the sandbox says “Stripe ACH.” Its [restricted-business policy](https://stripe.com/legal/restricted-businesses) distinguishes restricted financial activities and prohibited categories; obtain an explicit entity/product decision before any integration activation. No ordinary ecommerce account is evidence of approved consumer remittance.

## H2. Canonical port contracts

Every result is `Confirmed(evidence) | Pending(providerRef,nextInquiryAt) | Rejected(code,definitiveNonacceptance) | Unknown(reference) | Unsupported(capability)`. Network errors cannot return `Rejected`. Persist request hash, provider account/environment, operation reference and transport attempt separately. Transport auth material never appears in evidence/logs.

| Port | Required methods and fields |
|---|---|
| Funding | `createHostedSession(customer,instrumentType,returnUri)`, `createMandate(termsHash,consent)`, `verifyOwnership`, `authorize/capture/void/collect(reference,amount,currency,token)`, `inquire(reference)`, `refund(originalRef,reference,amount)`, `fetchStatements(cursor)`, `verifyWebhook(raw,headers)` |
| FX | `getIndicativeRate(pair)`, `firmQuote(pair,sourceOrTargetAmount,valueDate)`, `execute(quoteRef,reference)`, `inquireTrade(reference)`, `balances`, `fetchStatements` |
| Payout | `capabilities`, `catalog`, `validateRecipient(snapshot)`, `quote`, `create`, `confirm` when two-step, `inquireByExternalReference`, `cancel`, `returns`, `balances`, `fetchStatements`, `verifyWebhook` |
| Identity | `createSession(subject,policy,returnUri)`, `getDecision`, `getEvidence`, `requestAdditionalEvidence`, `deleteEligibleData`, `verifyWebhook` |
| Screening | `screen(subject,lists,policyVersion)`, `subscribeMonitoring`, `listDeltas(cursor)`, `getCaseEvidence`, `unsubscribe` |
| Notifications | `send(templateVersion,destinationToken,locale,parameters,eventKey)`, `status`, `parseDelivery` |

Adapter capabilities specify supported entity/account, C2C/B2C, origins/state restrictions, currencies/exponents, methods/institutions, min/max, quote lifetime, all fees, cutoffs/holidays, required originator/beneficiary fields, idempotency retention, request lookup, authoritative nonacceptance horizon, callback auth/order, cancellation boundary, return semantics, statement completeness, rate limits, and support contacts. Store a signed contract hash and expiry/review date. Unsupported operations fail explicitly; no default success implementation.

## H3. Thunes candidate mapping

Official [Money Transfer API v2](https://docs.thunes.com/money-transfer/v2/) exposes discovery, quotation, transaction creation/confirmation, callbacks, lookup and reports. Plan `discoverPayers→getRequiredFields→createQuotation→createTransaction→confirmTransaction`; a created transaction is not yet proof of paid delivery. Preserve quote ID, transaction ID, external ID and payer ID. Callback status maps via a versioned adapter table, tested against contracted enum values; do not invent numeric status codes in this plan. Confirm by external-reference inquiry after timeout. Exact callback authentication and safe nonacceptance conditions must be documented during certification; unsigned callbacks are hints requiring authenticated inquiry. Cancellation is state/capability-specific. Raw vendor schemas are snapshotted with contract hash in `packages/providers/thunes/contracts/`; no guessed endpoints/fields beyond inspected public flow.

Nium adapter must prove equivalent identity, quote, payout, status, cancellation and reports against its own account model. Never reuse a Thunes ID namespace/key at Nium. Secondary route can be implemented and sandbox-certified before commercial activation. Launch may proceed with one fully approved provider if outage/refund operations and owner risk approval accept the dependency; a second uncontracted route must not appear as available failover.

## H4. Philippine method behavior

Bank catalog is provider-versioned; support account-name validation where offered, return codes, holiday calendar and actual institution coverage. InstaPay/PESONet limits and windows are loaded from approved capabilities, not hardcoded from research. No transfer slicing to bypass scheme limits. GCash and Maya have distinct required identifiers, name/verification/capacity rules; validation expiry and name-match result are stored. Cash pickup requires immutable legal name, recipient ID instructions, pickup location/network, secret control reference, availability, collected timestamp, expiry and actual returned-cash evidence. Bills require separate posting proof and investigation workflow.

A funded account balance does not imply enough available prefund after queued reservations and fees. Reserve conservatively; if provider balance is stale or statement mismatch material, stop new submissions. Status inquiries, returns and reconciliation stay active while a route is disabled.

## H5. Certification fixture catalog

For every funding/FX/payout provider obtain a signed outcome map and fixtures for: approved/settled, declined, pending, duplicate request, idempotency-payload mismatch, timeout before acceptance, timeout after acceptance, duplicate/reordered/delayed callback, invalid authentication, unknown code, not-found propagation delay, amount/currency mismatch, beneficiary mismatch, stale quote, insufficient prefund, partial return, late return, cancellation race, refund failure, report missing/duplicate line and net fee settlement. Test create and confirm crash windows separately. Evidence must include API version, sanitized raw request/response, hashes, statement mapping, journal IDs and test run hash. Provider sandbox simulation remains confined to fixtures/test adapters.

## H6. Sandbox versus production enforcement

Separate cloud accounts, DBs, provider accounts/keys, webhook endpoints, storage, queues, encryption keys, mobile bundle IDs and email domains. Production startup rejects any provider marked sandbox, test callback key, fixture-only adapter, unapproved capability, or missing secret binding. No runtime boolean can turn a fake funding function into a live rail. Contract test sandbox endpoints may invoke vendor simulation; production endpoint inventory must exclude those URLs and methods.

Production credential activation requires DEP-01…DEP-07 sign-offs, current underwriting, callback verification, independent reconciliation proof and a recorded low-value live certification under authorized operator control. The plan does not perform that live transfer. Rotate keys using overlapping verification keys and provider-specific versioning; test overlap, expiry and rollback without logging secrets.

## H7. SLA and commercial worksheet

Capture quote-only actual costs: fixed/percentage payin fee, FX spread, payout fee, reserve %, reserve release, refunds, chargebacks, failed attempts, IDV/manual review, minimum monthly commitments, onboarding cost, funding timetable, holiday support, prefund ownership, insolvency terms and exit/data export. Track as published/quoted/contracted with evidence date. Cost fixture is for tests, never a marketing price. Provider outages and repricing require policy simulation and reapproval. Vendor renewals or API changes rerun contract suites before deployment.

## H8. Verified source corrections

Additional public-document checks on 2026-11-09 do not establish Kita eligibility. The supplied research conflates legacy Maya remittance intent/execute details with current URAPI. The official [legacy guide](https://developers.maya.ph/docs/remittance-to-maya-wallet-technical-guide) states retirement in October 2026 and points to the [URAPI reference](https://developers.maya.ph/reference/send-remittance-to-an-account-owned-by-the-receiving-party). Treat old `/remittances/v2` paths, states and expiry as legacy evidence; obtain the current schema/execute/inquiry/authentication pack under DEP-04/12 before implementing or enabling that route.

The consulted [Nium webhook guide](https://preview.docs.nium.com/docs/developers/notifications-and-webhooks) is a preview reference and describes account-dependent retry behavior. Certification must pin the actual contracted version and retry settings; do not rely solely on callback redelivery. Authenticated inquiry and complete statements remain required recovery paths. [Adyen idempotency documentation](https://docs.adyen.com/development-resources/api-idempotency/) supplies endpoint-specific retry guarantees; never project them onto another provider or beyond the documented scope/window.

[Stripe ACH documentation](https://docs.stripe.com/payments/ach-direct-debit) describes delayed results and disputes. Settlement-gated release at launch reduces advance exposure but does not eliminate late return risk. These are technical evidence checks only; no source page substitutes for remittance underwriting or a signed accounting policy.
