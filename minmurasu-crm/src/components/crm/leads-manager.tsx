'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { BarChart2, Briefcase, Download, Flag, Kanban, Mail, Plus, Search, Tag, TrendingUp, X } from 'lucide-react';
import { createLeadAction } from '@/lib/actions/crm';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatINR } from '@/lib/utils';

const STAGE_DOT_COLORS: Record<string, string> = {
  new: 'bg-brand-blue',
  contacted: 'bg-sky-500',
  qualified: 'bg-indigo-500',
  proposal_sent: 'bg-amber-500',
  negotiation: 'bg-violet-500',
  won: 'bg-emerald-500',
  lost: 'bg-rose-500',
};

function ScoreSegments({ score }: { score: number }) {
  const filled = Math.round(Math.max(0, Math.min(100, score)) / 10);
  const barColor =
    score >= 85
      ? 'bg-emerald-500'
      : score >= 65
        ? 'bg-brand-blue'
        : 'bg-amber-500';

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs font-semibold tabular-nums w-5 text-right">{score}</span>
      <div className="flex items-center gap-0.5" aria-label={`Score ${score} out of 100`}>
        {Array.from({ length: 10 }).map((_, idx) => (
          <span
            key={idx}
            className={`h-2.5 w-1 rounded-[1px] ${
              idx < filled ? barColor : 'bg-slate-200 dark:bg-white/15'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
  const [sortBy, setSortBy] = useState<'score_desc' | 'deal_desc' | 'name_asc'>('score_desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowDup, setAllowDup] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = leads
    .filter((l) => {
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
    })
    .sort((a, b) => {
      if (sortBy === 'deal_desc') {
        return Number(b.expected_deal_value_inr ?? 0) - Number(a.expected_deal_value_inr ?? 0);
      }
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return b.lead_score - a.lead_score;
    });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

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

      {/* Compact Filter Pill Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, email..."
            className="w-full h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-8 pr-3 text-xs text-brand-navy dark:text-white focus:border-brand-blue focus:outline-none"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium"
        >
          <option value="all">Stage: Any</option>
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
          onChange={(e) => {
            setSourceFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium"
        >
          <option value="all">Source: Any</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium"
        >
          <option value="score_desc">Sort: Score High–Low</option>
          <option value="deal_desc">Sort: Deal Value High–Low</option>
          <option value="name_asc">Sort: Name A–Z</option>
        </select>

        <button
          type="button"
          onClick={handleExportCsv}
          className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium hover:border-brand-blue transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Crisp Data Table */}
      <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400">
            No leads found. Click <strong>Add Lead</strong> to create your first lead.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface text-[11px] font-medium text-slate-500 dark:text-slate-300">
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      Lead &amp; Account
                    </span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-slate-400" />
                      Lead Score
                    </span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5 text-slate-400" />
                      Stage
                    </span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Contact
                    </span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-slate-400" />
                      Source
                    </span>
                  </th>
                  <th className="py-2.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                      Deal Value
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-[13px]">
                {paginated.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-md bg-brand-navy/8 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {lead.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-navy dark:text-white truncate">{lead.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {lead.company || lead.interested_service || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <ScoreSegments score={lead.lead_score} />
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-navy dark:text-slate-200">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT_COLORS[lead.stage] ?? 'bg-brand-blue'}`}
                        />
                        {lead.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-brand-slate dark:text-slate-300">
                      <p>{lead.email || '—'}</p>
                      <p className="text-slate-400 text-[11px]">{lead.phone || ''}</p>
                    </td>
                    <td className="py-2.5 px-4 text-xs capitalize text-brand-slate dark:text-slate-300">
                      {lead.source.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold tabular-nums">
                      {lead.expected_deal_value_inr ? formatINR(lead.expected_deal_value_inr) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <TablePagination
          totalItems={filtered.length}
          page={safePage}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
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
