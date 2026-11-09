BATCH-OK

Next: T-PLAT-03, limited to outbox/inbox contract types and an unavailable `applyEvent` stub. This does not authorize the full durable-worker implementation or close T-PLAT-03.

T-CONTRACT-01 landed: `commands.ts`, `events.ts`, `freezeContracts`, `ports.ts`, `gap-addenda.md`, and `contract-freeze.md`. The current `docs/kita-plan/openapi/kita-v1.yaml` SHA-256 matches the freeze: `f8f98d45c4c09098412da2504ed140211471859b3dee2be1d27be724d65eb49c`.

Exact files Qoder may change or create in the next batch:

- Change `apps/kita/packages/contracts/src/platform.ts`: add outbox/inbox envelopes, durable event and consumer identities, and `Plat03Input` / `Plat03Output` types using the frozen event vocabulary.
- Create `apps/kita/packages/platform/apply-event.ts`: expose `applyEvent(ctx: WorkerContext, input: Plat03Input): Promise<Result<Plat03Output>>`; always return the existing `dependency_unavailable` problem with status 503. No success path or side effects.
- Create `apps/kita/tests/features/test-plat-03.spec.ts`: verify the unavailable result and absence of database, queue, provider, or journal effects. This is stub evidence only, not durable-worker acceptance.

T-CORE-02 remains HOLD: the contract freeze does not authorize `executeCommand` or writes to `money_operations`.

No T-LEDGER-02. No refunds. No journal posting, database writes, event application, queue publishing, inbox acknowledgement, migrations, infrastructure changes, or live worker activation. Keep frozen contracts and existing exports unchanged except for the additive platform types above.

Execution follows the established roles: Qoder Efficient codes on GPU `gpu-fqaf`; Sol max reviews the returned batch. This document authorizes no implementation in this session.
