-- Comprehensive, idempotent RLS policy fix across all CRM, Operations, Billing, and Audit tables
-- Ensures every table has explicit USING + WITH CHECK clauses for agency staff

-- Audit Logs (allow org members to insert audit entries, agency staff to read)
DROP POLICY IF EXISTS "Agency staff insert audit logs" ON audit_logs;
CREATE POLICY "Agency staff insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (is_org_member(organization_id));

-- Notifications
DROP POLICY IF EXISTS "Agency staff create notifications" ON notifications;
CREATE POLICY "Agency staff create notifications" ON notifications
  FOR INSERT
  WITH CHECK (is_agency_staff(organization_id));

-- Invoices & Payments
DROP POLICY IF EXISTS "Agency staff manage invoices" ON invoices;
CREATE POLICY "Agency staff manage invoices" ON invoices
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage payments" ON payments;
CREATE POLICY "Agency staff manage payments" ON payments
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

-- Social Accounts & Posts
DROP POLICY IF EXISTS "Agency staff manage social accounts" ON social_accounts;
CREATE POLICY "Agency staff manage social accounts" ON social_accounts
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage social posts" ON social_posts;
CREATE POLICY "Agency staff manage social posts" ON social_posts
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

-- SEO & GEO
DROP POLICY IF EXISTS "Agency staff manage SEO projects" ON seo_projects;
CREATE POLICY "Agency staff manage SEO projects" ON seo_projects
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage SEO keywords" ON seo_keywords;
CREATE POLICY "Agency staff manage SEO keywords" ON seo_keywords
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage SEO rankings" ON seo_rankings;
CREATE POLICY "Agency staff manage SEO rankings" ON seo_rankings
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage GEO checks" ON geo_visibility_checks;
CREATE POLICY "Agency staff manage GEO checks" ON geo_visibility_checks
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

-- WhatsApp CRM
DROP POLICY IF EXISTS "Agency staff manage whatsapp contacts" ON whatsapp_contacts;
CREATE POLICY "Agency staff manage whatsapp contacts" ON whatsapp_contacts
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage whatsapp templates" ON whatsapp_templates;
CREATE POLICY "Agency staff manage whatsapp templates" ON whatsapp_templates
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage conversations" ON conversations;
CREATE POLICY "Agency staff manage conversations" ON conversations
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

DROP POLICY IF EXISTS "Agency staff manage conversation messages" ON conversation_messages;
CREATE POLICY "Agency staff manage conversation messages" ON conversation_messages
  FOR ALL
  USING (is_agency_staff(organization_id))
  WITH CHECK (is_agency_staff(organization_id));

-- Deliverables & Client Approvals
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
