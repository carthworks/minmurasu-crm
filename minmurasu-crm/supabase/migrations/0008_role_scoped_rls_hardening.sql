-- 0008: Enforce role-based permissions in the database (not only in server actions).
--
-- Before this migration every agency staff role (including team_member) had FOR ALL
-- access to every table, so any logged-in staff user could read/modify invoices or
-- hard-delete clients directly through the public Supabase API.
--
-- After this migration:
--   * Hard DELETE is limited to org admins (super_admin, agency_admin); use deleted_at.
--   * leads / prospects / lead_activities writes  -> lead managers (mirrors canManageLeads)
--   * campaigns / campaign_metrics writes         -> campaign managers (mirrors canManageCampaigns)
--   * invoices / payments / integrations          -> org admins only (clients keep read on own invoices)
--   * audit_logs inserts must be by staff, as themselves (no forged actor_id, no client inserts)
--   * SECURITY DEFINER helpers have a pinned search_path
--   * organization_members changes cannot escalate to super_admin or remove the last admin

-- ---------------------------------------------------------------------------
-- 1. Pin search_path on SECURITY DEFINER helpers
-- ---------------------------------------------------------------------------
ALTER FUNCTION is_org_member(UUID)              SET search_path = public, pg_temp;
ALTER FUNCTION is_agency_staff(UUID)            SET search_path = public, pg_temp;
ALTER FUNCTION is_client_member_for(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION is_org_admin(UUID)               SET search_path = public, pg_temp;
ALTER FUNCTION set_updated_at()                 SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION has_org_role(p_org_id UUID, p_roles user_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND profile_id = auth.uid()
      AND is_active = TRUE
      AND role = ANY (p_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Replace blanket FOR ALL staff policies with per-command, per-role policies
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  staff_roles    CONSTANT TEXT := 'ARRAY[''super_admin'',''agency_admin'',''marketing_manager'',''sales_bd'',''team_member'']::user_role[]';
  lead_roles     CONSTANT TEXT := 'ARRAY[''super_admin'',''agency_admin'',''marketing_manager'',''sales_bd'']::user_role[]';
  campaign_roles CONSTANT TEXT := 'ARRAY[''super_admin'',''agency_admin'',''marketing_manager'']::user_role[]';
  admin_roles    CONSTANT TEXT := 'ARRAY[''super_admin'',''agency_admin'']::user_role[]';

  -- table name => [read roles, write roles]
  spec JSONB := jsonb_build_object(
    'clients',               jsonb_build_array('staff', 'staff'),
    'client_contacts',       jsonb_build_array('staff', 'staff'),
    'projects',              jsonb_build_array('staff', 'staff'),
    'tasks',                 jsonb_build_array('staff', 'staff'),
    'social_accounts',       jsonb_build_array('staff', 'staff'),
    'social_posts',          jsonb_build_array('staff', 'staff'),
    'seo_projects',          jsonb_build_array('staff', 'staff'),
    'seo_keywords',          jsonb_build_array('staff', 'staff'),
    'seo_rankings',          jsonb_build_array('staff', 'staff'),
    'geo_visibility_checks', jsonb_build_array('staff', 'staff'),
    'whatsapp_contacts',     jsonb_build_array('staff', 'staff'),
    'whatsapp_templates',    jsonb_build_array('staff', 'staff'),
    'conversations',         jsonb_build_array('staff', 'staff'),
    'conversation_messages', jsonb_build_array('staff', 'staff'),
    'deliverables',          jsonb_build_array('staff', 'staff'),
    'client_approvals',      jsonb_build_array('staff', 'staff'),
    'leads',                 jsonb_build_array('staff', 'lead'),
    'lead_activities',       jsonb_build_array('staff', 'lead'),
    'prospects',             jsonb_build_array('staff', 'lead'),
    'campaigns',             jsonb_build_array('staff', 'campaign'),
    'campaign_metrics',      jsonb_build_array('staff', 'campaign'),
    'invoices',              jsonb_build_array('admin', 'admin'),
    'payments',              jsonb_build_array('admin', 'admin'),
    'integrations',          jsonb_build_array('admin', 'admin')
  );

  tbl TEXT;
  read_expr TEXT;
  write_expr TEXT;
  pol RECORD;
BEGIN
  FOR tbl IN SELECT jsonb_object_keys(spec) LOOP
    -- Drop every FOR ALL policy on the table (the old blanket staff policies).
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND cmd = 'ALL'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, tbl);
    END LOOP;

    read_expr := CASE spec -> tbl ->> 0
      WHEN 'admin' THEN admin_roles
      ELSE staff_roles
    END;
    write_expr := CASE spec -> tbl ->> 1
      WHEN 'admin'    THEN admin_roles
      WHEN 'lead'     THEN lead_roles
      WHEN 'campaign' THEN campaign_roles
      ELSE staff_roles
    END;

    EXECUTE format('DROP POLICY IF EXISTS "rbac_select" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "rbac_insert" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "rbac_update" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "rbac_delete" ON public.%I', tbl);

    EXECUTE format(
      'CREATE POLICY "rbac_select" ON public.%I FOR SELECT USING (has_org_role(organization_id, %s))',
      tbl, read_expr);
    EXECUTE format(
      'CREATE POLICY "rbac_insert" ON public.%I FOR INSERT WITH CHECK (has_org_role(organization_id, %s))',
      tbl, write_expr);
    EXECUTE format(
      'CREATE POLICY "rbac_update" ON public.%I FOR UPDATE USING (has_org_role(organization_id, %s)) WITH CHECK (has_org_role(organization_id, %s))',
      tbl, write_expr, write_expr);
    EXECUTE format(
      'CREATE POLICY "rbac_delete" ON public.%I FOR DELETE USING (has_org_role(organization_id, %s))',
      tbl, admin_roles);
  END LOOP;
END $$;

-- Invoices: the old read policy let every staff role see financials. Restrict to
-- admins (via rbac_select above) plus the invoice's own client.
DROP POLICY IF EXISTS "Invoices read isolation" ON invoices;
CREATE POLICY "Invoices read isolation" ON invoices
  FOR SELECT USING (is_client_member_for(organization_id, client_id));

-- ---------------------------------------------------------------------------
-- 3. Audit logs: staff may only append entries attributed to themselves.
--    No UPDATE/DELETE policies exist, so entries are immutable through the API.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Agency staff insert audit logs" ON audit_logs;
CREATE POLICY "Agency staff insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (actor_id = auth.uid() AND is_agency_staff(organization_id));

-- ---------------------------------------------------------------------------
-- 4. organization_members guard: no self-escalation, no admin lockout
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins manage organization members" ON organization_members;
CREATE POLICY "Admins manage organization members" ON organization_members
  FOR ALL
  USING (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

CREATE OR REPLACE FUNCTION guard_org_member_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org UUID := COALESCE(NEW.organization_id, OLD.organization_id);
  v_caller_is_super BOOLEAN;
  v_remaining_admins INT;
  v_admin_roles CONSTANT user_role[] := ARRAY['super_admin', 'agency_admin']::user_role[];
BEGIN
  -- Service role, migrations and the SQL editor run without an end-user JWT.
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Serialize membership changes per org so two admins can't demote each other at once.
  PERFORM 1 FROM organizations WHERE id = v_org FOR UPDATE;

  v_caller_is_super := EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = v_org
      AND profile_id = auth.uid()
      AND is_active = TRUE
      AND role = 'super_admin'
  );

  IF TG_OP = 'UPDATE' AND NEW.organization_id <> OLD.organization_id THEN
    RAISE EXCEPTION 'Members cannot be moved between organizations'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE')
     AND NEW.role = 'super_admin'
     AND (TG_OP = 'INSERT' OR OLD.role <> 'super_admin')
     AND NOT v_caller_is_super THEN
    RAISE EXCEPTION 'Only a super admin can grant the super admin role'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP IN ('UPDATE', 'DELETE')
     AND OLD.role = 'super_admin'
     AND NOT v_caller_is_super THEN
    RAISE EXCEPTION 'Only a super admin can change a super admin''s membership'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.is_active AND OLD.role = ANY (v_admin_roles) AND (
       TG_OP = 'DELETE'
       OR (TG_OP = 'UPDATE' AND (NOT NEW.is_active OR NOT (NEW.role = ANY (v_admin_roles))))
     ) THEN
    SELECT COUNT(*) INTO v_remaining_admins
    FROM organization_members
    WHERE organization_id = v_org
      AND id <> OLD.id
      AND is_active = TRUE
      AND role = ANY (v_admin_roles);

    IF v_remaining_admins = 0 THEN
      RAISE EXCEPTION 'An organization must keep at least one active admin'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_org_member_changes ON organization_members;
CREATE TRIGGER trg_guard_org_member_changes
  BEFORE INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION guard_org_member_changes();
