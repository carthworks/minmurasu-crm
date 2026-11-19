# MIN MURASU CRM – MASTER IMPLEMENTATION PROMPT
## Project: Digital Growth & Agency Operations Platform
Version: 1.0

Act as a Principal SaaS Architect, Senior Full-Stack Developer, Database Engineer, UI/UX Designer and Integration Specialist.

Your task is to build a production-ready Digital Marketing Agency CRM for MIN MURASU.

Website: https://www.minmurasu.digital

Brand: MIN MURASU – The Digital Drum

Tagline: Turn Digital Attention Into Business Growth.

---

# 1. FIXED ARCHITECTURE DECISIONS

Do not change the following technology choices without identifying a genuine technical blocker and explaining it first.

Frontend:
- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts

Backend:
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

Integrations:
- Official Meta WhatsApp Cloud API
- n8n automation
- OpenAI API
- Google Analytics 4
- Google Search Console
- Google Ads and Meta Ads, subject to API access

Deployment:
- Vercel
- Supabase Cloud
- Secure background automation infrastructure

Use current stable compatible package versions. Follow the current official Next.js and Supabase documentation.

# 2. EXISTING PROJECT AUDIT

First inspect the entire existing repository.

Locate and inspect:
- login.html
- crm-dashboard.html
- global.css
- Existing assets
- Existing JavaScript functionality
- Existing project configuration

Preserve the useful design and brand identity.

The uploaded login page contains:
- MIN MURASU brand identity.
- The Digital Drum positioning.
- Navy, orange and blue palette.
- Login form.
- Password visibility control.
- Theme toggle.
- Client & Growth Portal messaging.
- Google Workspace / Client SSO presentation.

The dashboard contains:
- Client Marketing CRM.
- Campaign ROI KPIs.
- Qualified leads.
- Social engagement.
- Client project tracker.
- Campaign charts.
- Client selector.
- Global search.
- CSV export.
- Campaign creation modal.

Retain and improve these features.

Important: The existing dashboard uses hardcoded demonstration records and chart data. Its login JavaScript performs client-side validation and redirects to the dashboard without authenticating a real user.

Replace these mechanisms with real database operations and Supabase authentication.

Never treat the sample KPI figures as verified business results.

# 3. PRODUCT SCOPE

Build an internal agency CRM for MIN MURASU.

The application must support:
- Agency administrators.
- Marketing managers.
- Sales representatives.
- Team members.
- External client users.

Use organization-based ownership throughout the database.

Although the initial deployment is for one agency, design the database so that multiple organizations can be supported in a future SaaS version.

Build two distinct experiences:

A. Agency Operations Portal
B. Client Growth Portal

Client users must only see data belonging to their assigned client account.

# 4. AUTHENTICATION AND RBAC

Implement:
- Supabase email/password authentication.
- Secure cookie-based sessions.
- Password reset.
- Email verification.
- Logout.
- Protected routes.
- Google OAuth / Workspace SSO when configured.
- Role-based permissions.
- Server-side authorization.

Roles:
- super_admin
- agency_admin
- marketing_manager
- sales
- team_member
- client

Create reusable permission functions.

Implement PostgreSQL RLS policies on every exposed business table.

Do not rely on hiding UI elements as an authorization mechanism.

A user must not be able to access another client's data by changing URL parameters or API requests.

# 5. DATABASE IMPLEMENTATION

Create ordered, reproducible SQL migrations.

Implement the following tables:

Foundation:
- organizations
- profiles
- organization_members
- client_members

CRM:
- clients
- client_contacts
- prospects
- leads
- lead_activities

Marketing:
- campaigns
- campaign_metrics
- marketing_channels
- social_accounts
- social_posts

SEO/GEO:
- seo_projects
- seo_keywords
- seo_rankings
- geo_visibility_checks

WhatsApp:
- whatsapp_contacts
- conversations
- conversation_messages
- whatsapp_templates
- whatsapp_webhook_events

Operations:
- projects
- tasks
- deliverables
- client_approvals

Finance:
- invoices
- payments

System:
- notifications
- integrations
- audit_logs

Database standards:
- UUID primary keys.
- Foreign key constraints.
- Appropriate indexes.
- Timestamps with timezone.
- Numeric monetary columns.
- Unique external provider identifiers.
- Soft deletion where appropriate.
- Updated-at triggers.
- Organization-level data ownership.
- RLS policies.
- Database tests.

Create seed data for development only.

Clearly distinguish demo data from real data.

# 6. APPLICATION MODULES

Build the following modules with functional CRUD operations.

## Dashboard
- Active clients.
- Leads generated.
- Qualified leads.
- Monthly revenue.
- Campaign expenditure.
- Attributed revenue.
- ROI and ROAS.
- Conversion rates.
- Pending approvals.
- Overdue tasks.

Include date and client filters.

Every KPI must be calculated from actual records.

## Client CRM
- Create and edit clients.
- Manage company profiles.
- Manage contacts.
- Assign account managers.
- Manage service packages.
- Track monthly retainers.
- Client status.
- Client activity timeline.

## Lead Management
- Lead creation.
- Source tracking.
- Lead assignment.
- Lead scoring.
- Sales pipeline.
- Follow-up reminders.
- Lead activities.
- Duplicate detection.
- CSV import/export.

Pipeline:
New → Contacted → Qualified → Proposal Sent → Negotiation → Won/Lost.

## Campaign Management
- Campaign creation.
- Budget tracking.
- Channel management.
- Performance metrics.
- Campaign comparison.
- ROI calculations.
- ROAS calculations.
- Cost per lead.
- Conversion tracking.

## WhatsApp CRM
- Shared inbox.
- Contact management.
- Conversation assignment.
- Message history.
- Inbound and outbound messages.
- Approved templates.
- Media support.
- Message status.
- Customer opt-in.
- Service window tracking.
- Lead creation from messages.
- Internal notes.

## Projects and Tasks
- Project creation.
- Task assignments.
- Priority.
- Due dates.
- Progress tracking.
- Deliverables.
- Client approvals.
- Notifications.

## SEO/GEO
- Keyword tracking.
- Ranking history.
- Search Console data.
- Organic traffic.
- Technical SEO tasks.
- AI search visibility tests.
- Citation tracking.

Do not claim AI search rankings without actual measurements.

## Social Media
- Account management.
- Content calendar.
- Post scheduling.
- Caption management.
- Creative uploads.
- Client approval.
- Publishing status.
- Engagement analytics.

## Reports
- Monthly client reports.
- Campaign reports.
- Lead reports.
- SEO/GEO reports.
- PDF and CSV export.
- Report history.

## Billing
- Client retainers.
- Invoices.
- Payment records.
- Outstanding balances.
- INR formatting.

## AI Assistant
- Campaign performance summaries.
- Lead qualification suggestions.
- Marketing recommendations.
- Report summaries.
- Social caption generation.
- WhatsApp conversation summaries.

Use OpenAI through secure server-side APIs.

Never expose API credentials to the browser.

# 7. WHATSAPP CLOUD API IMPLEMENTATION

Use the official Meta WhatsApp Business Cloud API.

Build dedicated Edge Functions:

1. whatsapp-webhook
2. whatsapp-send
3. whatsapp-template-sync
4. whatsapp-media

Webhook requirements:
- GET verification handshake.
- POST event processing.
- Verify X-Hub-Signature-256 using raw request bytes.
- Persist incoming webhook events.
- Deduplicate using provider event identifiers.
- Handle inbound messages.
- Handle delivery/read/failure status updates.
- Handle retries and out-of-order events.
- Update conversation records.
- Notify the assigned agent.

Message sending:
- Validate the recipient.
- Check customer opt-in.
- Check the 24-hour customer service window.
- Permit free-form messages only when allowed.
- Require approved templates when applicable.
- Store Meta message IDs.
- Update delivery status using webhooks.
- Log API errors.

Store secrets securely.

Required configuration:
- META_APP_SECRET
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_BUSINESS_ACCOUNT_ID
- WHATSAPP_WEBHOOK_VERIFY_TOKEN
- META_GRAPH_API_VERSION

Use a configurable, deliberately pinned Graph API version.

Do not create fake WhatsApp conversations or report a connected account without successful verification.

# 8. N8N AUTOMATION

Prepare n8n workflows:

01. Website Lead Capture
02. WhatsApp Lead Capture
03. Lead Assignment
04. Lead Follow-up
05. Proposal Follow-up
06. Client Onboarding
07. Task Deadline Reminder
08. Content Approval
09. Invoice Reminder
10. Monthly Client Report

All workflows must use authenticated webhooks or appropriately secured Supabase access.

Implement idempotency to prevent duplicate execution.

Provide workflow JSON exports and setup documentation.

# 9. DESIGN SYSTEM

Preserve MIN MURASU branding.

Colors:
- Navy #0D2040
- Dark Navy #071326
- Surface #0A1931
- Orange #F58220
- Orange Hover #E06F10
- Blue #0082CA
- WhatsApp Green #25D366
- Background #FAFBFD

Fonts:
- Manrope
- Inter

Requirements:
- Premium SaaS appearance.
- Responsive layouts.
- Collapsible sidebar.
- Dark/light mode.
- Professional KPI cards.
- Interactive charts.
- Search and filters.
- Toast notifications.
- Loading skeletons.
- Empty states.
- Error handling.
- Accessible controls.

Every visible button and navigation item must have a working action.

# 10. PROJECT STRUCTURE

Use a modular architecture:

src/
  app/
  components/
  lib/
  services/
  hooks/
  types/
  config/

supabase/
  migrations/
  functions/
  tests/
  seed.sql

n8n/
  workflows/

docs/

Use reusable components and typed service functions.

Separate:
- UI components.
- Business logic.
- Database access.
- Validation.
- Authorization.
- Integration logic.

# 11. TESTING REQUIREMENTS

Implement:
- TypeScript checks.
- ESLint.
- Unit tests.
- Component tests.
- API tests.
- Authentication tests.
- RLS security tests.
- Cross-client access tests.
- WhatsApp webhook tests.
- Duplicate event tests.
- Campaign calculation tests.
- End-to-end critical workflows.

Test that:
- Agency users cannot access unauthorized organizations.
- Clients cannot access other clients.
- Client users cannot modify internal roles.
- Unauthorized API requests are rejected.
- Invalid webhook signatures are rejected.
- Duplicate webhook events do not duplicate messages.
- Closed WhatsApp service windows do not allow free-form messaging.
- Dashboard metrics reconcile with underlying records.

# 12. DEVELOPMENT EXECUTION PLAN

Work incrementally.

PHASE 0 – AUDIT
Inspect existing repository, files and dependencies.

PHASE 1 – FOUNDATION
- Next.js project.
- Design system.
- Supabase setup.
- Database migrations.
- Authentication.
- RLS.
- Agency shell.

PHASE 2 – CRM
- Clients.
- Contacts.
- Prospects.
- Leads.
- Sales pipeline.

PHASE 3 – MARKETING
- Campaigns.
- ROI analytics.
- Projects.
- Tasks.
- Client portal.

PHASE 4 – WHATSAPP
- Cloud API.
- Webhooks.
- Inbox.
- Message sending.
- Templates.

PHASE 5 – AUTOMATION
- n8n workflows.
- Notifications.
- Follow-ups.
- Reporting automation.

PHASE 6 – ANALYTICS
- Google Analytics.
- Search Console.
- SEO/GEO.
- Social analytics.

PHASE 7 – AI AND PRODUCTION
- AI assistant.
- Security review.
- Testing.
- Deployment.

# 13. STRICT DEVELOPMENT RULES

1. Never overwrite the existing project without inspecting it.
2. Never hardcode credentials.
3. Never expose service-role keys in frontend code.
4. Never bypass RLS for convenience.
5. Never fabricate campaign statistics.
6. Never simulate successful external API calls.
7. Never create non-functional buttons.
8. Never skip error handling.
9. Never skip authorization tests.
10. Never claim a module is production-ready until it has passed its acceptance tests.
11. Use database migrations for all schema changes.
12. Document every external integration.
13. Keep the application deployable after each development phase.

If required credentials are unavailable, build the integration interface and testable adapter, document the missing configuration, and clearly mark the integration as not connected.

# 14. DEFINITION OF DONE

The first production release must allow MIN MURASU to:

- Sign in securely.
- Manage team members.
- Manage multiple clients.
- Manage leads and sales opportunities.
- Create and monitor campaigns.
- Manage projects and deliverables.
- Operate a real WhatsApp CRM inbox.
- Automate follow-ups.
- Provide secure client dashboards.
- Generate reports from real performance data.

The result must be a functioning agency operating system, not merely a collection of attractive dashboard screens.

# YOUR FIRST ACTION

Do not start coding all modules immediately.

First:

1. Inspect the complete repository.
2. Audit login.html and crm-dashboard.html.
3. Produce an architecture assessment.
4. Prepare the complete database ERD.
5. Prepare the SQL migration sequence.
6. Identify missing external credentials.
7. Prepare the implementation checklist.

Then implement PHASE 1 completely.

Run the application, verify authentication, test RLS and demonstrate the working dashboard before moving to Phase 2.

Maintain a DEVELOPMENT_STATUS.md file and update it after every phase.

Work as a senior engineering team delivering a real commercial product for MIN MURASU.