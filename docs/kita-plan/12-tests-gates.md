# L. Test specification and release gates

Baseline: 2026-11-09. **These are required tests, not reported passes.** No application has been implemented or executed in this planning task. All104 available feature IDs are mapped below to acceptance evidence and104 detailed scenarios, with all56 retained SC-register checks cross-referenced in L6. The original user specification sections1–13 is absent (DEP-00); this is comprehensive coverage of the available plan/source requirements, not certification of unseen scenarios. Add original-spec IDs and any missing cases before final scope sign-off.

## L1. Test authority and fixtures

Use E4–E11 as independent economic oracles, G as state/concurrency specification, H as provider outcome semantics, I as authorization/rights policy and J/K as recovery/close requirements. Fixture rates, fees, fictional identities and balances belong only to isolated test databases and certified provider sandboxes. Production test probes are nonfinancial reads. A separately authorized capped live pilot uses real funds and independently reconciled evidence; it is not run by this plan.

The baseline oracle is principal50000USD minor, fee399, tax/discount0, total50399, receive2871000PHP minor, actual FX cost49500USD minor. Assert both state and exact journal account/currency/direction/amount after each evidence event. Compare full trial balance and source obligation before/after, number of provider instructions and stable external references, outbox/inbox identities, approvals, notification effects, immutable receipt/hash and case deadlines. Never assert only HTTP200 or a green UI badge.

Run financial integration/concurrency tests against real PostgreSQL with production roles, isolation, triggers and grants; SQLite and mocked repositories cannot prove these gates. A controllable clock supplies policy/provider time while DB clock is the acceptance authority. Fake providers support deterministic barriers before/after remote acceptance, statement delay, duplicate/reordered callbacks and withheld responses; every simulated response is explicitly test-only. Store actual certified provider fixtures separately, scrubbed and hash-addressed.

Concurrency harness uses explicit barriers around row-lock acquisition, dispatch commit and provider call, at least100 racing contenders for last-balance/budget/key tests, plus randomized interleavings with reproducible seeds. Property suites exercise at least100000 generated histories per money/reversal/refund/reward invariant; persist failing seed and minimized counterexample. A successful simulation cannot establish actual provider idempotency or legal eligibility.

## L2. Required scenario catalog

Every row specifies setup/action and an independently observable result. M01–M104 are stable plan scenario IDs. All applicable provider/currency/method variants must run; disabled optional products must additionally prove unavailable/no-side-effect behavior. Scenarios for optional-product execution run before that product activates, not silently waived forever.

| Scenario | Setup / action | Required assertions | Feature IDs |
|---|---|---|---|
| **M01** Quote/money | USD500 principal,399 fee,58 wholesale and100bp reduction; create quote | Exactly50399 USD total and2871000 PHP receive; display/receipt match E4; no journal before collection | KITA-QUOTE-01, KITA-QUOTE-07, KITA-PUB-02, KITA-PUB-04 |
| **M02** Quote/money | Receive exactly PHP1000 at57.42; solve inverse | USD1742 minor principal, exactly100000 PHP minor receive, disclosed fractional rounding; never100026 receive | KITA-QUOTE-02 |
| **M03** Quote/money | JPY exponent0 plus USD/PHP exponent2; min/max and values near9e15; fuzz exact rational math | Lossless string/BigInt parity; reject float JSON, signs, leading zeros, exponent notation, fraction, NaN/infinity, overflow; property bounds hold | KITA-QUOTE-01, KITA-QUOTE-02, KITA-PLAT-01 |
| **M04** Quote/money | Tier boundary at min/max; percent/min/max/surcharge, tax-positive1USD, discount at fee cap | One fee tier; no overlap/gap; E5 total50499; explicit tax policy; discount never principal; sum exact | KITA-QUOTE-03, KITA-GROW-03 |
| **M05** Quote/money | Fresh vs source age>10s, vendor expiry<10s, outage and circuit open | Executable quote unavailable; no fixed/cached execution fallback; public indicative label/as-of maintained | KITA-QUOTE-04, KITA-PUB-02 |
| **M06** Quote/money | Accept one microsecond before expiry, equality, after,90minutes later with client clocks/timezones changed | Database time only; equality/after rejected; no funding, ledger, liquidity or reward effect | KITA-QUOTE-05, KITA-PLAT-05 |
| **M07** Quote/money | Change recipient version, instrument, consent/disclosure hash or unaccepted policy permission | 409 or safe action-needed; no acceptance; old accepted terms never mutate | KITA-QUOTE-05, KITA-REC-03 |
| **M08** Quote/money | ACH delay then wholesale cost501USD for same PHP28710 | E6 corporate FX loss1; customer promise unchanged; exposure reserved through wait; no silent repricing | KITA-QUOTE-06, KITA-FIN-06 |
| **M09** Quote/money | Exact target unsupported, quote source amount mismatch, provider quote malformed | Reject before acceptance; quarantine evidence; no implicit recipient reduction | KITA-QUOTE-02, KITA-QUOTE-04 |
| **M10** Quote/money | Two devices update same draft or rapid responses arrive out of order | expectedVersion rejects stale write; UI keeps latest request/accepted quote; repeat send requires fresh quote/consent | KITA-QUOTE-08, KITA-REC-04 |
| **M11** Commands | Double click,100 concurrent identical keys and same quote with different keys | One transfer/consent/reservation/outbox/command economic effect; quote uniqueness independent of key | KITA-TX-01 |
| **M12** Commands | Reuse same key with changed amount/path/recipient/hash; retry after response loss | 409 mismatch; matching retry returns original result; operation lookup works before knowing resource ID | KITA-TX-01, KITA-FUND-05 |
| **M13** Commands | Crash before transaction commit, after commit before HTTP reply; DB serialization retries/exhaustion | Rollback leaves no partial obligations; committed operation recoverable; retries preserve keys, exhaustion never starts new command | KITA-TX-01, KITA-PLAT-03 |
| **M14** Commands | Cross-customer/entity quote, recipient, instrument, case, document, cursor and operation IDs | 404/403 scoped; no data or mutation; UUID opacity is not authorization | KITA-TX-03, KITA-REC-01, KITA-ADM-01 |
| **M15** Commands | SSE disconnect, duplicate/out-of-order event, stale Last-Event-ID, revoked session | Dedup version; resync on gap; reauthorize stream; delivery stays evidenced; no financial command triggered by display | KITA-TX-02, KITA-AUTH-02 |
| **M16** Funding | ACH initiation, pending, then authenticated settlement | No money at initiation; E5 settled-funding compound journal once; no payout before settlement | KITA-FUND-02 |
| **M17** Funding | Debit authorization, capture then gross/net settlement with2.50 cost and10 reserve | No journal at auth; receivable503.99 at capture; bank491.49+expense2.50+reserve10 at net settlement; release reserve only on evidence | KITA-FUND-03, KITA-FIN-01 |
| **M18** Funding | Debit Express before bank settlement with cap exhausted/missing approval/corporate prefund | Dispatch blocked without approved funded exposure; allowed case uses real prefund and receivable, never pretends settled cash | KITA-FUND-03, KITA-FIN-05 |
| **M19** Funding | Hosted redirect says success, forged client callback or unowned token/mandate | No funding/KYC success; verify server evidence and ownership; no raw PAN/CVV/bank secret in app/logs | KITA-FUND-01, KITA-KYC-01 |
| **M20** Funding | Unsupported credit/Apple Pay/Google Pay or sandbox key in production | CAPABILITY_DISABLED/startup rejection; no fallback ordinary ecommerce route | KITA-FUND-04, KITA-PLAT-07 |
| **M21** Funding | Timeout before/after bank debit or card capture; same key after provider dedup window expires | Unknown retained; inquire original reference; no second collection; never equate temporary not-found with definitive rejection | KITA-FUND-05 |
| **M22** Funding | Settled ACH returned before payout; simultaneous cancel/refund request | E10 extinguish unperformed principal/fee against actual debit; no extra refund where credit already restored; preserve case/deadline | KITA-FUND-06, KITA-FIN-08 |
| **M23** Funding | ACH return or chargeback after PHP delivery, plus15USD dispute fee | Paid history/receipt survives; separate503.99 recovery/loss and15 cost; restrict new exposure; no negative wallet availability | KITA-FUND-06, KITA-FIN-08 |
| **M24** Funding | Dispute won/lost, bank credit arrives twice, response deadline missed | One recovery event per movement; linked loss/receivable resolution; escalate deadline; never reverse payout delivery | KITA-FUND-06, KITA-FIN-08 |
| **M25** Funding | Unmatched deposit or late funding after cancelled/expired offer | Dr real bank/Cr unidentified or pending obligation; case/refund; no revenue or silent transfer resurrection | KITA-FUND-07 |
| **M26** Funding | Second funding session with different key while first is pending/unknown | One unresolved collection authority; return existing recovery reference or conflict, never charge twice | KITA-FUND-05, KITA-TX-01 |
| **M27** Payout/FX | Normal settled ACH→FX→prefund debit→recipient credit | E4 J01–J09 exactly once; all per-currency books balance; earn fee/margin only at delivered evidence | KITA-PAY-01, KITA-PAY-03, KITA-FIN-01 |
| **M28** Payout/FX | Provider says accepted/pending, wallet capacity rejection, wrong phone network | Accepted is not paid; exact recipient validation required; rejected before debit has no fabricated transit journal | KITA-PAY-03, KITA-REC-02 |
| **M29** Payout/FX | 100 concurrent accepts consume last prefund including payout fee and buffer | Only covered obligations accepted; available cash nonnegative; expected inbound and processor reserve excluded | KITA-FIN-05, KITA-PAY-01 |
| **M30** Payout/FX | Stale/mismatched provider available balance vs ledger, holiday/cutoff, amount limit | Conservative reconciled availability; pause new exposure; correct promise calendar; no splitting to evade limits | KITA-PAY-02, KITA-FIN-05 |
| **M31** Payout/FX | Provider accepts then connection drops; attempt remains unknown | Keep original authority/reservation; original-reference inquiry; no failover to second provider | KITA-PAY-01, KITA-PLAT-03 |
| **M32** Payout/FX | Authenticated final rejection/cancel plus proven no debit or actual returned cash | Safe new route only after current checks and independent approval; release old liquidity only when supported; reserve new before submit | KITA-PAY-01, KITA-ADM-06 |
| **M33** Payout/FX | Provider temporary not-found during propagation or inquiry timeout | Remain unknown; no negative proof/fresh key/reroute; escalation after5min does not fabricate failure | KITA-PAY-01, KITA-PAY-05 |
| **M34** Payout/FX | Hold commits just before vs just after dispatch linearization | Before: zero remote call. After: in-flight status+cancel/inquiry; cannot promise stop. Two holds resolve independently | KITA-ADM-03, KITA-KYC-05 |
| **M35** Payout/FX | Old worker lease expires, new generation wins; old result returns late | Fence stale DB mutation; append verified evidence for reducer; never use lease expiry alone to authorize remote resend | KITA-PLAT-03, KITA-PAY-01 |
| **M36** Payout/FX | Crash between provider create and confirm, after confirm before DB write | Recover both external identities; inquiry before retry; no second economic payment | KITA-PAY-01, KITA-PLAT-03 |
| **M37** Payout/FX | FX trade timeout, accepted unsettled trade, rate/amount deviation | Unknown trade inquired under original identity; no second buy; bridge positions only from supported facts | KITA-FIN-06, KITA-QUOTE-06 |
| **M38** Payout/FX | FX definitive no-trade vs trade settled then payout fails | No nonexistent trade/reversal in first case; actual bridges/prefund/unwind and corporate gain/loss in second | KITA-FIN-06, KITA-TX-06 |
| **M39** Payout/FX | Paid callback precedes debit evidence, late pending after paid, amount/currency/beneficiary mismatch | Attested implication only under certified map; otherwise case for missing movement. Never regress paid or accept mismatched evidence | KITA-PAY-03, KITA-PLAT-04 |
| **M40** Payout/FX | Cash ready-for-pickup→collected; expiry before collection; delayed collection after expiry | Ready != delivered; receipt secret protected; expiry alone no refund cash; late collection investigated | KITA-PAY-04 |
| **M41** Payout/FX | Post-delivery40% return PHP11484, duplicate/over-cap return | New return event; preserve original delivery; principal200USD/fee1.60 allocation; one cumulative return, reject excess | KITA-PAY-05, KITA-FIN-02 |
| **M42** Cancellation/refund | Cancel before any collection or FX | Release reservations, void verified auth if supported; no money journal for money never collected | KITA-TX-05 |
| **M43** Cancellation/refund | Cancel funded transfer before FX | E7 Dr principal/pending500+deferred fee3.99/Cr refund payable503.99 once; actual debit and refund completion distinct | KITA-TX-05, KITA-TX-06 |
| **M44** Cancellation/refund | Cancel after FX before delivery; recovered PHP sold at57 vs59 | E8 exact503.99 sender obligation; treasury gain8.68 or loss8.39 separate; no undisclosed FX loss to sender | KITA-TX-05, KITA-TX-06, KITA-FIN-06 |
| **M45** Cancellation/refund | Cancel at US policy boundary and provider delivered at request time; phone/after-hours intake | Persist original receipt timestamp; approved legal-calendar decision; no stale UI precondition rejection; preserve investigation evidence | KITA-TX-05, KITA-TX-07 |
| **M46** Cancellation/refund | Provider outcome unknown near remedy deadline | Corporate-funded independently authorized remedy if owed; original payable/transit retained; later recovery cannot create second refund | KITA-TX-06, KITA-TX-07, KITA-FIN-08 |
| **M47** Cancellation/refund | Two concurrent partial refunds; randomized partitions then final refund | Aggregate allocations including pending/unknown stay within entitlement; cumulative rounding exhausts399cent fee exactly; no per-request drift | KITA-TX-06, KITA-FIN-02 |
| **M48** Cancellation/refund | Refund timeout, failure before debit, failure after debit, actual return, retry | Unknown holds reservation; payable survives failure; transit retained until returned cash; new attempt only after definite nonpayment | KITA-TX-06 |
| **M49** Cancellation/refund | Refund races ACH return/chargeback/partner return; actual double credit occurs | No automatic second credit; lock entitlement/all allocations. Real overlap booked recovery/loss and reviewed, never hidden by netting | KITA-FIN-08, KITA-TX-06 |
| **M50** Cancellation/refund | Refund fee with points/promo discount, tax already remitted, goodwill or alternate destination | Refund collected money plus lawful remedy only; restore subsidy separately; tax recovery mapped; goodwill funded and alternate destination independently approved | KITA-TX-06, KITA-GROW-03, KITA-FIN-02 |
| **M51** Cancellation/refund | Sanctions-blocked property, expired reviewer approval or unauthorized original-instrument change | No automatic refund bypass; counsel-directed release process; deadline case/escalation retained | KITA-ADM-04, KITA-TX-06 |
| **M52** Cancellation/refund | Error received at180day boundary, notice/investigation/remedy calendars and support handoff | Versioned counsel-approved ordinary/exception rules applied; received time never reset; evidence of notices and election retained | KITA-TX-07, KITA-TX-08 |
| **M53** Ledger | Attempt empty,one-line,unbalanced-per-currency,USD/PHP-offsetting,wrong-book/account/currency journals | DB rejects at commit; no balance/outbox partial writes; balanced sum across currencies cannot hide local imbalance | KITA-FIN-01, KITA-PLAT-02 |
| **M54** Ledger | Update/delete posted header/line/account; append to committed journal; runtime direct DML | Database/role boundary denies all; auditor read-only; immutable financial identity retained | KITA-FIN-01, KITA-ADM-11 |
| **M55** Ledger | Same event key same body vs changed body under100 concurrent writers | One exact journal; changed hash conflict; no duplicated balance projection; ordered locks avoid unsafe deadlock recovery | KITA-FIN-01, KITA-PLAT-03 |
| **M56** Ledger | Full reversal twice, nonnegating reversal, partial correction without allocation/approval | Only exact one full reversal; template/entitlement checks plus cumulative partial cap; balanced arbitrary journal is still unauthorized | KITA-FIN-02, KITA-ADM-06 |
| **M57** Ledger | Closed period/backdate, expired posting policy, mismatched evidence/transfer/template, unauthorized posting role | Deny via T-LEDGER-02 controls; late evidence uses current open posting period with original effective time | KITA-FIN-07, KITA-FIN-01 |
| **M58** Ledger | Rebuild all balance caches after randomized histories and compare every account/currency/book | Exact equality to full journal history; drift disables affected new authorizations and alerts; no last1000-row integrity shortcut | KITA-FIN-01, KITA-FIN-03 |
| **M59** Ledger | Real opening capital vs sandbox/demo balances, cross-book transfer proposal | Only independent bank/provider evidence supports real opening journal; no sandbox import; no implicit interentity netting | KITA-PLAT-02, KITA-FIN-01 |
| **M60** Wallet | Two simultaneous spends/withdrawals/conversions of last wallet units | Atomic available→reserved/obligation; one succeeds or both within total; no negative available/pending/reserved | KITA-WAL-03, KITA-WAL-04, KITA-WAL-05 |
| **M61** Wallet | Real top-up pending/settled/returned and restricted/closing wallet | No fake top-up; pending release only after policy/evidence; recover return separately; closure preserves lawful redemption | KITA-WAL-01, KITA-WAL-02, KITA-WAL-05 |
| **M62** Wallet | Cross-currency conversion and same-book P2P with either party restricted | Balanced per-currency asset/liability bridges; exact quoted receive; both parties screened; cross-book disabled without settlement policy | KITA-WAL-04, KITA-WAL-06 |
| **M63** Growth | Duplicate earn/vest callbacks, return before vest, after vest and after redemption | One paired points event per source/rule; reverse source-linked lots; noncash debt if consumed; never seize unrelated fiat | KITA-GROW-01, KITA-GROW-09 |
| **M64** Growth | Concurrent points reserve/redeem/expiry using oldest expiring lots | No double spend; only vested/unexpired available units; reserve campaign cost atomically; reserved expiry released safely | KITA-GROW-02 |
| **M65** Growth | Concurrent final campaign budget, code+points stacking, failure/cancel/partial refund | Budget never overspent; launch precedence enforced; discount<=fee; safe release/consume exactly once; financial subsidy reconciles | KITA-GROW-03 |
| **M66** Growth | Self-referral, duplicate/referrer change, shared household/device and qualification refund | One referrer/first qualified transfer; self blocked; shared signals reviewed, not assumed fraud; vest/caps/reversal policy enforced | KITA-GROW-04 |
| **M67** Growth | Stale/oscillating rate, threshold crossing, cooldown/rearm/expiry and notification retries | Basis-specific alert once; no money action or stale rate execution; each channel event/template deduped | KITA-GROW-05, KITA-GROW-07 |
| **M68** Growth | Auto-conversion trigger races revoke, rate deterioration, insufficient wallet and unknown execution | Mandate bounds and version checked atomically; revoked-before-reserve wins; after execution tracks in-flight; one occurrence, no bank debit from alert | KITA-GROW-06 |
| **M69** Growth | DST repeated/skipped wall time, leap/month-end, recurring retry, missing consent, cancel future occurrence | One(schedule,occurrenceUTC); approved calendar; missing consent/funding skips+notifies; no catch-up debit or cancelling paid occurrence | KITA-TX-10 |
| **M70** Growth | Marketing opt-out, quiet hours, bounced service notice, provider unknown send | Consent/category respected; required notice has alternative evidence-backed channel/escalation; no invented delivery | KITA-GROW-07, KITA-GROW-08 |
| **M71** Bills/business | Biller schema changed, duplicate account-period, accepted vs posted, partial/reversed posting | New validation/consent where material; duplicate review; only final posting proof completes; refund and case track actual reversal | KITA-PAY-06 |
| **M72** Bills/business | Personal KYC reused as KYB, changed beneficial owner/signatory, batch file/hash edit | Business remains blocked until KYB/signatory policy; edits invalidate approval; no personal approval bypass | KITA-EXT-03, KITA-EXT-04 |
| **M73** Bills/business | Batch partly paid then crash/retry; CSV formula/injection and duplicate rows | Paid items remain paid; only definitive unsubmitted items retried under original IDs; bounded file validation and formula-safe exports | KITA-EXT-04 |
| **M74** Treasury optional | Stablecoin wrong contract/network/decimals/address, duplicate transaction/nonce | Disabled launch; when approved, atomic-unit policy and allowlists gate execution; no retry on alternate chain | KITA-EXT-02 |
| **M75** Treasury optional | Chain pending/reorg, custody mismatch, depeg>0.5%, off-ramp delayed | No available PHP from chain receipt; freeze affected liquidity and append compensating events; real PHP settlement/fiat refund reserve required | KITA-EXT-02, KITA-FIN-05 |
| **M76** Ingress/recovery | Invalid/rotated/expired signature, wrong account/environment, timestamp/replay/body size | Reject unauthenticated event, no posting; rotation overlap tested; raw bytes verified before parse; unsigned hint triggers authenticated inquiry only | KITA-PLAT-04 |
| **M77** Ingress/recovery | Duplicate delivery same hash, same ID changed hash, different delivery IDs same economic movement | Ack duplicate once; changed hash quarantine/security case; economic movement dedup prevents second journal | KITA-PLAT-04, KITA-PLAT-03 |
| **M78** Ingress/recovery | Reordered/late/unknown provider statuses and malformed amount/currency/beneficiary | Store evidence/quarantine; safe reducer does not regress or fabricate financial fact; return is distinct event | KITA-PLAT-04, KITA-PAY-05 |
| **M79** Ingress/recovery | DB/object storage down before durable inbox acknowledgment | No2xx before durable evidence/inbox;503 requests retry; orphan encrypted object can be collected safely with no money effect | KITA-PLAT-04 |
| **M80** Ingress/recovery | Crash after outbox commit before send, after queue send before marked published, after consumer commit before ack | At-least-once transport, one committed economic effect via consumer/event identities; no lost authorized work | KITA-PLAT-03 |
| **M81** Ingress/recovery | Timer/DLQ lease expiry, restart, stale generation, replay changed payload/key | Deadlines survive; stale timer no-op; approved replay preserves payload and identities; unknown payment inquires only | KITA-PLAT-05 |
| **M82** Ingress/recovery | 429/5xx/Retry-After, provider rate limit and noisy retry storm | Bounded jitter/backoff; provider-safe same-key retries only; refund/deadline queues not starved | KITA-PLAT-03, KITA-PLAT-06 |
| **M83** Compliance/admin | KYC capture success without decision, expired/revoked approval, screening outage/new list hit | No clearance from UI; stale/absent screening holds; list update before dispatch stops payout | KITA-KYC-01, KITA-KYC-02, KITA-KYC-04, KITA-KYC-05 |
| **M84** Compliance/admin | Concurrent risk/velocity/EDD limits across shared customer/instrument/recipient | Atomic buckets and exposure; no aggregate breach; bounded false-positive review and immutable evidence | KITA-KYC-06 |
| **M85** Compliance/admin | Maker approves with second login of same person; approval hash/state/version/evidence changes; expiry/revoked role | Person-level separation; no stale/excess-value/expired approval execution; exactly one consumed approval/audit | KITA-ADM-05, KITA-ADM-10 |
| **M86** Compliance/admin | Every action×role×entity×value×assurance; customer token on admin and staff token on worker route | Default deny; no privilege by UI or broad role; access/reveal distinct; runtime endpoints lack mark-paid/edit-balance | KITA-ADM-01, KITA-ADM-04, KITA-ADM-06 |
| **M87** Compliance/admin | Support reads AML filing/RFI cause; PII reveal without step-up/reason/expiry; export/download IDOR | Confidential details absent, reveal purpose-scoped and audited, links expire, exports masked/formula-safe | KITA-KYC-07, KITA-TX-09, KITA-ADM-09 |
| **M88** Compliance/admin | Manual paid screenshot/forged statement/unreviewed evidence intake | Proposal cannot mark paid; independent verified provenance, exact amount/destination, reducer and typed journal required | KITA-ADM-07 |
| **M89** Compliance/admin | Price/route/campaign release lacks simulation/approval; rollback and queued old policy | Only approved effective policy for new quote; accepted terms remain; forward rollback; dispatch rechecks permissions | KITA-ADM-08 |
| **M90** Compliance/admin | Emergency stop races submission and later reenable | New exposure halted; in-flight tracked; inquiries/returns/lawful remedies continue; reenable requires independent current evidence | KITA-ADM-12 |
| **M91** Reconciliation | Missing/extra/duplicate statements/lines, net fees/reserves, timing, FX and unknown cash | Three-way exact matching; all eight J2 break classes assigned; no silent tolerance or duplicate import | KITA-FIN-03, KITA-FIN-04 |
| **M92** Reconciliation | Concurrent one-to-many/many-to-one allocations and force-match attempt | Sum caps locked; zero-minor tolerance; unresolved difference stays case; correction links approved journal/evidence | KITA-FIN-03, KITA-FIN-04 |
| **M93** Reconciliation | Daily close eligible-assets shortfall, month-end late entries, reward provision/unit economics | Block exposure on shortfall; approved valuation/period policy; current-period corrections; forecast distinct from actual | KITA-FIN-07, KITA-GROW-09 |
| **M94** Reconciliation | Net FX trade allocations across many transfers and rounding residual | Cost allocations sum exactly actual trade; deterministic largest remainder then ID; no change to customer receive | KITA-FIN-06 |
| **M95** Platform/security | Production bundle/env/endpoint scan for addSandboxFunds,simulatePartnerCompletion,forced complete,test KYC,fixtures/Kimi/MySQL | Fail build/startup; missing credentials/certification yields unavailable, not fake success; no sandbox import | KITA-PLAT-01, KITA-PLAT-02, KITA-PLAT-07 |
| **M96** Platform/security | Restore older DB after remote payment; old worker/provider credentials still usable | No new submissions until former writer fenced and uncertainty window externally reconstructed/reconciled; lost row != no payment | KITA-PLAT-08 |
| **M97** Platform/security | Backup/key rotation/audit tamper, concurrent hash anchors, missing WORM page | Restore and verify full balances/anchors; separate archive detects tamper; alert named on-call; no unaudited privileged mutation | KITA-ADM-11, KITA-PLAT-08 |
| **M98** Platform/security | Load100commands/s,20accept/s,200reads/s,2000tracking clients and3×bursts with hot account/campaign/prefund | Meet A7/K SLOs under actual contention, retain exact ledger invariants and deadlines, no duplicate payment at overload | KITA-PLAT-06, KITA-PLAT-10 |
| **M99** Platform/security | XSS/CSRF/SSRF/BOLA/SQLi/file malware/CSV injection/log PII/hostile deep links/token reuse | Security regression suite rejects attacks; quarantine protects analysts; no credential/PII in bundles/logs/URLs | KITA-KYC-03, KITA-AUTH-07, KITA-PLAT-09 |
| **M100** Platform/security | US disabled state and all CA/GB/EU/EEA/JP/SG/AU disabled tuples; stale capability approval | No quote acceptance/funding/dispatch; show unavailable; currencies/regions not mistaken for countries | KITA-PUB-03, KITA-EXT-01 |
| **M101** Client/access | Keyboard/screen-reader flow,200% zoom,360/375/768/1024/1440px,low-end mobile/offline after submit | Kita tokens/contrast, exact currency speech, en/fil retained consent, no optimistic paid or offline money queue; resume original operation | KITA-PUB-01, KITA-PUB-05, KITA-PUB-06, KITA-AUTH-07 |
| **M102** Client/access | Contact unverified, expired/revoked session, new-device recovery, passkey loss | No money authorization; safe recovery preserves24h high-risk restriction unless approved equivalent procedure; revoked refresh chain fails | KITA-AUTH-01, KITA-AUTH-02, KITA-AUTH-03, KITA-AUTH-04, KITA-AUTH-05 |
| **M103** Client/access | Closure/privacy deletion with pending payout/refund/legal hold and archived recipient | No loss of obligations/history; lawful record retention, deletable PII removal; scope and legal hold enforced | KITA-AUTH-06, KITA-REC-03, KITA-PLAT-09 |
| **M104** Client/access | Pagination/filter changes/new rows/replica lag and old receipt after policy update | Stable scoped cursor; freshness displayed; receipt immutable hash/version/locale; dashboard never authorizes money | KITA-TX-03, KITA-TX-04, KITA-ADM-02 |

## L3. Feature acceptance index

Each test below must perform its mapped scenarios and assert the stated feature invariant. Paths are planned test artifacts; their presence here does not claim the files already exist. Cross-cutting scenarios are implemented once in reusable harnesses and called by feature suites; do not duplicate financial logic into104 separate test implementations. Feature-only UI behavior has separate accessible end-to-end checks.

| Feature | Required named test / planned file | Scenario coverage | Acceptance oracle |
|---|---|---|---|
| KITA-PUB-01 | `TEST-PUB-01` — `tests/acceptance/pub-01.spec.ts` | M101 | Unapproved license or partner claim is absent |
| KITA-PUB-02 | `TEST-PUB-02` — `tests/acceptance/pub-02.spec.ts` | M01, M05 | Stale feed labels estimate and cannot yield executable transfer |
| KITA-PUB-03 | `TEST-PUB-03` — `tests/acceptance/pub-03.spec.ts` | M100 | Disabled US state or origin cannot accept money |
| KITA-PUB-04 | `TEST-PUB-04` — `tests/acceptance/pub-04.spec.ts` | M01 | Fee and deadline agree with accepted terms |
| KITA-PUB-05 | `TEST-PUB-05` — `tests/acceptance/pub-05.spec.ts` | M101 | Receipt and consent retain chosen language |
| KITA-PUB-06 | `TEST-PUB-06` — `tests/acceptance/pub-06.spec.ts` | M101 | Keyboard and screen reader flow passes at all required widths |
| KITA-AUTH-01 | `TEST-AUTH-01` — `tests/acceptance/auth-01.spec.ts` | M102 | Unverified contact cannot authorize transfer |
| KITA-AUTH-02 | `TEST-AUTH-02` — `tests/acceptance/auth-02.spec.ts` | M15, M102 | Revoked token cannot continue financial command |
| KITA-AUTH-03 | `TEST-AUTH-03` — `tests/acceptance/auth-03.spec.ts` | M102 | New destination needs fresh assurance |
| KITA-AUTH-04 | `TEST-AUTH-04` — `tests/acceptance/auth-04.spec.ts` | M102 | Recovery cannot bypass new-destination hold |
| KITA-AUTH-05 | `TEST-AUTH-05` — `tests/acceptance/auth-05.spec.ts` | M102 | Revoked device cannot refresh token |
| KITA-AUTH-06 | `TEST-AUTH-06` — `tests/acceptance/auth-06.spec.ts` | M103 | Closure preserves outstanding refund and lawful records |
| KITA-AUTH-07 | `TEST-AUTH-07` — `tests/acceptance/auth-07.spec.ts` | M99, M101 | Expired key or hostile deep link requires safe reauthentication |
| KITA-KYC-01 | `TEST-KYC-01` — `tests/acceptance/kyc-01.spec.ts` | M19, M83 | Capture callback alone never approves customer |
| KITA-KYC-02 | `TEST-KYC-02` — `tests/acceptance/kyc-02.spec.ts` | M83 | Later adverse decision blocks new payout |
| KITA-KYC-03 | `TEST-KYC-03` — `tests/acceptance/kyc-03.spec.ts` | M99 | Infected upload never reaches analyst viewer |
| KITA-KYC-04 | `TEST-KYC-04` — `tests/acceptance/kyc-04.spec.ts` | M83 | Unavailable or stale list cannot silently pass |
| KITA-KYC-05 | `TEST-KYC-05` — `tests/acceptance/kyc-05.spec.ts` | M34, M83 | New list hit stops queued payout before dispatch |
| KITA-KYC-06 | `TEST-KYC-06` — `tests/acceptance/kyc-06.spec.ts` | M84 | Concurrent transfers cannot exceed aggregate limit |
| KITA-KYC-07 | `TEST-KYC-07` — `tests/acceptance/kyc-07.spec.ts` | M87 | Support cannot read AML filing or confidential rationale |
| KITA-REC-01 | `TEST-REC-01` — `tests/acceptance/rec-01.spec.ts` | M14 | Ownership/name/account validation enforced server-side |
| KITA-REC-02 | `TEST-REC-02` — `tests/acceptance/rec-02.spec.ts` | M28 | Wrong network or expired validation blocks payout |
| KITA-REC-03 | `TEST-REC-03` — `tests/acceptance/rec-03.spec.ts` | M07, M103 | Old transfer snapshot survives destination edit |
| KITA-REC-04 | `TEST-REC-04` — `tests/acceptance/rec-04.spec.ts` | M10 | Repeat obtains new quote and never replays old payment |
| KITA-QUOTE-01 | `TEST-QUOTE-01` — `tests/acceptance/quote-01.spec.ts` | M01, M03 | 500 USD fixture yields exact 28710 PHP and 503.99 USD total |
| KITA-QUOTE-02 | `TEST-QUOTE-02` — `tests/acceptance/quote-02.spec.ts` | M02, M03, M09 | JPY and USD inversion deliver requested minor amount exactly |
| KITA-QUOTE-03 | `TEST-QUOTE-03` — `tests/acceptance/quote-03.spec.ts` | M04 | Tier boundary discount and tax totals are exact |
| KITA-QUOTE-04 | `TEST-QUOTE-04` — `tests/acceptance/quote-04.spec.ts` | M05, M09 | Stale quote unavailable; no cached execution fallback |
| KITA-QUOTE-05 | `TEST-QUOTE-05` — `tests/acceptance/quote-05.spec.ts` | M06, M07 | Expiry equality or recipient change produces conflict |
| KITA-QUOTE-06 | `TEST-QUOTE-06` — `tests/acceptance/quote-06.spec.ts` | M08, M37 | Wholesale deterioration changes corporate cost not customer promise |
| KITA-QUOTE-07 | `TEST-QUOTE-07` — `tests/acceptance/quote-07.spec.ts` | M01 | Display rounding never changes execution arithmetic |
| KITA-QUOTE-08 | `TEST-QUOTE-08` — `tests/acceptance/quote-08.spec.ts` | M10 | Stale draft version cannot overwrite newer recipient/amount |
| KITA-TX-01 | `TEST-TX-01` — `tests/acceptance/tx-01.spec.ts` | M11, M12, M13, M26 | Double tap and different keys on one quote create one transfer |
| KITA-TX-02 | `TEST-TX-02` — `tests/acceptance/tx-02.spec.ts` | M15 | Late return preserves paid history |
| KITA-TX-03 | `TEST-TX-03` — `tests/acceptance/tx-03.spec.ts` | M14, M104 | Stable cursor cannot expose another customer records |
| KITA-TX-04 | `TEST-TX-04` — `tests/acceptance/tx-04.spec.ts` | M104 | Old receipt unchanged after pricing update |
| KITA-TX-05 | `TEST-TX-05` — `tests/acceptance/tx-05.spec.ts` | M42, M43, M44, M45 | Receipt timestamp and actual delivery determine eligible remedy |
| KITA-TX-06 | `TEST-TX-06` — `tests/acceptance/tx-06.spec.ts` | M38, M43, M44, M46, M47, M48, M49, M50, M51 | Concurrent partial refunds cannot exceed entitlement |
| KITA-TX-07 | `TEST-TX-07` — `tests/acceptance/tx-07.spec.ts` | M45, M46, M52 | Support handoff never resets original statutory clock |
| KITA-TX-08 | `TEST-TX-08` — `tests/acceptance/tx-08.spec.ts` | M52 | Wrong account cannot read or attach case evidence |
| KITA-TX-09 | `TEST-TX-09` — `tests/acceptance/tx-09.spec.ts` | M87 | Confidential risk details absent from public projection |
| KITA-TX-10 | `TEST-TX-10` — `tests/acceptance/tx-10.spec.ts` | M69 | DST retry produces one authorized occurrence |
| KITA-FUND-01 | `TEST-FUND-01` — `tests/acceptance/fund-01.spec.ts` | M19 | No raw PAN/CVV in app server logs or DB |
| KITA-FUND-02 | `TEST-FUND-02` — `tests/acceptance/fund-02.spec.ts` | M16 | Initiation alone cannot authorize payout |
| KITA-FUND-03 | `TEST-FUND-03` — `tests/acceptance/fund-03.spec.ts` | M17, M18 | Authorization posts no cash and capture remains receivable |
| KITA-FUND-04 | `TEST-FUND-04` — `tests/acceptance/fund-04.spec.ts` | M20 | Unapproved method fails closed |
| KITA-FUND-05 | `TEST-FUND-05` — `tests/acceptance/fund-05.spec.ts` | M12, M21, M26 | Timeout after debit never creates second charge |
| KITA-FUND-06 | `TEST-FUND-06` — `tests/acceptance/fund-06.spec.ts` | M22, M23, M24 | Paid PHP persists with separate loss/recovery |
| KITA-FUND-07 | `TEST-FUND-07` — `tests/acceptance/fund-07.spec.ts` | M25 | Unowned cash remains suspense not revenue |
| KITA-PAY-01 | `TEST-PAY-01` — `tests/acceptance/pay-01.spec.ts` | M27, M29, M31, M32, M33, M35, M36 | Unknown first provider blocks second payout |
| KITA-PAY-02 | `TEST-PAY-02` — `tests/acceptance/pay-02.spec.ts` | M30 | Cutoff/holiday and amount cannot be bypassed by splitting |
| KITA-PAY-03 | `TEST-PAY-03` — `tests/acceptance/pay-03.spec.ts` | M27, M28, M39 | Accepted request is not recipient credited |
| KITA-PAY-04 | `TEST-PAY-04` — `tests/acceptance/pay-04.spec.ts` | M40 | Available and collected differ; expiry alone never fabricates return |
| KITA-PAY-05 | `TEST-PAY-05` — `tests/acceptance/pay-05.spec.ts` | M33, M41, M78 | Returned amount capped and original delivered timestamp preserved |
| KITA-PAY-06 | `TEST-PAY-06` — `tests/acceptance/pay-06.spec.ts` | M71 | Aggregator accepted does not mark bill paid |
| KITA-WAL-01 | `TEST-WAL-01` — `tests/acceptance/wal-01.spec.ts` | M61 | Projection and ledger agree per currency |
| KITA-WAL-02 | `TEST-WAL-02` — `tests/acceptance/wal-02.spec.ts` | M61 | No funds credited without real settlement/approved risk evidence |
| KITA-WAL-03 | `TEST-WAL-03` — `tests/acceptance/wal-03.spec.ts` | M60 | Two simultaneous spends cannot overdraw |
| KITA-WAL-04 | `TEST-WAL-04` — `tests/acceptance/wal-04.spec.ts` | M60, M62 | Four currency legs balance and exact target obligation is funded |
| KITA-WAL-05 | `TEST-WAL-05` — `tests/acceptance/wal-05.spec.ts` | M60, M61 | Failed refund retains obligation; closure cannot lose remaining funds |
| KITA-WAL-06 | `TEST-WAL-06` — `tests/acceptance/wal-06.spec.ts` | M62 | Both parties screened; cross-book unsupported without settlement policy |
| KITA-GROW-01 | `TEST-GROW-01` — `tests/acceptance/grow-01.spec.ts` | M63 | Duplicate payout callback awards once |
| KITA-GROW-02 | `TEST-GROW-02` — `tests/acceptance/grow-02.spec.ts` | M64 | Concurrent redemption/expiry cannot overspend lot |
| KITA-GROW-03 | `TEST-GROW-03` — `tests/acceptance/grow-03.spec.ts` | M04, M50, M65 | Last budget unit reserved by one transfer only |
| KITA-GROW-04 | `TEST-GROW-04` — `tests/acceptance/grow-04.spec.ts` | M66 | Self-referral blocked and household signal reviewed |
| KITA-GROW-05 | `TEST-GROW-05` — `tests/acceptance/grow-05.spec.ts` | M67 | Oscillating or stale rate does not spam or execute money |
| KITA-GROW-06 | `TEST-GROW-06` — `tests/acceptance/grow-06.spec.ts` | M68 | Revocation race serializes before conversion reservation |
| KITA-GROW-07 | `TEST-GROW-07` — `tests/acceptance/grow-07.spec.ts` | M67, M70 | Duplicate event gives one intended message per channel |
| KITA-GROW-08 | `TEST-GROW-08` — `tests/acceptance/grow-08.spec.ts` | M70 | Marketing opt-out suppresses campaign but preserves necessary service notices |
| KITA-GROW-09 | `TEST-GROW-09` — `tests/acceptance/grow-09.spec.ts` | M63, M93 | Issued/vested/redeemed/expired totals reconcile to provision |
| KITA-ADM-01 | `TEST-ADM-01` — `tests/acceptance/adm-01.spec.ts` | M14, M86 | Customer token and unrelated entity denied |
| KITA-ADM-02 | `TEST-ADM-02` — `tests/acceptance/adm-02.spec.ts` | M104 | Paginated queue shows deadlines and freshness |
| KITA-ADM-03 | `TEST-ADM-03` — `tests/acceptance/adm-03.spec.ts` | M34 | Hold before dispatch wins; after dispatch recorded in-flight |
| KITA-ADM-04 | `TEST-ADM-04` — `tests/acceptance/adm-04.spec.ts` | M51, M86 | Unqualified role cannot override blocked-property restriction |
| KITA-ADM-05 | `TEST-ADM-05` — `tests/acceptance/adm-05.spec.ts` | M85 | Second login of same person cannot approve |
| KITA-ADM-06 | `TEST-ADM-06` — `tests/acceptance/adm-06.spec.ts` | M32, M56, M86 | Stale payload and unauthorized accounts fail |
| KITA-ADM-07 | `TEST-ADM-07` — `tests/acceptance/adm-07.spec.ts` | M88 | No manual paid result without verified evidence and reviewer |
| KITA-ADM-08 | `TEST-ADM-08` — `tests/acceptance/adm-08.spec.ts` | M89 | Existing quote unchanged and new quote uses approved effective version |
| KITA-ADM-09 | `TEST-ADM-09` — `tests/acceptance/adm-09.spec.ts` | M87 | Reveal step-up/reason/audit and expiry enforced |
| KITA-ADM-10 | `TEST-ADM-10` — `tests/acceptance/adm-10.spec.ts` | M85 | Revoked approver cannot execute queued request |
| KITA-ADM-11 | `TEST-ADM-11` — `tests/acceptance/adm-11.spec.ts` | M54, M97 | Concurrent hash anchors verified against independent archive |
| KITA-ADM-12 | `TEST-ADM-12` — `tests/acceptance/adm-12.spec.ts` | M90 | New commands stop but inquiries and legal remedies continue |
| KITA-FIN-01 | `TEST-FIN-01` — `tests/acceptance/fin-01.spec.ts` | M17, M27, M53, M54, M55, M57, M58, M59 | Empty/unbalanced/cross-currency/edited journal rejected |
| KITA-FIN-02 | `TEST-FIN-02` — `tests/acceptance/fin-02.spec.ts` | M41, M47, M50, M56 | Cumulative partial fees sum exactly on final refund |
| KITA-FIN-03 | `TEST-FIN-03` — `tests/acceptance/fin-03.spec.ts` | M58, M91, M92 | Missing/duplicate/fee/FX/timing breaks classified |
| KITA-FIN-04 | `TEST-FIN-04` — `tests/acceptance/fin-04.spec.ts` | M91, M92 | Force match impossible; correction links approved journal |
| KITA-FIN-05 | `TEST-FIN-05` — `tests/acceptance/fin-05.spec.ts` | M18, M29, M30, M75 | Concurrent transfers cannot spend same last prefund |
| KITA-FIN-06 | `TEST-FIN-06` — `tests/acceptance/fin-06.spec.ts` | M08, M37, M38, M44, M94 | Trade allocations equal actual cost and no customer terms drift |
| KITA-FIN-07 | `TEST-FIN-07` — `tests/acceptance/fin-07.spec.ts` | M57, M93 | Closed period cannot receive unauthorized backdated posting |
| KITA-FIN-08 | `TEST-FIN-08` — `tests/acceptance/fin-08.spec.ts` | M22, M23, M24, M46, M49 | No second automatic customer credit for same entitlement |
| KITA-PLAT-01 | `TEST-PLAT-01` — `tests/acceptance/plat-01.spec.ts` | M03, M95 | Exact patched locks and no server secrets in client bundle |
| KITA-PLAT-02 | `TEST-PLAT-02` — `tests/acceptance/plat-02.spec.ts` | M53, M59, M95 | Fresh install works and sandbox balances never become live cash |
| KITA-PLAT-03 | `TEST-PLAT-03` — `tests/acceptance/plat-03.spec.ts` | M13, M31, M35, M36, M55, M77, M80, M82 | Crash at every commit/send/ack boundary preserves one economic effect |
| KITA-PLAT-04 | `TEST-PLAT-04` — `tests/acceptance/plat-04.spec.ts` | M39, M76, M77, M78, M79 | Same ID changed body quarantined; invalid signature cannot post |
| KITA-PLAT-05 | `TEST-PLAT-05` — `tests/acceptance/plat-05.spec.ts` | M06, M81 | Restart preserves deadlines and replay preserves original key |
| KITA-PLAT-06 | `TEST-PLAT-06` — `tests/acceptance/plat-06.spec.ts` | M82, M98 | Alerts reach named on-call without PII leaks |
| KITA-PLAT-07 | `TEST-PLAT-07` — `tests/acceptance/plat-07.spec.ts` | M20, M95 | Production fails startup on sandbox capability or fixture adapter |
| KITA-PLAT-08 | `TEST-PLAT-08` — `tests/acceptance/plat-08.spec.ts` | M96, M97 | Old writer fenced and uncertain external payments reconciled before reopen |
| KITA-PLAT-09 | `TEST-PLAT-09` — `tests/acceptance/plat-09.spec.ts` | M99, M103 | Legal hold preserves required records; deletable PII removed |
| KITA-PLAT-10 | `TEST-PLAT-10` — `tests/acceptance/plat-10.spec.ts` | M98 | No critical gap or unexplained financial break at launch |
| KITA-EXT-01 | `TEST-EXT-01` — `tests/acceptance/ext-01.spec.ts` | M100 | Unapproved country/state/product remains disabled |
| KITA-EXT-02 | `TEST-EXT-02` — `tests/acceptance/ext-02.spec.ts` | M74, M75 | Wrong network/depeg/reorg cannot produce available PHP cash |
| KITA-EXT-03 | `TEST-EXT-03` — `tests/acceptance/ext-03.spec.ts` | M72 | Individual KYC alone cannot authorize business payout |
| KITA-EXT-04 | `TEST-EXT-04` — `tests/acceptance/ext-04.spec.ts` | M72, M73 | Partial batch preserves paid items and no retry duplicates them |

## L4. Gates and required evidence

| Gate | Owner / phase | Required proof / fail condition |
|---|---|---|
| G00 Source/contract freeze | Product + architect + Sol; before workstream integration | DEP-00 original crosswalk; all104 current feature→operation/task/test mappings; complete migration inventory; no unresolved monetary semantics; OpenAPI references/examples/auth/version compatibility. Missing original spec blocks exact-scope certification |
| G01 Build/source hygiene | Platform + Security; each change | Exact supported patched lockfiles/SDK compatibility with official evidence, types/lint/boundary rules, SBOM/license/secret scans; no Kimi/MySQL/fake money production imports or endpoints. Reverify preexisting version claims in A/K |
| G02 Database/ledger | Controller + financial engineer; each financial change | Fresh/upgrade migrations on target PostgreSQL, deferred constraints and runtime-role negative tests, deterministic E worked journals, property/race tests, full balance recomputation. Zero unexplained minor-unit difference |
| G03 Domain safety | Sol + QA; each money workflow change | Quote/funding/FX/payout/refund/reward/limit/race/unknown suites above, crash boundaries and immutable receipts. Provider instruction counts independently observed |
| G04 Provider certification | Integrations + Operations + Finance; each adapter/version | H5 fixture matrix, vendor API/version/contract hash, raw sanitized exchanges, dedup/nonacceptance/inquiry behavior, callback verifier/rotation and statement matching. No sandbox result represented as production certification |
| G05 Customer/admin/mobile | Product + Accessibility + QA; each client release | Next.js and Expo same typed contracts; en/fil consent/receipts; all D empty/loading/error/review/unknown/returned/offline states; responsive widths, keyboard/screen reader and real device native SDK/security checks. No optimistic paid display |
| G06 Security/privacy/approval | Security + MLRO; release | All operation×role×scope/value/assurance denies, BOLA, maker/checker, confidential AML, upload/CSRF/SSRF/XSS, penetration assessment, retention/legal holds, token/secret rotation. No unresolved critical/high defect affecting money or sensitive data |
| G07 Finance/ops/rights | Controller + Treasury + MLRO + Support; launch/expansion | Three-way reconciliation/statement completeness, eligible-assets coverage, refund/dispute/close/period controls, staffed deadline/cancellation runbooks and supported receipt/notice clocks. No unexplained financial break or unfunded remedy |
| G08 Capacity/failure/recovery | SRE + Finance + Security; launch/material infra change | A7/K SLO load with hot keys,3×burst, provider isolation/fairness, fault injection, monthly restore and quarterly financial recovery evidence, old writer/provider credential fencing, uncertainty-window reconstruction. Infrastructure RTO alone never authorizes financial reopen |
| G09 External activation | Program owner + counsel + provider owners; per tuple | Current scoped DEP-01…DEP-07,09,14,15 evidence and real reserve/bank proof. Optional08/10/11/12 only for relevant product; DEP-00/13 govern source completeness. Disabled capability is tested and cannot be approved via feature flag alone |
| G10 Release/pilot | Release owner + Sol reviewer + independent financial approver | Exact reviewed commit and signed artifact digest; all applicable gates on that same head; forward migration/rollback plan; capped authorized real-money pilot reconciled independently; canary exposure and stop criteria; signed decision |

No gate is waived by code coverage percentage, passing mocks, a balanced but wrong journal, or an operator screenshot. If approved scope excludes an optional method, record its feature IDs as implemented-disabled/unimplemented-disabled, the gate dependency and negative-path evidence; do not label its execution tests passed. All source requirements remain in the backlog.

## L5. Evidence packaging and change gates

Every run records `runId`, commit SHA, artifact digest, schema checksums, OpenAPI hash, test runner/tool versions, fixture/contract/policy hashes, seed/clock/calendar, environment/provider account class, cases executed/skipped and reason, expected/actual journals and instruction count, output artifact hashes, reviewer identity and timestamp. Store redacted evidence under `artifacts/kita/<runId>/` in the future CI artifact store; money/PII evidence goes to the restricted archive, not public CI logs.

Planned commands: `pnpm check:contracts`, `pnpm test:db`, `pnpm test:money`, `pnpm test:concurrency`, `pnpm test:providers`, `pnpm test:e2e`, `pnpm test:mobile`, `pnpm test:security`, `pnpm test:load`, `pnpm drill:restore`, `pnpm gates:release`. T-BASE-01/T-PLAT-10 create these commands; they do not exist merely because the plan names them. Contract lint and documentation structural checks performed by this planning pass are reported separately in COMPLETENESS-PASS.

A reviewer re-runs applicable gates after every fix/rebase/merge affecting the reviewed head. Review approval binds exact head, schema and contracts; new changes invalidate prior evidence. No GitHub merge/deployment is authorized by this document. Failed substantive review returns a concrete fix batch to Qoder; mechanical courtesy cleanup follows the repository operator policy with gates rerun and contributor notice by the authorized coordinator.

## L6. Retained scenario-register crosswalk

The shared [scenario register](evidence/scenarios.json) contains56 prior-session SC IDs. Preserve every ID and its stronger acceptance requirement, including100000 seeded property sequences. These overlap the M scenarios rather than represent56 unrelated happy-path tests. Both sets of IDs must appear in run evidence.

| Retained ID / check | Required result | Method | Detailed scenario IDs |
|---|---|---|---|
| **SC-01** — Per-currency journal property sequences | Generate100000 seeded sequences including USD/PHP/JPY, fees, refunds and reversals; every committed journal balances by book/currency and replay has no new effect | unit/property + real PostgreSQL | M53, M55, M56, M58 |
| **SC-02** — Empty, one-sided, cross-book or wrong-currency journal | Deferred header/line constraints and composite FKs reject; no partial balance projection survives | SQL integration | M53 |
| **SC-03** — Append/update/delete committed journal | Runtime direct write denied; owner trigger blocks mutation; later transaction cannot add lines; full reversal exactly negates original | SQL privileges/invariants | M54, M56 |
| **SC-04** — Money rounding and overflow | G1 golden send/inverse/JPY/tranche/fee/tax/cumulative partial vectors; reject float JSON, precision loss, overflow and excessive decimal places | unit/property | M01, M02, M03, M04, M47 |
| **SC-05** — Concurrent wallet debits | Barrier100 clients spending last available funds; permitted total never exceeds initial balance; failed commands leave no reservation/outbox | multiconnection PostgreSQL | M60 |
| **SC-06** — Concurrent provider liquidity | Two accepted transfers compete for final prefund including fee/buffer; one reservation succeeds; no negative available | multiconnection PostgreSQL | M29, M30 |
| **SC-07** — Customer double tap, same key and new key same quote | One transfer, one economic event and one payout authority; mismatched same-key body409 | API/concurrency | M11, M12 |
| **SC-08** — Quote expiry during confirmation | At expiry equality reject; before expiry transaction commits accepted terms; client clock/timezone never controls | time-controlled integration | M06 |
| **SC-09** — Accepted quote waits90 minutes/days for funding | Accepted binding promise preserved with treasury cost; unaccepted expired quote cannot execute; late uninitiated funds enter remedy flow | workflow/treasury | M08, M25 |
| **SC-10** — Recipient edit/archive during acceptance | Ownership and version conflict; immutable submitted destination unaffected; no re-directed in-flight payment | API/concurrency | M07 |
| **SC-11** — Stale FX/cache/provider unavailable/outlier | No executable quote on stale feed; indicative display marked; disable rates on invalid values; no fabricated fallback | provider fault injection | M05, M09 |
| **SC-12** — Two workers/lease expiry | Only one stable authority; expired submitting lease triggers inquiry, not fresh submit; provider dedup tested | worker concurrency | M35 |
| **SC-13** — Crash before provider call and after acceptance | Restart queries original reference; bounded retry only under contract; one real remote effect | provider fault injection | M13, M31, M36 |
| **SC-14** — Timeout before/after primary acceptance, backup unavailable | Unknown retains reservation, blocks reroute; proven nonacceptance permits independently approved fallback only | adapter certification | M31, M32 |
| **SC-15** — Temporary provider not-found and expired idempotency window | No new instruction until authoritative no-effect proof; repeated inquires keep case visible | adapter certification | M21, M33 |
| **SC-16** — Duplicate, reordered, delayed and equivalent webhooks | Delivery+business dedup; paid never regresses; true later return processed once | inbox/reducer | M77, M78 |
| **SC-17** — Invalid signature/replay/malformed/oversize/changed body same ID | Reject or quarantine with no financial effect; durable valid receipt precedes2xx | ingress security | M76, M77, M79 |
| **SC-18** — Unknown provider code or amount/currency/beneficiary mismatch | Quarantine and case; customer promise unchanged; no automatic success/failure | adapter security | M39, M78 |
| **SC-19** — Outbox send/commit/ack crash and queue purge | Same event republished; consumer effect once; DB sweeper recovers missing queue work | chaos | M80 |
| **SC-20** — Worker restart/DLQ replay/active-transfer deployment | IDs and request hashes preserved, timers survive; replay permission and audit required | chaos/deployment | M81 |
| **SC-21** — Hold/resume races with dispatch | Hold before dispatch commit blocks; later hold records in-flight and cancel inquiry; resolving one hold leaves others | concurrency | M34 |
| **SC-22** — Cancellation versus recipient deposit/pickup | Original request/agent time and actual recipient event govern policy; funded remedy meets signed deadline without erasing exposure | workflow/legal clock | M45, M40 |
| **SC-23** — ACH initiated/settled/returned after delivery | Initiated posts no cash; release only after policy evidence; late return preserves paid and creates recovery/loss | ledger/provider | M16, M22, M23 |
| **SC-24** — Card authorize/capture/net settle/reserve/dispute | Auth no journal; captured receivable; exact gross-to-net fees/reserve; late dispute separate | ledger/provider | M17, M18, M24 |
| **SC-25** — Full and cumulative partial refunds | Cap principal/fees/tax, exact final remainder; duplicate/unknown refunds retain allocation; rejected refund does not extinguish obligation | property/concurrency | M47, M48 |
| **SC-26** — Refund plus chargeback/ACH return overlap | Lock entitlement; no second automatic customer credit; actual double credit is receivable/loss with evidence | ledger/concurrency | M49 |
| **SC-27** — Refund before collection/after FX/after payout | Only actual events reversed; independent corporate remediation if payout not returned; all E7–E10 balances checked | ledger golden | M42, M43, M44, M46, M50 |
| **SC-28** — Payout reject, debit-return, partial return | Liability remains until evidence; returned cash restores asset; original delivery history retained | ledger/provider | M38, M41 |
| **SC-29** — Cash pickup uncollected expiry and late collection | Available not delivered; expiry query/cancellation evidence required; late collected callback investigated | adapter/workflow | M40 |
| **SC-30** — Bills accepted/posted/partial/reversed/duplicate period | Only biller proof completes; individual financial obligations and remediation remain traceable | adapter/workflow | M71 |
| **SC-31** — Maker self-approval through second login | Person-level DB trigger rejects; expired/hash/version mismatched request cannot execute | admin/database | M85 |
| **SC-32** — Support direct finance API/tenant IDOR/audience confusion | Every referenced object scoped; deny and audit; customer token cannot be admin | security matrix | M14, M86 |
| **SC-33** — PII reveal/export and role revocation | Fresh assurance/purpose/audit/expiry; revoked grant stops queued execution; no AML leakage | security matrix | M85, M87 |
| **SC-34** — KYC UI spoof, stale evidence, adverse reversal, SDK tamper | No provider evidence no approval; re-KYC/review holds queued payout; accessible fallback preserved | identity integration | M19, M83, M99 |
| **SC-35** — Screening outage/list update during submission | Fail closed before authorization; new list rescreen stops queued work; no unsupported legal override | compliance concurrency | M34, M83 |
| **SC-36** — Recovery/SIM-swap/new device/new recipient/admin MFA | Risk hold and step-up; recovery does not bypass controls; keystore invalidation reauth tested | web/mobile security | M102 |
| **SC-37** — Campaign last-budget race/code farming | Atomic caps and entitlement; failure releases; no principal reduction; policy stacking deterministic | property/concurrency | M65 |
| **SC-38** — Points vest/expiry/redemption/refund race | FIFO lots cannot overspend; duplicate earn once; spent-points reversal never takes unrelated fiat | points/property | M63, M64 |
| **SC-39** — Referral self/linked household/returned qualifier | Self blocked, linked household reviewed, one qualification and delayed benefit, reversal/appeal retained | rewards/fraud | M66 |
| **SC-40** — Rate alert oscillation/stale feed/consent | Threshold crossing/hysteresis/cooldown/dedup; no money execution; opt-out respected | worker/property | M67 |
| **SC-41** — Auto-conversion revoke/balance/rate-bound race | Atomic one-shot mandate, exact net target/fee caps; unknown remains executing; no ACH debit from alert | workflow/concurrency | M68 |
| **SC-42** — Scheduled transfer DST/missing consent/offline | One occurrence per ID, documented local-time mapping, skip/notify without unauthorized catch-up debit | time-controlled workflow | M69, M101 |
| **SC-43** — Notification duplicates/delivery unknown/quiet hours | Message dedup and category consent; app fetches authoritative state; no pickup secret on lock screen | messaging/mobile | M70 |
| **SC-44** — Missing/duplicate/timing/fee/FX statement lines | Three-way reconciliation detects all seeded discrepancies; zero amount tolerance; raw file retained | reconciliation fixtures | M91, M92 |
| **SC-45** — Projection drift/closed period/safeguarding deficit | Drift and shortfall stop affected new exposure; closed-period change denied; as-of reports independently reconstruct | finance controls | M57, M58, M93 |
| **SC-46** — Database restore with already-paid remote instruction | Old writer credential fenced; evidence window replayed/reconciled; no duplicate payout after reopen | disaster recovery | M96 |
| **SC-47** — Provider outage/global stop/secret rotation | New exposure stopped while inquiry/refund servicing works; rotated signature overlap and invalid-key rejection | resilience/security | M76, M82, M90, M97 |
| **SC-48** — Accessibility and low-device matrix | Full funnel360/375/768/1024/1440px, keyboard/focus/SR/200% zoom/reduced motion, real low-end Android and iOS | manual + axe + device | M101 |
| **SC-49** — Load/hot-account/campaign/provider contention | A7 targets at stated steady/3x load, no deadlock leakage or overdraft; p95 and safety evidence separate | load/PostgreSQL | M98 |
| **SC-50** — Privacy/legal holds/backup/vendor deletion | Eligible PII deleted; required held evidence retained with restricted purpose; no test environment live PII | privacy integration | M103 |
| **SC-51** — Stablecoin wrong chain/depeg/reorg/off-ramp down | No PHP available from provisional chain status; custody identity, fees and recovered/unresolved exposure reconcile | sandbox treasury | M74, M75 |
| **SC-52** — Business KYB/signatories/batch partial results | KYB prerequisite, exact approval hash, item states/journals, rerun never repeats paid item | business workflow | M72, M73 |
| **SC-53** — Production fixture leakage and unapproved market | Build/startup/route gates reject sandbox adapters, keys, fake funding and disabled jurisdiction/product | release isolation | M95, M100 |
| **SC-54** — Independent audit chain under concurrency | Per-book anchors serialized; WORM mirror detects missing/tampered sequence; primary rewrite cannot alter external anchor | audit controls | M97 |
| **SC-55** — Foreign-key and ownership graph | Reject cross-book customer/quote/recipient/evidence/attempt/journal references and missing parent rows | SQL/API | M14, M53, M57 |
| **SC-56** — Complete US-PH successful fixture | All J00–J09, actual fee/reserve variants and receipt match500/3.99/503.99/28710; open obligations zero only on evidence | full end-to-end | M27 |

## Feature acceptance register — task contracts

| Feature ID | Test ID | Minimum acceptance assertion | Required packs / task |
|---|---|---|---|
| `KITA-PUB-01` | `TEST-PUB-01` | Unapproved license or partner claim is absent | PACK-UX, PACK-API; `T-PUB-01` |
| `KITA-PUB-02` | `TEST-PUB-02` | Stale feed labels estimate and cannot yield executable transfer | PACK-UX, PACK-API; `T-PUB-02` |
| `KITA-PUB-03` | `TEST-PUB-03` | Disabled US state or origin cannot accept money | PACK-UX, PACK-API; `T-PUB-03` |
| `KITA-PUB-04` | `TEST-PUB-04` | Fee and deadline agree with accepted terms | PACK-UX, PACK-API; `T-PUB-04` |
| `KITA-PUB-05` | `TEST-PUB-05` | Receipt and consent retain chosen language | PACK-UX, PACK-API; `T-PUB-05` |
| `KITA-PUB-06` | `TEST-PUB-06` | Keyboard and screen reader flow passes at all required widths | PACK-UX, PACK-API; `T-PUB-06` |
| `KITA-AUTH-01` | `TEST-AUTH-01` | Unverified contact cannot authorize transfer | PACK-IDENTITY, PACK-SECURITY, PACK-API; `T-AUTH-01` |
| `KITA-AUTH-02` | `TEST-AUTH-02` | Revoked token cannot continue financial command | PACK-IDENTITY, PACK-SECURITY, PACK-API; `T-AUTH-02` |
| `KITA-AUTH-03` | `TEST-AUTH-03` | New destination needs fresh assurance | PACK-IDENTITY, PACK-SECURITY, PACK-API; `T-AUTH-03` |
| `KITA-AUTH-04` | `TEST-AUTH-04` | Recovery cannot bypass new-destination hold | PACK-IDENTITY, PACK-SECURITY, PACK-API; `T-AUTH-04` |
| `KITA-AUTH-05` | `TEST-AUTH-05` | Revoked device cannot refresh token | PACK-IDENTITY, PACK-SECURITY, PACK-API; `T-AUTH-05` |
| `KITA-AUTH-06` | `TEST-AUTH-06` | Closure preserves outstanding refund and lawful records | PACK-IDENTITY, PACK-SECURITY, PACK-API; `T-AUTH-06` |
| `KITA-AUTH-07` | `TEST-AUTH-07` | Expired key or hostile deep link requires safe reauthentication | PACK-IDENTITY, PACK-SECURITY, PACK-API; `T-AUTH-07` |
| `KITA-KYC-01` | `TEST-KYC-01` | Capture callback alone never approves customer | PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; `T-KYC-01` |
| `KITA-KYC-02` | `TEST-KYC-02` | Later adverse decision blocks new payout | PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; `T-KYC-02` |
| `KITA-KYC-03` | `TEST-KYC-03` | Infected upload never reaches analyst viewer | PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; `T-KYC-03` |
| `KITA-KYC-04` | `TEST-KYC-04` | Unavailable or stale list cannot silently pass | PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; `T-KYC-04` |
| `KITA-KYC-05` | `TEST-KYC-05` | New list hit stops queued payout before dispatch | PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; `T-KYC-05` |
| `KITA-KYC-06` | `TEST-KYC-06` | Concurrent transfers cannot exceed aggregate limit | PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; `T-KYC-06` |
| `KITA-KYC-07` | `TEST-KYC-07` | Support cannot read AML filing or confidential rationale | PACK-IDENTITY, PACK-ADMIN, PACK-PROVIDER; `T-KYC-07` |
| `KITA-REC-01` | `TEST-REC-01` | Ownership/name/account validation enforced server-side | PACK-API, PACK-PROVIDER, PACK-UX; `T-REC-01` |
| `KITA-REC-02` | `TEST-REC-02` | Wrong network or expired validation blocks payout | PACK-API, PACK-PROVIDER, PACK-UX; `T-REC-02` |
| `KITA-REC-03` | `TEST-REC-03` | Old transfer snapshot survives destination edit | PACK-API, PACK-PROVIDER, PACK-UX; `T-REC-03` |
| `KITA-REC-04` | `TEST-REC-04` | Repeat obtains new quote and never replays old payment | PACK-API, PACK-PROVIDER, PACK-UX; `T-REC-04` |
| `KITA-QUOTE-01` | `TEST-QUOTE-01` | 500 USD fixture yields exact 28710 PHP and 503.99 USD total | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-01` |
| `KITA-QUOTE-02` | `TEST-QUOTE-02` | JPY and USD inversion deliver requested minor amount exactly | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-02` |
| `KITA-QUOTE-03` | `TEST-QUOTE-03` | Tier boundary discount and tax totals are exact | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-03` |
| `KITA-QUOTE-04` | `TEST-QUOTE-04` | Stale quote unavailable; no cached execution fallback | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-04` |
| `KITA-QUOTE-05` | `TEST-QUOTE-05` | Expiry equality or recipient change produces conflict | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-05` |
| `KITA-QUOTE-06` | `TEST-QUOTE-06` | Wholesale deterioration changes corporate cost not customer promise | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-06` |
| `KITA-QUOTE-07` | `TEST-QUOTE-07` | Display rounding never changes execution arithmetic | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-07` |
| `KITA-QUOTE-08` | `TEST-QUOTE-08` | Stale draft version cannot overwrite newer recipient/amount | PACK-MONEY, PACK-API, PACK-UX; `T-QUOTE-08` |
| `KITA-TX-01` | `TEST-TX-01` | Double tap and different keys on one quote create one transfer | PACK-API, PACK-MONEY, PACK-UX; `T-TX-01` |
| `KITA-TX-02` | `TEST-TX-02` | Late return preserves paid history | PACK-API, PACK-MONEY, PACK-UX; `T-TX-02` |
| `KITA-TX-03` | `TEST-TX-03` | Stable cursor cannot expose another customer records | PACK-API, PACK-MONEY, PACK-UX; `T-TX-03` |
| `KITA-TX-04` | `TEST-TX-04` | Old receipt unchanged after pricing update | PACK-API, PACK-MONEY, PACK-UX; `T-TX-04` |
| `KITA-TX-05` | `TEST-TX-05` | Receipt timestamp and actual delivery determine eligible remedy | PACK-API, PACK-MONEY, PACK-UX; `T-TX-05` |
| `KITA-TX-06` | `TEST-TX-06` | Concurrent partial refunds cannot exceed entitlement | PACK-API, PACK-MONEY, PACK-UX; `T-TX-06` |
| `KITA-TX-07` | `TEST-TX-07` | Support handoff never resets original statutory clock | PACK-API, PACK-MONEY, PACK-UX; `T-TX-07` |
| `KITA-TX-08` | `TEST-TX-08` | Wrong account cannot read or attach case evidence | PACK-API, PACK-MONEY, PACK-UX; `T-TX-08` |
| `KITA-TX-09` | `TEST-TX-09` | Confidential risk details absent from public projection | PACK-API, PACK-MONEY, PACK-UX; `T-TX-09` |
| `KITA-TX-10` | `TEST-TX-10` | DST retry produces one authorized occurrence | PACK-API, PACK-MONEY, PACK-UX; `T-TX-10` |
| `KITA-FUND-01` | `TEST-FUND-01` | No raw PAN/CVV in app server logs or DB | PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; `T-FUND-01` |
| `KITA-FUND-02` | `TEST-FUND-02` | Initiation alone cannot authorize payout | PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; `T-FUND-02` |
| `KITA-FUND-03` | `TEST-FUND-03` | Authorization posts no cash and capture remains receivable | PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; `T-FUND-03` |
| `KITA-FUND-04` | `TEST-FUND-04` | Unapproved method fails closed | PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; `T-FUND-04` |
| `KITA-FUND-05` | `TEST-FUND-05` | Timeout after debit never creates second charge | PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; `T-FUND-05` |
| `KITA-FUND-06` | `TEST-FUND-06` | Paid PHP persists with separate loss/recovery | PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; `T-FUND-06` |
| `KITA-FUND-07` | `TEST-FUND-07` | Unowned cash remains suspense not revenue | PACK-PROVIDER, PACK-MONEY, PACK-FINANCE; `T-FUND-07` |
| `KITA-PAY-01` | `TEST-PAY-01` | Unknown first provider blocks second payout | PACK-PROVIDER, PACK-MONEY, PACK-UX; `T-PAY-01` |
| `KITA-PAY-02` | `TEST-PAY-02` | Cutoff/holiday and amount cannot be bypassed by splitting | PACK-PROVIDER, PACK-MONEY, PACK-UX; `T-PAY-02` |
| `KITA-PAY-03` | `TEST-PAY-03` | Accepted request is not recipient credited | PACK-PROVIDER, PACK-MONEY, PACK-UX; `T-PAY-03` |
| `KITA-PAY-04` | `TEST-PAY-04` | Available and collected differ; expiry alone never fabricates return | PACK-PROVIDER, PACK-MONEY, PACK-UX; `T-PAY-04` |
| `KITA-PAY-05` | `TEST-PAY-05` | Returned amount capped and original delivered timestamp preserved | PACK-PROVIDER, PACK-MONEY, PACK-UX; `T-PAY-05` |
| `KITA-PAY-06` | `TEST-PAY-06` | Aggregator accepted does not mark bill paid | PACK-PROVIDER, PACK-MONEY, PACK-UX; `T-PAY-06` |
| `KITA-WAL-01` | `TEST-WAL-01` | Projection and ledger agree per currency | PACK-MONEY, PACK-FINANCE, PACK-API; `T-WAL-01` |
| `KITA-WAL-02` | `TEST-WAL-02` | No funds credited without real settlement/approved risk evidence | PACK-MONEY, PACK-FINANCE, PACK-API; `T-WAL-02` |
| `KITA-WAL-03` | `TEST-WAL-03` | Two simultaneous spends cannot overdraw | PACK-MONEY, PACK-FINANCE, PACK-API; `T-WAL-03` |
| `KITA-WAL-04` | `TEST-WAL-04` | Four currency legs balance and exact target obligation is funded | PACK-MONEY, PACK-FINANCE, PACK-API; `T-WAL-04` |
| `KITA-WAL-05` | `TEST-WAL-05` | Failed refund retains obligation; closure cannot lose remaining funds | PACK-MONEY, PACK-FINANCE, PACK-API; `T-WAL-05` |
| `KITA-WAL-06` | `TEST-WAL-06` | Both parties screened; cross-book unsupported without settlement policy | PACK-MONEY, PACK-FINANCE, PACK-API; `T-WAL-06` |
| `KITA-GROW-01` | `TEST-GROW-01` | Duplicate payout callback awards once | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-01` |
| `KITA-GROW-02` | `TEST-GROW-02` | Concurrent redemption/expiry cannot overspend lot | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-02` |
| `KITA-GROW-03` | `TEST-GROW-03` | Last budget unit reserved by one transfer only | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-03` |
| `KITA-GROW-04` | `TEST-GROW-04` | Self-referral blocked and household signal reviewed | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-04` |
| `KITA-GROW-05` | `TEST-GROW-05` | Oscillating or stale rate does not spam or execute money | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-05` |
| `KITA-GROW-06` | `TEST-GROW-06` | Revocation race serializes before conversion reservation | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-06` |
| `KITA-GROW-07` | `TEST-GROW-07` | Duplicate event gives one intended message per channel | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-07` |
| `KITA-GROW-08` | `TEST-GROW-08` | Marketing opt-out suppresses campaign but preserves necessary service notices | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-08` |
| `KITA-GROW-09` | `TEST-GROW-09` | Issued/vested/redeemed/expired totals reconcile to provision | PACK-REWARDS, PACK-AUTOMATION, PACK-UX; `T-GROW-09` |
| `KITA-ADM-01` | `TEST-ADM-01` | Customer token and unrelated entity denied | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-01` |
| `KITA-ADM-02` | `TEST-ADM-02` | Paginated queue shows deadlines and freshness | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-02` |
| `KITA-ADM-03` | `TEST-ADM-03` | Hold before dispatch wins; after dispatch recorded in-flight | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-03` |
| `KITA-ADM-04` | `TEST-ADM-04` | Unqualified role cannot override blocked-property restriction | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-04` |
| `KITA-ADM-05` | `TEST-ADM-05` | Second login of same person cannot approve | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-05` |
| `KITA-ADM-06` | `TEST-ADM-06` | Stale payload and unauthorized accounts fail | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-06` |
| `KITA-ADM-07` | `TEST-ADM-07` | No manual paid result without verified evidence and reviewer | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-07` |
| `KITA-ADM-08` | `TEST-ADM-08` | Existing quote unchanged and new quote uses approved effective version | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-08` |
| `KITA-ADM-09` | `TEST-ADM-09` | Reveal step-up/reason/audit and expiry enforced | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-09` |
| `KITA-ADM-10` | `TEST-ADM-10` | Revoked approver cannot execute queued request | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-10` |
| `KITA-ADM-11` | `TEST-ADM-11` | Concurrent hash anchors verified against independent archive | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-11` |
| `KITA-ADM-12` | `TEST-ADM-12` | New commands stop but inquiries and legal remedies continue | PACK-ADMIN, PACK-SECURITY, PACK-API; `T-ADM-12` |
| `KITA-FIN-01` | `TEST-FIN-01` | Empty/unbalanced/cross-currency/edited journal rejected | PACK-MONEY, PACK-FINANCE; `T-FIN-01` |
| `KITA-FIN-02` | `TEST-FIN-02` | Cumulative partial fees sum exactly on final refund | PACK-MONEY, PACK-FINANCE; `T-FIN-02` |
| `KITA-FIN-03` | `TEST-FIN-03` | Missing/duplicate/fee/FX/timing breaks classified | PACK-MONEY, PACK-FINANCE; `T-FIN-03` |
| `KITA-FIN-04` | `TEST-FIN-04` | Force match impossible; correction links approved journal | PACK-MONEY, PACK-FINANCE; `T-FIN-04` |
| `KITA-FIN-05` | `TEST-FIN-05` | Concurrent transfers cannot spend same last prefund | PACK-MONEY, PACK-FINANCE; `T-FIN-05` |
| `KITA-FIN-06` | `TEST-FIN-06` | Trade allocations equal actual cost and no customer terms drift | PACK-MONEY, PACK-FINANCE; `T-FIN-06` |
| `KITA-FIN-07` | `TEST-FIN-07` | Closed period cannot receive unauthorized backdated posting | PACK-MONEY, PACK-FINANCE; `T-FIN-07` |
| `KITA-FIN-08` | `TEST-FIN-08` | No second automatic customer credit for same entitlement | PACK-MONEY, PACK-FINANCE; `T-FIN-08` |
| `KITA-PLAT-01` | `TEST-PLAT-01` | Exact patched locks and no server secrets in client bundle | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-01` |
| `KITA-PLAT-02` | `TEST-PLAT-02` | Fresh install works and sandbox balances never become live cash | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-02` |
| `KITA-PLAT-03` | `TEST-PLAT-03` | Crash at every commit/send/ack boundary preserves one economic effect | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-03` |
| `KITA-PLAT-04` | `TEST-PLAT-04` | Same ID changed body quarantined; invalid signature cannot post | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-04` |
| `KITA-PLAT-05` | `TEST-PLAT-05` | Restart preserves deadlines and replay preserves original key | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-05` |
| `KITA-PLAT-06` | `TEST-PLAT-06` | Alerts reach named on-call without PII leaks | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-06` |
| `KITA-PLAT-07` | `TEST-PLAT-07` | Production fails startup on sandbox capability or fixture adapter | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-07` |
| `KITA-PLAT-08` | `TEST-PLAT-08` | Old writer fenced and uncertain external payments reconciled before reopen | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-08` |
| `KITA-PLAT-09` | `TEST-PLAT-09` | Legal hold preserves required records; deletable PII removed | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-09` |
| `KITA-PLAT-10` | `TEST-PLAT-10` | No critical gap or unexplained financial break at launch | PACK-OPS, PACK-SECURITY, PACK-API; `T-PLAT-10` |
| `KITA-EXT-01` | `TEST-EXT-01` | Unapproved country/state/product remains disabled | PACK-AUTOMATION, PACK-PROVIDER, PACK-API; `T-EXT-01` |
| `KITA-EXT-02` | `TEST-EXT-02` | Wrong network/depeg/reorg cannot produce available PHP cash | PACK-AUTOMATION, PACK-PROVIDER, PACK-API; `T-EXT-02` |
| `KITA-EXT-03` | `TEST-EXT-03` | Individual KYC alone cannot authorize business payout | PACK-AUTOMATION, PACK-PROVIDER, PACK-API; `T-EXT-03` |
| `KITA-EXT-04` | `TEST-EXT-04` | Partial batch preserves paid items and no retry duplicates them | PACK-AUTOMATION, PACK-PROVIDER, PACK-API; `T-EXT-04` |

## L7. Mandatory user-requested scenarios — five independent outcomes

REQ-SC-01–REQ-SC-21 are the explicit current-request scenarios below. They **do not renumber** retained SC-01–SC-56 or M01–M104. Run their stronger assertions together; all task references prefixed REQ-SC refer here. Every scenario requires independent DB, ledger, provider, UI and audit observations, including explicit no-op assertions. Real PostgreSQL/runtime-role integration is mandatory; provider fault process keeps its durable instruction journal across application crashes/restores. Simulators remain isolated and cannot certify actual vendor behavior.

Race variants run in both orders at equality boundaries, with deterministic barriers, at least100 contenders where applicable and100 repeated schedules; preserve seeds. Retain L1's100000 property histories for financial invariants. At every scenario end, independently rebuild balances, prove nonempty balanced journals by book/currency, check original-reference economic instruction counts, verify UI projections and audit anchors. A balanced but economically wrong journal fails. No test is reported executed here.

### REQ-SC-01 — Double click / double tap / lost acceptance response

Race identical commands across tabs/devices; retry after lost response; repeat with distinct keys on one quote and a reused key with changed payload.

* **DB:** One transfer per quote, one reservation/consent/event/outbox set. Same key/body returns original operation; changed body IDEMPOTENCY_MISMATCH; different key on used quote QUOTE_ALREADY_ACCEPTED, with no partial writes.
* **Ledger:** At most one wallet reservation/funding allocation; ordinary unfunded acceptance posts no cash.
* **Provider:** One collection and payout identity; independent provider journal proves no second economic instruction.
* **UI:** Recover original operation/timeline; unknown response keeps reference and disables duplicate pay action.
* **Audit:** Correlate all requests to original command/transfer and record rejected payload conflict without PII.

### REQ-SC-02 — Duplicate workers, stale lease and queue replay

Run concurrent consumers and a paused stale worker; crash before/after publish, send, provider accept, result commit and queue acknowledgment; replay DLQ.

* **DB:** Stable event/consumer dedup, attempt version/generation and one unresolved authority. Stale result may add verified evidence but cannot regress state; timers/outbox survive restart.
* **Ledger:** One economic posting despite duplicate delivery IDs, including distinct callbacks for the same movement; balance reconstruction matches.
* **Provider:** One accepted instruction; expired submitting lease causes inquiry, never fresh-key submit. Same-key retry only with contractual duplicate suppression.
* **UI:** Monotonic timeline; no paid→pending regression or duplicate intended success notification.
* **Audit:** Claim/generation, replay authorization/reason, duplicate identities and evidence-backed transition remain reconstructible.

### REQ-SC-03 — Provider accept-before-timeout

Provider accepts funding, FX, payout or refund then drops response; separately exercise create and confirm crash windows.

* **DB:** Original immutable request/reference persists; unresolved submitting/unknown retains reservation and legal timers. No alternate authority until verified resolution.
* **Ledger:** Timeout posts no success. Later authenticated debit/settlement/credit posts once; retain transit and outstanding liability while unresolved.
* **Provider:** Inquire original account/reference; no automatic secondary route or fresh debit/trade/refund. Safe identical retry requires documented idempotency window.
* **UI:** Show checking and reference; admin has inquiry/remedy actions, no forced fail/paid control.
* **Audit:** Dispatch, transport ambiguity, each inquiry and eventual evidence/mapping version linked.

### REQ-SC-04 — Hold race against dispatch

Commit hold/list-delta immediately before or after queued→submitting commit; resolve one of two additive holds.

* **DB:** Shared lock determines order: hold first blocks submit; dispatch first records submission_in_flight and cancellation/inquiry. Resolving one hold leaves others effective.
* **Ledger:** Hold alone posts no cash; funded liability and actual transit remain until evidenced disposition.
* **Provider:** Zero submit if hold wins; otherwise only existing instruction plus contracted cancellation/inquiry.
* **UI:** Review before submit; after submit explain stopping is being checked, never promise already stopped. Confidential reasons withheld.
* **Audit:** Hold scope/owner/list version, dispatch generation, ordering and cancellation evidence retained.

### REQ-SC-05 — Last-funds race: wallet, prefund, risk capital and limits

Race transfers/withdrawals for last spendable amount including provider fee/buffer; repeat with shared provider pool, daily velocity and Express capital.

* **DB:** Exactly one affordable reservation; loser INSUFFICIENT_FUNDS/LIQUIDITY_UNAVAILABLE/LIMIT_EXCEEDED. No orphan transfer/partial budget/limit reservation; pending or stale incoming cash counts zero.
* **Ledger:** Wallet available→reserved once and never negative; prefund reservation is not a cash debit. Fees cannot reduce guaranteed beneficiary principal.
* **Provider:** Only funded authority dispatches; confirmed pool never overdrawn by accepted economic instructions.
* **UI:** Loser sees accurate insufficiency/action and can request new terms; no fictitious balance or shortened payout.
* **Audit:** Pool/version, policy/buffer, reserved principal/cost and winning/losing decision recorded without leaking another customer.

### REQ-SC-06 — Quote expiry and accepted promise

Test DB time just before expiry, equality and after; changed recipient/consent/policy and clock skew; after valid acceptance worsen actual FX cost from USD495 to USD501.

* **DB:** Equality/later QUOTE_EXPIRED with no acceptance side effects; stale recipient conflicts. Valid acceptance fixes promise and exposure through disclosed funding window.
* **Ledger:** Rejected quote no journal; accepted USD500 principal still buys PHP28,710 with USD1 corporate FX loss under E6, no invented positive margin.
* **Provider:** No expired executable quote; any fresh treasury execution fulfills accepted terms under approved exposure.
* **UI:** Expired quote needs explicit new-terms consent. Accepted USD503.99 total/PHP28,710 receive never silently changes.
* **Audit:** DB time, expiry, recipient/policy/consent versions and actual FX cost/loss evidence retained.

### REQ-SC-07 — Late funding

Receive cash after initiation deadline/cancellation; separately test timely ACH initiation settling within its longer contracted settlement window.

* **DB:** Orphan/late receipt creates case; never resurrect cancelled transfer. Timely ACH remains bound to accepted terms and availability policy.
* **Ledger:** Actual unmatched receipt Dr bank/Cr unidentified liability; verified attribution reclassifies to pending/refund payable. No earned revenue/automatic payout on late cash.
* **Provider:** Reconcile actual incoming movement; any refund uses authorized remaining obligation. Never re-debit merely because settlement was late.
* **UI:** Late-funds resolution/refund differs from normal waiting for settlement; disclose actual received amount.
* **Audit:** Acceptance, initiation, cancellation, settlement and attribution evidence/timestamps linked; remedy clock retained.

### REQ-SC-08 — Short funding

Expected USD503.99, actual USD500.00; duplicate/reorder receipts. Separately test net USD491.49 with evidenced USD2.50 fee and USD10 reserve.

* **DB:** True USD3.99 shortfall blocks full payout and opens case; extra collection needs permitted explicit authorization. Net-fee example is fully collected gross, not customer shortage.
* **Ledger:** Post only actual receipt/pending/suspense per signed short-payment template; never create missing cash. Net settlement Dr bank491.49+expense2.50+reserve10/Cr receivable503.99.
* **Provider:** No payout before availability; no unsolicited extra debit. Obtain independent gross/net evidence.
* **UI:** Show actual shortage and consented next step; processor fees/reserves never trigger false top-up demand or reduce promised receive.
* **Audit:** Expected/actual/gross/net comparison, classification, policy and any extra-collection consent retained.

### REQ-SC-09 — Excess funding

Expected USD503.99, receive USD510.00; race duplicate receipt, matching and excess refund.

* **DB:** One receipt, expected allocation capped and USD6.01 excess case; no automatic increase of quote, payout or points. Disposition requires proven owner and policy.
* **Ledger:** Dr cash510/Cr expected liabilities503.99+excess/unidentified liability6.01; reclassify excess to refund payable on approved entitlement. Excess is never revenue.
* **Provider:** One original payout; excess refund has distinct capped obligation/reference and actual completion evidence.
* **UI:** Original promise unchanged; excess resolution separately visible without implying licensed general wallet credit.
* **Audit:** Movement dedup, ownership evidence, exact allocations and refund chain explain every cent.

### REQ-SC-10 — ACH return after PHP payout

After PHP28,710 delivery, return USD503.99 ACH; duplicate return, then collect/write off. Also cover card chargeback and actual fee.

* **DB:** Keep delivered timestamp/history; separate funding return/dispute/recovery case, exposure restriction and contest deadline.
* **Ledger:** Dr legally collectible recovery receivable or approved loss503.99/Cr bank503.99 once; fee separately. Collection/write-off links original recovery, never erases delivery or creates negative wallet.
* **Provider:** No second payout or automatic re-debit; collection/contest requires permitted scheme/mandate rules.
* **UI:** Delivered history plus funding issue; admin sees receivable/loss/deadline, not failed payout.
* **Audit:** Original mandate, actual return movement/code, delivery evidence, recoverability policy and final resolution retained.

### REQ-SC-11 — Refund/chargeback overlap and partial cap

Race partial/full refunds with provisional/final chargeback credit; vary unknown refund, failure before debit, debit without credit and paid refund.

* **DB:** Lock all obligations/allocations/credits; unknown refunds retain reservation. Ordinary cumulative entitlement cannot spend twice; ambiguous legal overlap gets deadline-bound case, actual duplicate credits stay recorded.
* **Ledger:** E9 cumulative fee/cost rounding exhausts original exactly. Refund transit persists after debit. Real second credit becomes recovery/loss under E10, not hidden netting or negative available funds.
* **Provider:** No retry of unknown refund; independent chargeback is recorded. Original instrument default; verified alternate needs approved policy.
* **UI:** Requested/sent/received/refund-failed and dispute states remain distinct; provisional credit is not promised final remedy.
* **Audit:** Entitlement, component amounts, approvals, allocation decisions, deadlines and each external credit linked.

### REQ-SC-12 — Cancellation versus payout and remedy deadline

Race received request against dispatch and actual delivery; delay/reorder evidence; include oral/after-hours intake, policy boundaries and scheduled-transfer branches.

* **DB:** Original channel/receivedAt survives handoff. Pre-dispatch cancellation safe; post-dispatch inquiry persists. Actual delivery time, not callback arrival, governs signed policy. Owed refund/timer exists before operator approval.
* **Ledger:** Before collection no money journal; funded cancellation E7/E8. Timely corporate-funded E10 remedy preserves original payout payable/transit until its independent outcome; no double extinction.
* **Provider:** Cancel only when supported; uncertainty cannot justify reroute. Eventual returned funds resolve same entitlement without a second refund.
* **UI:** Cancellation requested versus confirmed/refund owed clearly distinguished; no misleading stopped/failed status.
* **Audit:** Request/payment/delivery times, policy/calendar, evidence, due date and funded exception authorization retained.

### REQ-SC-13 — Uncollected cash pickup

Make pickup available, expire local timer with no returned cash, then receive late collection or confirmed cancellation plus actual returned prefund.

* **DB:** Available is not paid. Expiry triggers inquiry/case; late collection is investigated, not discarded. Resolve only actual returned amount.
* **Ledger:** Payable/transit stay open until evidence; no fee/FX earning at availability. Collection earns service; return/remedy E8/E9 cannot invent cash at expiry.
* **Provider:** Require collection ID/time or actual returned movement and supported cancellation; no second pickup while unknown.
* **UI:** Ready for pickup versus collected; expiry explains resolution. Pickup secret appears only in authorized detail.
* **Audit:** Network, masked reference, collection/cancellation/return proof and refund chain; no pickup secret in logs/notifications.

### REQ-SC-14 — KYC tamper and forged approval

Alter browser/SDK success, subject/case/document ID, score or signed payload; replay approval after adverse result/list update; upload malware.

* **DB:** Browser capture remains pending; forged/wrong-subject evidence rejected/quarantined. Current adverse/list result blocks dispatch; infected document inaccessible.
* **Ledger:** No funds release, balance or payout posting caused by tamper.
* **Provider:** Only verified callback/inquiry or authorized evidence review can advance decision; no payment under forged clearance.
* **UI:** Submitted/review/action-needed truthful, no confidential AML details or foreign documents.
* **Audit:** Integrity rejection, actor/session, raw hash, list/policy version and security case retained without document content.

### REQ-SC-15 — IDOR / BOLA / audience confusion

Substitute foreign transfer, quote, recipient version, instrument, document, case, receipt, command, batch item, SSE cursor and signed URL for every applicable operation; include nested IDs/book scope.

* **DB:** Owner/book/purpose checked before read or mutation; scoped customer404. Staff action/entity/value scope enforced; caches/projections never cross subjects.
* **Ledger:** No unauthorized balance disclosure or posting; clients cannot select arbitrary accounts.
* **Provider:** No unauthorized hosted session, evidence fetch or financial instruction for another subject.
* **UI:** No existence/content leak in errors, SSE, downloads, cache or notifications; customer audience cannot enter admin.
* **Audit:** Denied privileged access and suspicious enumeration recorded with redacted metadata, never protected response body.

### REQ-SC-16 — Dual-account approve and stale approval

Same person uses another workforce login; also race expiry, role revocation, payload/target-version change and two executors.

* **DB:** person_id rejects self-approval; exact payload/hash/evidence and current grants rechecked; expired/stale invalidated; valid approval consumed once with command/outbox.
* **Ledger:** Denied approval no posting; valid correction/refund uses approved typed template once.
* **Provider:** No call from revoked/stale/self-approved authority; one instruction for independently approved payload.
* **UI:** Show independent checker requirement and stale/reapproval reason; execute payload immutable.
* **Audit:** Both subjects→person linkage, maker/checker scopes/assurance, evidence hash and consumed result retained.

### REQ-SC-17 — Not-found after accept

Accept externally then time out; inquiry temporarily says not-found; test account namespace error, expired dedup window and delayed paid event.

* **DB:** Keep original unknown authority/reservation; temporary not-found is not definitive failure. New authority requires contractually final nonacceptance after horizon and checks.
* **Ledger:** No reversal/reservation release from not-found alone; apply later attested movements once while preserving payable/transit.
* **Provider:** Query original account/reference and independent reports; no secondary provider/fresh key during propagation or uncertain history.
* **UI:** Checking with support escalation, not failed with a new pay button.
* **Audit:** Namespace, lookup times, contract horizon, evidence and denied reroute recorded; privilege cannot replace proof.

### REQ-SC-18 — Promo race, points expiry and referral qualification

Compete for last campaign unit/same lot; race expiry, release, delivery and duplicate callback; reverse a source transfer after redemption.

* **DB:** One budget/lot reservation under caps; one earn/vest/consume source+rule; only unreserved expiry; reversal/debt retains history; self-referral blocked and household signal reviewed.
* **Ledger:** Paired points conserve units; E11 subsidy/provision once; failure refunds only collected cash and reverses subsidy. Noncash debt cannot seize unrelated fiat.
* **Provider:** Collect exactly accepted discounted amount; no unapproved cash reward or extra payout.
* **UI:** Benefit conditional until reserved; exhausted/expired terms need consent; pending/vested/reversed/debt units distinct.
* **Audit:** Campaign policy, eligibility, FIFO order, winner, reversal source and cost/provision reconciliation retained.

### REQ-SC-19 — Statement breaks

Seed missing/duplicate/timing/amount/currency/fee/reserve/FX rows, corrupt totals, duplicate files/cross-file movements, unknown deposits and late closed-period evidence; race matchers.

* **DB:** Hash-dedup files; retain duplicate-movement candidates and immutable lines; exact allocation caps. Break owner/SLA/evidence mandatory; no force-match or silent closure.
* **Ledger:** Opening+movements=closing per account/currency; full journal sum equals projection. Real unidentified cash credits suspense. Approved correction in open period, no original edits or nonzero hidden tolerance.
* **Provider:** Independent bank/provider statements and inquiry; material unexplained difference stops new affected exposure but preserves servicing.
* **UI:** As-of/completeness, exact difference, severity, owner and aging; unresolved discrepancy cannot appear reconciled.
* **Audit:** Source/parser hashes, matching allocations, correction approval/journal and close sign-off reconstruct outcome.

### REQ-SC-20 — Restore versus external instruction and old writer

Restore backup predating an accepted/paid external instruction while old worker still has credentials; repeat with lost queue data.

* **DB:** Restored scope starts submit-disabled; reconstruct missing attempts/commands from independent history and stable references; unknown window remains fenced, outbox rebuilt only from authority.
* **Ledger:** Reconstruct real external movements once via recovery templates; no cash invention or deletion of external liability by rewind; independently prove positions.
* **Provider:** Fence/revoke old workload/provider credentials or prove safe gateway before new submits. Inquiry first; absent fencing/history completeness keeps submission disabled.
* **UI:** Recovery/processing and servicing contact; restored stale balance cannot spend or invite duplicate repayment.
* **Audit:** Independent anchors, uncertainty window, revocation proof, reconstruction manifest and Finance/Security/incident-command reopen signatures retained outside restored DB.

### REQ-SC-21 — Production-unreachable simulators

Probe final artifact/API/tRPC/worker/admin/deep links for simulatePartnerCompletion, addSandboxFunds, force complete/paid/balance, fake KYC/fixed rates and test adapters; swap flags/keys/environment.

* **DB:** No simulator command registration/grants or imported fictional balances/approvals/refs. Account/environment/contract binding fails closed even during flag outage.
* **Ledger:** No fixture/status switch can manufacture cash or delivery; opening books need independent real evidence.
* **Provider:** No production simulator URL/key/import; test keys cannot authenticate callbacks; absent contracted capability returns unavailable.
* **UI:** No fake success or hidden-but-callable money control; unavailable capability truthful across web/mobile/admin.
* **Audit:** Artifact/import and endpoint inventories, denied probes and environment/account bindings retained. Hiding a button is insufficient.

## L8. Cross-feature verification packs

Each TEST-* in the task-contract register inherits L1/L7 oracles and its relevant M/SC/REQ-SC scenarios. PACK names below group required evidence; they do not waive specific scenarios. All planned command names in L5 remain future build work.

| Pack | Required tests and evidence |
|---|---|
| PACK-MONEY | E4–E11 plus short/excess funding, exact USD/PHP/JPY and inverse/tiers/tax/discount, overflow/JSON-number rejection, negative spread, four-leg wallet conversion, cumulative partial refunds, immutable/reversal/evidence/period and runtime-role controls. Independent arithmetic oracle. |
| PACK-API | All114 OpenAPI operations and M supplemental ownership; schema/runtime-client compatibility, auth/CSRF/nested ownership, idempotency/version conflicts, no-store, pagination, SSE reconnect/reset/revocation, old mobile clients, atomic command/outbox and retry exhaustion. |
| PACK-IDENTITY | Contact challenge, OIDC nonce/state/PKCE/JWKS/replay, passkeys/accessibility, refresh reuse/logout/device revocation, recovery hold, closure obligations, capture integrity, document quarantine, adverse re-KYC/list-delta/risk, restricted AML filing/QA. |
| PACK-PROVIDER | H5 per account/method/version, create/confirm crash windows, authenticated evidence, ambiguous/not-found, amount/beneficiary mismatch, unknown codes, net settlement, cancel/refund/returns/statements, bank calendar, GCash/Maya validation, cash collected/biller-posted proof. |
| PACK-UX | Complete web and physical iOS/Android public→identity→quote→fund→track→receipt→support/refund; empty/error/offline/unknown; English/Filipino versioned consent; Kita tokens; keyboard/manual screen reader/accessibility and required widths; no private CDN/service-worker cache. |
| PACK-ADMIN | All I2 permission allow/deny cells, value/entity/person scope, queues/assignment/freshness, timed reveal/export, additive holds, independent approvals, evidence-only completion, policy effective date and forward rollback, revocation, audit/WORM, emergency stop/reenable. |
| PACK-REWARDS | P1 approval, earn/vest/reverse, FIFO reserve/expiry/debt, promo budgets/caps, referral review, rate crossing/rearm/cooldown, notification dedup/consent/quiet hours and provision/unit-economics reconciliation. |
| PACK-AUTOMATION | Alert never spends; explicit one-shot wallet mandate bounds/revoke race/fresh net rate; DST overlap/gap/leap day/calendar change, missing recurring consent and no catch-up debit; biller proof; KYB/signatory authority and batch partial results; stablecoin units/network/finality/reorg/depeg/off-ramp failures. |
| PACK-FINANCE | Three-way statements, real openings, safeguarding by entity/currency, no unsupported netting, liquidity excludes pending cash, FX residuals/revaluation, period close/late correction, reserve/recovery impairment/tax, reports/CSV/as-of/receipt immutability. |
| PACK-SECURITY | Threat-model/business-logic tests, dependency/secret/SAST/DAST and independent pen test; BOLA/XSS/SQLi/SSRF/CSRF/CORS, upload attacks, auth/recovery theft, KMS/key rotation and redaction; privacy/retention/legal holds/provider deletion. Record assessor/catalog versions. |
| PACK-OPS | IaC/IAM/account isolation, forward migration, simulator exclusion, outages/overload and fairness, DLQ/outbox/timer recovery, alarm delivery, staff handoff, writer-fenced restore/external reconciliation, mobile signed OTA/runtime rollback and measured spend. |

Capacity evidence: A7 steady100 commands/s,20 accepts/s,200 reads/s and2000 tracking clients for60min, then3× for10min including hot accounts/campaigns/prefund. Record hardware, data volume and provider limits. Owned read p95≤300ms, commit≤750ms, quote≤2s, durable webhook ack≤500ms, notification submission≤30s; overload remains bounded and financially safe. Monthly99.9% SLO requires operating measurement, not inference from a load run. D6 web metrics and low-end Android/physical iOS matrix apply.

Trigger and verify on-call delivery for balance drift/customer shortfall/duplicate instruction, unknown payout>5min, quote source age>10s, outbox>60s, inbox lag>30s, timer overdue>60s, liquidity breach, missing statements, failed audit archive and privileged anomaly. Demonstrate proposed RPO≤5min and infrastructure RTO≤60min; no financial reopening shortcut while external instructions remain uncertain.

## L9. Six sequential release stages

G00–G10 in L4 are retained **technical check families**. G1–G6 below are **release maturity stages** combining those checks and external approvals. The names and their scope must appear in the release manifest. None has passed in this planning phase. Each stage is scoped to artifact, entity, origin/state, destination, product, funding/payout method, provider account/version and client versions. A US→PH launch cannot certify a disabled extension or expansion market.

| Stage | Required exit criteria | Evidence / accountable signers | Failure action / rollback |
|---|---|---|---|
| **G1 — Code complete** | Frozen contracts; blocking schema/API gaps closed; every in-scope task's domain/API/worker/projection/UI/runbook implemented and built; exact locks and migrations; no fake-success or disconnected money path. Full-target code complete requires all104 production features; excluded pilot scope explicitly recorded. Missing original spec still blocks exact full-scope attestation. | Complete feature→task→code→test map, source/migration inventory, build/types/lint/generated-client and static reports; G00/G01; architect and exact-head Sol review. | Fix batch and disabled capability; compatible code revert only, history retained. |
| **G2 — Internally verified** | G1 plus every applicable TEST, M, SC and REQ-SC test passes in isolated staging on real DB; races/faults/money/security/a11y/load/recovery and alert/runbook evidence; DEP-15 resolved. No prohibited defect, skipped/flaky required test or unexplained financial break. | G02/G03/G05–08; reproducible manifests and independent Finance arithmetic/reconciliation, QA/Security reports; architect + QA + Controller + Security. | Reproduce/fix/retest; simulator results remain internal evidence. |
| **G3 — Sandbox certified** | G2 plus actual chosen provider/account/method collection/FX/payout/refund/report flows exercised and reconciled; authentication/dedup/nonacceptance/cancel semantics documented. Vendor-unavailable scenarios retain local fault proof and explicit unsupported capability restriction, never a false vendor pass. Native SDK/device and disclosure compatibility checked. | G04 and relevant G09; API/contract hashes, sanitized real sandbox transcripts and statements, provider acknowledgment, SDK/device proof; Integrations + QA + Finance + Compliance. | Disable affected method/adapter, revise reviewed contract and rerun impacted evidence; no simulated production fallback. |
| **G4 — Limited live pilot** | G3 plus applicable DEP approvals, legal/underwriting/consumer policy, real opening assets and capital/prefund/remedy reserve, staffed on-call, security closure, production isolation and writer fencing. Separate explicit authorization must name allowlisted cohort, dates, per-transfer/cumulative/daily/outstanding caps and stop owner. Proposed planning ceiling:≤100 transfers over≤14days,≤USD500 principal each and≤USD10000 cumulative principal; stricter approved risk/legal/provider caps control, and missing actual daily/outstanding caps blocks entry. This proposal is not live permission. | G09/G10; signed pilot scope and exact artifact; business owner + Compliance/counsel + Controller/Treasury + Security + architect. Controlled real low-value certification is inside this pilot, not an ungated precondition. | Immediate new-exposure stop for duplicate/shortfall/breach/material unexplained break; continue inquiry/support/lawful remedies. Forward recovery after external instructions. |
| **G5 — Pilot reconciled** | Every live pilot movement matched bank↔provider↔ledger; recipient outcomes, refunds/returns/disputes, fees/reserves/FX and daily closes evidenced. No unknown payout, unexplained break or overdue remedy. Approved observation window and continuing late-return reserve/monitoring; settled ACH never declared immune to return. Unperformed scenarios remain untested live. | Per-transfer evidence, closing liabilities/assets, break disposition, costs/latency/support and audit/access review; Controller + Treasury + Ops + Compliance + Integrations. | Keep capped or stop intake; correct/reconcile under independent approval and repeat affected observation before growth. |
| **G6 — GA** | G5 plus current exact-artifact capacity/security/recovery, signed scope and staffing/liquidity/concentration/SLO/incident/renewal controls. DEP-00 closed before claiming complete original target. Each optional product/market repeats its applicable G1–G5; no inherited unrelated permission. | Signed launch manifest, G00–G10 evidence on reviewed candidate, current dependencies and staged exposure checkpoints; business owner + architect + Finance + Compliance + Security. | Disable affected new exposure, rollback compatible code/presentation, preserve obligations and keys; reconcile/repair forward. No DB rewind across external money. |

Any duplicate economic instruction, customer shortfall, unauthorized money action, ledger corruption or production simulator reachability blocks release. Critical/high exploitable security defects, required-test failure and unverifiable money outcome also block the affected stage. Low-risk waivers need owner, scope, expiry and compensating control; they cannot waive financial invariants, legal rights, provider authority or isolation. Changed artifact/contracts/policy/provider invalidate impacted evidence and require exact-candidate reruns. Archive request/DB/ledger/provider/UI/audit results with the L5 manifest fields; screenshots alone cannot certify a gate.
