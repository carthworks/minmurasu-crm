'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Download,
  ExternalLink,
  Flag,
  IndianRupee,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { createClientAction } from '@/lib/actions/crm';
import { TablePagination } from '@/components/ui/table-pagination';
import { formatINR } from '@/lib/utils';

export interface ClientItem {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  monthly_retainer_inr: number;
  service_package: string | null;
  status: string;
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-emerald-500',
  onboarding: 'bg-brand-blue',
  paused: 'bg-amber-500',
  churned: 'bg-rose-500',
};

export function ClientsManager({ clients }: { clients: ClientItem[] }) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'retainer_desc' | 'retainer_asc'>('name_asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = clients
    .filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q) ||
        (c.service_package ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'retainer_desc') return Number(b.monthly_retainer_inr) - Number(a.monthly_retainer_inr);
      if (sortBy === 'retainer_asc') return Number(a.monthly_retainer_inr) - Number(b.monthly_retainer_inr);
      return a.name.localeCompare(b.name);
    });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleExportCsv() {
    const headers = ['Client Name', 'Industry', 'Location', 'Package', 'Status', 'Monthly Retainer (INR)', 'Website'];
    const rows = filtered.map((c) =>
      [
        c.name,
        c.industry ?? '',
        c.location ?? '',
        c.service_package ?? '',
        c.status,
        c.monthly_retainer_inr,
        c.website ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minmurasu-clients.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createClientAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setModalOpen(false);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Clients
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Manage active retainers, service packages, and client portals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
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
              aria-label="Grid view"
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
            <span>Add Client</span>
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
            placeholder="Search client, industry, city..."
            className="w-full h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-8 pr-3 text-xs text-brand-navy dark:text-white focus:border-brand-blue focus:outline-none"
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
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-8 rounded-lg border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-2.5 text-xs font-medium"
        >
          <option value="name_asc">Sort: Name A–Z</option>
          <option value="retainer_desc">Sort: Retainer High–Low</option>
          <option value="retainer_asc">Sort: Retainer Low–High</option>
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

      {/* Table or Cards View */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
          {paginated.length === 0 ? (
            <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400">
              No clients match your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-brand-navy-surface text-[11px] font-medium text-slate-500 dark:text-slate-300">
                    <th className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        Client &amp; Package
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
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Location
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
                        Retainer
                      </span>
                    </th>
                    <th className="py-2.5 px-4 text-right">Portal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-[13px]">
                  {paginated.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition">
                      <td className="py-2.5 px-4">
                        <Link href={`/clients/${client.id}`} className="flex items-center gap-2.5 group">
                          <span className="h-6 w-6 rounded-md bg-brand-navy/8 dark:bg-white/10 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {client.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-navy dark:text-white group-hover:text-brand-blue truncate">
                              {client.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {client.service_package || 'Custom Package'}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-brand-slate dark:text-slate-300">
                        {client.industry || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-brand-slate dark:text-slate-300">
                        {client.location || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-xs font-medium capitalize">
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[client.status] ?? 'bg-emerald-500'}`} />
                          {client.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold tabular-nums">
                        {formatINR(Number(client.monthly_retainer_inr || 0))}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={`/clients/${client.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
                        >
                          360°
                          <ExternalLink className="h-3 w-3" />
                        </Link>
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
          {paginated.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 p-10 text-center text-sm text-brand-slate dark:text-slate-400">
              No clients match your current filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="group bg-white dark:bg-brand-navy rounded-xl border border-slate-200/80 dark:border-white/10 p-4 hover:border-brand-blue/50 transition flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-brand-navy/8 dark:bg-brand-orange/15 text-brand-navy dark:text-brand-orange flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="font-display text-sm font-bold text-brand-navy dark:text-white group-hover:text-brand-blue transition">
                          {client.name}
                        </h2>
                        <p className="text-xs text-slate-400">{client.industry || 'Digital Growth Client'}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 px-2.5 py-0.5 text-[11px] font-medium capitalize">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[client.status] ?? 'bg-emerald-500'}`} />
                      {client.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                    <span className="font-display font-bold text-sm">
                      {formatINR(Number(client.monthly_retainer_inr || 0))}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-blue">
                      Open 360°
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

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

      {/* Add Client Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-brand-navy dark:text-white">
                  Add New Client
                </h3>
                <p className="text-xs text-slate-400">
                  Onboard company, retainer terms, and primary point of contact in one step.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">Company Name *</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g., Kovai Precision Works"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue="onboarding"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  >
                    <option value="onboarding">Onboarding</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Industry</label>
                  <input
                    name="industry"
                    placeholder="Healthcare / B2B"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Location</label>
                  <input
                    name="location"
                    placeholder="Coimbatore, TN"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Website</label>
                  <input
                    name="website"
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Monthly Retainer (INR)</label>
                  <input
                    name="monthly_retainer_inr"
                    type="number"
                    min="0"
                    defaultValue="50000"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Service Package</label>
                  <input
                    name="service_package"
                    placeholder="SEO + Meta Ads + WhatsApp"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Contract Start</label>
                  <input
                    name="contract_start"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Contract End</label>
                  <input
                    name="contract_end"
                    type="date"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-blue">
                  Primary Decision Maker (Auto-added to Contacts)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Contact Name</label>
                    <input
                      name="primary_contact_name"
                      placeholder="Senthil Nathan"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Email</label>
                    <input
                      name="primary_contact_email"
                      type="email"
                      placeholder="senthil@company.com"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone / WhatsApp</label>
                    <input
                      name="primary_contact_phone"
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Onboarding Goals &amp; Notes</label>
                <textarea
                  name="internal_notes"
                  rows={2}
                  placeholder="Target CPL, key markets, or priority deliverables..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                />
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
                  {isPending ? 'Saving...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
