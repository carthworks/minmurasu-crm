-- RLS, trigger and RPC tests. Run after 00_stub_supabase_auth.sql and all migrations:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/10_rls_and_rpcs.test.sql
-- Raises an exception (non-zero exit) if any assertion fails.

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
INSERT INTO auth.users VALUES
 ('00000000-0000-0000-0000-00000000000a','super'),('00000000-0000-0000-0000-00000000000b','admin'),
 ('00000000-0000-0000-0000-00000000000c','tm'),('00000000-0000-0000-0000-00000000000d','sales'),
 ('00000000-0000-0000-0000-00000000000e','client');
INSERT INTO profiles (id, email, full_name) SELECT id, email, email FROM auth.users;
INSERT INTO organizations (id, name, slug) VALUES ('10000000-0000-0000-0000-000000000001','OrgA','orga');
INSERT INTO clients (id, organization_id, name) VALUES
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','C1'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','C2');
INSERT INTO organization_members (id, organization_id, profile_id, role, client_id) VALUES
 ('30000000-0000-0000-0000-00000000000a','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','super_admin',NULL),
 ('30000000-0000-0000-0000-00000000000b','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000b','agency_admin',NULL),
 ('30000000-0000-0000-0000-00000000000c','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','team_member',NULL),
 ('30000000-0000-0000-0000-00000000000d','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000d','sales_bd',NULL),
 ('30000000-0000-0000-0000-00000000000e','10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000e','client','20000000-0000-0000-0000-000000000001');
INSERT INTO invoices (organization_id, client_id, invoice_number, amount_inr, due_date) VALUES
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','INV-1',100,'2026-12-01'),
 ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','INV-2',200,'2026-12-01');

CREATE TABLE results (n serial, test text, ok boolean, detail text);
GRANT ALL ON results, results_n_seq TO authenticated;
CREATE FUNCTION t(p_name text, p_sql text, p_expect text) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE v int; BEGIN
  BEGIN
    EXECUTE p_sql;
    GET DIAGNOSTICS v = ROW_COUNT;
    IF p_expect = 'fail' THEN INSERT INTO results(test,ok,detail) VALUES (p_name,false,'succeeded, rows='||v);
    ELSE INSERT INTO results(test,ok,detail) VALUES (p_name, v::text = p_expect, 'rows='||v); END IF;
  EXCEPTION WHEN others THEN
    INSERT INTO results(test,ok,detail) VALUES (p_name, p_expect='fail', SQLERRM);
  END;
END $f$;
CREATE FUNCTION cnt(p_name text, p_sql text, p_expect int) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE v int; BEGIN EXECUTE p_sql INTO v; INSERT INTO results(test,ok,detail) VALUES (p_name, v=p_expect, 'count='||v); END $f$;
CREATE FUNCTION who(p uuid) RETURNS void LANGUAGE sql AS $f$ SELECT set_config('request.jwt.claim.sub', p::text, false) $f$;

SET ROLE authenticated;

SELECT who('00000000-0000-0000-0000-00000000000c'); -- team_member
SELECT cnt('tm cannot read invoices', 'SELECT count(*) FROM invoices', 0);
SELECT t('tm cannot insert invoice', $$INSERT INTO invoices (organization_id,client_id,invoice_number,amount_inr,due_date) VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','X',1,'2026-12-01')$$, 'fail');
SELECT t('tm cannot hard-delete client', $$DELETE FROM clients WHERE id='20000000-0000-0000-0000-000000000002'$$, '0');
SELECT t('tm can soft-delete client', $$UPDATE clients SET deleted_at=now() WHERE id='20000000-0000-0000-0000-000000000002'$$, '1');
SELECT t('tm cannot insert lead', $$INSERT INTO leads (organization_id,name) VALUES ('10000000-0000-0000-0000-000000000001','L')$$, 'fail');
SELECT cnt('tm can read clients', 'SELECT count(*) FROM clients', 2);
SELECT t('tm cannot forge audit actor', $$INSERT INTO audit_logs (organization_id,actor_id,action,entity_type) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','x','y')$$, 'fail');
SELECT t('tm can audit as self', $$INSERT INTO audit_logs (organization_id,actor_id,action,entity_type) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000c','x','y')$$, '1');
SELECT t('tm cannot promote self', $$UPDATE organization_members SET role='super_admin' WHERE id='30000000-0000-0000-0000-00000000000c'$$, '0');

SELECT who('00000000-0000-0000-0000-00000000000d'); -- sales_bd
SELECT t('sales can insert lead', $$INSERT INTO leads (organization_id,name) VALUES ('10000000-0000-0000-0000-000000000001','L')$$, '1');
SELECT t('sales cannot insert campaign', $$INSERT INTO campaigns (organization_id,client_id,name) VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','C')$$, 'fail');

SELECT who('00000000-0000-0000-0000-00000000000e'); -- client
SELECT cnt('client sees only own invoice', 'SELECT count(*) FROM invoices', 1);
SELECT cnt('client sees only own client', 'SELECT count(*) FROM clients', 1);
SELECT t('client cannot write audit', $$INSERT INTO audit_logs (organization_id,actor_id,action,entity_type) VALUES ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000e','x','y')$$, 'fail');

-- ---- 0009: transactional RPCs and rate limiting ----
SELECT who('00000000-0000-0000-0000-00000000000c'); -- team_member
SELECT t('tm cannot record payment', $$SELECT record_payment((SELECT id FROM invoices LIMIT 1), 10, 'NEFT', 'R0')$$, 'fail');
SELECT t('tm cannot create lead via rpc', $$SELECT create_lead_with_activity('10000000-0000-0000-0000-000000000001', '{"name":"Nope"}')$$, 'fail');
SELECT cnt('failed lead rpc leaves no orphan activity', $$SELECT count(*) FROM lead_activities la JOIN leads l ON l.id = la.lead_id WHERE l.name = 'Nope'$$, 0);
SELECT cnt('tm cannot read rate_limits table', 'SELECT count(*) FROM rate_limits', 0);

SELECT who('00000000-0000-0000-0000-00000000000d'); -- sales_bd
SELECT t('sales creates lead via rpc', $$SELECT create_lead_with_activity('10000000-0000-0000-0000-000000000001', '{"name":"RPC Lead","source":"website","stage":"qualified","next_follow_up":"2026-12-01"}')$$, '1');
SELECT cnt('lead rpc wrote created activity', $$SELECT count(*) FROM lead_activities la JOIN leads l ON l.id = la.lead_id WHERE l.name = 'RPC Lead' AND la.activity_type = 'created'$$, 1);
SELECT cnt('rate limit: 1st call allowed', $$SELECT check_rate_limit('test', 2, 60)::int$$, 1);
SELECT cnt('rate limit: 2nd call allowed', $$SELECT check_rate_limit('test', 2, 60)::int$$, 1);
SELECT cnt('rate limit: 3rd call blocked', $$SELECT check_rate_limit('test', 2, 60)::int$$, 0);
SELECT who('00000000-0000-0000-0000-00000000000e'); -- client: separate bucket per user
SELECT cnt('rate limit: buckets are per user', $$SELECT check_rate_limit('test', 2, 60)::int$$, 1);
SELECT set_config('request.jwt.claim.sub', '', false); -- no user
SELECT cnt('rate limit: anonymous always blocked', $$SELECT check_rate_limit('test', 2, 60)::int$$, 0);

SELECT who('00000000-0000-0000-0000-00000000000b'); -- agency_admin
SELECT cnt('partial payment leaves balance', $$SELECT (record_payment((SELECT id FROM invoices WHERE invoice_number='INV-1'), 40, 'NEFT', 'UTR-1')->>'balance_inr')::numeric::int$$, 60);
SELECT cnt('partial payment does not mark paid', $$SELECT count(*) FROM invoices WHERE invoice_number='INV-1' AND status='paid'$$, 0);
SELECT t('overpayment rejected', $$SELECT record_payment((SELECT id FROM invoices WHERE invoice_number='INV-1'), 70, 'NEFT', 'UTR-2')$$, 'fail');
SELECT t('duplicate reference rejected', $$SELECT record_payment((SELECT id FROM invoices WHERE invoice_number='INV-1'), 10, 'NEFT', 'UTR-1')$$, 'fail');
SELECT t('non-positive amount rejected', $$SELECT record_payment((SELECT id FROM invoices WHERE invoice_number='INV-1'), 0, 'NEFT', 'UTR-3')$$, 'fail');
SELECT cnt('settling payment marks paid', $$SELECT CASE WHEN record_payment((SELECT id FROM invoices WHERE invoice_number='INV-1'), 60, 'NEFT', 'UTR-4')->>'status' = 'paid' THEN 1 ELSE 0 END$$, 1);
SELECT cnt('invoice now paid', $$SELECT count(*) FROM invoices WHERE invoice_number='INV-1' AND status='paid'$$, 1);
SELECT cnt('exactly two payments recorded', $$SELECT count(*) FROM payments p JOIN invoices i ON i.id = p.invoice_id WHERE i.invoice_number='INV-1'$$, 2);
SELECT t('paying a paid invoice rejected', $$SELECT record_payment((SELECT id FROM invoices WHERE invoice_number='INV-1'), 1, 'NEFT', 'UTR-5')$$, 'fail');
SELECT cnt('payments audited', $$SELECT count(*) FROM audit_logs WHERE action='payment.recorded'$$, 2);
SELECT t('admin creates client + contact via rpc', $$SELECT create_client_with_contact('10000000-0000-0000-0000-000000000001', '{"name":"RPC Client","monthly_retainer_inr":"25000","contract_start":"2026-11-01"}', '{"full_name":"Priya","email":"p@example.com","phone":"+919876543210"}')$$, '1');
SELECT cnt('client rpc wrote primary contact', $$SELECT count(*) FROM client_contacts cc JOIN clients c ON c.id = cc.client_id WHERE c.name='RPC Client' AND cc.is_primary$$, 1);
SELECT cnt('client rpc wrote audit entry', $$SELECT count(*) FROM audit_logs WHERE action='client.created'$$, 1);
SELECT t('client rpc with bad data writes nothing', $$SELECT create_client_with_contact('10000000-0000-0000-0000-000000000001', '{"name":"Bad Client","contract_start":"not-a-date"}', '{"full_name":"X"}')$$, 'fail');
SELECT cnt('no partial rows after failed client rpc', $$SELECT count(*) FROM clients WHERE name='Bad Client'$$, 0);

SELECT who('00000000-0000-0000-0000-00000000000b'); -- agency_admin
SELECT cnt('admin reads all invoices', 'SELECT count(*) FROM invoices', 2);
SELECT t('admin cannot grant super_admin', $$UPDATE organization_members SET role='super_admin' WHERE id='30000000-0000-0000-0000-00000000000c'$$, 'fail');
SELECT t('admin cannot demote super_admin', $$UPDATE organization_members SET role='team_member' WHERE id='30000000-0000-0000-0000-00000000000a'$$, 'fail');
SELECT t('admin can change tm role', $$UPDATE organization_members SET role='marketing_manager' WHERE id='30000000-0000-0000-0000-00000000000c'$$, '1');
SELECT t('admin can hard-delete client', $$DELETE FROM clients WHERE id='20000000-0000-0000-0000-000000000002'$$, '1');
SELECT t('admin can step down (super remains)', $$UPDATE organization_members SET role='team_member' WHERE id='30000000-0000-0000-0000-00000000000b'$$, '1');

SELECT who('00000000-0000-0000-0000-00000000000a'); -- super_admin, now the only admin
SELECT t('last admin cannot deactivate self', $$UPDATE organization_members SET is_active=false WHERE id='30000000-0000-0000-0000-00000000000a'$$, 'fail');
SELECT t('last admin cannot delete self', $$DELETE FROM organization_members WHERE id='30000000-0000-0000-0000-00000000000a'$$, 'fail');
SELECT t('super can grant super_admin', $$UPDATE organization_members SET role='super_admin' WHERE id='30000000-0000-0000-0000-00000000000b'$$, '1');
SELECT t('super can step down once another exists', $$UPDATE organization_members SET role='team_member' WHERE id='30000000-0000-0000-0000-00000000000a'$$, '1');

RESET ROLE;
SELECT n, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS r, test, detail FROM results ORDER BY n;

DO $$
DECLARE v_failed INT; v_total INT;
BEGIN
  SELECT count(*) FILTER (WHERE NOT ok), count(*) INTO v_failed, v_total FROM results;
  IF v_failed > 0 THEN
    RAISE EXCEPTION '% of % database tests failed', v_failed, v_total;
  END IF;
  RAISE NOTICE 'All % database tests passed', v_total;
END $$;
