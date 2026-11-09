# J. Finance, treasury, and operating procedures

2026-11-09. Regulatory and provider requirements are unverified pending owner/counsel. Finance/controller owns posting and revenue policy; Treasury owns liquidity; MLRO owns compliance; Operations owns cases; Engineering owns reliable execution.

## J1. Three-way reconciliation

Run intraday every15 minutes for current provider movements and daily full close by10:00 UTC on the agreed business calendar; source report arrival SLAs may require a separately approved close time. Reconcile by book, provider/bank account, currency and value date. Compare (1) immutable ledger economic movements, (2) independently downloaded provider statements, (3) bank/custodian statements. Callback success is not an independent statement. Each source file has immutable hash, period, account, parser version and import identity.

Import under file-hash uniqueness, retain raw encrypted file, parse exact decimals/exponents, validate statement opening/closing and totals, reject malformed/overflow/mixed-currency rows. Duplicate file acknowledgment does not reimport. Duplicate economic lines across different files become duplicate candidates, not silently discarded. Match first by provider account+stable movement ID+leg+currency+amount; then grouped gross-to-net settlement using explicit fee/reserve lines and provider batch ID. Fuzzy matches are proposals requiring human evidence, never automatic monetary adjustment. Amount tolerance is **zero minor units**; timing tolerance shifts value date only within contracted window and stays visible.

Control equation: opening external balance + signed movements = closing external balance. Reconcile ledger movement allocations against both gross principal and net settlement. One line may allocate across journals only with exact sum caps; one journal may match many report lines with same total. Lock allocations to avoid double matching. Reconcile ledger balance cache independently from all lines, not a limited recent-row sample.

## J2. Break taxonomy and resolution

| Break | Initial action | Resolution evidence |
|---|---|---|
| Timing | Track contractual arrival window and owner; do not fabricate cash | Later report/settlement proves match |
| Missing internal movement | Freeze affected exposure, ingest verified external evidence | Typed journal and reducer event linked to case |
| Missing external movement | Query provider under original reference | Report correction, definitive nonacceptance or real settlement |
| Duplicate movement | Block reroute/retry and quantify exposure | Provider reversal/recovery or funded loss |
| Amount/currency mismatch | Critical case; stop affected route | Corrected report or approved adjustment; never overwrite original |
| Fee/reserve discrepancy | Reconstruct contract and gross/net details | Approved actual cost/reserve journal |
| FX mismatch | Compare trade, rate, rounding, value date | FX gain/loss/settlement mapping with controller review |
| Unknown incoming cash | Dr bank / Cr unidentified liability | Proven owner then reclassify; no revenue recognition |

Every case has amount/currency, first/last seen, materiality, customer impact, owner, SLA, source refs, decisions, approval, linked correction and closure sign-off. No “force match.” Default criticality: any ledger imbalance, duplicate payout or unexplained customer liability shortfall is P0; unknown payout>5min P1; timing breaks within contracted settlement are P2. Even immaterial nonzero differences remain tracked. A resolved case cannot erase original evidence. Material open differences stop exposure increase and require Finance/Compliance sign-off before route reenable.

## J3. Treasury controls

Show cash, processor receivables/reserves, partner prefund, payout/refund transit, liabilities, reserved liquidity, confirmed incoming settlement, available funding, FX positions and concentration by legal entity/currency. Asset accounting and safeguarding eligibility are distinct: receivables or partner claims may not qualify under the selected legal regime. No netting between entities or currencies for legal coverage without explicit authority.

Proposed buffer policy: available prefund after reservations≥max(next2hours forecast payouts, largest permitted single payout+fees); weekend/holiday replenishment uses forecast through next confirmed funding window plus20% stress. Safety ceiling is approved corporate exposure, not projected customer inflow. Forecast from pending/accepted transfers, empirical arrival, refunds and cost fees; incoming unknown transfers count zero. Warn at1.5× buffer, pause new route at buffer breach or stale provider balance>5 minutes unless contractual update cadence has an approved stricter-safe alternative. Treasury movements require maker/checker, destination allowlist, amount cap, fresh bank verification and bank-side dual control.

FX risk ledger tracks accepted unfunded quote exposure separately from executed unsettled trades. Positive spread deferred until delivery; negative execution margin is corporate cost. Net treasury trades can cover multiple transfers only with deterministic allocation of actual cost and rounding residual by largest fractional remainder then transfer ID. Residual total must exactly equal the actual trade amount; no customer receives less. Revalue open currency monetary items at controller-approved close rate, post unrealized gain/loss with next-period reversal/settlement policy, and retain rate source. Financial statements report functional-currency valuation; per-currency operational trial balances still balance independently.

## J4. Unit economics and close

Per-transfer contribution = earned customer fee + realized FX margin − funding cost − payout/FX settlement fees − expected/realized fraud/returns − variable IDV − notifications − attributable support − promotional/points cost. Preserve forecast vs actual columns; never treat prefunding capital or customer safeguarded cash as revenue. Report by origin, method, provider, cohort and campaign. Sample E gives gross revenueUSD8.99; subtract actual costs, including converted PHP costs at documented valuation, before claiming profit.

Daily close: reconcile statement completeness → balance proof → customer obligations vs eligible assets → aged transit/unknown/refunds → fees/FX/provision valuation → case owner review → signed trial balance/positions report → WORM archive. Month-end locks accounting periods, accrues known provider costs and reward obligations, impairs recovery claims, assesses suspense aging and tax liabilities, and exports accountant-approved GL mapping. Late evidence posts in current open period with original effective date and adjustment link; no backdating into a closed period. T-LEDGER-02 adds period-control command and enforcement before live activation.

## J5. Operational runbooks

**Unknown payout:** assign immediately; hold further payout authority; verify original reference/account; run authenticated inquiry; inspect callback/report lag; escalate contractual support with redacted evidence; classify paid, definitively rejected/cancelled, or still unknown; post only evidence-supported events. Do not reroute to meet a dashboard SLA. Customer gets a neutral update and case reference. Refund rights and deadline escalation run in parallel.

**Insufficient prefund:** stop new accepts on affected route if exposure cannot be reserved; continue recovery; inspect reservations and statement balance; Treasury approves replenishment; independently confirm receipt; reconcile; reenable in limited volume. A screenshot of a bank instruction is not received liquidity.

**ACH return/chargeback:** preserve delivery, post bank debit vs recovery/loss, restrict new risk, open case with provider deadlines, gather mandate and authorization evidence, contest only where supported, reconcile recovery or write-off. Never debit unrelated customer wallet without lawful authority and explicit policy.

**Refund deadline:** use recorded legal due time; alerts at50%,75%,90% remaining window and imminent breach; escalations include Finance approver and Compliance. Prepare corporate-funded exception when original rail is uncertain. The customer entitlement is recognized even before approval execution. Actual duplicate credit becomes recovery/loss, not a hidden net adjustment.

**Cash pickup uncollected:** schedule inquiry at contractual expiry; stop new collection only with provider acknowledgment; reconcile refunded prefund; create customer remedy; collected event after expiry is investigated and must not be ignored. Do not show delivered when funds are merely ready to collect.

**Suspicious activity:** restrict authorized scope, preserve confidential case, MLRO determination and filing acknowledgment; support sees neutral delay only. The case system carries jurisdiction-specific deadlines approved by counsel, not vendor scores as legal conclusions.

**Complaint/error claim:** accept in app, phone and supported channels; original received timestamp survives handoffs; classify and assign, retain disclosures, investigate, record customer remedy choice, send required notice and delivery evidence, independently review closure. SLA targets never override legal rights.

## J6. Staffing, reports, and continuity

Named on-call Ops, Finance approver, Treasury, MLRO delegate and incident commander cover active corridor service and urgent cancellation windows. Staff training covers all above runbooks, signed live-access exercises, case handover and confidential data. Support templates are reviewed by Product/Compliance and localized. No promise of24/7 staffing without actual roster coverage.

Reports: transfer lifecycle and delivery success; unsettled funding and late return cohorts; aging payout/refund transit; customer liability and safeguarding coverage; daily trial balance; provider/currency liquidity; FX exposure/valuation; revenue/cost/promotion/points; regulatory exports; complaint/error deadlines; admin access and adjustment inventory. Export rows include snapshot/as-of IDs and exact currency/amount, masked by default, permissioned with expiring download and audit. Spreadsheet fields are escaped to prevent formulas. Read replica lag is displayed; a stale report cannot approve a payment.
