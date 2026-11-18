'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Download, Kanban, Plus, Search, X } from 'lucide-react';
import { createLeadAction } from '@/lib/actions/crm';
import { formatINR } from '@/lib/utils';

export interface LeadItem {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  interested_service: string | null;
  source: string;
  lead_score: number;
  expected_deal_value_inr: number | null;
  stage: string;
  next_follow_up: string | null;
}

const LEAD_SOURCES = [
  'website',
  'whatsapp',
  'google_ads',
  'meta_ads',
  'instagram',
  'linkedin',
  'organic_search',
  'referral',
  'manual',
];

export function LeadsManager({
  leads,
  clients,
}: {
  leads: LeadItem[];
  clients: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowDup, setAllowDup] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = leads.filter((l) => {
    const q = search.trim().toLowerCase();
    const matchesQ =
      !q ||
      l.name.toLowerCase().includes(q) ||
      (l.company ?? '').toLowerCase().includes(q) ||
      (l.email ?? '').toLowerCase().includes(q) ||
      (l.phone ?? '').toLowerCase().includes(q);
    const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchesQ && matchesStage && matchesSource;
  });

  function handleExportCsv() {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Source', 'Stage', 'Score', 'Deal Value (INR)'];
    const rows = filtered.map((l) =>
      [l.name, l.company ?? '', l.email ?? '', l.phone ?? '', l.source, l.stage, l.lead_score, l.expected_deal_value_inr ?? '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minmurasu-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (allowDup) formData.set('allow_duplicate', 'true');

    startTransition(async () => {
      const res = await createLeadAction(formData);
      if (res?.error) {
        setError(res.error);
        if (res.duplicate) setAllowDup(true);
      } else {
        setAllowDup(false);
        setModalOpen(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Leads
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Capture, score, and convert inbound enquiries across all marketing channels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3.5 py-2 text-xs font-semibold text-brand-navy dark:text-white hover:border-brand-blue transition"
          >
            <Kanban className="h-4 w-4 text-brand-blue" />
            <span>Kanban Pipeline</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setAllowDup(false);
              setError(null);
              setModalOpen(true);
            }}
            className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, email, phone..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-10 pr-4 py-2 text-sm text-brand-navy dark:text-white focus:border-brand-blue focus:outline-none"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3 py-2 text-xs font-medium"
        >
          <option value="all">All Stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="negotiation">Negotiation</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3 py-2 text-xs font-medium"
        >
          <option value="all">All Sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3 py-2 text-xs font-medium hover:border-brand-blue transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400">
            No leads found. Click <strong>Add Lead</strong> to create your first lead.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  <th className="py-3 px-5">Lead &amp; Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-5 text-right">Deal Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-brand-navy dark:text-white">{lead.name}</p>
                      <p className="text-xs text-brand-slate dark:text-slate-400">
                        {lead.company || lead.interested_service || '—'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-brand-slate dark:text-slate-300">
                      <p>{lead.email || '—'}</p>
                      <p className="text-slate-400">{lead.phone || ''}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs capitalize text-brand-slate dark:text-slate-300">
                      {lead.source.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-brand-blue/10 text-brand-blue">
                        {lead.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-xs">{lead.lead_score}/100</td>
                    <td className="py-3.5 px-5 text-right font-semibold">
                      {lead.expected_deal_value_inr ? formatINR(lead.expected_deal_value_inr) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Add New Lead</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Lead Name *</label>
                  <input
                    name="name"
                    required
                    placeholder="Ravi Kumar"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Company</label>
                  <input
                    name="company"
                    placeholder="Sri Murugan Builders"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="ravi@example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Phone / WhatsApp</label>
                  <input
                    name="phone"
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Source</label>
                  <select
                    name="source"
                    defaultValue="whatsapp"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Client Account (Optional)</label>
                  <select
                    name="client_id"
                    defaultValue=""
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  >
                    <option value="">Agency Prospect</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Expected Deal Value (INR)</label>
                  <input
                    name="expected_deal_value_inr"
                    type="number"
                    min="0"
                    placeholder="75000"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Lead Score (0–100)</label>
                  <input
                    name="lead_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="65"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer disabled:opacity-60"
                >
                  {isPending ? 'Saving...' : allowDup ? 'Create Anyway' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
