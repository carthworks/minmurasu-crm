-- MIN MURASU Digital Growth CRM & Client Portal
-- Migration 0002: Row Level Security (RLS) Policies

-- Helper functions (SECURITY DEFINER to avoid recursive RLS lookups)
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND profile_id = auth.uid()
      AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_agency_staff(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND profile_id = auth.uid()
      AND is_active = TRUE
      AND role IN ('super_admin', 'agency_admin', 'marketing_manager', 'sales_bd', 'team_member')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_client_member_for(p_org_id UUID, p_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND profile_id = auth.uid()
      AND is_active = TRUE
      AND role = 'client'
      AND client_id = p_client_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS across all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_visibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own profile; agency staff can read org members
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Organizations: members can view their organization
CREATE POLICY "Members view organization" ON organizations
  FOR SELECT USING (is_org_member(id));

-- Organization Members: users view own membership; agency admins manage
CREATE POLICY "View own membership" ON organization_members
  FOR SELECT USING (profile_id = auth.uid() OR is_agency_staff(organization_id));

-- Clients: agency staff see all org clients; client users see ONLY their own client_id
CREATE POLICY "Client read isolation" ON clients
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, id)
  );

CREATE POLICY "Agency staff manage clients" ON clients
  FOR ALL USING (is_agency_staff(organization_id));

-- Campaigns & Campaign Metrics: agency staff full access; client users read-only for own client_id
CREATE POLICY "Campaigns read isolation" ON campaigns
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage campaigns" ON campaigns
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Campaign metrics read isolation" ON campaign_metrics
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage campaign metrics" ON campaign_metrics
  FOR ALL USING (is_agency_staff(organization_id));

-- Marketing Channels: any org member can read
CREATE POLICY "Channels read" ON marketing_channels
  FOR SELECT USING (is_org_member(organization_id));

-- Leads: agency staff full access; client users read own client leads
CREATE POLICY "Leads read isolation" ON leads
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR (client_id IS NOT NULL AND is_client_member_for(organization_id, client_id))
  );

CREATE POLICY "Agency staff manage leads" ON leads
  FOR ALL USING (is_agency_staff(organization_id));

-- Projects, Tasks, Deliverables, Client Approvals
CREATE POLICY "Projects read isolation" ON projects
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage projects" ON projects
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Tasks read isolation" ON tasks
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage tasks" ON tasks
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Deliverables read isolation" ON deliverables
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Client approvals read & update" ON client_approvals
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Clients submit approval" ON client_approvals
  FOR UPDATE USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

-- Invoices & Payments: agency staff + respective client read-only
CREATE POLICY "Invoices read isolation" ON invoices
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

-- Notifications: recipient only
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Agency-only tables (Prospects, Integrations, Audit Logs, Webhook Events)
CREATE POLICY "Agency staff prospects" ON prospects
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff integrations" ON integrations
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff audit logs" ON audit_logs
  FOR SELECT USING (is_agency_staff(organization_id));
