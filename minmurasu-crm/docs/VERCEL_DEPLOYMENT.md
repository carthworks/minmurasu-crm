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
```

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

## 5. Pre-Deployment Verification
Run locally inside `minmurasu-crm/`:
```powershell
npx tsc --noEmit
npm run lint
npm run build
```
