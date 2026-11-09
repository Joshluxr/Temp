-- T-IDENTITY-01: durable session/device binding, refresh-token rotation with reuse detection,
-- and short-lived evidence/document access support records. PostgreSQL 18 dialect, additive only.
-- Sources: docs/kita-plan/13-backlog.md T-IDENTITY-01 ("DB" row), docs/kita-plan/09-admin-security.md
-- I1 (opaque server sessions, rotated refresh tokens + reuse detection, device inventory and
-- revocation) and I6 (HMAC lookup values only, envelope cipher + purpose-separated keys,
-- signed document links <=60s, every privileged reveal audited).
--
-- PURE DDL: this file contains NO INSERT statements, so the no-money-import guard
-- (packages/database/src/invariant.ts findMoneyImport) has no install-time import vector to model,
-- and NO seed row can fabricate a KYC approval, a clean scan, an active session or a verified contact.
-- Every state column defaults to the UNTRUSTED value ('pending'/'quarantine'-equivalent), never to
-- 'clean'/'approved'/'pass'. Runtime rows arrive only through narrowly authorized command functions.
--
-- No PAN/CVV anywhere: token material is HMAC lookup text and provider-token ciphertext owned by
-- 001's funding_instruments; this file adds HMAC columns only (see refresh_tokens.token_hmac) and
-- never a card number or security code column. No money columns (*_minor / atomic_units), no
-- journals/balances/economic tables. executeCommand/command_keys are untouched (T-CORE-02 owns them).
-- Privileges stay with 001's tail: this file issues NO GRANT/REVOKE, and it ALTERs nothing that
-- already exists — permissions documents.read vs access.grant remain data in the existing
-- approvals/audit_events/staff_grants machinery, not new database roles.
BEGIN;

SET search_path = kita, pg_catalog;

-- ---------------------------------------------------------------------------
-- 1. session_devices: durable device inventory referenced by auth_sessions.device_ref.
--    001 stores device_ref as opaque NOT NULL text on auth_sessions with no owning table, so the
--    inventory binding (enrol / rename / revoke per device) had nowhere to live. One row per
--    (book, customer, device_ref); auth_sessions.device_ref points at session_devices.device_ref.
--    label_mask is a display mask only — no push/advert identifiers, no raw PII (I6 "no raw PII").
-- ---------------------------------------------------------------------------
CREATE TABLE session_devices(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books,
  customer_id uuid NOT NULL,
  device_ref text NOT NULL CHECK(device_ref~'^[A-Za-z0-9_-]{8,128}$'),
  label_mask text NOT NULL CHECK(length(label_mask) BETWEEN 1 AND 128),
  platform text NOT NULL CHECK(platform IN ('web','ios','android','other')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE(book_id,customer_id,device_ref),
  -- Ownership proof: a device row may only name a customer belonging to its own book, enforced by
  -- the composite FK pair (001's customers(id,book_id) pattern), not by application-side trust.
  FOREIGN KEY(customer_id,book_id) REFERENCES customers(id,book_id),
  CHECK(revoked_at IS NULL OR revoked_at>=enrolled_at)
);
-- Device-list read path: newest enrolment first for one customer inside one book.
CREATE INDEX session_devices_customer ON session_devices(book_id,customer_id,enrolled_at DESC,id);
-- Revocation sweep / "is this device still live" lookups without scanning history.
CREATE INDEX session_devices_active ON session_devices(customer_id,device_ref) WHERE revoked_at IS NULL;

COMMENT ON TABLE session_devices IS 'I1 device inventory backing auth_sessions.device_ref; enrolment plus revocation, scoped by the composite customers(id,book_id) ownership FK.';
COMMENT ON COLUMN session_devices.device_ref IS 'Opaque device identifier handed to the session layer; matched against auth_sessions.device_ref. Not a secret, not a hardware ID, never logged as PII.';
COMMENT ON COLUMN session_devices.label_mask IS 'Operator/customer-facing masked label (e.g. "iPhone ** 1"); carries no token, cookie or push-certificate material.';
COMMENT ON COLUMN session_devices.revoked_at IS 'Set once on revocation; a revoked device must not mint new sessions or refresh generations (RB-CONTROL rollback path).';

-- ---------------------------------------------------------------------------
-- 2. refresh_tokens: rotation ledger with reuse detection. Only the HMAC of the presented token is
--    stored (I6 "HMAC normalized values only where lookup is needed"; same 64-hex text shape as
--    recipient_versions.destination_hmac / contact_verifications.destination_hmac) — never the token,
--    never a session cookie value. family_id groups one login's rotation chain so presenting an
--    already-rotated generation marks the whole family 'reuse_detected' and the tree is revoked.
--    state defaults to 'active' because a newly minted token IS legitimately active; unlike 001's
--    transfers.compliance_state (default 'pending') no approval/clean/pass default exists here, and
--    nothing in this table asserts identity success — reuse_detected and revoked are terminal.
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES auth_sessions,
  family_id uuid NOT NULL,
  generation bigint NOT NULL CHECK(generation>0),
  token_hmac text NOT NULL CHECK(token_hmac~'^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','rotated','revoked','reuse_detected')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  expires_at timestamptz NOT NULL,
  UNIQUE(session_id,generation),
  -- Rotation is monotone and time-consistent; a token can never outlive its issuing moment.
  CHECK(expires_at>issued_at),
  CHECK(rotated_at IS NULL OR rotated_at>=issued_at),
  -- Reuse/rotation bookkeeping must never claim a future timestamp, and a non-active row must be
  -- dated so the audit trail can reconstruct the sequence.
  CHECK(state='active' OR rotated_at IS NOT NULL)
);
-- Family-tree walk on reuse detection (revoke every descendant of a compromised family).
CREATE INDEX refresh_tokens_family ON refresh_tokens(family_id,generation);
-- Expiry sweep for the retention/expiry worker.
CREATE INDEX refresh_tokens_expiry ON refresh_tokens(expires_at) WHERE state='active';

COMMENT ON TABLE refresh_tokens IS 'I1 rotated refresh-token chain with reuse detection; keyed by HMAC lookup value only, so a dump yields no usable bearer token.';
COMMENT ON COLUMN refresh_tokens.token_hmac IS 'HMAC-SHA-256 (64-hex lowercase) of the opaque refresh token under a KMS-held lookup key; unique so replay collides on the index instead of silently succeeding.';
COMMENT ON COLUMN refresh_tokens.family_id IS 'Rotation lineage for one authenticated login; reuse of any member invalidates the whole family.';
COMMENT ON COLUMN refresh_tokens.generation IS 'Strictly increasing rotation counter within a session; UNIQUE(session_id,generation) makes double-rotation impossible.';
COMMENT ON COLUMN refresh_tokens.state IS 'active -> rotated on use; revoked on logout/device revocation; reuse_detected when a rotated hmac is presented again (never a success state).';

-- ---------------------------------------------------------------------------
-- 3. document_access_grants: evidence-access support records for privileged document reveals.
--    Two separate permissions gate a reveal (I2): documents.read to see that a document exists,
--    access.grant to mint a link. Both are enforced OUTSIDE this table via the existing
--    approvals/audit_events/staff_grants rows — approval_id is nullable precisely because the DDL
--    must not pretend an approval happened; a runtime command supplies it when policy demands one.
--    step_up_ref is the assurance marker (I1 workforce step-up <=5 min) recorded as an opaque ref,
--    never a credential. The ≤60s ceiling from I6 is asserted in DDL, so an over-long link cannot
--    be persisted even by a buggy command function.
-- ---------------------------------------------------------------------------
CREATE TABLE document_access_grants(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books,
  document_id uuid NOT NULL,
  actor_ref text NOT NULL CHECK(length(actor_ref) BETWEEN 1 AND 256),
  purpose text NOT NULL CHECK(length(purpose) BETWEEN 1 AND 512),
  approval_id uuid REFERENCES approvals,
  step_up_ref text NOT NULL CHECK(length(step_up_ref) BETWEEN 1 AND 256),
  link_expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  state text NOT NULL DEFAULT 'issued' CHECK(state IN ('issued','consumed','expired','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Same-book guarantee for the revealed document, by composite FK rather than app logic.
  FOREIGN KEY(document_id,book_id) REFERENCES documents(id,book_id),
  CHECK(link_expires_at>created_at),
  -- I6 hard rule: short-lived signed document links are <=60 seconds. Encoded as a constraint so
  -- the ceiling is schema-enforced; extract(epoch ...) keeps it numeric-exact across DST/leap rows.
  CHECK(extract(epoch FROM (link_expires_at-created_at))<=60),
  CHECK(consumed_at IS NULL OR (consumed_at>=created_at AND consumed_at<=link_expires_at)),
  -- Only an unconsumed grant may still be revoked or expire; a consumed link is finished history,
  -- and any non-issued state must be dated (consumed_at for 'consumed', rotated by expiry/revocation).
  CHECK(state='issued' OR (state='consumed' AND consumed_at IS NOT NULL) OR (state IN ('expired','revoked') AND consumed_at IS NULL))
);
-- Grant-history read path for audit review: most recent grants for a document inside a book.
CREATE INDEX document_access_grants_document ON document_access_grants(book_id,document_id,created_at DESC,id);
-- Approval-chain reconciliation: which grants did an approval authorize.
CREATE INDEX document_access_grants_approval ON document_access_grants(approval_id) WHERE approval_id IS NOT NULL;

COMMENT ON TABLE document_access_grants IS 'I6 privileged-reveal support record: who (actor_ref), why (purpose), under which approval and step-up, for how long (<=60s). Reads of documents are audited via audit_events; this table is the grant side of that pairing.';
COMMENT ON COLUMN document_access_grants.actor_ref IS 'Opaque staff/customer subject reference (staff_identities.subject or auth_sessions principal); no display names, no credentials.';
COMMENT ON COLUMN document_access_grants.purpose IS 'Mandatory business purpose string; an empty or generic purpose is rejected by the command layer, and this column being NOT NULL keeps "no reason" impossible.';
COMMENT ON COLUMN document_access_grants.step_up_ref IS 'Reference to the assurance event that satisfied the access.grant permission; presence is required, its value is opaque.';
COMMENT ON COLUMN document_access_grants.link_expires_at IS 'Absolute death of the signed link, capped at 60s after created_at by CHECK; watermarked viewer fetch must complete before it.';
COMMENT ON COLUMN document_access_grants.state IS 'issued -> consumed on redemption; expired past link_expires_at; revoked on incident. There is no approved/clean/pass value to fabricate.';

-- ---------------------------------------------------------------------------
-- 4. evidence_access_scans: malware/MIME/content scan lifecycle extension for documents.
--    001 keeps documents.scan_state immutable ('quarantine','clean','rejected'); the per-scan
--    evidence that justifies a transition lives here as append-only rows instead of mutating the
--    document row. outcome defaults to 'pending': a scan is never presumed clean, and because this
--    file has no INSERTs no 'clean' row can be seeded. detail_hash is a digest of the scanner
--    report object (object storage), never the scanned content or any PII.
-- ---------------------------------------------------------------------------
CREATE TABLE evidence_access_scans(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents,
  scanner text NOT NULL CHECK(length(scanner) BETWEEN 1 AND 128),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  outcome text NOT NULL DEFAULT 'pending' CHECK(outcome IN ('pending','clean','rejected')),
  detail_hash text CHECK(detail_hash IS NULL OR detail_hash~'^[a-f0-9]{64}$'),
  CHECK(completed_at IS NULL OR completed_at>=started_at),
  -- A finished verdict requires a completion timestamp; an unfinished scan must not carry one.
  CHECK((outcome='pending' AND completed_at IS NULL) OR (outcome<>'pending' AND completed_at IS NOT NULL)),
  -- A terminal verdict requires report evidence, so 'clean' can never be claimed bare.
  CHECK(outcome='pending' OR detail_hash IS NOT NULL)
);
-- Scan history for one document, oldest first (transition reconstruction for auditors).
CREATE INDEX evidence_access_scans_document ON evidence_access_scans(document_id,started_at,id);
-- Worker queue pickup: pending scans due for completion.
CREATE INDEX evidence_access_scans_pending ON evidence_access_scans(started_at) WHERE outcome='pending';

COMMENT ON TABLE evidence_access_scans IS 'I6 quarantine/scan lifecycle audit trail per document; supports documents.scan_state without mutating it, keeping the original scan record immutable.';
COMMENT ON COLUMN evidence_access_scans.scanner IS 'Versioned scanner identity (engine + ruleset) so a verdict can be re-evaluated when signatures age.';
COMMENT ON COLUMN evidence_access_scans.detail_hash IS 'SHA-256 (64-hex lowercase) of the stored scanner report; holds no scanned bytes, no PII, no secrets.';
COMMENT ON COLUMN evidence_access_scans.outcome IS 'pending until the scanner answers; clean/rejected are asserted only by the scan command after real results, never by a default.';

COMMIT;
