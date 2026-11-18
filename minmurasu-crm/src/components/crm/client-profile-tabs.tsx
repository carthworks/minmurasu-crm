'use client';

import { useState } from 'react';
import { formatINR, formatNumber } from '@/lib/utils';

const TABS = [
  'Overview',
  'Campaigns',
  'Leads',
  'Projects',
  'SEO/GEO',
  'Social Media',
  'WhatsApp',
  'Reports',
  'Billing',
  'Activity History',
] as const;

type TabKey = (typeof TABS)[number];

interface ClientProfileProps {
  client: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    location: string | null;
    monthly_retainer_inr: number;
    service_package: string | null;
    status: string;
    contract_start: string | null;
    contract_end: string | null;
    internal_notes: string | null;
  };
  contacts: { id: string; full_name: string; role_title: string | null; email: string | null; phone: string | null }[];
  campaigns: { id: string; name: string; status: string; budget_inr: number }[];
  leads: { id: string; name: string; stage: string; source: string; expected_deal_value_inr: number | null }[];
  projects: { id: string; name: string; status: string; progress_pct: number; due_date: string | null }[];
  invoices: { id: string; invoice_number: string; amount_inr: number; status: string; due_date: string }[];
  activities: { id: string; action: string; created_at: string }[];
}

export function ClientProfileTabs({
  client,
  contacts,
  campaigns,
  leads,
  projects,
  invoices,
  activities,
}: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab
                ? 'bg-brand-orange text-white shadow-xs'
                : 'text-brand-slate dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow">
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-display text-sm font-bold text-brand-navy dark:text-white">
                Account Summary
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-400">Industry</dt>
                  <dd className="font-medium mt-0.5">{client.industry || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Location</dt>
                  <dd className="font-medium mt-0.5">{client.location || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Package</dt>
                  <dd className="font-medium mt-0.5 text-brand-blue">{client.service_package || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Monthly Retainer</dt>
                  <dd className="font-bold mt-0.5">{formatINR(Number(client.monthly_retainer_inr || 0))}</dd>
                </div>
              </dl>
              {client.internal_notes && (
                <div className="pt-2">
                  <p className="text-xs text-slate-400 mb-1">Internal Notes</p>
                  <p className="text-xs text-brand-slate dark:text-slate-300 bg-slate-50 dark:bg-brand-navy-dark p-3 rounded-xl">
                    {client.internal_notes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-display text-sm font-bold text-brand-navy dark:text-white">
                Primary Contacts ({contacts.length})
              </h3>
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-400">No contacts added for this client yet.</p>
              ) : (
                <ul className="space-y-2">
                  {contacts.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-slate-100 dark:border-white/10 p-3 text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">{c.full_name}</p>
                        <p className="text-slate-400">{c.role_title || 'Stakeholder'}</p>
                      </div>
                      <div className="text-right text-slate-400">
                        <p>{c.email || '—'}</p>
                        <p>{c.phone || ''}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Campaigns' && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold">Campaigns ({campaigns.length})</h3>
            {campaigns.length === 0 ? (
              <p className="text-xs text-slate-400">No campaigns linked to this client.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
                {campaigns.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between">
                    <span className="font-semibold">{c.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="capitalize text-brand-blue font-medium">{c.status}</span>
                      <span className="font-semibold">{formatINR(Number(c.budget_inr || 0))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Leads' && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold">Attributed Leads ({leads.length})</h3>
            {leads.length === 0 ? (
              <p className="text-xs text-slate-400">No leads attributed to this client yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
                {leads.map((l) => (
                  <div key={l.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-slate-400">Source: {l.source}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="capitalize text-brand-orange font-semibold">{l.stage.replace('_', ' ')}</span>
                      <span>{l.expected_deal_value_inr ? formatINR(l.expected_deal_value_inr) : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Projects' && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold">Active Projects ({projects.length})</h3>
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400">No projects created for this client yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
                {projects.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <span className="font-semibold">{p.name}</span>
                    <span>{formatNumber(p.progress_pct)}% complete</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'SEO/GEO' || activeTab === 'Social Media' || activeTab === 'WhatsApp' || activeTab === 'Reports') && (
          <div className="py-6 text-center text-xs text-brand-slate dark:text-slate-400">
            <p className="font-semibold text-brand-navy dark:text-white mb-1">{activeTab} Workspace</p>
            <p>
              Connected {activeTab} records for <strong>{client.name}</strong> will appear here as Phase 3–5 integrations are enabled.
            </p>
          </div>
        )}

        {activeTab === 'Billing' && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold">Invoices ({invoices.length})</h3>
            {invoices.length === 0 ? (
              <p className="text-xs text-slate-400">No invoices issued for this client yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/10 text-xs">
                {invoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <span className="font-semibold">{inv.invoice_number}</span>
                    <div className="flex items-center gap-4">
                      <span className="capitalize">{inv.status}</span>
                      <span className="font-bold">{formatINR(Number(inv.amount_inr))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Activity History' && (
          <div className="space-y-3">
            <h3 className="font-display text-sm font-bold">Audit &amp; Activity History</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/10">
                    <span className="font-medium">{a.action}</span>
                    <span className="text-slate-400">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
