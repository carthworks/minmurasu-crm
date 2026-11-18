-- Phase 2 RLS Policies for client_contacts and lead_activities

CREATE POLICY "Client contacts read isolation" ON client_contacts
  FOR SELECT USING (
    is_agency_staff(organization_id)
    OR is_client_member_for(organization_id, client_id)
  );

CREATE POLICY "Agency staff manage client contacts" ON client_contacts
  FOR ALL USING (is_agency_staff(organization_id));

CREATE POLICY "Agency staff manage lead activities" ON lead_activities
  FOR ALL USING (is_agency_staff(organization_id));
