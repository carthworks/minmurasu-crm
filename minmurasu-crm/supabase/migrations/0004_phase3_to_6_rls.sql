-- Phase 3–6 RLS Policies for Social, SEO/GEO, WhatsApp, and Payments

-- Social Accounts & Posts
CREATE POLICY "Social accounts read isolation" ON social_accounts
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage social accounts" ON social_accounts
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Social posts read isolation" ON social_posts
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage social posts" ON social_posts
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Clients approve social posts" ON social_posts
  FOR UPDATE USING (
    is_client_member_for(organization_id, client_id)
  );

-- SEO & GEO
CREATE POLICY "SEO projects read isolation" ON seo_projects
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage SEO projects" ON seo_projects
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage SEO keywords" ON seo_keywords
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage SEO rankings" ON seo_rankings
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage GEO checks" ON geo_visibility_checks
  FOR ALL USING (is_agency_staff(organization_id));

-- WhatsApp CRM
CREATE POLICY "Agency staff manage whatsapp contacts" ON whatsapp_contacts
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage whatsapp templates" ON whatsapp_templates
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Conversations read isolation" ON conversations
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR (client_id IS NOT NULL AND is_client_member_for(organization_id, client_id))
  );

CREATE POLICY "Agency staff manage conversations" ON conversations
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage conversation messages" ON conversation_messages
  FOR ALL USING (is_agency_staff(organization_id));

-- Payments & Agency Invoices
CREATE POLICY "Agency staff manage invoices" ON invoices
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage payments" ON payments
  FOR ALL USING (is_agency_staff(organization_id));

-- Deliverables
CREATE POLICY "Agency staff manage deliverables" ON deliverables
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage approvals" ON client_approvals
  FOR ALL USING (is_agency_staff(organization_id));
