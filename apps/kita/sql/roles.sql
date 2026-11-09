# Least-privilege PostgreSQL roles for the Kita slice (T-PLAT-02 / T-CORE-01 contract).
# Batch 1: applies ONLY to the isolated test database kita_core_test (port 54339).
# Never run against production; no live money exists in this slice. See
# docs/runbooks/platform.md section 3 and docs/FORBIDDEN.md.
#
# Idempotent-ish bootstrap: run as a cluster admin role, one time, after createdb kita_core_test.

BEGIN;

-- 001_core.sql creates schema kita; roles.sql is idempotent either way. Owner must be the
-- migration group so grants below survive a fresh cluster (CREATE SCHEMA IF NOT EXISTS keeps
-- the existing owner when the schema already exists).

-- Cluster-level logins (NOLOGIN groups keep membership grants readable).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kita_group_migration') THEN
    CREATE ROLE kita_group_migration NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kita_group_api') THEN
    CREATE ROLE kita_group_api NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kita_group_worker') THEN
    CREATE ROLE kita_group_worker NOLOGIN;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS kita AUTHORIZATION kita_group_migration;

-- Migration owner: DDL only. No runtime DML on ledger tables through this role at app time.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kita_migration') THEN
    CREATE ROLE kita_migration LOGIN PASSWORD '__injected_at_runtime__'; -- never commit real secrets
  END IF;
END
$$;
GRANT kita_group_migration TO kita_migration;
GRANT USAGE, CREATE ON SCHEMA kita TO kita_group_migration;

-- API read role: SELECT + approved function EXECUTE only. Explicitly NOT INSERT/UPDATE/DELETE on
-- journals / journal_lines / account_balances (append-only enforcement is defense-in-depth via
-- triggers; role denial must come first). Negative tests expect SQLSTATE 42501.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kita_api') THEN
    CREATE ROLE kita_api LOGIN PASSWORD '__injected_at_runtime__';
  END IF;
END
$$;
GRANT kita_group_api TO kita_api;
GRANT USAGE ON SCHEMA kita TO kita_group_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA kita GRANT SELECT ON TABLES TO kita_group_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA kita GRANT EXECUTE ON FUNCTIONS TO kita_group_api;
REVOKE ALL ON SCHEMA kita FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;  -- schema public is NOT used by Kita; belt-and-braces

-- Worker role: executes approved command/reducer functions with SET LOCAL context. Raw ledger DML
-- remains denied; inserts happen only inside SECURITY DEFINER command functions owned by migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='kita_worker') THEN
    CREATE ROLE kita_worker LOGIN PASSWORD '__injected_at_runtime__';
  END IF;
END
$$;
GRANT kita_group_worker TO kita_worker;
GRANT USAGE ON SCHEMA kita TO kita_group_worker;
ALTER DEFAULT PRIVILEGES FOR ROLE kita_group_migration IN SCHEMA kita
  GRANT EXECUTE ON FUNCTIONS TO kita_group_worker;

COMMIT;

-- Post-check (run manually or from TEST-PLAT-02):
--   SET ROLE kita_api; INSERT INTO kita.journals DEFAULT VALUES;  -- must fail 42501
--   SET ROLE kita_worker; UPDATE kita.account_balances SET ...;   -- must fail 42501
-- Password placeholders above are literal; real credentials are injected at runtime by the
-- platform tooling (packages/platform, pending lane coder-24) and never stored in git.
