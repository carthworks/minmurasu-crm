-- ============================================================================
-- DEVELOPMENT SEED DATA ONLY (DO NOT RUN IN PRODUCTION)
-- Realistic sample records for MIN MURASU CRM local/staging development
-- ============================================================================

INSERT INTO organizations (id, name, slug, domain)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'MIN MURASU',
  'min-murasu',
  'minmurasu.digital'
) ON CONFLICT (id) DO NOTHING;

-- Marketing Channels
INSERT INTO marketing_channels (id, organization_id, name, slug, category) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Google Ads', 'google-ads', 'paid'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Meta Ads & Instagram', 'meta-ads', 'social'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'LinkedIn B2B', 'linkedin', 'social'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'SEO & GEO', 'seo-geo', 'organic'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'WhatsApp Marketing', 'whatsapp', 'messaging')
ON CONFLICT DO NOTHING;

-- Sample Clients
INSERT INTO clients (id, organization_id, name, industry, website, location, monthly_retainer_inr, service_package, status) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'Kaveri Organics', 'D2C & Organic FMCG', 'https://kaveriorganics.example', 'Coimbatore, TN', 85000.00, 'Growth + WhatsApp CRM', 'active'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'Veloce EV', 'Electric Mobility', 'https://veloceev.example', 'Chennai, TN', 140000.00, 'Full-Funnel Performance', 'active'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'Aether Cloud', 'B2B SaaS', 'https://aethercloud.example', 'Bengaluru, KA', 120000.00, 'ABM + SEO/GEO', 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample Campaigns
INSERT INTO campaigns (id, organization_id, client_id, channel_id, name, objective, start_date, budget_inr, status) VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222202', 'Festive D2C Reels & Retargeting', 'Direct Inquiries & Orders', '2026-10-01', 150000.00, 'active'),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', 'Test-Ride Lead Gen Search', 'Qualified Test-Ride Bookings', '2026-10-15', 220000.00, 'active'),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', 'Enterprise SaaS ABM Funnel', 'Demo Requests', '2026-11-01', 180000.00, 'optimization')
ON CONFLICT (id) DO NOTHING;

-- Sample Campaign Metrics (Measured records)
INSERT INTO campaign_metrics (organization_id, client_id, campaign_id, metric_date, spend_inr, impressions, reach, clicks, engagements, leads_count, conversions, revenue_attributed_inr) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401', '2026-11-01', 42000, 185000, 142000, 4800, 14200, 195, 48, 245000),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444402', '2026-11-01', 68000, 112000, 94000, 6100, 5200, 260, 62, 390000),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444403', '2026-11-01', 54000, 64000, 51000, 2250, 3100, 88, 19, 285000)
ON CONFLICT DO NOTHING;
