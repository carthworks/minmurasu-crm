# PROJECT: MIN MURASU – DIGITAL GROWTH CRM & CLIENT PORTAL

**Brand:** MIN MURASU  
**Tagline:** The Digital Drum  
**Website:** https://www.minmurasu.digital  
**Platform:** Digital Marketing Agency CRM, Marketing Operations & Client Growth Portal

## 1. YOUR ROLE

Act as a Senior SaaS Product Architect, Full-Stack Engineer, UI/UX Designer, CRM Specialist and Marketing Automation Architect.

Build a modern, scalable, production-ready CRM application for MIN MURASU, a digital marketing and AI automation agency.

This is not a generic CRM.

It must combine:
- Agency CRM
- Client relationship management
- Marketing campaign management
- Lead management and sales pipeline
- WhatsApp Business CRM
- Marketing automation
- SEO and GEO performance tracking
- Social media management
- Client project management
- Reporting and analytics
- AI-powered marketing insights

The application should serve two primary audiences:

1. Agency administrators and internal marketing team.
2. Clients who need to monitor their marketing performance and business growth.

## 2. BRAND IDENTITY AND DESIGN SYSTEM

Use the existing uploaded files `login.html` and `crm-dashboard.html` as the primary visual and functional reference.

Do not discard the existing design direction. Improve and modernize it.

Brand:
MIN MURASU – The Digital Drum.

Tagline:
Turn Digital Attention Into Business Growth.

Color palette:
- Primary Navy: #0D2040
- Dark Navy: #071326
- Navy Surface: #0A1931
- Brand Orange: #F58220
- Orange Hover: #E06F10
- Brand Blue: #0082CA
- WhatsApp Green: #25D366
- Background: #FAFBFD

Typography:
- Manrope for headings.
- Inter for body content.

Design direction:
- Premium SaaS dashboard.
- Modern B2B software aesthetic.
- Clean sidebar navigation.
- Responsive desktop, tablet and mobile layouts.
- Light and dark themes.
- Professional charts and KPI cards.
- Subtle transitions and animations.
- Consistent spacing and typography.
- No unnecessary gradients or visual clutter.

Use Lucide icons.

The interface must feel like a commercial SaaS product, not a static HTML dashboard.

## 3. USER ROLES AND ACCESS CONTROL

Implement role-based access control.

### Super Admin
- Complete application access.
- Manage agency settings.
- Manage users and permissions.
- Manage all clients.
- Configure integrations.
- Access all financial and marketing reports.

### Agency Admin
- Manage assigned clients.
- Create campaigns.
- Assign team members.
- Manage leads and projects.
- Access client reports.

### Marketing Manager
- Manage campaigns.
- Track performance.
- Manage content calendars.
- Manage SEO activities.
- Generate reports.

### Sales / Business Development
- Manage prospects.
- Manage leads.
- Track sales pipeline.
- Schedule follow-ups.
- Convert prospects into clients.

### Team Member
- View assigned projects.
- Update tasks.
- Upload deliverables.
- Update campaign activities.

### Client
- Access only their organization's information.
- View campaign performance.
- Track leads.
- Review deliverables.
- Approve content.
- Download reports.
- Communicate with the agency.

A client must NEVER access another client's data.

## 4. APPLICATION MODULES

### A. Executive Dashboard

Create a central dashboard with:

KPI cards:
- Total Active Clients
- Monthly Recurring Revenue (MRR)
- Total Leads Generated
- Qualified Leads
- Campaign Spend
- Revenue Attributed
- Average Campaign ROI
- Conversion Rate
- Pending Client Approvals
- Overdue Tasks

Visualizations:
- Revenue vs expenditure.
- Campaign ROI trends.
- Monthly lead generation.
- Lead conversion funnel.
- Channel performance.
- Client growth.
- Campaign performance.

Filters:
- Date range.
- Client.
- Marketing channel.
- Campaign status.

All metrics must be calculated from actual database records.

Never display fabricated live performance data.

### B. Client Management

Features:
- Add and edit clients.
- Company profile.
- Industry and business category.
- Contact persons.
- Email and phone.
- Website.
- Business location.
- Client logo.
- Contract start and end dates.
- Monthly retainer.
- Service package.
- Assigned account manager.
- Client status.
- Internal notes.
- Documents and attachments.

Client profile tabs:
1. Overview
2. Campaigns
3. Leads
4. Projects
5. SEO/GEO
6. Social Media
7. WhatsApp
8. Reports
9. Billing
10. Activity History

### C. Lead Management CRM

Build a complete lead management system.

Lead sources:
- Website forms.
- WhatsApp.
- Google Ads.
- Meta Ads.
- Instagram.
- Facebook.
- LinkedIn.
- Organic Search.
- Referrals.
- Manual Entry.
- API/Webhooks.

Lead information:
- Name.
- Company.
- Phone.
- Email.
- Interested service.
- Source.
- Campaign.
- Assigned sales representative.
- Lead score.
- Budget.
- Expected deal value.
- Notes.
- Next follow-up.
- Lead status.

Pipeline stages:
- New
- Contacted
- Qualified
- Proposal Sent
- Negotiation
- Won
- Lost

Features:
- Kanban pipeline.
- Drag-and-drop lead movement.
- Lead assignment.
- Follow-up reminders.
- Activity timeline.
- Lead notes.
- Duplicate detection.
- CSV import/export.
- Advanced filters.
- Conversion analytics.

### D. WhatsApp Business CRM

This is a major feature of MIN MURASU.

Build an integrated WhatsApp CRM interface using the official WhatsApp Business Platform / Cloud API.

Features:
- WhatsApp conversation inbox.
- Contact management.
- Conversation history.
- Incoming and outgoing messages.
- Message templates.
- Approved template management.
- Media attachments.
- Lead creation from incoming conversations.
- Assign conversations to team members.
- Conversation tags.
- Automated responses.
- Follow-up workflows.
- Conversation status.
- Campaign attribution.
- Delivery and read receipts where supported.

WhatsApp automation:
- New lead acknowledgement.
- Enquiry qualification.
- Appointment confirmation.
- Follow-up reminders.
- Proposal follow-up.
- Payment reminders.
- Client onboarding messages.

Important:
- Respect WhatsApp messaging policies.
- Implement customer opt-in tracking.
- Use approved templates for business-initiated messages when required.
- Respect the 24-hour customer service window.
- Store webhook events.
- Implement webhook signature verification.
- Do not simulate a connected WhatsApp account.

### E. Campaign Management

Manage marketing campaigns across multiple clients.

Channels:
- Google Ads.
- Meta Ads.
- Instagram.
- Facebook.
- LinkedIn.
- SEO.
- GEO.
- Email Marketing.
- WhatsApp Marketing.
- YouTube.

Campaign details:
- Campaign name.
- Client.
- Objective.
- Marketing channel.
- Start and end dates.
- Campaign budget.
- Actual expenditure.
- Impressions.
- Reach.
- Clicks.
- Leads.
- Conversions.
- Revenue attributed.
- Cost per lead.
- Cost per acquisition.
- ROAS.
- ROI.
- Campaign status.

Include:
- Campaign creation.
- Campaign assignment.
- Performance monitoring.
- Campaign notes.
- Budget tracking.
- Optimization recommendations.
- Campaign comparison.

### F. SEO & GEO Performance

Build a dedicated SEO and Generative Engine Optimization module.

SEO:
- Website URL.
- Target keywords.
- Keyword ranking history.
- Search impressions.
- Clicks.
- CTR.
- Average position.
- Organic traffic.
- Technical SEO audit.
- Backlink monitoring.
- Page optimization tasks.

GEO:
- Brand visibility in AI search.
- Brand mention tracking.
- Citation monitoring.
- AI search presence.
- Competitor visibility.
- Prompt-based visibility tests.
- Historical visibility trends.

Integrations:
- Google Search Console API.
- Google Analytics 4 API.
- Approved SEO data providers.

Important: Do not claim real-time keyword rankings or AI search visibility without a connected data provider and actual measurement.

### G. Social Media Management

Features:
- Social account management.
- Content calendar.
- Post planning.
- Creative uploads.
- Caption management.
- Hashtag management.
- Content approval.
- Publishing status.
- Engagement analytics.
- Reach and impressions.
- Comments and interactions where supported.

Platforms:
- Instagram.
- Facebook.
- LinkedIn.
- YouTube.

Provide a calendar view and content workflow.

### H. Project & Task Management

Manage agency deliverables.

Features:
- Create projects.
- Assign project owners.
- Create tasks.
- Set deadlines.
- Set priority.
- Track progress.
- Upload files.
- Internal comments.
- Client approval.
- Task dependencies.
- Notifications.

Task statuses:
- Backlog
- To Do
- In Progress
- In Review
- Client Approval
- Completed

### I. Reports & Analytics

Generate professional client-facing reports.

Report types:
- Monthly marketing report.
- Campaign performance report.
- SEO report.
- GEO report.
- WhatsApp lead report.
- Social media report.
- Lead conversion report.
- ROI report.

Features:
- Date filters.
- Client filters.
- Charts and visualizations.
- PDF export.
- CSV export.
- Scheduled reporting.
- Shareable client reports.

Reports must be generated from real database data.

### J. Billing & Subscription Management

Features:
- Client invoices.
- Monthly retainers.
- Service packages.
- Payment tracking.
- Outstanding balances.
- Invoice history.
- Payment reminders.
- Revenue analytics.

Support INR currency formatting.

Do not implement payment processing until the payment gateway is configured.

### K. Notifications & Activity

Create centralized notifications.

Examples:
- New lead received.
- WhatsApp enquiry received.
- Follow-up due.
- Campaign performance alert.
- Client content approval pending.
- Project deadline approaching.
- Invoice overdue.

Include an audit trail for important operations.

### L. AI Marketing Assistant

Build an AI-powered assistant for agency operations.

Capabilities:
- Summarize client performance.
- Identify campaigns with poor ROI.
- Recommend campaign optimization.
- Summarize WhatsApp conversations.
- Suggest lead qualification scores.
- Generate campaign ideas.
- Draft social media captions.
- Generate monthly report summaries.
- Identify overdue client deliverables.

Use an LLM API through secure server-side endpoints.

AI must use actual client data with proper access restrictions.

AI recommendations must be clearly distinguished from measured performance.

## 5. APPLICATION NAVIGATION

Create the following sidebar:

OVERVIEW
- Executive Dashboard

CRM
- Clients
- Prospects
- Leads
- Sales Pipeline
- Contacts

MARKETING
- Campaigns & ROI
- Social Media
- Content Calendar
- SEO & GEO
- Email Marketing
- WhatsApp Inbox

OPERATIONS
- Projects
- Tasks
- Deliverables
- Client Approvals

ANALYTICS
- Reports
- Performance Analytics
- Revenue Analytics

ADMINISTRATION
- Team Members
- Billing & Invoices
- Integrations
- Notifications
- Settings

## 6. RECOMMENDED TECHNOLOGY STACK

Use a modern, maintainable architecture.

Frontend:
- Next.js with App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide React.
- Recharts.

Backend:
- Next.js server-side API or dedicated FastAPI services where appropriate.
- REST APIs.
- Server-side validation.
- Background job processing.

Database:
- PostgreSQL.
- Supabase preferred for initial implementation.
- Supabase Auth.
- Row Level Security.
- Supabase Storage.

Automation:
- n8n for workflow automation.
- WhatsApp Cloud API.
- Webhooks.

AI:
- OpenAI API.
- Secure server-side integration.

Deployment:
- Vercel for frontend.
- Supabase for database and authentication.
- Separate worker infrastructure where needed.

## 7. DATABASE DESIGN

Create a normalized PostgreSQL schema.

Core tables:

- organizations
- profiles
- organization_members
- clients
- client_contacts
- prospects
- leads
- lead_activities
- campaigns
- campaign_metrics
- marketing_channels
- social_accounts
- social_posts
- seo_projects
- seo_keywords
- seo_rankings
- geo_visibility_checks
- conversations
- conversation_messages
- whatsapp_contacts
- whatsapp_templates
- whatsapp_webhook_events
- projects
- tasks
- deliverables
- client_approvals
- invoices
- payments
- notifications
- integrations
- audit_logs

Requirements:
- UUID primary keys.
- Foreign key constraints.
- Created and updated timestamps.
- Appropriate indexes.
- Soft-delete strategy where appropriate.
- Organization-level data isolation.
- Client-level access policies.
- RLS policies for all sensitive tables.

Use migrations and seed scripts.

## 8. INTEGRATIONS

Prepare an integration architecture for:

- WhatsApp Cloud API.
- Google Analytics 4.
- Google Search Console.
- Google Ads.
- Meta Marketing API.
- LinkedIn integrations.
- n8n.
- OpenAI API.
- SMTP/email service.

Each integration should have:
- Connection status.
- Configuration.
- Credential management.
- Last successful sync.
- Last error.
- Sync logs.

Use environment variables for all secrets.

Never expose API keys in frontend code.

## 9. AUTHENTICATION AND SECURITY

Implement:
- Secure login.
- Logout.
- Password reset.
- Email verification.
- Session management.
- Role-based access control.
- Organization-level isolation.
- Client-specific access.
- Protected routes.
- API authorization.
- Input validation.
- Rate limiting.
- Audit logging.
- Secure webhook handling.

Google SSO can be added through Supabase Auth OAuth configuration.

Do not implement fake authentication.

## 10. UI/UX REQUIREMENTS

Login page:
Use the existing MIN MURASU login.html as the design reference.

Preserve:
- Brand identity.
- Murasu drum logo concept.
- The Digital Drum positioning.
- Real-Time Campaign & WhatsApp CRM Sync Active messaging.
- Main headline.
- Client & Growth Portal.
- Email and password authentication.
- Forgot password.
- Google Workspace SSO option.
- WhatsApp support link.

Dashboard:
Use crm-dashboard.html as the visual reference.

Improve:
- KPI cards.
- Interactive charts.
- Sidebar navigation.
- Client selector.
- Global search.
- Notifications.
- Campaign table.
- Lead pipeline.
- Responsive navigation.

Every visible action must work.

Avoid decorative buttons that do nothing.

## 11. DEVELOPMENT APPROACH

Build this in phases.

PHASE 1 – FOUNDATION
- Project setup.
- Design system.
- Database schema.
- Authentication.
- Organization management.
- RBAC.
- Login page.
- Executive dashboard.

PHASE 2 – CORE CRM
- Client management.
- Prospects.
- Lead management.
- Sales pipeline.
- Follow-up management.

PHASE 3 – MARKETING OPERATIONS
- Campaign management.
- Campaign analytics.
- Project management.
- Task management.
- Social media calendar.

PHASE 4 – WHATSAPP AUTOMATION
- WhatsApp Cloud API integration.
- Webhook infrastructure.
- Inbox.
- Contact synchronization.
- Automated workflows.
- Lead attribution.

PHASE 5 – ANALYTICS
- SEO.
- GEO.
- Google Analytics.
- Google Search Console.
- Reports and PDF exports.

PHASE 6 – AI & OPTIMIZATION
- AI marketing assistant.
- Lead scoring.
- Campaign recommendations.
- Automated report summaries.

## 12. IMPORTANT DEVELOPMENT RULES

1. First inspect the complete existing project and uploaded HTML files.
2. Preserve useful existing UI components and branding.
3. Do not rebuild everything blindly.
4. Do not use static mock data as actual business performance.
5. Create realistic demo seed data only for development and label it clearly.
6. Implement functional CRUD operations.
7. Build reusable components.
8. Use strict TypeScript.
9. Handle loading, empty and error states.
10. Validate all forms.
11. Add responsive layouts.
12. Implement proper authorization on the server, not just in the UI.
13. Do not expose secrets.
14. Maintain clear API documentation.
15. Test critical workflows.
16. Keep the code modular and production-ready.

## 13. DEFINITION OF DONE

The first release must allow MIN MURASU to:

- Sign in securely.
- Manage multiple clients.
- Create and manage leads.
- Track the sales pipeline.
- Create campaigns.
- Assign projects and tasks.
- Monitor marketing performance.
- Manage WhatsApp enquiries.
- Generate client reports.
- Give clients their own secure growth dashboard.

A feature is not complete simply because its screen exists. Its database operations, authorization, validation and user feedback must work.

## FINAL INSTRUCTION

Start by auditing the existing uploaded login.html and crm-dashboard.html.

Prepare:
1. Existing UI component assessment.
2. Proposed application architecture.
3. Database ER diagram.
4. Implementation roadmap.
5. Initial project structure.

Then implement Phase 1 completely before proceeding to Phase 2.

Do not attempt to generate the entire application in one pass.

Build a high-quality, maintainable digital growth platform that MIN MURASU can actually use to manage its agency and clients.