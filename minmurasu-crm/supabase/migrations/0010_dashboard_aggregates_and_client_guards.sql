-- 0010: Database-side dashboard aggregation, client approval column guard,
-- and a staff-readable view of the Ollama integration config.
--
-- * dashboard_metrics(): sums leads/spend/revenue/trends in SQL instead of shipping
--   every campaign_metrics and leads row to the app server on each page load.
--   SECURITY INVOKER, so RLS (incl. client isolation) applies to every row counted.
-- * guard_client_approval_update(): client users may only change approval fields on
--   social_posts and client_approvals (previously their UPDATE policy allowed any column).
-- * get_ollama_config(): 0008 made `integrations` admin-only, which silently hid the
--   org's Ollama settings from non-admin staff using the AI assistant. This returns only
--   the non-secret base_url/model to staff.

-- ---------------------------------------------------------------------------
-- 1. Indexes for the dashboard filters
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_org_client_date
  ON campaign_metrics (organization_id, client_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign
  ON campaign_metrics (campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_client
  ON leads (organization_id, client_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Dashboard aggregation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION dashboard_metrics(
  p_client_id UUID DEFAULT NULL,
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH
  m AS (
    SELECT campaign_id, metric_date, spend_inr, leads_count, engagements, revenue_attributed_inr
    FROM campaign_metrics
    WHERE (p_client_id IS NULL OR client_id = p_client_id)
      AND (p_from IS NULL OR metric_date >= p_from)
      AND (p_to IS NULL OR metric_date <= p_to)
  ),
  l AS (
    SELECT stage FROM leads
    WHERE deleted_at IS NULL
      AND (p_client_id IS NULL OR client_id = p_client_id)
  ),
  c AS (
    SELECT status, monthly_retainer_inr FROM clients
    WHERE deleted_at IS NULL
      AND (p_client_id IS NULL OR id = p_client_id)
  )
  SELECT jsonb_build_object(
    'active_clients', (SELECT count(*) FROM c WHERE status = 'active'),
    'mrr_inr',        (SELECT COALESCE(sum(monthly_retainer_inr), 0) FROM c WHERE status = 'active'),
    'total_leads',    (SELECT count(*) FROM l),
    'qualified_leads',(SELECT count(*) FROM l
                       WHERE stage IN ('qualified', 'proposal_sent', 'negotiation', 'won')),
    'won_leads',      (SELECT count(*) FROM l WHERE stage = 'won'),
    'spend_inr',      (SELECT COALESCE(sum(spend_inr), 0) FROM m),
    'revenue_inr',    (SELECT COALESCE(sum(revenue_attributed_inr), 0) FROM m),
    'trends', COALESCE((
      SELECT jsonb_agg(t ORDER BY t.date)
      FROM (
        SELECT metric_date AS date,
               COALESCE(sum(leads_count), 0) AS leads,
               COALESCE(sum(spend_inr), 0) AS spend,
               COALESCE(sum(revenue_attributed_inr), 0) AS revenue
        FROM m GROUP BY metric_date
      ) t
    ), '[]'::jsonb),
    'by_campaign', COALESCE((
      SELECT jsonb_agg(b)
      FROM (
        SELECT campaign_id,
               COALESCE(sum(leads_count), 0) AS leads,
               COALESCE(sum(engagements), 0) AS engagements,
               COALESCE(sum(spend_inr), 0) AS spend,
               COALESCE(sum(revenue_attributed_inr), 0) AS revenue
        FROM m GROUP BY campaign_id
      ) b
    ), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- 3. Client users may only change approval fields
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_client_approval_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allowed TEXT[];
BEGIN
  -- Service role / SQL editor, and agency staff, are not restricted here.
  IF auth.uid() IS NULL OR is_agency_staff(OLD.organization_id) THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'social_posts' THEN
    v_allowed := ARRAY['approval_status', 'updated_at'];
    IF NEW.approval_status NOT IN ('approved', 'changes_requested') THEN
      RAISE EXCEPTION 'Invalid approval status' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'client_approvals' THEN
    v_allowed := ARRAY['status', 'feedback', 'reviewed_by', 'reviewed_at', 'updated_at'];
    -- Record who reviewed and when; clients cannot attribute a review to someone else.
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
  ELSE
    RETURN NEW;
  END IF;

  IF (to_jsonb(NEW) - v_allowed) IS DISTINCT FROM (to_jsonb(OLD) - v_allowed) THEN
    RAISE EXCEPTION 'Clients can only change the approval decision'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_client_social_post_update ON social_posts;
CREATE TRIGGER trg_guard_client_social_post_update
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION guard_client_approval_update();

DROP TRIGGER IF EXISTS trg_guard_client_approval_update ON client_approvals;
CREATE TRIGGER trg_guard_client_approval_update
  BEFORE UPDATE ON client_approvals
  FOR EACH ROW EXECUTE FUNCTION guard_client_approval_update();

-- Make the client UPDATE policies' WITH CHECK explicit (Postgres falls back to USING
-- when it is omitted; spelling it out keeps future edits from loosening it by accident).
DROP POLICY IF EXISTS "Clients approve social posts" ON social_posts;
CREATE POLICY "Clients approve social posts" ON social_posts
  FOR UPDATE
  USING (is_client_member_for(organization_id, client_id))
  WITH CHECK (is_client_member_for(organization_id, client_id));

DROP POLICY IF EXISTS "Clients submit approval" ON client_approvals;
CREATE POLICY "Clients submit approval" ON client_approvals
  FOR UPDATE
  USING (is_agency_staff(organization_id) OR is_client_member_for(organization_id, client_id))
  WITH CHECK (is_agency_staff(organization_id) OR is_client_member_for(organization_id, client_id));

-- ---------------------------------------------------------------------------
-- 4. Non-secret Ollama settings for all agency staff
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_ollama_config(p_org_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'base_url', config ->> 'base_url',
    'model',    config ->> 'model'
  )
  FROM integrations
  WHERE organization_id = p_org_id
    AND provider = 'ollama'
    AND is_agency_staff(p_org_id);
$$;

REVOKE ALL ON FUNCTION get_ollama_config(UUID) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION get_ollama_config(UUID) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION get_ollama_config(UUID) TO authenticated';
  END IF;
END $$;
