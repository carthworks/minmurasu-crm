-- 0009: Shared rate limiting + transactional write RPCs.
--
-- * check_rate_limit(): a counter in Postgres shared by every serverless instance
--   (the previous in-memory Map was per-instance, so limits did nothing on Vercel).
-- * record_payment(): one transaction that locks the invoice, rejects overpayment
--   and duplicate references, and only marks the invoice paid when fully settled.
-- * create_client_with_contact() / create_lead_with_activity(): the primary row,
--   its child row and the audit entry succeed or fail together.
--
-- The write RPCs are SECURITY INVOKER, so the role-scoped RLS from 0008 still applies.
-- User-facing validation errors are raised with SQLSTATE P0001.

-- ---------------------------------------------------------------------------
-- 1. Rate limiting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);

-- RLS on with no policies: only the SECURITY DEFINER function below can touch it.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_rate_limit(p_bucket TEXT, p_limit INT, p_window_seconds INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_hits INT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;
  IF p_limit < 1 OR p_window_seconds < 1 OR length(p_bucket) > 64 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO rate_limits AS r (bucket_key, hits, reset_at)
  VALUES (p_bucket || ':' || v_uid, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket_key) DO UPDATE SET
    hits     = CASE WHEN r.reset_at <= now() THEN 1 ELSE r.hits + 1 END,
    reset_at = CASE WHEN r.reset_at <= now()
                    THEN now() + make_interval(secs => p_window_seconds)
                    ELSE r.reset_at END
  RETURNING hits INTO v_hits;

  -- Opportunistic cleanup of long-expired buckets (~1% of calls).
  IF random() < 0.01 THEN
    DELETE FROM rate_limits WHERE reset_at < now() - INTERVAL '1 day';
  END IF;

  RETURN v_hits <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INT, INT) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) TO authenticated';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Payments
-- ---------------------------------------------------------------------------
-- The same bank reference cannot be recorded twice against one invoice (double submits).
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_invoice_reference
  ON payments (invoice_id, reference_number)
  WHERE reference_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments (invoice_id);

CREATE OR REPLACE FUNCTION record_payment(
  p_invoice_id UUID,
  p_amount_inr NUMERIC,
  p_payment_method TEXT,
  p_reference_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_paid NUMERIC;
  v_new_total NUMERIC;
  v_status invoice_status;
BEGIN
  IF p_amount_inr IS NULL OR p_amount_inr <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than 0';
  END IF;

  -- Row lock serializes concurrent payments on the same invoice.
  -- RLS limits visibility to org admins, so other callers simply see "not found".
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  IF v_invoice.status IN ('paid', 'cancelled') THEN
    RAISE EXCEPTION 'Invoice % is already %', v_invoice.invoice_number, v_invoice.status;
  END IF;

  SELECT COALESCE(SUM(amount_inr), 0) INTO v_paid FROM payments WHERE invoice_id = p_invoice_id;
  v_new_total := v_paid + p_amount_inr;

  IF v_new_total > v_invoice.amount_inr THEN
    RAISE EXCEPTION 'Payment exceeds the outstanding balance of INR %',
      to_char(v_invoice.amount_inr - v_paid, 'FM999999999990.00');
  END IF;

  INSERT INTO payments (organization_id, invoice_id, amount_inr, payment_method, reference_number)
  VALUES (
    v_invoice.organization_id,
    p_invoice_id,
    p_amount_inr,
    NULLIF(trim(p_payment_method), ''),
    NULLIF(trim(p_reference_number), '')
  );

  v_status := v_invoice.status;
  IF v_new_total >= v_invoice.amount_inr THEN
    v_status := 'paid';
    UPDATE invoices SET status = 'paid' WHERE id = p_invoice_id;
  END IF;

  INSERT INTO audit_logs (organization_id, actor_id, action, entity_type, entity_id, details)
  VALUES (
    v_invoice.organization_id, auth.uid(), 'payment.recorded', 'invoice', p_invoice_id,
    jsonb_build_object(
      'amount_inr', p_amount_inr,
      'payment_method', p_payment_method,
      'paid_total_inr', v_new_total,
      'balance_inr', v_invoice.amount_inr - v_new_total
    )
  );

  RETURN jsonb_build_object(
    'status', v_status,
    'paid_total_inr', v_new_total,
    'balance_inr', v_invoice.amount_inr - v_new_total
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Client + primary contact + audit, atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_client_with_contact(
  p_organization_id UUID,
  p_client JSONB,
  p_contact JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  c clients%ROWTYPE := jsonb_populate_record(NULL::clients, p_client);
  v_id UUID;
BEGIN
  INSERT INTO clients (
    organization_id, name, industry, website, location, contract_start, contract_end,
    monthly_retainer_inr, service_package, status, internal_notes, account_manager_id
  ) VALUES (
    p_organization_id, c.name, c.industry, c.website, c.location, c.contract_start, c.contract_end,
    COALESCE(c.monthly_retainer_inr, 0), c.service_package, COALESCE(c.status, 'active'),
    c.internal_notes, auth.uid()
  )
  RETURNING id INTO v_id;

  IF p_contact IS NOT NULL AND COALESCE(trim(p_contact ->> 'full_name'), '') <> '' THEN
    INSERT INTO client_contacts (
      organization_id, client_id, full_name, email, phone, whatsapp_number, is_primary
    ) VALUES (
      p_organization_id, v_id,
      trim(p_contact ->> 'full_name'),
      NULLIF(trim(p_contact ->> 'email'), ''),
      NULLIF(trim(p_contact ->> 'phone'), ''),
      NULLIF(trim(p_contact ->> 'phone'), ''),
      TRUE
    );
  END IF;

  INSERT INTO audit_logs (organization_id, actor_id, action, entity_type, entity_id, details)
  VALUES (p_organization_id, auth.uid(), 'client.created', 'client', v_id,
          jsonb_build_object('name', c.name));

  RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Lead + "created" activity, atomically
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_lead_with_activity(
  p_organization_id UUID,
  p_lead JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  l leads%ROWTYPE := jsonb_populate_record(NULL::leads, p_lead);
  v_id UUID;
BEGIN
  INSERT INTO leads (
    organization_id, client_id, name, company, phone, email, interested_service, source,
    assigned_to, lead_score, budget_inr, expected_deal_value_inr, stage, next_follow_up, notes
  ) VALUES (
    p_organization_id, l.client_id, l.name, l.company, l.phone, l.email, l.interested_service,
    COALESCE(l.source, 'manual'), auth.uid(), COALESCE(l.lead_score, 50), l.budget_inr,
    l.expected_deal_value_inr, COALESCE(l.stage, 'new'), l.next_follow_up, l.notes
  )
  RETURNING id INTO v_id;

  INSERT INTO lead_activities (organization_id, lead_id, actor_id, activity_type, summary)
  VALUES (p_organization_id, v_id, auth.uid(), 'created',
          'Lead created from ' || COALESCE(l.source, 'manual'));

  RETURN v_id;
END;
$$;
