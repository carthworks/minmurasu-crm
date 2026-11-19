-- Fix infinite recursion by using a SECURITY DEFINER helper for admin checks

DROP POLICY IF EXISTS "Admins manage organization members" ON organization_members;

CREATE OR REPLACE FUNCTION is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND profile_id = auth.uid()
      AND is_active = TRUE
      AND role IN ('super_admin', 'agency_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Admins manage organization members" ON organization_members
  FOR ALL USING (is_org_admin(organization_id));
