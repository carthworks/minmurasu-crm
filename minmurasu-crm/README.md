# MIN MURASU — Digital Growth CRM & Client Portal

**The Digital Drum** · [minmurasu.digital](https://www.minmurasu.digital)  
*Turn Digital Attention Into Business Growth.*

A full-stack digital marketing agency CRM, marketing operations workspace, and client-isolated growth portal built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Supabase (Auth, PostgreSQL, Row Level Security)**, **Recharts**, and **jsPDF**.

---

## Key Features

- **Executive Dashboard (`/`)**: Real-time KPIs (Active Clients, MRR, Leads, Qualified Leads, Spend, Revenue Attributed, Avg. ROI, Conversion Rate, Pending Approvals, Overdue Tasks), Revenue vs. Spend & Channel Performance charts, and client filtering.
- **Core CRM (`/clients`, `/clients/[id]`, `/prospects`, `/leads`, `/pipeline`, `/contacts`)**:
  - 1-step client onboarding with primary contact auto-creation.
  - 10-tab 360° Client Profile (`Overview`, `Campaigns`, `Leads`, `Projects`, `SEO/GEO`, `Social Media`, `WhatsApp`, `Reports`, `Billing`, `Activity History`).
  - Table & Card view switchers, sorting, filtering, CSV export, pagination, and a 7-stage drag-and-drop Sales Pipeline Kanban.
- **Marketing Operations (`/campaigns`, `/projects`, `/tasks`, `/deliverables`, `/approvals`, `/calendar`, `/social`)**:
  - Campaign ROI & CPL tracking with daily metric logging.
  - 6-stage Task Board, Deliverable review workflow, and Social Content Calendar with client approval actions.
- **WhatsApp Business CRM (`/whatsapp`, `/api/webhooks/whatsapp`)**:
  - Official WhatsApp Cloud API webhook with HMAC-SHA256 signature verification, opt-in tracking, and 24-hour customer service window indicators.
- **SEO & GEO, Reports & Billing (`/seo-geo`, `/reports`, `/revenue`, `/billing`)**:
  - Branded, presentation-ready vector **PDF Reports** and **PDF Invoices** with MIN MURASU logo, date stamp, and unique Client ID (`MM-XXXXXXXX`), plus INR retainer & payment tracking.
- **AI Marketing Assistant (`/analytics`, `/api/ai/assistant`)**:
  - Grounded in RLS-scoped measured database records using **OpenAI** with automatic **local Ollama fallback** (streaming NDJSON support), configurable in **Settings**.
- **Security & RBAC (`/settings`, `/settings/team`, `/settings/integrations`, `/help`)**:
  - 6 roles (`super_admin`, `agency_admin`, `marketing_manager`, `sales_bd`, `team_member`, `client`) enforced in Server Actions and PostgreSQL `SECURITY DEFINER` RLS policies.

---

## Getting Started

### 1. Install Dependencies
```bash
cd minmurasu-crm
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Optional keys for external integrations (`OPENAI_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `WHATSAPP_*`) are documented in `.env.example`.

### 3. Run Database Migrations (Supabase SQL Editor)
Execute the SQL files in `supabase/migrations/` in order:
1. `0001_core_schema.sql`
2. `0002_rls_policies.sql`
3. `0003_phase2_rls.sql`
4. `0004_phase3_to_6_rls.sql`
5. `0005_org_members_rls.sql`
6. `0006_fix_social_posts_rls.sql`
7. `0007_complete_rls_fix.sql`
8. `0008_dashboard_metrics_rpc.sql`
9. *(Optional dev data)* `supabase/seed.sql`

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000/login](http://localhost:3000/login).

---

## Verification Commands
```bash
npm run lint
npx tsc --noEmit
npm run build
```

---

## Documentation
- [CRM How-To & Role Permissions Guide](docs/CRM_HOW_TO_GUIDE.md) (also available in-app at `/help`)
- [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT.md)
