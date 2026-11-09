# Contract Freeze — T-CONTRACT-01 (public HTTP surface)

Status: frozen for the current supplied-scope baseline. This document records what is
contractually locked and what explicitly is **not** locked by it.

## 1. Public HTTP contract

Public HTTP is defined solely by:

- Artifact: `docs/kita-plan/openapi/kita-v1.yaml`
- Title / version: `Kita remittance v1` / `1.0.0-plan.2026-11-09`
- sha256 (over the exact yaml bytes):
  `f8f98d45c4c09098412da2504ed140211471859b3dee2be1d27be724d65eb49c`

Any byte change to that file — whitespace, comment, or reordering included — breaks the
freeze and requires re-review before dependent streams continue. No worker makes a private
contract fork; additions arrive only as reviewed addenda with a new recorded hash.

The same hash appears in `docs/kita-plan/COMPLETENESS-PASS.md` and
`docs/kita-plan/evidence/validation-report.json` (`artifact_sha256`), which is the cross-check
that the plan artifacts and this freeze agree on one wire contract.

## 2. How the freeze is computed

`freezeContracts` (`apps/kita/packages/contracts/src/freeze-contracts.ts`) hashes the
**verbatim yaml bytes** of each candidate:

- Per-entry hash = `sha256` over the exact `Uint8Array` passed in as `candidate.yaml`. It is
  not a hash of a parsed/re-serialized document, so semantically-neutral edits still count
  as contract changes.
- Entries are sorted by name and combined into an aggregate digest over
  `name:hash` lines.
- Input validation rejects empty batches, blank/duplicate names, and zero-length payloads.

Consequence for CI and reviewers: drift checks must compare against the raw-file digest
above, never against a regenerated or reformatted copy of the spec.

## 3. What freezing does NOT do

- **No money posting.** A successful freeze produces an in-process manifest of hashes only.
  `freezeContracts` performs no I/O beyond the pure hash and never posts, publishes, or
  submits the manifest anywhere. Freezing contracts is not a financial operation and implies
  no ledger movement, no accounting period, and no approval authority.
- **No T-CORE-02.** This freeze does not implement, unblock, or satisfy
  `T-CORE-02` (durable commands, subject holds, limit buckets, non-transfer financial work
  identities). Per `docs/kita-plan/13-backlog.md`, all financial feature commands still
  require T-CORE-02/T-LEDGER-02 regardless of this contract being frozen. Read/UI-only work
  may proceed against the frozen surface; command-backed flows may not claim completion on
  the strength of this document.

## 4. Evidence

- EV(T-CONTRACT-01): architect freeze manifest plus Finance/Security review
  (see `docs/kita-plan/13-backlog.md`, T-CORE-01 section).
- Reproduce locally: `sha256sum docs/kita-plan/openapi/kita-v1.yaml`.
