-- Planning verification fixture; run ONLY in an isolated empty test database after 001.
-- psql -X -v ON_ERROR_STOP=1 -d kita_plan_test -f 001_core.sql -f 002_core_smoke.sql
-- All fixture data and helper objects are rolled back. This is not a production seed.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path=kita,pg_catalog;
SET LOCAL TIME ZONE 'UTC';
DO $$
DECLARE
 b uuid:=gen_random_uuid(); pol uuid:=gen_random_uuid(); ev uuid:=gen_random_uuid();
 cash uuid:=gen_random_uuid(); wallet uuid:=gen_random_uuid(); php uuid:=gen_random_uuid();
 j uuid; replay uuid; rev uuid; bad uuid; rejected boolean;
 stamp timestamptz:=clock_timestamp(); lines jsonb; changed jsonb; backwards jsonb;
BEGIN
 INSERT INTO books(id,legal_entity,functional_currency,status) VALUES(b,'isolated-smoke-'||b,'USD','sandbox');
 INSERT INTO policies(id,book_id,kind,version,body,effective_at) VALUES(pol,b,'posting',1,'{"fixture":true}',stamp-interval '1 day');
 INSERT INTO accounting_periods(book_id,start_date,end_date,state) VALUES(b,current_date-1,current_date+2,'open');
 INSERT INTO evidence(id,book_id,source,external_event_id,body_hash,object_ref,verified,occurred_at)
 VALUES(ev,b,'isolated-test','fixture',repeat('a',64),'test-only://evidence',true,stamp);
 INSERT INTO ledger_accounts(id,book_id,code,currency,account_type,normal_side,enforce_nonnegative) VALUES
 (cash,b,'fixture:cash','USD','asset','D',true),
 (wallet,b,'fixture:wallet','USD','liability','C',true),
 (php,b,'fixture:php','PHP','asset','D',true);
 lines:=jsonb_build_array(
 jsonb_build_object('account_id',cash,'currency','USD','side','D','amount_minor','50399'),
 jsonb_build_object('account_id',wallet,'currency','USD','side','C','amount_minor','50399'));
 j:=post_journal(b,'smoke:fund',pol,ev,NULL,NULL,NULL,stamp,'isolated fixture',lines);
 replay:=post_journal(b,'smoke:fund',pol,ev,NULL,NULL,NULL,stamp,'isolated fixture',lines);
 IF j<>replay OR (SELECT count(*) FROM journals WHERE book_id=b)<>1 THEN RAISE EXCEPTION 'same-key replay duplicated journal'; END IF;
 IF (SELECT normal_minor FROM account_balances WHERE account_id=wallet)<>50399 THEN RAISE EXCEPTION 'wrong wallet projection'; END IF;

 rejected:=false;
 BEGIN
  PERFORM post_journal(b,'smoke:fund',pol,ev,NULL,NULL,NULL,stamp,'changed request',lines);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%idempotency payload mismatch%' THEN RAISE; END IF; rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'changed payload accepted'; END IF;

 changed:=jsonb_set(lines,'{1,amount_minor}','"50398"'); rejected:=false;
 BEGIN
  PERFORM post_journal(b,'smoke:unbalanced',pol,ev,NULL,NULL,NULL,stamp,'invalid',changed);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%unbalanced journal%' THEN RAISE; END IF; rejected:=true;
 END;
 IF NOT rejected OR (SELECT normal_minor FROM account_balances WHERE account_id=wallet)<>50399 THEN RAISE EXCEPTION 'unbalanced post/projection rollback failed'; END IF;

 changed:=jsonb_build_array(
 jsonb_build_object('account_id',wallet,'currency','USD','side','D','amount_minor','50400'),
 jsonb_build_object('account_id',cash,'currency','USD','side','C','amount_minor','50400'));
 rejected:=false;
 BEGIN
  PERFORM post_journal(b,'smoke:overdraw',pol,ev,NULL,NULL,NULL,stamp,'invalid',changed);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%insufficient balance%' THEN RAISE; END IF; rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'overdraw accepted'; END IF;

 changed:=jsonb_set(lines,'{0,account_id}',to_jsonb(php)); rejected:=false;
 BEGIN
  PERFORM post_journal(b,'smoke:wrong-currency',pol,ev,NULL,NULL,NULL,stamp,'invalid',changed);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%account/entity/currency mismatch%' THEN RAISE; END IF; rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'wrong currency accepted'; END IF;

 rejected:=false;
 BEGIN
  UPDATE journals SET description='tamper' WHERE id=j;
 EXCEPTION WHEN SQLSTATE '55000' THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'posted header mutable'; END IF;
 rejected:=false;
 BEGIN
  DELETE FROM journal_lines WHERE journal_id=j;
 EXCEPTION WHEN SQLSTATE '55000' THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'posted lines deletable'; END IF;

 backwards:=jsonb_build_array(
 jsonb_build_object('account_id',wallet,'currency','USD','side','D','amount_minor','50399'),
 jsonb_build_object('account_id',cash,'currency','USD','side','C','amount_minor','50399'));
 rev:=post_journal(b,'smoke:reverse',pol,ev,NULL,j,NULL,stamp,'exact reversal',backwards);
 IF EXISTS(SELECT 1 FROM account_balances WHERE account_id IN(cash,wallet) AND normal_minor<>0) THEN RAISE EXCEPTION 'reversal did not zero projections'; END IF;
 IF (SELECT reversal_of FROM journals WHERE id=rev)<>j THEN RAISE EXCEPTION 'reversal not linked'; END IF;

 -- Header trigger must reject an empty journal even without a journal_lines event.
 rejected:=false;
 BEGIN
  INSERT INTO journals(book_id,event_key,request_hash,policy_id,evidence_id,effective_at,description)
  VALUES(b,'smoke:empty',repeat('b',64),pol,ev,stamp,'invalid empty journal') RETURNING id INTO bad;
  SET CONSTRAINTS ALL IMMEDIATE;
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%at least two lines%' THEN RAISE; END IF; rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'empty journal accepted'; END IF;
 SET CONSTRAINTS ALL IMMEDIATE;
 IF has_table_privilege('kita_api','kita.journals','INSERT') OR has_table_privilege('kita_worker','kita.journal_lines','UPDATE') OR has_table_privilege('kita_posting','kita.account_balances','UPDATE') THEN RAISE EXCEPTION 'runtime direct ledger write granted'; END IF;
 IF NOT has_function_privilege('kita_posting','kita.post_journal(uuid,text,uuid,uuid,uuid,uuid,uuid,timestamptz,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'posting boundary not granted'; END IF;
 RAISE NOTICE 'Core smoke assertions passed; fixture will roll back';
END $$;
ROLLBACK;
