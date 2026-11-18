'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Briefcase, ExternalLink, MapPin, Plus, Search, X } from 'lucide-react';
import { createClientAction } from '@/lib/actions/crm';
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

export function ClientsManager({ clients }: { clients: ClientItem[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.industry ?? '').toLowerCase().includes(q) ||
      (c.location ?? '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Clients
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Manage active retainers, service packages, and client portals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by client, industry, or city..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-10 pr-4 py-2 text-sm text-brand-navy dark:text-white focus:border-brand-blue focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3 py-2 text-xs font-medium text-brand-navy dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>
      </div>

      {/* Client Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 p-10 text-center text-sm text-brand-slate dark:text-slate-400">
          No clients match your current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="group bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow hover:border-brand-blue/50 transition flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-navy/8 dark:bg-brand-orange/15 text-brand-navy dark:text-brand-orange flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-brand-navy dark:text-white group-hover:text-brand-blue transition">
                      {client.name}
                    </h2>
                    <p className="text-xs text-brand-slate dark:text-slate-400">
                      {client.industry || 'Digital Growth Client'}
                    </p>
                  </div>
                </div>

                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp">
                  {client.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-brand-slate dark:text-slate-300">
                {client.location && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {client.location}
                  </p>
                )}
                {client.service_package && (
                  <p className="font-medium text-brand-blue">{client.service_package}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Monthly Retainer</span>
                  <span className="font-display font-bold text-sm text-brand-navy dark:text-white">
                    {formatINR(Number(client.monthly_retainer_inr || 0))}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-brand-blue">
                  Open 360° Profile
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-brand-navy dark:text-white">
                Add New Client
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-brand-slate dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="e.g., Kovai Precision Works"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate dark:text-slate-300 mb-1">
                    Industry
                  </label>
                  <input
                    name="industry"
                    placeholder="Healthcare / Manufacturing"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-slate dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    name="location"
                    placeholder="Coimbatore, TN"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-slate dark:text-slate-300 mb-1">
                    Monthly Retainer (INR)
                  </label>
                  <input
                    name="monthly_retainer_inr"
                    type="number"
                    min="0"
                    defaultValue="50000"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-slate dark:text-slate-300 mb-1">
                    Service Package
                  </label>
                  <input
                    name="service_package"
                    placeholder="SEO + Meta Ads + WhatsApp"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-slate dark:text-slate-300 mb-1">
                  Website
                </label>
                <input
                  name="website"
                  placeholder="https://example.com"
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
