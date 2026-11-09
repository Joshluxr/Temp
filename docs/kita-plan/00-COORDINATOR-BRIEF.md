# Coordinator brief (2026-11-09)

Grok is coordinator only. Codex `gpt-6-astra` `xhigh` must write the complete plan under `docs/kita-plan/`. Do not implement the remittance application in this phase.

## Source availability (inspected this run)

All tmpfiles.org sources were downloaded to `docs/kita-sources/`:

| File | Status | Notes |
|---|---|---|
| `kita_remittance_technical_blueprint.pdf` | available | text extract `kita_blueprint.txt` (1676 lines) |
| `remittance_platform_technical_blueprint.pdf` | available | `remit_blueprint.txt` (2132 lines) |
| `building_a_philippines_focused_remittance_platform_technical_research.pdf` | available | `ph_research.txt` (1137 lines) |
| `remittance-platform-technical-build-research.md` | available | 1288 lines |
| `remittance_platform_technical_research.md` | available | 228 lines; treat as partial vs the 1288-line sibling |
| `20261110_025437_enterprise_remit_a87.txt` | available | **truncated** (~4 lines / 3326 bytes) |
| `kimi_agent_remittancewebsitefullstack.zip` | available | unpacked `kimi-archive/app` + nested `Kita_Remittance_Technical_Blueprint.pdf` (dedupe vs kita pdf) |

## Actual starting stack (verify in archive; do not assume Next.js/Postgres already exist)

- UI: React 19 + Vite 7 + React Router 7 + Tailwind. Product identity Kita. Colors in use: ink `#0a0a0a`, warm `#f5f5f0`, lime `#c8ff00` (Newsreader + Hanken Grotesk).
- API: Hono + tRPC 11 + Zod 4. Kimi session auth (`api/kimi/*`), roles `user|admin` only.
- Persistence: **MySQL** via Drizzle (`mysql2`), not PostgreSQL. `db/migrations/.gitkeep` only — no executable SQL migrations.
- Ledger: tables exist; admin `complete` / customer `simulatePartnerCompletion` / `addSandboxFunds` manufacture outcomes. KYC provider default `"Sandbox eKYC"`.
- Rates: configured/sandbox, not live executable liquidity. Rate alerts stored, not processed as a conversion product.
- Tests: vitest configured; archive has no material production-grade financial tests.
- Payout methods modeled: bank, GCash, Maya, cash_pickup. Partners labeled Nium/Thunes/PERA HUB **sandbox**.
- Funding labels: Stripe ACH sandbox, Adyen sandbox, Kita wallet sandbox top-up.
- Home page explicitly discloses sandbox / no real money.

## Planning rules (from the goal)

Write sections A–N as separate files plus a master `README.md` index. Every feature ID in a traceability matrix. Concrete stack decision (evaluate Next.js+Postgres+workers+Redis vs retain Vite/Hono/tRPC/MySQL). US→PH first corridor; configure US, CA, UK, EU/EEA, JP, SG, AU. No TODOs, no fake money, no silent mocks in production. Provider gaps are external dependencies with gates.

Preferred baseline to **evaluate**: TypeScript, Next.js customer web + separate admin, React Native/Expo, modular backend + workers, PostgreSQL financial persistence, durable orchestration, Redis cache, encrypted object storage.

Commit to one architecture. Pin versions after current docs (check date 2026-11-09).

Integration owner: Principal full-stack / financial-systems architect (single accountable owner). Subagent workstreams must share contracts before parallel coding.
