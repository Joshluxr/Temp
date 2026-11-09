# K. Infrastructure, deployment, and recovery

2026-11-09. Proposed engineering configuration; contractual/regulatory suitability is unverified pending owner/counsel. No infrastructure is deployed in this phase.

## K1. Environment topology

AWS separate accounts for development, provider sandbox, staging, production and security archive. ECS Fargate services: customer Next standalone, admin Next standalone, API customer/admin entrypoints, webhook ingress, outbox publisher, provider workers, rate ingestion, reconciliation/timers/notifications. Use independently scoped task IAM and security groups. Admin behind workforce access proxy/VPN with separate DNS/cookies; public API and callbacks behind ALB/WAF. Private PostgreSQL18.6 Multi-AZ, private Redis cache, SQS queues and DLQs, S3 private documents and cross-account audit Object Lock. Terraform remote state encrypted/locked with least privilege, no secrets in state where avoidable.

One authoritative write region (`us-east-1` proposed for US principal) and encrypted standby recovery region (`us-west-2` proposed). Jurisdiction/data-residency review may require different regional deployment before another market activates. No financial multi-primary. Network allows only required provider endpoints and AWS services; isolate callback ingress from outbound submit credentials. No public database. TLS current secure config, KMS per data purpose, Secrets Manager rotation, short-lived workload credentials. Provider mTLS keys live in scoped secret storage.

SQS Standard durable delivery with14-day retention, visibility timeout120s extended while work proceeds; task leases are DB-authoritative, default30s heartbeat10s. An expired lease never permits unsafe payment replay. DLQ after8 transient failures, redrive through approved command preserving IDs. Financial idempotency identities stay in PostgreSQL for the signed record-retention period, longer than queue retention. Aged outbox sweeper every minute ensures queue purge/loss does not erase committed work.

## K2. Deployment and migrations

CI: exact lockfile+SBOM/license scan → lint/types → OpenAPI compatibility+generated-client drift → SQL fresh/install/upgrade tests → money/property/concurrency → provider contract → frontend/mobile/a11y → security → signed artifact+provenance. Containers pinned by digest, run nonroot/read-only root FS, no shell debug endpoints or broad cloud permissions. Build once, promote same digest between staging and production. Secrets supplied at runtime, never baked into images. Admin and financial changes require independent review.

Migrations are numbered/checksummed and forward-only after real external activity. Expand schema → deploy dual-readable code → backfill verified data → switch reads/writes → remove old fields only after old workers/mobile versions drain. Freeze posting-template changes behind approved policy version. Schema rollback by restore is forbidden while remote money may have moved. Blue/green API deployment preserves command compatibility; workers stop claiming, finish durable transitions, and leave unknown external calls for inquiry. Release canary by new-account/exposure cap, not half of one transfer; no compliance A/B tests.

Production build rejects sandbox adapter imports, fake money endpoints, hardcoded live rates, sample KYC approvals, Kimi session dependencies and test keys. Feature activation checks account/environment+contract evidence+policy approvals in DB as well as application config. With credentials absent, route responds unavailable and records reason. Feature-flag outage defaults to previously approved cached disables/current DB authority; it never grants new permission.

## K3. Observability and alerts

OTel trace request→command→transfer→journal→outbox→attempt→provider evidence, with redacted IDs and no raw customer/payload data. Metrics do not use customer IDs as high-cardinality labels. Dashboard by corridor/provider/method/environment. Page on any unbalanced journal attempt accepted by DB (should be impossible), balance-projection drift, customer-asset shortfall, duplicate provider instruction, signature failures spike, unknown payout age>5min, quote-source age>10s, outbox oldest>60s, inbox apply lag>30s, timers overdue>60s, liquidity buffer breach, missing daily statements, failed audit archive, or privileged-access anomaly. Thresholds are initial operating targets tested in L.

SLOs separate our command/inbox availability from upstream delivery performance. Budget:99.9% monthly customer API, durable webhook p95≤500ms, owned-command p95≤750ms, quote p95≤2s, notification submission p95≤30s. Every alarm has owner/runbook and dedup key. Synthetic probes use sandbox or nonfinancial production reads; no unsolicited live money. Export logs to independent retention with PII scanning and bounded access.

## K4. Backup and fenced recovery

Continuous WAL/PITR, daily encrypted snapshot,35-day operational restore window as planning default; retained financial evidence follows signed retention schedule separately. Test restore monthly and complete payment recovery quarterly. Target DB RPO≤5min and infrastructure RTO≤60min; financial reopening has no fixed shortcut and waits for uncertainty resolution. Multi-AZ failover should retain acknowledged writes within provider service guarantees, but test actual behavior; cross-region RPO is not zero.

Recovery procedure:

1. Incident commander closes intake/submission gates; preserve inquiries, callbacks and customer support where safe. Independently revoke/fence former submit task identities and provider credentials before enabling replacement writers.
2. Snapshot surviving WAL, queues, inbox/object evidence, audit anchors and provider request logs. Record the earliest potentially lost command time and account/provider list.
3. Restore into isolated private DB; no submit credential or outbound payment network access. Validate schema checksums, ledger balance, cache reconstruction, command identities, approval records and audit chain/anchors.
4. Rebuild all attempts crossing the uncertainty window using independent provider history/statements and retained external reference evidence. Do not conclude missing DB row means no remote payment. Import evidence and reconstruct missing economic events through approved recovery templates.
5. Reconcile bank/provider/ledger movements and outstanding liabilities. Mark unresolved attempts unknown and keep their route exposure fenced. Rebuild outbox/consumer projections from durable identity, not new keys.
6. Finance, Security and incident commander sign recovered positions and writer fencing. Enable inquiries first, then small new exposure on fully reconciled scopes. Monitor duplicate submissions, changed balances and deadlines.
7. Retain recovery manifest, hash evidence, timeline, lost-data assessment, customer/regulator communications and corrective actions. Do not delete duplicate evidence to improve the report.

A DB lease/generation alone cannot fence an old process that still has provider credentials. Recovery requires cloud/workload and provider-side fencing or a contractually safe single submission gateway. If old credentials cannot be revoked, new submissions remain disabled until old authority is provably stopped.

## K5. Operational security and mobile delivery

Workforce SSO hardware MFA, short-lived admin sessions, just-in-time infrastructure access, signed code review, separate release/migration/finance/security archive owners. Pen test covers web/API/mobile/admin and business logic. Test KMS/key/secret rotation, callback overlap, expired credentials, TLS rotation, package compromise and emergency patch. No production data copied to test environments.

Expo development builds for provider SDK compatibility and device attestation; native secure storage, screenshots/app-switcher redaction on sensitive screens, verified app/universal links. Signed OTA only for compatible runtime fingerprint, staged rollout and rollback with version tracking; no payment behavior changed outside server policy/release control. Native binary changes go through store review and provider recertification as needed. Persist minimum supported app contract version; do not break in-progress transfers when old clients are blocked from starting new ones.

## K6. Capacity and spend planning

Benchmark stated A7 load with contention on the same customer/campaign/provider account, not only independent accounts. Bound pool size across tasks below database capacity; use transaction pooling carefully, avoiding leaked session tenant state. Use `SET LOCAL` for transactional context; object authorization remains server-side. Long reporting queries use replica/warehouse. Scale workers per provider rate limit and pending-age, with fairness across entities; a noisy retry queue must not starve refunds or legal deadlines.

Budget components: containers/ALB/WAF, Multi-AZ DB/storage/IO/backups, Redis, queue operations, S3/document/audit retention, KMS/Secrets, logs/traces, security tools, mobile builds and outbound network. Record measured cost per successful transfer after load/pilot; no unverified vendor price quotation in the plan. Reserve capital, safeguarded customer money, and provider prefund are separate from cloud spend.
