-- Ensure social_posts (and Phase 3-6 tables) have explicit WITH CHECK for INSERT/UPDATE

DROP POLICY IF EXISTS "Agency staff manage social posts" ON social_posts;
CREATE POLICY "Agency staff manage social posts" ON social_posts
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage social accounts" ON social_accounts;
CREATE POLICY "Agency staff manage social accounts" ON social_accounts
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage deliverables" ON deliverables;
CREATE POLICY "Agency staff manage deliverables" ON deliverables
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage approvals" ON client_approvals;
CREATE POLICY "Agency staff manage approvals" ON client_approvals
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));
