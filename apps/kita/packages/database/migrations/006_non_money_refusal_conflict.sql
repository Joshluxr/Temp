-- Forward repair: same-key ON CONFLICT DO NOTHING so invisible unique
-- conflicts surface as native 40001 instead of rethrown 23505.
-- Replaces only kita.record_non_money_refusal(text,text). Never ok:true.
BEGIN;

SET search_path = pg_catalog;

DO $$
DECLARE
  v_oid oid;
  v_owner name;
  v_hash text;
  v_len integer;
  v_admin boolean;
  v_temp boolean;
BEGIN
  IF session_user IS DISTINCT FROM 'kita_test' OR current_user IS DISTINCT FROM 'kita_test' THEN
    RAISE EXCEPTION '006 installer must be kita_test';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kita_test' AND (rolsuper OR NOT rolcreaterole)) THEN
    RAISE EXCEPTION '006 installer attributes are not NOSUPERUSER CREATEROLE';
  END IF;

  SELECT p.oid, pg_get_userbyid(p.proowner), length(p.prosrc), encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex')
    INTO v_oid, v_owner, v_len, v_hash
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal'
    AND pg_get_function_identity_arguments(p.oid) = 'p_key text, p_tag text';

  IF v_oid IS NULL THEN
    RAISE EXCEPTION '006 HOLD: function missing';
  END IF;
  IF v_owner IS DISTINCT FROM 'kita_refusal_definer' THEN
    RAISE EXCEPTION '006 HOLD: unexpected function owner';
  END IF;
  IF v_len IS DISTINCT FROM 3799 OR v_hash IS DISTINCT FROM 'b02f86166e57077af7dde9702455492c344e4f543ac21408b4b6f979fdf2b5e8' THEN
    RAISE EXCEPTION '006 HOLD: installed body is not the reviewed 005 definition';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_auth_members m
    JOIN pg_roles r ON r.oid = m.member
    JOIN pg_roles g ON g.oid = m.roleid
    WHERE r.rolname = 'kita_test'
      AND g.rolname = 'kita_refusal_definer'
      AND m.admin_option
  ) INTO v_admin;
  IF NOT v_admin THEN
    RAISE EXCEPTION '006 HOLD: kita_test lacks ADMIN OPTION on kita_refusal_definer';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_auth_members m
    JOIN pg_roles r ON r.oid = m.member
    JOIN pg_roles g ON g.oid = m.roleid
    JOIN pg_roles grantor ON grantor.oid = m.grantor
    WHERE r.rolname = 'kita_test'
      AND g.rolname = 'kita_refusal_definer'
      AND grantor.rolname = 'kita_test'
  ) INTO v_temp;
  IF v_temp THEN
    RAISE EXCEPTION '006 HOLD: temporary kita_test-granted membership already present';
  END IF;
END
$$;

GRANT kita_refusal_definer TO CURRENT_USER WITH ADMIN FALSE, INHERIT TRUE, SET FALSE GRANTED BY CURRENT_USER;

CREATE OR REPLACE FUNCTION kita.record_non_money_refusal(p_key text, p_tag text)
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
  v_inserted integer;
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

  INSERT INTO kita.command_keys (
    book_id, actor_id, operation, key, request_hash, state, resource_id, response
  ) VALUES (
    v_book, v_actor, 'recordNonMoneyRefusal.v1', p_key, v_hash, 'rejected', NULL, v_response
  )
  ON CONFLICT (book_id, actor_id, operation, key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 1 THEN
    RETURN v_response;
  END IF;

  SELECT * INTO v_row
  FROM kita.command_keys k
  WHERE k.book_id = v_book
    AND k.actor_id = v_actor
    AND k.operation = 'recordNonMoneyRefusal.v1'
    AND k.key = p_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'refusal-record integrity is unavailable' USING ERRCODE = 'KRF03';
  END IF;
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
END;
$$;

REVOKE kita_refusal_definer FROM CURRENT_USER GRANTED BY CURRENT_USER RESTRICT;

DO $$
DECLARE
  v_owner name;
  v_hash text;
  v_temp boolean;
  v_prosecdef boolean;
BEGIN
  SELECT pg_get_userbyid(p.proowner), encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex'), p.prosecdef
    INTO v_owner, v_hash, v_prosecdef
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'kita' AND p.proname = 'record_non_money_refusal'
    AND pg_get_function_identity_arguments(p.oid) = 'p_key text, p_tag text';
  IF v_owner IS DISTINCT FROM 'kita_refusal_definer' OR v_prosecdef IS NOT TRUE THEN
    RAISE EXCEPTION '006 HOLD: owner or SECURITY DEFINER changed';
  END IF;
  IF v_hash IS DISTINCT FROM 'a6140caff93ff7a014ee33ae6c32bb669f8bd75322580fdaafc9c3179f76898a' THEN
    RAISE EXCEPTION '006 HOLD: installed body hash mismatch';
  END IF;
  SELECT EXISTS (
    SELECT 1
    FROM pg_auth_members m
    JOIN pg_roles r ON r.oid = m.member
    JOIN pg_roles g ON g.oid = m.roleid
    JOIN pg_roles grantor ON grantor.oid = m.grantor
    WHERE r.rolname = 'kita_test'
      AND g.rolname = 'kita_refusal_definer'
      AND grantor.rolname = 'kita_test'
  ) INTO v_temp;
  IF v_temp THEN
    RAISE EXCEPTION '006 HOLD: temporary membership survived REVOKE';
  END IF;
END
$$;

COMMIT;
