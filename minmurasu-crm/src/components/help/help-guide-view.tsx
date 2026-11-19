'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Database,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';

type GuideTab = 'workflows' | 'permissions' | 'architecture';
type AudienceTab = 'admin' | 'team';

const ADMIN_WORKFLOWS = [
  {
    title: '1. Decision Intelligence & ROI Monitoring',
    badge: 'Executive',
    steps: [
      'Use the topbar Client Filter to switch between All Clients and a specific account.',
      'Review the 10 live KPIs: MRR, Qualified Leads, Spend, Revenue Attributed, Avg. ROI, and Overdue Tasks.',
      'Open Analytics to query the AI Marketing Assistant (advisory output grounded in measured records).',
      'Export presentation-ready vector PDF reports from Reports with MIN MURASU branding, date stamp, and Client ID.',
    ],
    links: [
      { label: 'Executive Dashboard', href: '/' },
      { label: 'AI Analytics', href: '/analytics' },
      { label: 'PDF Reports', href: '/reports' },
    ],
  },
  {
    title: '2. Customer Experience & Onboarding',
    badge: 'Client Portal',
    steps: [
      'Register new accounts in Clients with industry, package, and monthly retainer (INR).',
      'Open any client’s 10-tab 360° Profile for unified visibility across campaigns, leads, SEO/GEO, and billing.',
      'Schedule posts in Content Calendar and collect one-click client approvals before publishing.',
      'Monitor WhatsApp Business CRM conversations while respecting the 24-hour service window and opt-in status.',
    ],
    links: [
      { label: 'Clients 360°', href: '/clients' },
      { label: 'Content Calendar', href: '/calendar' },
      { label: 'WhatsApp Inbox', href: '/whatsapp' },
    ],
  },
  {
    title: '3. Agency Profitability & Billing',
    badge: 'Finance (INR)',
    steps: [
      'Track Active Monthly Retainers, Total Billed, Collected (Paid), and Outstanding Balance in INR.',
      'Click + New Invoice to issue client invoices and download branded PDF invoices anytime.',
      'Use Mark Paid to record Bank Transfer, UPI, or Cheque settlements with UTR reference numbers.',
    ],
    links: [{ label: 'Billing & Invoices', href: '/billing' }],
  },
];

const TEAM_WORKFLOWS = [
  {
    title: '1. Lead Capture & Pipeline Execution',
    badge: 'Sales & BD',
    steps: [
      'Add inbound leads in Leads — built-in duplicate detection checks email and phone automatically.',
      'Filter by Stage, Source, or Fit Score (10-segment meter) and export filtered lists to CSV.',
      'Switch to Kanban Pipeline and drag-and-drop deals across all 7 stages; every move logs to lead_activities.',
    ],
    links: [
      { label: 'Leads Table', href: '/leads' },
      { label: 'Kanban Pipeline', href: '/pipeline' },
      { label: 'Prospects', href: '/prospects' },
    ],
  },
  {
    title: '2. Campaign & Task Delivery',
    badge: 'Operations',
    steps: [
      'Launch client campaigns in Campaigns & ROI and use Log Metrics to record daily spend, leads, and revenue.',
      'Create client projects in Projects first, then add deliverables/tasks in Tasks.',
      'Drag tasks across the 6-stage board (Backlog → To Do → In Progress → In Review → Client Approval → Completed).',
    ],
    links: [
      { label: 'Campaigns & ROI', href: '/campaigns' },
      { label: 'Projects', href: '/projects' },
      { label: 'Task Board', href: '/tasks' },
    ],
  },
];

const ROLE_MATRIX = [
  {
    role: 'Super Admin',
    dot: 'bg-brand-orange',
    scope: 'Full Organization',
    clients: 'Read / Write',
    leads: 'Read / Write',
    campaigns: 'Read / Write',
    billing: 'Read / Write',
    admin: 'Full Admin',
  },
  {
    role: 'Agency Admin',
    dot: 'bg-brand-blue',
    scope: 'Full Organization',
    clients: 'Read / Write',
    leads: 'Read / Write',
    campaigns: 'Read / Write',
    billing: 'Read / Write',
    admin: 'Team & Org',
  },
  {
    role: 'Marketing Manager',
    dot: 'bg-indigo-500',
    scope: 'Full Organization',
    clients: 'Read / Write',
    leads: 'Read / Write',
    campaigns: 'Read / Write',
    billing: 'Read Only',
    admin: 'Read Only',
  },
  {
    role: 'Sales / BD',
    dot: 'bg-emerald-500',
    scope: 'Full Organization',
    clients: 'Read / Write',
    leads: 'Read / Write',
    campaigns: 'Read Only',
    billing: 'Read Only',
    admin: 'Read Only',
  },
  {
    role: 'Team Member',
    dot: 'bg-slate-400',
    scope: 'Full Organization',
    clients: 'Read / Write',
    leads: 'Read Only',
    campaigns: 'Read Only',
    billing: 'Read Only',
    admin: 'Read Only',
  },
  {
    role: 'Client',
    dot: 'bg-brand-whatsapp',
    scope: 'Own client_id Only',
    clients: 'Own Profile',
    leads: 'Own Leads',
    campaigns: 'Own (Read)',
    billing: 'Own Invoices',
    admin: 'No Access',
  },
];

export function HelpGuideView() {
  const [activeTab, setActiveTab] = useState<GuideTab>('workflows');
  const [audience, setAudience] = useState<AudienceTab>('admin');

  const workflows = audience === 'admin' ? ADMIN_WORKFLOWS : TEAM_WORKFLOWS;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-brand-navy text-white p-6 sm:p-8 relative overflow-hidden border border-white/10">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-orange/15 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/20 text-brand-orange px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <BookOpen className="h-3.5 w-3.5" />
              MIN MURASU Operations Manual
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              CRM How-To Guide &amp; Role Permissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Step-by-step operational workflows for administrators and team members, plus the complete Supabase RLS and RBAC security reference.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('workflows')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'workflows'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              <Workflow className="h-3.5 w-3.5" />
              Workflows
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Role Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                activeTab === 'architecture'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              RLS &amp; Security
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Workflows */}
      {activeTab === 'workflows' && (
        <div className="space-y-5">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy p-1">
            <button
              type="button"
              onClick={() => setAudience('admin')}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                audience === 'admin'
                  ? 'bg-brand-navy text-white dark:bg-brand-orange'
                  : 'text-brand-slate dark:text-slate-300 hover:text-brand-navy'
              }`}
            >
              Administrators &amp; Account Leads
            </button>
            <button
              type="button"
              onClick={() => setAudience('team')}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                audience === 'team'
                  ? 'bg-brand-navy text-white dark:bg-brand-orange'
                  : 'text-brand-slate dark:text-slate-300 hover:text-brand-navy'
              }`}
            >
              Standard Users (Managers, Sales, Team)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {workflows.map((wf) => (
              <div
                key={wf.title}
                className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow flex flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-sm font-bold text-brand-navy dark:text-white">
                      {wf.title}
                    </h2>
                    <span className="rounded-full bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0">
                      {wf.badge}
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-brand-slate dark:text-slate-300">
                    {wf.steps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-orange shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-2">
                  {wf.links.map((lnk) => (
                    <Link
                      key={lnk.href}
                      href={lnk.href}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/15 px-2.5 py-1 text-[11px] font-semibold text-brand-blue hover:border-brand-blue transition"
                    >
                      {lnk.label}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Role Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold">System Role Permissions Matrix</h2>
              <p className="text-xs text-slate-400">
                Assign and update roles under Administration → Team Members
              </p>
            </div>
            <Link
              href="/settings/team"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              Manage Team Roles
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface text-[11px] font-medium text-slate-500 dark:text-slate-300">
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Data Scope</th>
                  <th className="py-2.5 px-4">Clients &amp; Contacts</th>
                  <th className="py-2.5 px-4">Leads &amp; Pipeline</th>
                  <th className="py-2.5 px-4">Campaigns &amp; Tasks</th>
                  <th className="py-2.5 px-4">Billing</th>
                  <th className="py-2.5 px-4">Team &amp; Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {ROLE_MATRIX.map((r) => (
                  <tr key={r.role} className="hover:bg-slate-50/70 dark:hover:bg-white/5">
                    <td className="py-3 px-4 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${r.dot}`} />
                        {r.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-brand-blue">{r.scope}</td>
                    <td className="py-3 px-4 text-xs">{r.clients}</td>
                    <td className="py-3 px-4 text-xs">{r.leads}</td>
                    <td className="py-3 px-4 text-xs">{r.campaigns}</td>
                    <td className="py-3 px-4 text-xs">{r.billing}</td>
                    <td className="py-3 px-4 text-xs font-medium">{r.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Server & Supabase RLS Architecture */}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow space-y-3">
            <div className="h-9 w-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <h2 className="font-display text-sm font-bold">1. Middleware &amp; Server RBAC</h2>
            <p className="text-xs text-brand-slate dark:text-slate-300 leading-relaxed">
              Every request validates the Supabase JWT via <code>updateSession()</code>. Server Actions call{' '}
              <code>getCurrentUserContext()</code> and verify role helpers (<code>isAgencyStaffRole</code>,{' '}
              <code>canManageCampaigns</code>, <code>canManageLeads</code>, <code>canManageSettings</code>) before mutating data.
            </p>
          </div>

          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow space-y-3">
            <div className="h-9 w-9 rounded-xl bg-brand-orange/12 text-brand-orange flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
            <h2 className="font-display text-sm font-bold">2. PostgreSQL RLS Isolation</h2>
            <p className="text-xs text-brand-slate dark:text-slate-300 leading-relaxed">
              Non-recursive <code>SECURITY DEFINER</code> functions (<code>is_org_member</code>,{' '}
              <code>is_agency_staff</code>, <code>is_org_admin</code>, <code>is_client_member_for</code>) enforce{' '}
              <code>USING</code> and <code>WITH CHECK</code> policies at the database layer so <code>client</code> users can never access another client’s rows.
            </p>
          </div>

          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow space-y-3">
            <div className="h-9 w-9 rounded-xl bg-brand-whatsapp/12 text-emerald-600 dark:text-brand-whatsapp flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="font-display text-sm font-bold">3. Server-Side Secrets</h2>
            <p className="text-xs text-brand-slate dark:text-slate-300 leading-relaxed">
              Sensitive keys (<code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>WHATSAPP_ACCESS_TOKEN</code>,{' '}
              <code>WHATSAPP_APP_SECRET</code>, <code>OPENAI_API_KEY</code>) live strictly in server environment variables and are never exposed to client bundles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
