'use client';

import { useState, useTransition } from 'react';
import {
  Building2,
  Download,
  Flag,
  IndianRupee,
  LayoutGrid,
  List,
  Plus,
  Search,
  Tag,
  User,
  X,
} from 'lucide-react';
import { createProspectAction } from '@/lib/actions/crm';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatINR } from '@/lib/utils';

export interface ProspectItem {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  estimated_retainer_inr: number | null;
  status: string;
}

const PROSPECT_DOT: Record<string, string> = {
  researching: 'bg-slate-400',
  outreach: 'bg-brand-blue',
  replied: 'bg-brand-orange',
  qualified: 'bg-emerald-500',
  archived: 'bg-rose-500',
};

export function ProspectsManager({ prospects }: { prospects: ProspectItem[] }) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'company_asc' | 'retainer_desc' | 'retainer_asc'>('company_asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = prospects
    .filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesQ =
        !q ||
        p.company_name.toLowerCase().includes(q) ||
        (p.contact_name ?? '').toLowerCase().includes(q) ||
        (p.industry ?? '').toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesQ && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'retainer_desc') {
        return Number(b.estimated_retainer_inr ?? 0) - Number(a.estimated_retainer_inr ?? 0);
      }
      if (sortBy === 'retainer_asc') {
        return Number(a.estimated_retainer_inr ?? 0) - Number(b.estimated_retainer_inr ?? 0);
      }
      return a.company_name.localeCompare(b.company_name);
    });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleExportCsv() {
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Industry', 'Status', 'Est. Retainer (INR)'];
    const rows = filtered.map((p) =>
      [
        p.company_name,
        p.contact_name ?? '',
        p.email ?? '',
        p.phone ?? '',
        p.industry ?? '',
        p.status,
        p.estimated_retainer_inr ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minmurasu-prospects.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createProspectAction(formData);
      if (res?.error) setError(res.error);
      else setModalOpen(false);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Prospects
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Track outbound targets and agency business development outreach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-white/15 text-brand-navy dark:text-white font-semibold'
                  : 'text-slate-400 hover:text-brand-navy dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-white/15 text-brand-navy dark:text-white font-semibold'
                  : 'text-slate-400 hover:text-brand-navy dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Prospect</span>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search company, contact, industry..."
            className="w-full h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-8 pr-3 text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium"
        >
          <option value="all">Status: Any</option>
          <option value="researching">Researching</option>
          <option value="outreach">Outreach</option>
          <option value="replied">Replied</option>
          <option value="qualified">Qualified</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium"
        >
          <option value="company_asc">Sort: Company A–Z</option>
          <option value="retainer_desc">Sort: Est. Retainer High–Low</option>
          <option value="retainer_asc">Sort: Est. Retainer Low–High</option>
        </select>

        <button
          type="button"
          onClick={handleExportCsv}
          className="h-8 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium hover:border-brand-blue transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />
          Export CSV
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          {paginated.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400">
              No prospects match your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface text-[11px] font-medium text-slate-500 dark:text-slate-300">
                    <th className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        Company
                      </span>
                    </th>
                    <th className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Contact
                      </span>
                    </th>
                    <th className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                        Industry
                      </span>
                    </th>
                    <th className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Flag className="h-3.5 w-3.5 text-slate-400" />
                        Status
                      </span>
                    </th>
                    <th className="py-2.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 justify-end">
                        <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                        Est. Retainer
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-[13px]">
                  {paginated.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                      <td className="py-2.5 px-4 font-semibold">{p.company_name}</td>
                      <td className="py-2.5 px-4 text-xs">
                        <p>{p.contact_name || '—'}</p>
                        <p className="text-slate-400 text-[11px]">{p.email || p.phone || ''}</p>
                      </td>
                      <td className="py-2.5 px-4 text-xs">{p.industry || '—'}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize">
                          <span className={`h-1.5 w-1.5 rounded-full ${PROSPECT_DOT[p.status] ?? 'bg-brand-orange'}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold tabular-nums">
                        {p.estimated_retainer_inr ? formatINR(p.estimated_retainer_inr) : '—'}
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
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-sm font-bold">{p.company_name}</h2>
                    <p className="text-xs text-slate-400">{p.industry || 'Outbound Prospect'}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium capitalize">
                    <span className={`h-1.5 w-1.5 rounded-full ${PROSPECT_DOT[p.status] ?? 'bg-brand-orange'}`} />
                    {p.status}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{p.contact_name || 'No contact'}</span>
                  <span className="font-bold">
                    {p.estimated_retainer_inr ? formatINR(p.estimated_retainer_inr) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
            <TablePagination
              totalItems={filtered.length}
              page={safePage}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Add Prospect</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Company Name *</label>
                <input name="company_name" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Contact Name</label>
                  <input name="contact_name" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Industry</label>
                  <input name="industry" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input name="email" type="email" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Est. Retainer (INR)</label>
                  <input name="estimated_retainer_inr" type="number" min="0" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Save Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
