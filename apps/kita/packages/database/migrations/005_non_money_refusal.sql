-- T-CORE-02 limited non-money refusal-record slice.
-- Additive over 001_core.sql + 004_identity_access.sql.
-- Inserts no binding, book, customer, command key or financial row.
BEGIN;

SET search_path = pg_catalog;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'kita_refusal_recorder') THEN
    RAISE EXCEPTION 'kita_refusal_recorder already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'kita_refusal_definer') THEN
    RAISE EXCEPTION 'kita_refusal_definer already exists';
  END IF;
  IF to_regclass('kita.non_money_refusal_principals') IS NOT NULL THEN
    RAISE EXCEPTION 'kita.non_money_refusal_principals already exists';
  END IF;
  IF EXISTS (
    SELECT 1 FROM kita.command_keys WHERE operation = 'recordNonMoneyRefusal.v1'
  ) THEN
    RAISE EXCEPTION 'reserved refusal-record operation already has rows';
  END IF;
END
$$;

CREATE ROLE kita_refusal_recorder NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
CREATE ROLE kita_refusal_definer NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;

CREATE TABLE kita.non_money_refusal_principals (
  login_oid oid PRIMARY KEY,
  login_name name NOT NULL UNIQUE,
  book_id uuid NOT NULL REFERENCES kita.books (id),
  actor_id text NOT NULL,
  CONSTRAINT non_money_refusal_principals_actor_chk CHECK (
    actor_id ~ '^refusal-service:[A-Za-z0-9_-]{1,64}$'
  ),
  CONSTRAINT non_money_refusal_principals_book_actor_uq UNIQUE (book_id, actor_id)
);

CREATE FUNCTION kita.non_money_refusal_principals_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'non_money_refusal_principals is immutable'
    USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER non_money_refusal_principals_no_update
  BEFORE UPDATE OR DELETE ON kita.non_money_refusal_principals
  FOR EACH ROW
  EXECUTE FUNCTION kita.non_money_refusal_principals_immutable();

ALTER TABLE kita.command_keys
  ADD CONSTRAINT command_keys_non_money_refusal_shape CHECK (
    operation <> 'recordNonMoneyRefusal.v1'
    OR (
      state = 'rejected'
      AND resource_id IS NULL
      AND request_hash ~ '^rr1:[a-f0-9]{64}$'
      AND actor_id ~ '^refusal-service:[A-Za-z0-9_-]{1,64}$'
      AND key ~ '^[A-Za-z0-9_-]{16,128}$'
      AND response = '{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}'::jsonb
    )
  );

CREATE FUNCTION kita.guard_non_money_refusal_command_keys()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.operation = 'recordNonMoneyRefusal.v1' THEN
      RAISE EXCEPTION 'reserved refusal row is immutable'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;
  IF NEW.operation = 'recordNonMoneyRefusal.v1' OR OLD.operation = 'recordNonMoneyRefusal.v1' THEN
    RAISE EXCEPTION 'reserved refusal row is immutable'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER command_keys_non_money_refusal_immutable
  BEFORE UPDATE OR DELETE ON kita.command_keys
  FOR EACH ROW
  EXECUTE FUNCTION kita.guard_non_money_refusal_command_keys();

CREATE FUNCTION kita.record_non_money_refusal(p_key text, p_tag text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  v_login name := session_user;
  v_oid oid;
  v_book uuid;
  v_actor text;
  v_status text;
  v_hash text;
  v_canonical text;
  v_row kita.command_keys%ROWTYPE;
  v_response jsonb := '{"ok":false,"error":{"code":"CAPABILITY_UNAVAILABLE","status":503,"retryable":false,"detail":"Command execution is unavailable."}}'::jsonb;
  v_super boolean;
  v_createdb boolean;
  v_createrole boolean;
  v_replication boolean;
  v_bypass boolean;
  v_inherit boolean;
  v_member boolean;
BEGIN
  IF p_key IS NULL OR p_tag IS NULL
     OR p_key !~ '^[A-Za-z0-9_-]{16,128}$'
     OR p_tag !~ '^[A-Za-z0-9_-]{1,64}$' THEN
    RAISE EXCEPTION 'invalid refusal-record request' USING ERRCODE = '22023';
  END IF;

  SELECT r.oid, r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolreplication, r.rolbypassrls, r.rolinherit
    INTO v_oid, v_super, v_createdb, v_createrole, v_replication, v_bypass, v_inherit
  FROM pg_catalog.pg_roles r
  WHERE r.rolname = v_login;

  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_auth_members m
    JOIN pg_catalog.pg_roles g ON g.oid = m.roleid
    WHERE m.member = v_oid
      AND g.rolname = 'kita_refusal_recorder'
      AND m.admin_option = false
  ) INTO v_member;

  IF v_oid IS NULL OR v_super OR v_createdb OR v_createrole OR v_replication OR v_bypass OR NOT v_inherit OR NOT v_member THEN
    RAISE EXCEPTION 'refusal-record scope is unavailable' USING ERRCODE = 'KRF01';
  END IF;

  SELECT p.book_id, p.actor_id
    INTO v_book, v_actor
  FROM kita.non_money_refusal_principals p
  WHERE p.login_oid = v_oid AND p.login_name = v_login;

  IF v_book IS NULL THEN
    RAISE EXCEPTION 'refusal-record scope is unavailable' USING ERRCODE = 'KRF01';
  END IF;

  SELECT b.status INTO v_status FROM kita.books b WHERE b.id = v_book;
  IF v_status IS DISTINCT FROM 'disabled' THEN
    RAISE EXCEPTION 'refusal-record scope is unavailable' USING ERRCODE = 'KRF01';
  END IF;

  v_canonical := '{"requestTag":"' || p_tag || '","schemaVersion":1}';
  v_hash := 'rr1:' || encode(pg_catalog.sha256(convert_to(v_canonical, 'UTF8')), 'hex');

  SELECT * INTO v_row
  FROM kita.command_keys k
  WHERE k.book_id = v_book
    AND k.actor_id = v_actor
    AND k.operation = 'recordNonMoneyRefusal.v1'
    AND k.key = p_key;

  IF FOUND THEN
    IF v_row.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'idempotency key is bound to a different request' USING ERRCODE = 'KRF02';
    END IF;
    IF v_row.state IS DISTINCT FROM 'rejected'
       OR v_row.resource_id IS NOT NULL
       OR v_row.response IS DISTINCT FROM v_response
       OR v_row.request_hash !~ '^rr1:[a-f0-9]{64}$' THEN
      RAISE EXCEPTION 'refusal-record integrity is unavailable' USING ERRCODE = 'KRF03';
    END IF;
    RETURN v_row.response;
  END IF;

  BEGIN
    INSERT INTO kita.command_keys (
      book_id, actor_id, operation, key, request_hash, state, resource_id, response
    ) VALUES (
      v_book, v_actor, 'recordNonMoneyRefusal.v1', p_key, v_hash, 'rejected', NULL, v_response
    );
  EXCEPTION
    WHEN unique_violation THEN
      SELECT * INTO v_row
      FROM kita.command_keys k
      WHERE k.book_id = v_book
        AND k.actor_id = v_actor
        AND k.operation = 'recordNonMoneyRefusal.v1'
        AND k.key = p_key;
      IF NOT FOUND THEN
        RAISE;
      END IF;
      IF v_row.request_hash IS DISTINCT FROM v_hash THEN
        RAISE EXCEPTION 'idempotency key is bound to a different request' USING ERRCODE = 'KRF02';
      END IF;
      IF v_row.state IS DISTINCT FROM 'rejected'
         OR v_row.resource_id IS NOT NULL
         OR v_row.response IS DISTINCT FROM v_response THEN
        RAISE EXCEPTION 'refusal-record integrity is unavailable' USING ERRCODE = 'KRF03';
      END IF;
      RETURN v_row.response;
  END;

  RETURN v_response;
END;
$$;

GRANT kita_refusal_definer TO CURRENT_USER WITH INHERIT TRUE, SET TRUE;
GRANT CREATE ON SCHEMA kita TO kita_refusal_definer;
ALTER FUNCTION kita.record_non_money_refusal(text, text) OWNER TO kita_refusal_definer;
REVOKE CREATE ON SCHEMA kita FROM kita_refusal_definer;

REVOKE ALL ON FUNCTION kita.record_non_money_refusal(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION kita.record_non_money_refusal(text, text) TO kita_refusal_recorder;

GRANT USAGE ON SCHEMA kita TO kita_refusal_recorder;
GRANT USAGE ON SCHEMA kita TO kita_refusal_definer;

GRANT SELECT (login_oid, login_name, book_id, actor_id) ON kita.non_money_refusal_principals TO kita_refusal_definer;
GRANT SELECT (id, status) ON kita.books TO kita_refusal_definer;
GRANT SELECT (
  id, book_id, actor_id, operation, key, request_hash, state, resource_id, response, created_at
) ON kita.command_keys TO kita_refusal_definer;
GRANT INSERT (
  book_id, actor_id, operation, key, request_hash, state, resource_id, response
) ON kita.command_keys TO kita_refusal_definer;

REVOKE kita_refusal_definer FROM CURRENT_USER;

COMMIT;
