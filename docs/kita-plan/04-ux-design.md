# D. Kita customer, mobile, and admin design

2026-11-09. Provider/regulatory claims, logos and trust copy remain unverified pending owner/counsel. Never show a license, insured-deposit claim, affiliation, review, or delivery guarantee without evidence.

## D1. Preserve Kita

Use ink **#0a0a0a**, warm **#f5f5f0**, lime **#c8ff00**, paper **#ffffff**. Hanken Grotesk400/500/600/700 for tasks; Newsreader400/500 and italic for brand headlines only, self-hosted with license attribution. Financial figures use tabular lining numerals and currency code. Reject navy/teal/blue identity variants from the other research; do not mix palettes. Existing CSS approximates colors through HSL: target tokens must use these exact hex values.

Tokens: text primary ink, secondary#52524b; input/focus boundary#707068; error#b42318; pending amber#855300; delivered green#226045. Status colors always accompany icon and text. Ink on lime and warm on ink are the primary button/hero pairs; white on lime is prohibited. Input borders/focus rings must pass non-text contrast on the adjacent background; decorative card borders can be lighter. Measure actual combinations and disabled/hover/focus states against WCAG2.2 AA rather than assuming the library supplies compliance. [WCAG2.2](https://www.w3.org/TR/WCAG22/) is the assessment reference; product requirement is AA plus44–48px primary targets.

Spacing4/8/12/16/24/32/48/64px; body16px line-height1.5–1.7, money32–40px, form labels14–16px, admin tables14px minimum with readable zoom. Form controls48px high, primary CTA56px mobile, radii12px inputs/16px surfaces, max customer content1120px and form680px. Desktop calculator two columns≥1024px; tablet one task column with anchored cost summary; mobile360/375px single column. No horizontal scrolling for money fields at200% text scale. Admin tables may scroll horizontally with sticky row headers and an accessible summary view.

## D2. Route and screen specification

| Surface / route | Required content and primary action | Data / exceptional states |
|---|---|---|
| Public `/` | Kita hero, US→PH calculator, how it works, approved methods, help/legal footer | Indicative as-of timestamp; unsupported corridor; stale/unavailable rate; no fake dynamic testimonials |
| `/locations`, `/fees`, `/help`, `/security`, `/legal`, `/complaints` | Country eligibility and accurate terms; contact/complaint entry | Versioned content by contracting entity; inactive markets labeled unavailable |
| `/login`, `/signup`, `/recovery` | Contact verification, passkey/password flow, recovery | OTP retry countdown, rate limiting, accessible paste, new-device/recovery risk |
| `/home` | Send/repeat transfer, pending action, latest activity, wallet only if enabled | First-time empty state, KYC action, funding delay, outage notice |
| `/send` | Amount→recipient→verification→review→funding→tracking | Resumable draft; back navigation; fresh quote after material edit; preserved operation after timeout |
| `/recipients` | Masked saved recipients, add/version/archive | Bank catalog; name mismatch; wallet capacity; cash pickup field guidance; no editing submitted snapshot |
| `/verification` | Why needed, supported docs, hosted capture, secure evidence requests | Camera denied/upload fallback, blurry/expired ID, pending/manual review/needs-info/rejected; capture success means submitted |
| `/activity`, `/transfers/[id]` | All outcomes, distinct funding/payout/refund timelines, amount/reference, receipt/help/cancel | Unknown provider result says checking; returned payment remains visible alongside original delivery |
| `/wallet` | Currency tabs; available, pending, reserved; top-up/convert/withdraw/history | Disabled without wallet entitlement; no free top-up button; insufficient funds/restriction/return recovery |
| `/rewards`, `/referrals`, `/alerts` | Points lots/expiry/terms, referral qualification, target rate/basis/channel | Pending vesting, revoked rewards, budget exhausted, no cash implication, alert is informational |
| `/schedules`, `/auto-conversions` | Mandate bounds, rate/fee ceilings, next occurrence, revoke | No mandate by default; reminder vs automatic execution clearly distinct |
| `/bills` | Biller, schema-based fields, amount/period, fee, proof | Accepted vs biller-posted distinction, duplicate period warning, investigation path |
| `/profile` | Legal profile, funding instruments, devices, notification consent, privacy/closure | Changes trigger re-verification where required; pending obligations survive account closure request |
| `/support` | Secure cases/messages, evidence, complaint/error claim, cancellation receipt | Timestamps/deadlines retained even outside staffed hours; no confidential AML reasons |
| Mobile | Home/Send/Recipients/Activity/Profile bottom tabs; wallet/rewards through Home | Native capture, biometric unlock, secure storage, push deep links, offline read-only stale label |

No customer screen exposes accounting implementation jargon such as posting templates, outbox, or provider fencing. Customer balances/status are server projections; no optimistic paid state or auto-executing offline money queue. Offline after unknown submit: “We’re checking your transfer. Open activity when you reconnect.” Do not assert money has not left unless the server proves it.

## D3. Quote and confirmation wireframe

Desktop left: amount anchor toggle, origin/destination, method/speed, recipient preview. Right: “Recipient receives PHP28,710.00”; principalUSD500.00, gross feeUSD3.99, discountUSD0.00, taxUSD0.00, totalUSD503.99; customer rate57.42 and timestamped reference58.00 with margin explanation. Show exact-recipient rounding adjustment when applicable. Review repeats destination mask, source of funds, purpose, funding authorization, earliest/latest arrival, legal availability date, cancellation/error rights, entity identity, and terms version. CTA states “Confirm and pay USD503.99” only when that action actually authorizes payment; otherwise “Continue to bank authorization.”

Countdown shows acceptance expiry, not marketing urgency. Expiry disables confirm and offers “Get a new quote”; material differences receive an explicit changed-values summary and fresh consent. A successful response locks displayed terms despite background query refreshes. Public estimate and executable quote use distinct components. Rate alert click always requests fresh pricing.

## D4. Funding, delivery, and failure copy

Express/Economy cards display actual cost and contingent timing; ACH settlement is a condition, not “instant.” Wallet delivery specifies GCash/Maya; bank delivery distinguishes institution and route where it matters; cash pickup shows available-for-collection separately from collected. Pickup secret is behind authenticated detail, masked in notifications and exports. Cash uncollected expiry explains refund timing and requires provider evidence, not local timer alone.

Use: “Payment authorized,” “Waiting for bank settlement,” “We’re reviewing your transfer,” “Checking delivery with our partner,” “Recipient received PHP…,” “Refund sent,” and “Refund received” according to evidence. A hold must explain the allowed next step without revealing SAR/STR, list-match logic, or falsely assuring safeguarding. Display last updated and support reference. Failed submission retains draft; unknown submission retains transfer/operation ID and disables duplicate payment CTA.

## D5. Admin workbench

Separate origin and workforce identity. Left navigation: Overview, Transfers, Customers, Verification, AML cases, Exceptions, Refunds/disputes, Reconciliation, Treasury, Pricing/routes, Campaigns, Support, Approvals, Audit, Access. Header search by internal/provider reference; masked PII search permission is separate. Queue columns: reference, customer mask, amount/currency, funding/compliance/payout states, age, deadline, provider, owner, severity. Saved filters include entity, corridor, method, currency, state, amount, age, risk, assignee, error code. Live refresh shows freshness and reconnect state.

Detail has customer promise, funds status, independent timelines, provider refs, evidence, journals, refunds/disputes, support, audit and allowed actions. Actions come from server eligibility with disabled reasons. Pause applies a scoped hold; resume resolves a specific hold; approve applies a defined case/approval; complete is evidence intake, not a status toggle. Two-person approvals show exact payload hash/version and invalidation reason. PII reveal is timed, watermarked, step-up, reasoned, and audited. Bulk money mutation is disabled; bulk assignment/tagging is permitted with bounded preview.

Configuration editor supports draft, structural validation, current-vs-proposed quote simulations (min/median/max, all methods, promo edges), independent approval, effective date, staged exposure, and forward rollback. Route emergency stop is immediately available to authorized operators; reenable requires independent evidence review.

## D6. Accessibility, localization, performance

Test keyboard order, focus return, visible focus under sticky footer, screen-reader amount/currency, accessible error summary, label/name, zoom, reduced motion and high contrast at360/375/768/1024/1440px. Stepper is a group with current-step text, not a misleading tablist. Preserve input on errors; never re-ask available profile fields unnecessarily. Support password managers, paste, and nonsensory alternatives to capture/biometric flows. Contrast and accessible authentication get manual review; axe alone is insufficient.

Launch English and Filipino catalogs with human-reviewed legal copy; explicit locale per disclosure/receipt. Use IANA zones and formatted business dates, not browser timezone for eligibility/deadlines. Names support Unicode and multiple parts without arbitrary Western first/last constraints; do not transliterate away original legal names. Provider-required transliteration is a separate field with provenance.

Targets: p75 LCP≤2.5s, INP≤200ms, CLS≤0.1 on representative low-end Android; initial first-party public JS≤170KiB gzip, app shell≤300KiB before hosted SDKs. Lazy-load capture/payment SDK at the relevant step. No private page/API response in CDN or service-worker cache; cache only public assets/help. Signed mobile OTA updates are limited to compatible runtime versions and change-control rules; financial policy remains server-side.

## D7. Source audit qualification

Use GPU findings as inspection leads. R15's suggestion that lime `#c8ff00` on ink `#0a0a0a` fails ordinary text contrast is incorrect; lime on a light background is the relevant failure case. Measure rendered pairs rather than copying that claim. R13's wallet-funding finding concerns **authenticated customers** and its recipient hydration finding describes a latent missing-scope risk, not a demonstrated bypass of the existing transfer ownership check. The production requirements remain: remove money-manufacturing controls, scope every object and implement accessible state/focus behavior.

## D9. Installable public shell and native boundary

Preserve the source install affordance using a Next.js web manifest and optional public-shell service worker; use Kita icon/splash assets, ink/warm/lime tokens and locale. Cache only fingerprinted public assets and an offline help page. All authenticated HTML/API, receipts, quotes, payment-provider redirects and financial SSE use network-only/no-store. Offline state shows a connection message and masked cached reference only where explicitly approved; never queue or replay financial POSTs on reconnect. Expo is the full native app, with secure storage and verified deep links; a PWA install is not a claim of native funding/IDV SDK support. F-COMPLIANCE-05 maps to KITA-AUTH-07/PUB-06/PLAT-07 and their negative offline/cache tests.
