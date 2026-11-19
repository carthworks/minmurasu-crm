-- Tests for migration 0010. Runs after 10_rls_and_rpcs.test.sql in the same database and
-- reuses its helpers (t, cnt, who), its results table and its end state:
--   ...0a = team_member, ...0b = super_admin, ...0c = marketing_manager,
--   ...0d = sales_bd, ...0e = client of C1 (2000...0001).

RESET ROLE;
TRUNCATE results;

-- Seed (as postgres, bypassing RLS)
INSERT INTO clients (id, organization_id, name, status, monthly_retainer_inr) VALUES
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'C3', 'active', 5000);
UPDATE clients SET status = 'active', monthly_retainer_inr = 10000 WHERE id = '20000000-0000-0000-0000-000000000001';

INSERT INTO campaigns (id, organization_id, client_id, name) VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'C1 Camp'),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'C3 Camp');

INSERT INTO campaign_metrics (organization_id, client_id, campaign_id, metric_date, spend_inr, leads_count, engagements, revenue_attributed_inr) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '2026-10-01', 100, 2, 10, 300),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '2026-11-01', 200, 3, 20, 500),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '2026-11-01', 1000, 7, 70, 900);

INSERT INTO leads (organization_id, client_id, name, stage) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'C1 Won', 'won'),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'C3 New', 'new');

INSERT INTO social_posts (id, organization_id, client_id, title, caption) VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'C1 Post', 'orig'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'C3 Post', 'orig');

INSERT INTO client_approvals (id, organization_id, client_id, social_post_id) VALUES
  ('60000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001');

INSERT INTO integrations (organization_id, provider, status, config) VALUES
  ('10000000-0000-0000-0000-000000000001', 'ollama', 'configured',
   '{"base_url":"http://10.0.0.5:11434","model":"llama3","api_token":"secret-token"}');

SET ROLE authenticated;

-- ---- dashboard_metrics ----
SELECT who('00000000-0000-0000-0000-00000000000b'); -- super_admin
SELECT cnt('dashboard: total spend across clients', $$SELECT (dashboard_metrics()->>'spend_inr')::numeric::int$$, 1300);
SELECT cnt('dashboard: client filter', $$SELECT (dashboard_metrics('20000000-0000-0000-0000-000000000001')->>'spend_inr')::numeric::int$$, 300);
SELECT cnt('dashboard: date range', $$SELECT (dashboard_metrics(NULL, '2026-11-01', '2026-11-30')->>'spend_inr')::numeric::int$$, 1200);
SELECT cnt('dashboard: trends grouped by date', $$SELECT jsonb_array_length(dashboard_metrics()->'trends')$$, 2);
SELECT cnt('dashboard: per-campaign rows', $$SELECT jsonb_array_length(dashboard_metrics()->'by_campaign')$$, 2);
SELECT cnt('dashboard: won leads', $$SELECT (dashboard_metrics()->>'won_leads')::int$$, 1);
-- Active: C1 (10000), C3 (5000) and "RPC Client" (25000, created by the 10_ tests).
SELECT cnt('dashboard: active clients + MRR', $$SELECT (dashboard_metrics()->>'active_clients')::int * 100000 + (dashboard_metrics()->>'mrr_inr')::numeric::int$$, 3 * 100000 + 40000);

SELECT who('00000000-0000-0000-0000-00000000000e'); -- client of C1
SELECT cnt('dashboard: client sees only own spend', $$SELECT (dashboard_metrics()->>'spend_inr')::numeric::int$$, 300);
SELECT cnt('dashboard: client cannot widen via filter', $$SELECT (dashboard_metrics('20000000-0000-0000-0000-000000000003')->>'spend_inr')::numeric::int$$, 0);
SELECT cnt('dashboard: client sees only own clients', $$SELECT (dashboard_metrics()->>'active_clients')::int$$, 1);

-- ---- client approval guard ----
SELECT t('client approves own post', $$UPDATE social_posts SET approval_status='approved' WHERE id='50000000-0000-0000-0000-000000000001'$$, '1');
SELECT t('client cannot edit caption', $$UPDATE social_posts SET caption='hacked' WHERE id='50000000-0000-0000-0000-000000000001'$$, 'fail');
SELECT t('client cannot set arbitrary approval status', $$UPDATE social_posts SET approval_status='published' WHERE id='50000000-0000-0000-0000-000000000001'$$, 'fail');
SELECT t('client cannot touch other client post', $$UPDATE social_posts SET approval_status='approved' WHERE id='50000000-0000-0000-0000-000000000003'$$, '0');
SELECT t('client cannot re-point post to other client', $$UPDATE social_posts SET client_id='20000000-0000-0000-0000-000000000003' WHERE id='50000000-0000-0000-0000-000000000001'$$, 'fail');
SELECT t('client submits approval with feedback', $$UPDATE client_approvals SET status='changes_requested', feedback='Fix logo' WHERE id='60000000-0000-0000-0000-000000000001'$$, '1');
SELECT cnt('approval attributed to the client', $$SELECT count(*) FROM client_approvals WHERE id='60000000-0000-0000-0000-000000000001' AND reviewed_by='00000000-0000-0000-0000-00000000000e' AND reviewed_at IS NOT NULL$$, 1);
SELECT t('client cannot change approval target', $$UPDATE client_approvals SET social_post_id='50000000-0000-0000-0000-000000000003' WHERE id='60000000-0000-0000-0000-000000000001'$$, 'fail');

SELECT who('00000000-0000-0000-0000-00000000000c'); -- marketing_manager (staff)
SELECT t('staff can still edit caption', $$UPDATE social_posts SET caption='edited' WHERE id='50000000-0000-0000-0000-000000000001'$$, '1');

-- ---- get_ollama_config ----
SELECT cnt('non-admin staff cannot read integrations table', 'SELECT count(*) FROM integrations', 0);
SELECT cnt('non-admin staff get ollama base_url via rpc', $$SELECT CASE WHEN get_ollama_config('10000000-0000-0000-0000-000000000001')->>'base_url' = 'http://10.0.0.5:11434' THEN 1 ELSE 0 END$$, 1);
SELECT cnt('rpc never returns other config keys', $$SELECT CASE WHEN get_ollama_config('10000000-0000-0000-0000-000000000001') ? 'api_token' THEN 1 ELSE 0 END$$, 0);
SELECT who('00000000-0000-0000-0000-00000000000e'); -- client
SELECT cnt('client gets no ollama config', $$SELECT CASE WHEN get_ollama_config('10000000-0000-0000-0000-000000000001') IS NULL THEN 1 ELSE 0 END$$, 1);

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
