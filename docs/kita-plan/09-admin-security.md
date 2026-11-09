# I. Administration, compliance, and security

**Regulatory/provider claims: unverified pending accountable owner/counsel, 2026-11-09.** Implementation controls below are proposed requirements; approvals do not create authority to conduct prohibited activity.

## I1. Identity and authorization

Customer OIDC authorization code/PKCE with nonce and one-use state bound to the initiating session and exact allowlisted return URI; validate issuer/audience/algorithm/expiry and JWKS rotation. No base64 redirect used as CSRF state. Web has opaque server sessions in host-only `__Host-kita_customer` cookie (Secure, HttpOnly, SameSite=Lax, Path=/) and origin+CSRF protection for writes; 30-minute inactivity, 12-hour absolute interactive session planning defaults. Mobile access tokens5 minutes, rotated refresh tokens in Keychain/Keystore, reuse detection, device inventory and revocation. No localStorage, AsyncStorage, URL or analytics token storage. Biometric unlock protects device-held credentials; it is not server proof of customer identity. Recovery requires fresh assurance and24-hour new-destination/high-risk-spend hold unless approved accessible recovery procedure establishes equivalent assurance.

Workforce uses a separate IdP audience, domain and session cookie, managed-device access and phishing-resistant MFA; 15-minute idle/8-hour absolute session, step-up≤5 minutes for sensitive commands. Authenticate permissions on every operation; revoke active privileged access on offboarding/role removal. Stable `person_id`, not account login, enforces independent approval. No creator automatically becomes admin; bootstrap security enrollment is a time-limited, logged out-of-band administrative process and cannot grant one person financial self-approval.

## I2. Permission matrix

All rows also require legal-entity scope, currency/value authority, assignment/purpose, active employment, session assurance, and no related-customer conflict. Default deny. Auditors are read-only.

| Action | Support | Ops | Compliance analyst/approver | Finance maker/approver | Security admin |
|---|---|---|---|---|---|
| Masked transfer/customer read | yes scoped | yes scoped | yes scoped | yes scoped | incident metadata only |
| Secure support case / evidence request | yes | yes | yes | finance cases | no |
| Hold new payout / inquiry | request / inquiry | yes | yes | treasury hold only | emergency intake stop only |
| Release compliance/sanctions hold | no | no | analyst proposes; independent approver where policy requires | no | no |
| Cancel request | yes on customer instruction | yes | restrictions govern | yes | no |
| Refund/reroute/adjustment | request only | propose reroute | legal clearance only | maker prepares, independent approver executes eligibility | no |
| Pricing/routes/campaign release | no | propose | compliance policy approval | independent financial approval | no |
| KYC document reveal | no by default | no by default | assigned case + step-up | no | incident access separately approved |
| AML case/SAR/STR | no | no contents | MLRO/assigned analyst only | no | no routine content |
| Export financial/PII data | masked request | scoped request | restricted purpose | approved export | no blanket access |
| Staff role changes | no | no | no | no | maker/checker security workflow |
| Journal edit/delete | never | never | never | never | never |

Separate permissions `transfer.read`, `case.read`, `pii.reveal`, `documents.read`, `aml.case.read`, `ledger.read`, `refund.request`, `refund.approve`, `route.pause`, `config.publish`, `access.grant`, `audit.export`. PII reveal does not imply access to unrelated transfers. Source-IP/device correlations are fraud signals; shared household/IP is not proof of wrongdoing.

## I3. Action matrix and approvals

| Action | Preconditions | Atomic effect / external boundary |
|---|---|---|
| Pause | Active transfer or route, reason | Insert scoped hold and audit; workers share same transfer lock; in-flight instruction gets cancellation/inquiry, not false stop |
| Resume | Specific hold reviewed, permitted resolver | Resolve that hold only; recheck all other current conditions |
| Compliance approve/reject/RFI | Assigned case, complete evidence, current policy | Append decision; restrict/release workflow only under policy; independent high-risk review |
| Cancel | Customer request or permitted business action | Timestamp request, case/deadline, safe cancellation command; refund obligation separate |
| Refund | Entitlement recorded, remaining amount, no unresolved duplicate credit | Immutable obligation/approval/allocation; provider attempt; all discretionary refunds dual approved |
| Reroute | Definitive no-payment/cancellation evidence; new route safe | Dual approval, invalidate stale terms, reserve liquidity, new attempt identity |
| Retry | Same operation proven retry-safe | Reuse original request reference/hash; unknown outcome uses inquiry |
| Record payout evidence | Verified report/API evidence with amount/currency/destination | Dual reviewed manual evidence intake, normal reducer/journals; no unconditional complete endpoint |
| Fail | Definite provider rejection/no-effect evidence | Record reason and next action; no forced financial deletion |
| Accounting adjustment | Correcting known error, signed template and evidence | Dual approved balanced new journal linked to original; no arbitrary balance edit |
| Emergency route/intake stop | Incident authority | Immediate audited fail-closed switch; recovery/inquiry/refunds remain available as legally allowed |
| Reenable | Root cause resolved and current certification | Independent approval and exposure-limited rollout |

Approval records bind command kind, exact immutable payload/hash, recipient, amount/currency, entity, target version, evidence set, requester person, allowed approver scopes, expiry≤24h (sensitive transfer dispatch≤30min), and step-up. Execution locks approval+target, rechecks current state/scopes/holds/liquidity, atomically marks consumed with command/outbox. Changed payload/version, revoked role, expired evidence, or expired approval invalidates execution. A rejected approval cannot later be reused. Two linked login accounts of the same person cannot satisfy maker/checker. Policy-required automatic statutory remedies use a standing independently approved rule and audit every execution; they do not wait indefinitely for discretionary refund staffing.

## I4. KYC, screening, and monitoring

KYC tier0 permits browsing/indicative quotes; tier1 requires approved identity proof, contact, legal name/DOB/residence, document authenticity, liveness/face verification and screening; tier2 adds EDD/source-of-funds/proof-of-address under policy. **No hardcoded monetary legal thresholds**: approved entity/country policy supplies tier limits and due dates, absent policy denies payout. UI capture completion sets pending only. Store provider evidence, SDK version, capture integrity/deepfake signals, list version, policy version, reviewer, rationale, valid-until and next review. New adverse result can restrict previously approved customer; historical decisions remain.

Screen sender, recipient, relevant institutions and required payment data at onboarding, recipient addition/change, payout authorization and list-delta rescreen. New list version invalidates stale clearance before dispatch. Vendor unavailable→hold; no silent pass. Potential name matches enter review with DOB/country/identifier evidence; suppressions require bounded subject+list identifiers, reason, expiry and independent approval. True legal restrictions cannot be overridden by superadmin. MLRO owns reportability, deadlines, filing and acknowledgment. No general user-visible case note contains suspicious-activity details.

Initial deterministic monitoring policies (planning values, Compliance must approve): velocity breach→hold; any funding-ownership mismatch→review; post-recovery new destination within24h→hold; ≥3 failed funding attempts/hour→review; ≥5 new recipients/day→review; multiple identities sharing instrument→review; structuring indicators across linked recipients→case. Thresholds are policy parameters, not statutory limits; training/test fixtures demonstrate both false-positive clearance and continued restriction. Analysts need assignment, SLA escalation, QA sampling, appeals and immutable decision history. Do not build unconsented biometric galleries merely because a source suggests 1:N matching.

## I5. Jurisdiction registry and consumer rights

US permissions must distinguish federal MSB/AML registration, state activity, and sponsor/agent scope. UK/FCA payment/e-money, EU/EEA national authorizations, CA FINTRAC plus Bank of Canada/other applicable provincial responsibilities, JP FSA funds-transfer classification, SG MAS payment activity, AU AUSTRAC/remittance plus other applicable financial-services/privacy requirements, and PH BSP/AMLC/EMI/OPS/VASP boundaries each need an owner-signed legal perimeter. This is an assessment list, not a conclusion that all apply. No unsupported capital, fee, licensing duration, tax or rail-limit numbers from research become code. See N for official-source starting points and evidence.

For the worked US consumer flow, implement a versioned cancellation policy using payment/authorization time, actual recipient deposit/pickup time, and request receipt time. Proposed ordinary-rule values: qualifying request within30 minutes and before recipient receipt; refund within3 business days, including required fees/taxes. Keep oral/agent request timestamps, after-hours channel and separate scheduled-transfer rules. Owner/counsel must confirm applicability and exceptions. [CFPB §1005.34](https://www.consumerfinance.gov/rules-policy/regulations/1005/34/)

Error claims retain disclosed availability date, original report, investigation evidence, election of remedy, notices and delivery evidence. Proposed ordinary-rule clocks:180-day reporting window,90-day investigation, result notice within3 business days, remedy promptly under the applicable election/rule. Specialized timing/incorrect-account/document-request exceptions remain explicit policy branches approved by counsel; no silent generic denial at the boundary. [CFPB §1005.33](https://www.consumerfinance.gov/rules-policy/regulations/1005/33/)

Rights receipt renders the accepted quote/disclosure version, entity, source principal, gross fees/discount/taxes, exact recipient amount, rate, availability, recipient mask, cancellation/error instructions and contact channels. Retain original PDF/hash/language; later corrected receipts are new versions with reason. Filing a support message that alleges error routes into the regulated case workflow; classification cannot reset its received timestamp.

## I6. Audit, encryption, privacy, and application security

Audit all privileged reads/reveals/exports and mutations; capture actor/person/session assurance, action, target, expected/actual version, reason, immutable command hash, approval chain, evidence refs, result, request/trace ID, occurred/recorded time. Serialize per-book hash chaining with locked anchor; canonical JSON with stable key ordering and UTC precision. Independent archive receives sequence/hash and content hash; daily signed root anchor under separate security account. Missing audit export pages on-call. Hash chaining alone is not WORM; no primary-DB admin can alter the external retention account.

KMS envelope-encrypt profile/recipient fields and documents with purpose-separated keys. HMAC normalized values only where lookup is needed; ordinary SHA hashes of predictable phones/accounts are prohibited. Short-lived signed document links≤60s, watermarked privileged viewer, malware quarantine and MIME/content/size checks, no raw PII in queues/logs. Documents never become public. Retention/deletion scheduler follows approved jurisdiction/data-class durations and legal holds, including backups and provider deletion requests. Crypto-shredding applies only to legally deletable data. Avoid PII in immutable journals so retention and deletion do not conflict unnecessarily.

Hosted card capture/redirect only; no PAN/CVV handling in Kita servers, logs or screenshots. Acquirer/QSA determines PCI validation path; hosted fields do not automatically confer SAQ-A scope. CSP, payment-script inventory, integrity/tamper controls, CSRF, exact CORS allowlists, parameterized SQL, SSRF egress allowlists, rate limits per account/device/instrument/IP, file sandboxing, and dependency/secret/SAST/DAST scanning are release requirements. Test BOLA with every referenced object, admin audience confusion, XSS via provider messages, CSV injection, webhook replay, recovery takeover and sessions after role revocation. Use OWASP ASVS/MASVS as assessment catalogs with version recorded by Security, not unverified compliance badges.

Emergency access is time-boxed, purpose-bound and independently reviewed; it cannot edit posted money or bypass sanctions. No staff user has simultaneous unconstrained deployment, journal mutation and archive administration. Quarterly access review and termination revocation are operational deliverables. Security incidents preserve evidence, stop affected new exposure, engage Compliance/legal, assess notification duties with versioned jurisdiction clocks, and communicate verified facts only.
