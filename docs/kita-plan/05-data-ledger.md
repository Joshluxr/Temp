# E. Data model, posting authority, and worked journals

Baseline 2026-11-09. Accounting treatment is a concrete proposed operational policy requiring Finance/controller sign-off against the actual funds owner (DEP-01/DEP-02). Regulatory/provider assertions are unverified pending owner/counsel. No engineer may substitute a balanced but economically different journal.

## E1. Executable schema and boundaries

[sql/001_core.sql](sql/001_core.sql) is the executable core DDL. It creates books, currencies, customers, capability/policy versions, recipients and immutable versions, immutable quotes, transfers, evidence, attempts, holds, ledger, refund obligations, disputes, inbox/outbox, timers, staff/approvals, cases, screening, documents, reconciliation, receipts, notifications, rewards, schedules, bills, treasury, and business batches. Run once in an empty PostgreSQL database as a migration owner. Runtime roles have no direct financial table writes. The posting service gets only `post_journal`; higher-level approved domain command functions are implemented in backlog T-CORE-02 and T-LEDGER-02. SQL is the starting invariant layer, not a claim that all product workflows already exist.

`book_id` identifies the legal funds owner; customer, quote, recipient, provider, and journal relationships use composite ownership FKs where the core transaction crosses those boundaries. Every handler additionally scopes all object lookups. Internal UUIDs are opaque, external references are strings, timestamps are UTC; country calendars use IANA zones. `bigint` amounts are positive integer minor units on lines with explicit D/C direction; intermediate sums and rates use exact `numeric` or BigInt. API integers are decimal strings. Fiat exponents include JPY=0 and USD/PHP=2; no assumption of 100 across all currencies. Reject input precision beyond the currency exponent, NaN, infinity, exponent notation, numeric JSON money, signed amounts on positive-money commands, and overflow.

The core does not partition ledger tables. Account identity is nonnullable `(book_id,code,currency)`; no nullable-owner uniqueness hole. `ledger_accounts` has fixed currency/type/normal side and cannot be repurposed. Customer available/reserved/pending liabilities and actual spendable provider cash require nonnegative normal balances; economic receivables, losses, clearing positions, suspense, and revenue do not imply spendability.

## E2. Chart of accounts

Each code below is prefixed with the book/entity; customer, transfer, processor, bank, and provider segments are concrete IDs, never free-text labels from the browser.

| Code | Class / normal side | Currency | Purpose and control |
|---|---|---|---|
| `asset:bank:fbo:<bank>` | asset / D | funding currency | Actual bank balance, reconciled; safeguarding eligibility is separately classified |
| `asset:bank:operating:<bank>` | asset / D | functional currency | Corporate cash; never commingle with customer money in reports |
| `asset:payin:<processor>:receivable` | asset / D | funding currency | Captured amount awaiting actual settlement |
| `asset:payin:<processor>:reserve` | asset / D | funding currency | Processor-withheld reserve, excluded from available cash |
| `asset:prefund:<provider>` | asset / D | payout currency | Confirmed partner-owned/account-controlled prefund claim |
| `asset:payout:<attempt>:transit` | asset / D | payout currency | Evidence of debit before beneficiary credit; not extinguished on acceptance |
| `asset:refund:<attempt>:transit` | asset / D | refund currency | Actual debit before refund completion |
| `asset:recovery:<case>` | asset / D | loss currency | Contractually collectible return/dispute receivable; impairment evaluated |
| `asset:fxbridge:<trade>` | asset / D | each fiat | Temporary settlement clearing; either sign allowed; separate positions by currency |
| `liability:customer:<id>:pending` | liability / C | each wallet/funding currency | Confirmed funding not yet available |
| `liability:customer:<id>:available` | liability / C | each wallet currency | Spendable, no negative balance |
| `liability:transfer:<id>:principal` | liability / C | funding currency | Committed remittance principal, not general stored value |
| `liability:customer:<id>:reserved` | liability / C | each wallet currency | Reserved wallet money; blocked from a second spend |
| `liability:payout:<transfer>` | liability / C | payout currency | Amount still owed to beneficiary |
| `liability:return:<transfer>` | liability / C | payout currency | Actual post-delivery returned funds awaiting remedy |
| `liability:refund:<obligation>` | liability / C | source currency | Legally/commercially owed refund, regardless of internal approval delay |
| `liability:fee:deferred:<transfer>` | liability / C | source currency | Unperformed service fee |
| `liability:fxmargin:deferred:<transfer>` | liability / C | source currency | Positive spread deferred until delivery |
| `liability:tax:<authority>` | liability / C | taxable currency | Tax collected under signed applicable policy |
| `liability:unidentified:<source>` | liability / C | each fiat | Unknown incoming cash; not customer spendable or revenue |
| `revenue:transfer_fees`, `revenue:fx_margin` | revenue / C | source currency | Earned on confirmed delivery; contra entries for approved refunds |
| `expense:funding`, `expense:payout`, `expense:fx_loss` | expense / D | actual cost currency | Actual costs, not deducted from customer principal |
| `expense:fraud`, `expense:remediation`, `expense:promotion`, `expense:loyalty` | expense / D | cost currency | Separately attributable costs and loss decisions |
| `liability:reward_provision` | liability / C | redemption currency | Approved financial valuation of vested benefits |
| `equity:capital` | equity / C | contributed currency | Independently evidenced real capital; no fake seed balance |

Account purpose and safeguarding inclusion are versioned in account-policy metadata. Accounting normal side is not an overdraft authorization. Cross-entity transfers require separate balanced books and intercompany receivable/payable pairs with real authorization.

## E3. Posting protocol and invariants

One source economic event maps to one immutable `book_id,event_key` journal. Compute its canonical payload hash server-side. Same key and payload returns existing journal; changed payload raises conflict. The function serializes the key, locks accounts in UUID order, validates account/book/currency, checks verified evidence and posting-policy identity, checks aggregate resulting nonnegative balances, inserts header and lines, and updates the balance projection atomically. No network access occurs inside this transaction.

Deferred header and line triggers reject a committed empty or unbalanced journal per currency. FKs prevent orphan and cross-currency accounts. Posted header/line updates/deletes are blocked; new lines cannot be attached to a journal from an earlier transaction. Direct financial table grants are absent. Full reversal links are unique and must negate original account/currency nets; partial correction uses `adjustment_of`, an allocation record, and cumulative cap checking in the domain service. Neither full reversal nor a balanced journal alone establishes that a customer is owed money: typed business templates, legal entitlement, and evidence are mandatory.

Balance projections are authorizing caches updated only by posting. Recompute all accounts from journal lines independently daily and sampled continuously; any divergence disables new authorizations on affected books. DB admins can still bypass controls; independent WORM evidence, restricted migration identities, access review, and restore reconciliation address that separate trust boundary.

Use SERIALIZABLE for commands touching customer funds, refund caps, campaign budget, and liquidity. Retry the entire transaction on SQLSTATE 40001/40P01 at most 5 times with jitter (10, 25, 50, 100, 200 ms caps); preserve command/event keys. Exhaustion yields retryable conflict with operation lookup, not a new command. Administrative display calculations never authorize a posting.

## E4. Worked US→PH successful transfer

Illustrative fixture, not a live rate: customer sends USD **500.00**, fee **3.99**, tax **0.00**, total **503.99**; wholesale rate **58 PHP/USD**, customer rate **57.42** (100 bp reduction), guaranteed receive **PHP 28,710.00**. Execution buys exactly PHP 28,710 for **USD 495.00**; spread **USD 5.00**. Every amount below is major-unit display; the persisted amounts are USD cents/PHP centavos.

| Journal / actual evidence | Currency | Debits | Credits |
|---|---|---|---|
| J00 payment authorization | — | No journal | Authorization/mandate only |
| J01 capture confirmed | USD | Processor receivable 503.99 | Customer pending 500.00; deferred fee 3.99 |
| J02 gross settlement | USD | FBO cash 503.99 | Processor receivable 503.99 |
| J03 allocation after settlement/risk gate | USD | Customer pending 500.00 | Transfer principal liability 500.00 |
| J04 binding executed FX trade | USD | Transfer principal 500.00 | FX bridge 495.00; deferred FX margin 5.00 |
| J04 same journal, second currency group | PHP | FX bridge 28,710.00 | Payout payable 28,710.00 |
| J05 real USD treasury settlement | USD | FX bridge 495.00 | FBO cash 495.00 |
| J06 real PHP delivery into prefund | PHP | Provider prefund 28,710.00 | FX bridge 28,710.00 |
| J07 provider debits prefund | PHP | Payout transit 28,710.00 | Provider prefund 28,710.00 |
| J08 recipient credited | PHP | Payout payable 28,710.00 | Payout transit 28,710.00 |
| J09 service earned | USD | Deferred fee 3.99; deferred FX margin 5.00 | Fee revenue 3.99; FX revenue 5.00 |

After J09: customer pending/principal, FX bridges, payout payable/transit, and deferred revenue are zero. USD cash is 8.99, equal to gross earned revenue before external costs. PHP prefund from this trade is zero after delivery. Opening prefund is separately evidenced corporate liquidity; never conjure it on transfer acceptance. An aggregator that both converts and pays still supplies distinct trade, debit, and credit evidence; its single callback can generate multiple idempotent journals only when its contract attests each fact.

If only a prefund reservation occurs, J07 does not post until the provider actually debits. Keep a reservation row that reduces available liquidity. If paid evidence arrives before debit callback, query the provider/statement; attested paid evidence may imply debit only where the signed mapping says so. Otherwise leave the accounting evidence case open, display the real recipient outcome, and reconcile without inventing the missing asset movement.

## E5. Funding variants and costs

ACH initiated: no cash or receivable merely from a submitted debit. For a provider whose settled evidence is the first enforceable receipt, post J01+J02 as one compound settled-funding event (Dr bank / Cr pending + deferred fee); do not post another capture. Settlement remains returnable. Release only under the signed ACH availability rule, with no initial advance. An inbound unmatched deposit posts Dr bank / Cr unidentified liability, then Dr unidentified / Cr correctly attributed customer pending after verified matching.

Card authorized: memorandum only. Captured: J01. Express may proceed at J03 before J02 only under the approved corporate-funded exposure policy; corporate liquidity reserves cover the exact expected shortfall, reserve, and chargeback risk. The receivable never becomes safeguarded bank cash merely because payout is allowed.

Example net processor settlement of 503.99 with cost 2.50 and reserve 10.00: Dr bank 491.49 + Dr funding expense 2.50 + Dr processor reserve asset 10.00 / Cr receivable 503.99. Reserve release: Dr bank 10.00 / Cr reserve 10.00. Charge a separately evidenced PHP 10.00 payout cost: Dr payout expense PHP10 / Cr provider prefund PHP10. Include that cost in liquidity reservation but never reduce the promised PHP28,710.

Tax-positive fixture: principal500 + fee3.99 + tax1.00 =504.99. Funding credits pending500, deferred fee3.99, tax payable1.00. Remittance of tax Dr tax payable1 / Cr bank1. A required refund after tax remittance uses a tax-recovery receivable or expense only under the approved tax mapping; not a negative customer refund. The zero-tax US fixture is not a legal claim that all transfers are tax-free.

## E6. Negative spread and funding delay

At execution use actual required wholesale cost C, not the indicative quote's expected cost. If C=501.00 to buy the same PHP28,710, J04 USD is Dr principal500 + Dr FX loss1 / Cr FX bridge501. The PHP group is unchanged. Settlement costs501; Kita's corporate capital funds the extra dollar. Customer total and receipt stay unchanged. No positive-margin liability is booked for a loss.

Accepted quotes are binding under the proposed policy: acceptance reserves FX risk capital, receive amount, fees, and delivery commitment. ACH initiation deadline is the displayed deadline; long settlement waits are treasury exposure. Uninitiated offers expire with no money. Late or orphan funds go to suspense then a refund/consent workflow, never automatic repricing. A missed availability promise opens an error case and approved remedy; it does not become a stealth rate change.

## E7. Cancel/refund before FX

No collection yet: cancel pending command, void confirmed authorization if supported, release reservations; **no money journal**. Captured/settled principal still pending or committed: Dr that principal liability500 + Dr deferred fee3.99 / Cr refund payable503.99. This creates one refund obligation, not a second customer liability.

On actual processor/bank debit for refund: Dr refund transit503.99 / Cr bank or processor receivable503.99 (choose the real refund funding account). On beneficiary-of-refund credited: Dr refund payable503.99 / Cr refund transit503.99. If the provider's authenticated evidence confirms debit and recipient refund together, combine those steps. A failed refund before debit leaves payable unchanged. A failed refund after debit leaves transit open until cash returns; return Dr bank / Cr refund transit. Retry only after proven nonpayment and with a new attempt linked to the same remaining obligation.

## E8. Cancel/refund after FX, before delivery

If prefund was debited but no recipient credit, retain payout transit and original payable until cancellation and return are evidenced. Returned prefund: Dr prefund PHP28,710 / Cr payout transit PHP28,710. Reclassify obligation: PHP Dr payout payable28,710 / Cr FX bridge28,710; USD Dr FX bridge495 + Dr deferred FX margin5 / Cr refund payable500. Dr deferred fee3.99 / Cr refund payable3.99. Total owed sender503.99, not the current FX sale proceeds.

Sell recovered PHP at illustrative57 PHP/USD: USD503.68 after agreed rounding. Unwind: PHP Dr FX bridge28,710 / Cr prefund28,710; USD Dr bank503.68 / Cr FX bridge495 + Cr realized FX gain8.68. Refund503.99 uses existing retained margin/fees/corporate funds. At59, proceeds486.61: USD Dr bank486.61 + Dr FX loss8.39 / Cr FX bridge495. Corporate funds cover the loss. Treasury spread and refund obligation are separate; the sender does not inherit an undisclosed FX loss.

If FX failed with definitive no trade, do not post J04 or undo a nonexistent trade. If trade outcome is unknown, retain exposure and inquire before buying again. Where a legally owed refund must precede partner recovery, recognize a separately funded remedy as in E10; do not erase the still-live payout payable/transit.

## E9. Delivered transfer, partial return, and partial refund

A true return after delivery is a new event. Original J08 and delivered timestamp remain. For 40% returned: PHP **11,484.00**; USD original principal allocation **200.00**, cost **198.00**, margin **2.00**, refundable fee **1.60** under the illustrative proportional-fee remedy. On actual returned PHP: Dr prefund11,484 / Cr returned-funds payable11,484. Reclassification: PHP Dr returned-funds payable11,484 / Cr FX bridge11,484; USD Dr FX bridge198 + Dr FX revenue contra2 / Cr refund payable200; Dr fee revenue contra1.60 / Cr refund payable1.60. Treasury unwind and external refund201.60 follow E8/E7. A changed unwind rate creates separate treasury gain/loss.

Use cumulative allocation: `allocatedFee(k)=roundHalfUp(originalFee*cumulativeRefundPrincipal/originalPrincipal)`; current fee refund equals cumulative allocation minus previously allocated fee. Full final refund exhausts the original fee exactly. Apply the same cumulative rule to cost/spread and independently cap recipient principal. Never round every independent partial request without the cumulative remainder. Original costs already incurred stay expenses unless the provider actually reverses them. Refunds without recovered payout require an explicit remediation expense, not a second principal refund against an extinguished liability.

## E10. Late funding returns, chargebacks, and remedy races

ACH/card reversal after paid PHP: Dr recovery receivable503.99 / Cr bank503.99 where legally collectible; otherwise Dr fraud loss503.99 / Cr bank503.99. Payout stays delivered. A processor chargeback fee15 posts Dr dispute cost15 / Cr bank15. If collection becomes doubtful, Dr credit loss / Cr allowance for recovery (contra asset mapping approved separately). Collection Dr bank / Cr recovery; write-off Dr allowance or loss / Cr recovery. A won dispute returns cash and reverses the receivable/loss using a linked recovery journal; it does not reverse payout revenue automatically.

Return before payout consumes the unperformed principal/fee obligation rather than inventing a refund: Dr pending/principal500 + Dr deferred fee3.99 / Cr bank503.99. If collection and refund requests race, lock transfer plus all refund/dispute allocation rows and classify whether the sender already received equivalent credit. Do not blindly net a disputed credit against a legally owed remedy; Finance/Compliance resolves the entitlement and deadline. If both credits actually occur, record the second as recovery receivable or expense, never negative customer availability.

Urgent remedy for an unresolved payout: Dr remediation expense503.99 / Cr refund payable503.99, paid from corporate operating cash. Preserve original payout payable/transit and inquiry case. If the partner later returns the money, resolve the original obligation and recognize documented recovery of remediation, with cross-reference to prevent a second refund. This exception requires a funded reserve and independent approval; preapproved mandatory-remedy policy can authorize timely execution when the duty exists. Sanctions blocking restrictions remain controlling and require counsel procedure.

## E11. Wallets, rewards, and promotions

Wallet top-up settled: Dr bank100 / Cr pending wallet100, then Dr pending100 / Cr available100 after availability gate. Reserve transfer503.99: Dr available503.99 / Cr reserved503.99 atomically with transfer creation. Commit: Dr reserved503.99 / Cr transfer principal500 + Cr deferred fee3.99. Before commit release: Dr reserved / Cr available. Withdrawal: Dr available / Cr withdrawal refund-payable, then external debit/completion E7. Multi-currency conversion: quoted source debit, balanced bridges and target available liability; actual treasury settlement supplies matching asset legs. Wallet restrictions block new spending but do not delete lawful redemption rights.

Points are nontransferable fee-discount units, not cash. Proposed rule P1: one point per whole USD-equivalent principal at accepted valuation, minimum eligible principalUSD10, vest30 days after delivery if no dispute/return, expire365 days after vest, 100 points=USD1 of fee discount, cap at the fee; no cash withdrawal. All are policy versions, disabled pending DEP-08. Each points event is a paired customer/program movement, including reserve/release, FIFO by earliest expiry then lot ID. The core's `point_events.counter_account` identifies the paired program side; T-REWARD-01 adds a constrained points-posting function with zero-sum units and lot reservation checks. Never use the cash posting API for point units.

Example500 points vest, maximum financial obligationUSD5: Dr loyalty expense5 / Cr reward provision5. Redeem100 against fee3.99: total customer502.99; funding Dr cash502.99 + Dr reward provision1 / Cr principal500 + Cr deferred fee3.99. Failure releases points and restores provision via a linked journal; do not pay the promotional dollar as customer cash. Expiry of remaining400: Dr provision4 / Cr loyalty expense recovery4 under signed accounting policy. If points were already spent when the source transfer returned, record reward debt/negative points entitlement for future earns, never seize unrelated fiat or create negative spendable money.

Direct promo waiver3.99: Dr cash500 + Dr marketing expense3.99 / Cr principal500 + Cr deferred fee3.99. On failed transfer, reverse the subsidy and deferred fee; refund only collected500 (plus legally owed amounts). On delivery, recognize full3.99 fee revenue with explicit3.99 acquisition cost. Referral cash, if ever approved, uses marketing expense/benefit payable and real settlement; initial referral reward is points under the same vesting rules. This gross presentation requires controller approval; a net presentation would be a separate signed policy version, not ad hoc engineer choice.

## E12. Data history, retention, and migration

Quotes, recipient versions, disclosures, consents, financial evidence, journal events, decisions, and receipt versions are append-only. Mutable operational records have versions; immutable event history explains each version. PII resides in encrypted profile/document stores with key refs; journal/event descriptions contain IDs and reason codes only. Legal holds override deletion; retention durations come from a signed jurisdiction/data-class schedule, not a blanket rule copied from research.

No sandbox balance is migrated to production. A dry-run import may migrate masked demo fixtures into a separate sandbox only. For any future real legacy book: freeze intake, export audited closing trial balance and customer liabilities, map currency/account/owner, reject fractions or orphan references, compare row counts/hashes, approve opening journals against bank/provider evidence, reconcile both systems, then change authority once. Keep historical records read-only. Rollback after real submission is forward recovery, not restoring an old balance snapshot.

## E13. Non-remittance aggregates and supporting schema

`money_operations` is the durable authority for remittance, wallet top-up, withdrawal, conversion, P2P and bill movements. Remittances link an immutable transfer; wallet operations do not invent a recipient/transfer just to reuse a provider API. Provider attempts and refund/liquidity allocations attach to `operation_id`; optional transfer ID must agree with that operation. Lock this operation as the serialization boundary for non-remittance commands. One unresolved payout authority is enforced per operation. `wallet_quotes` carries immutable conversion terms without a remittance recipient.

Core DDL also defines tokenized funding instruments, mandates/revocations, auth sessions/contact challenges, rate snapshots, velocity buckets/reservations, accounting periods, case messages, notification delivery/preferences and FX trade allocations. T-CORE-02 adds narrow command functions with composite-ownership checks on every supporting-table link; T-LEDGER-02 validates allocation totals and prohibits overlapping accounting periods. The posting function rejects a book with no current open posting period; original economic time remains independent of current posting date. No domain command may silently synthesize an open period or bypass approvals.

## E14. Executing and validating this core artifact

Apply `001_core.sql` once to an empty PostgreSQL18.6 test database using a dedicated migration owner with CREATEROLE. Run `psql -X -v ON_ERROR_STOP=1 -d kita_plan_test -f docs/kita-plan/sql/001_core.sql -f docs/kita-plan/sql/002_core_smoke.sql` from repository root. The second file rolls back its fixture and checks posting/replay, changed-payload rejection, imbalance rollback, no overdraft, account currency binding, immutability, exact reversal, deferred empty-header rejection and runtime grants. It does not replace multiconnection races, cross-transaction append checks, full domain-policy authorization or provider certification in L.

This environment had no PostgreSQL binaries; embedded harness installation failed with package-registry DNS resolution (`EAI_AGAIN`). Consequently SQL runtime validation is **pending**, not reported as passed. Static structural and independent arithmetic checks are in the final validation report. The core is designed as executable PostgreSQL DDL; only a successful real-engine run may certify that claim. T-CORE-02/T-LEDGER-02 remain mandatory before financial activation, even after the smoke suite passes.
