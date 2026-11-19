-- Optional fast server-side aggregation RPC for Executive Dashboard
CREATE OR REPLACE FUNCTION public.dashboard_metrics(
  p_client_id UUID DEFAULT NULL,
  p_from DATE DEFAULT NULL,
  p_to DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH client_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'active')::INT AS active_clients,
      COALESCE(SUM(monthly_retainer_inr) FILTER (WHERE status = 'active'), 0)::NUMERIC AS mrr_inr
    FROM clients
    WHERE deleted_at IS NULL
      AND (p_client_id IS NULL OR id = p_client_id)
  ),
  lead_stats AS (
    SELECT
      COUNT(*)::INT AS total_leads,
      COUNT(*) FILTER (WHERE stage IN ('qualified', 'proposal_sent', 'negotiation', 'won'))::INT AS qualified_leads,
      COUNT(*) FILTER (WHERE stage = 'won')::INT AS won_leads
    FROM leads
    WHERE deleted_at IS NULL
      AND (p_client_id IS NULL OR client_id = p_client_id)
  ),
  filtered_metrics AS (
    SELECT *
    FROM campaign_metrics
    WHERE (p_client_id IS NULL OR client_id = p_client_id)
      AND (p_from IS NULL OR metric_date >= p_from)
      AND (p_to IS NULL OR metric_date <= p_to)
  ),
  metric_totals AS (
    SELECT
      COALESCE(SUM(spend_inr), 0)::NUMERIC AS spend_inr,
      COALESCE(SUM(revenue_attributed_inr), 0)::NUMERIC AS revenue_inr
    FROM filtered_metrics
  ),
  trend_rows AS (
    SELECT
      metric_date::TEXT AS date,
      COALESCE(SUM(leads_count), 0)::INT AS leads,
      COALESCE(SUM(spend_inr), 0)::NUMERIC AS spend,
      COALESCE(SUM(revenue_attributed_inr), 0)::NUMERIC AS revenue
    FROM filtered_metrics
    GROUP BY metric_date
    ORDER BY metric_date ASC
  ),
  campaign_rows AS (
    SELECT
      campaign_id,
      COALESCE(SUM(leads_count), 0)::INT AS leads,
      COALESCE(SUM(engagements), 0)::INT AS engagements,
      COALESCE(SUM(spend_inr), 0)::NUMERIC AS spend,
      COALESCE(SUM(revenue_attributed_inr), 0)::NUMERIC AS revenue
    FROM filtered_metrics
    GROUP BY campaign_id
  )
  SELECT jsonb_build_object(
    'active_clients', (SELECT active_clients FROM client_stats),
    'mrr_inr', (SELECT mrr_inr FROM client_stats),
    'total_leads', (SELECT total_leads FROM lead_stats),
    'qualified_leads', (SELECT qualified_leads FROM lead_stats),
    'won_leads', (SELECT won_leads FROM lead_stats),
    'spend_inr', (SELECT spend_inr FROM metric_totals),
    'revenue_inr', (SELECT revenue_inr FROM metric_totals),
    'trends', COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM trend_rows t), '[]'::jsonb),
    'by_campaign', COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM campaign_rows c), '[]'::jsonb)
  );
$$;
