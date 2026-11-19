# MIN MURASU CRM — Operational How-To & Permissions Guide

**Platform:** MIN MURASU – Digital Growth CRM & Client Portal (`minmurasu.digital`)  
**Stack:** Next.js App Router · TypeScript · Supabase Auth & PostgreSQL RLS · Recharts · jsPDF

---

## 1. Workflow Documentation

### A. Administrator & Manager Workflows (Account Leads, Agency Admins, Super Admins)

#### 1. Decision Intelligence & ROI Monitoring
1. **Executive Overview (`/`)**:
   - Use the topbar **Client Filter** to switch between `All Clients` and a specific account.
   - Review the 10 real-data KPI cards: **Total Active Clients**, **MRR**, **Total Leads**, **Qualified Leads**, **Campaign Spend**, **Revenue Attributed**, **Avg. Campaign ROI**, **Conversion Rate**, **Pending Client Approvals**, and **Overdue Tasks**.
   - Inspect **Revenue Attributed vs. Campaign Spend** and **Channel Performance** charts to identify which channels drive the highest margin.
2. **AI-Assisted Optimization (`/analytics`)**:
   - Select a quick prompt or enter a custom question in the **MIN MURASU AI Marketing Assistant** (`POST /api/ai/assistant`).
   - All AI output is grounded in RLS-scoped measured database records and clearly marked as **Advisory Output** separate from measured metrics.
3. **Presentation-Ready Client Reporting (`/reports`, `/revenue`)**:
   - Select the target client in the topbar, choose the **Report Type** (`Monthly Marketing Report`, `Campaign Performance & ROI Report`, `Lead Conversion Report`, or `Revenue & Retainer Report`), and click **Download PDF Report** (`generateClientPdfReport`) to export a branded MIN MURASU PDF with logo, date stamp, and unique Client ID (`MM-XXXXXXXX`).

#### 2. Customer Experience & Onboarding
1. **Client Provisioning (`/clients`, `/clients/[id]`)**:
   - Click **+ Add Client** to register company details, industry, location, service package, and monthly retainer (INR).
   - Open any client's **360° Profile** (`/clients/[id]`) to manage all 10 operational tabs (`Overview`, `Campaigns`, `Leads`, `Projects`, `SEO/GEO`, `Social Media`, `WhatsApp`, `Reports`, `Billing`, `Activity History`).
2. **Content & Deliverable Approvals (`/calendar`, `/approvals`)**:
   - Schedule social posts in `/calendar` (`createSocialPostAction`) with `pending` approval status.
   - Clients or account leads click **Approve** (`updateSocialPostApprovalAction`) before publishing.
3. **WhatsApp Business CRM (`/whatsapp`)**:
   - Monitor inbound enquiries synced via `/api/webhooks/whatsapp`.
   - Respect the **24-hour customer service window** and **Opt-In** indicators before sending free-form replies vs. approved templates.

#### 3. Agency Profitability & Billing (`/billing`)
1. **Retainer & Collection Tracking**:
   - Monitor **Active Monthly Retainers**, **Total Billed**, **Collected (Paid)**, and **Outstanding Balance** in INR.
2. **Invoicing & Payment Recording**:
   - Click **+ New Invoice** (`createInvoiceAction`) to issue an invoice for a client.
   - Click **PDF** on any row (`generateInvoicePdf`) to download a branded invoice.
   - Click **Mark Paid** (`recordPaymentAction`) to record Bank Transfer/UPI/Cheque payments in `payments` and update invoice status to `paid`.

---

### B. Standard User Workflows (Marketing Managers, Sales/BD, Team Members)

#### 1. Lead Capture & Pipeline Execution (`/leads`, `/pipeline`, `/prospects`)
1. **Adding Leads (`/leads`)**:
   - Click **+ Add Lead** (`createLeadAction`). Built-in duplicate detection warns if an email or phone already exists.
   - Use the filter bar (`Stage`, `Source`, `Sort`, `Search`) and **Export CSV** for list management.
2. **Moving Deals (`/pipeline`)**:
   - Switch to **Kanban Pipeline** (`/pipeline`) and drag-and-drop lead cards across the 7 stages (`New` → `Contacted` → `Qualified` → `Proposal Sent` → `Negotiation` → `Won` / `Lost`).
   - Every stage change automatically logs an entry in `lead_activities`.

#### 2. Campaign & Task Delivery (`/campaigns`, `/projects`, `/tasks`)
1. **Campaign Tracking (`/campaigns`)**:
   - Launch campaigns (`createCampaignAction`) and click **Log Metrics** (`recordCampaignMetricAction`) to record daily spend, leads, clicks, engagements, and attributed revenue. CPL and ROI recalculate automatically.
2. **Project & Task Workflow (`/projects`, `/tasks`)**:
   - Create a client project in `/projects` (`createProjectAction`) first.
   - Add tasks in `/tasks` (`createTaskAction`) and drag cards across the 6-stage board (`Backlog` → `To Do` → `In Progress` → `In Review` → `Client Approval` → `Completed`).

---

## 2. Server & Role Permissions Reference

### A. System Roles & Access Matrix

Defined in `src/lib/auth/rbac.ts` and enforced on both Server Actions and PostgreSQL RLS:

| Role (`user_role`) | Scope | Clients & Contacts | Leads & Pipeline | Campaigns & Metrics | Projects, Tasks & Social | Billing & Invoices | Team, RBAC & Org Settings |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`super_admin`** | Full Organization | Read / Write | Read / Write | Read / Write | Read / Write | Read / Write | **Full Admin** |
| **`agency_admin`** | Full Organization | Read / Write | Read / Write | Read / Write | Read / Write | Read / Write | **Manage Team & Org** |
| **`marketing_manager`** | Full Organization | Read / Write | Read / Write | Read / Write | Read / Write | Read Only | Read Only |
| **`sales_bd`** | Full Organization | Read / Write | Read / Write | Read Only | Read Only | Read Only | Read Only |
| **`team_member`** | Full Organization | Read / Write | Read Only | Read Only | Read / Write | Read Only | Read Only |
| **`client`** | **Own `client_id` Only** | Own Client Only | Own Leads Only | Own Campaigns (Read) | Own Projects & Approve Content | Own Invoices (Read) | No Access |

### B. Technical Mapping to Supabase RLS & Application Architecture

1. **Authentication & Session Context (`src/lib/supabase/middleware.ts`, `src/lib/auth/session.ts`)**:
   - Every request passes through `updateSession()` in Next.js middleware, validating the Supabase Auth JWT cookie (`supabase.auth.getUser()`). Unauthenticated requests to protected routes are redirected to `/login`.
   - Server Actions and Server Components call `getCurrentUserContext()`, which loads the user's active row from `organization_members` (`organization_id`, `role`, `client_id`) and enforces RBAC helpers (`isAgencyStaffRole`, `canManageCampaigns`, `canManageLeads`, `canManageSettings`) **on the server** before executing mutations.

2. **PostgreSQL Row Level Security (`supabase/migrations/0002_rls_policies.sql` – `0007_complete_rls_fix.sql`)**:
   - **Non-Recursive `SECURITY DEFINER` Helpers**:
     - `is_org_member(p_org_id)`: Verifies the authenticated user (`auth.uid()`) belongs to the organization and `is_active = TRUE`.
     - `is_agency_staff(p_org_id)`: Returns `TRUE` for `super_admin`, `agency_admin`, `marketing_manager`, `sales_bd`, and `team_member`.
     - `is_org_admin(p_org_id)`: Returns `TRUE` only for `super_admin` and `agency_admin` (controls `organization_members` updates via `/settings/team`).
     - `is_client_member_for(p_org_id, p_client_id)`: Returns `TRUE` only when `role = 'client'` and `organization_members.client_id = p_client_id`.
   - **Data Isolation**: Every sensitive table (`clients`, `campaigns`, `campaign_metrics`, `leads`, `projects`, `tasks`, `social_posts`, `invoices`, `payments`, `audit_logs`) enforces `USING` and `WITH CHECK` policies using these functions, guaranteeing at the database layer that a `client` user can never read or mutate another client's records.

3. **Secret & Integration Isolation**:
   - Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `OPENAI_API_KEY`) live exclusively in `.env.local` / Vercel environment variables and are accessed only inside `/api/*` Route Handlers and Server Components—never exposed to `NEXT_PUBLIC_*` client bundles.
