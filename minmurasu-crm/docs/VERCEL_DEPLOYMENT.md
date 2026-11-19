# Deploying MIN MURASU CRM to Vercel

## 1. Vercel Project Configuration
- **Framework Preset**: Next.js
- **Root Directory**: `minmurasu-crm`
- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- **Region**: `bom1` (Mumbai, configured in `vercel.json`)

## 2. Required Environment Variables (Vercel → Settings → Environment Variables)
Add these for **Production** (and Preview if desired):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=https://your-production-domain.vercel.app
```

Optional Integration Keys (add when connecting):
```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
OLLAMA_BASE_URL=
OLLAMA_MODEL=
ERROR_WEBHOOK_URL=
```
See `.env.example` for what each variable does.

`NEXT_PUBLIC_SUPABASE_URL` must be set at **build** time as well: the Content-Security-Policy
header allows browser connections only to that Supabase origin (it falls back to `*.supabase.co`
if unset). If you add a third-party script, font, analytics tool or API that the browser calls
directly, add its origin to the CSP in `next.config.ts` or the browser will block it.

Server errors are logged as one JSON line each (search Vercel logs for `"source":"minmurasu-crm"`).
Set `ERROR_WEBHOOK_URL` to also forward them to a Slack webhook or log drain.

## 3. Supabase Auth Redirect URLs
In **Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL**: `https://your-production-domain.com` (or your `.vercel.app` URL)
- **Redirect URLs**: Add `https://your-production-domain.com/auth/callback`

## 4. WhatsApp Webhook (When Ready)
Point your Meta App WhatsApp Webhook Callback URL to:
`https://your-production-domain.com/api/webhooks/whatsapp`

`WHATSAPP_APP_SECRET` is **required** for the webhook: without it every POST is rejected
with `503`, and any request without a valid `X-Hub-Signature-256` header gets `401`.

## 4a. Database Migrations
Apply every file in `supabase/migrations/` in order (`supabase db push`, or paste into the SQL editor).
`0008_role_scoped_rls_hardening.sql` enforces role permissions in the database:
- Only Super Admin / Agency Admin can read or write invoices, payments and integrations
  (client users still see their own invoices). Other staff will see an empty Billing page.
- Only Sales/BD and above can create or edit leads and prospects; only Marketing Manager and above
  can create or edit campaigns and metrics.
- Hard deletes are limited to admins; use `deleted_at` for soft deletes.
- Only a Super Admin can grant or change the Super Admin role, and an organization can never
  be left without an active admin.

`0009_rate_limits_and_transactional_rpcs.sql` **must be applied before deploying the matching app code**
(the app calls these functions):
- `check_rate_limit()`: Postgres-backed per-user rate limit used by the AI assistant
  (10/minute, 200/day). If the function is missing, the assistant returns `503` (fails closed).
- `record_payment()`: partial payments keep the invoice open; it is marked `paid` only when fully
  settled. Overpayments and a repeated reference number on the same invoice are rejected.
- `create_client_with_contact()` / `create_lead_with_activity()`: the record, its child row and the
  audit entry are saved together or not at all.

`0010_dashboard_aggregates_and_client_guards.sql` **must also be applied before deploying the matching
app code**:
- `dashboard_metrics()`: dashboard, analytics and reports totals are computed in the database.
  Without it, those pages show zeros. Optional `?from=YYYY-MM-DD&to=YYYY-MM-DD` query parameters
  limit campaign metrics to a date range.
- Client users can now change only the approval decision (and feedback) on social posts and
  approvals; the reviewer and review time are recorded automatically.
- `get_ollama_config()`: non-admin staff use the organization's Ollama settings again
  (0008 had hidden them, so they silently fell back to `OLLAMA_BASE_URL`).

## 5. Pre-Deployment Verification
Run locally inside `minmurasu-crm/`:
```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Database tests (against a throwaway local Postgres, never production):
```powershell
psql -v ON_ERROR_STOP=1 -f supabase/tests/00_stub_supabase_auth.sql
Get-ChildItem supabase/migrations/*.sql | Sort-Object Name | ForEach-Object { psql -v ON_ERROR_STOP=1 -q -f $_.FullName }
Get-ChildItem supabase/tests/*.test.sql | Sort-Object Name | ForEach-Object { psql -v ON_ERROR_STOP=1 -f $_.FullName }
```
The same checks run in GitHub Actions on every pull request (`.github/workflows/ci.yml`).
