'use client';

import { useState, useTransition } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { createProspectAction } from '@/lib/actions/crm';
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

export function ProspectsManager({ prospects }: { prospects: ProspectItem[] }) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = prospects.filter((p) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      p.company_name.toLowerCase().includes(q) ||
      (p.contact_name ?? '').toLowerCase().includes(q) ||
      (p.industry ?? '').toLowerCase().includes(q)
    );
  });

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Prospects
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Track outbound targets and agency business development outreach.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Prospect</span>
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prospects..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-10 pr-4 py-2 text-sm"
        />
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400">
            No prospects added yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  <th className="py-3 px-5">Company</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Industry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Est. Retainer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                    <td className="py-3.5 px-5 font-semibold">{p.company_name}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <p>{p.contact_name || '—'}</p>
                      <p className="text-slate-400">{p.email || p.phone || ''}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">{p.industry || '—'}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-brand-orange/12 text-brand-orange">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-semibold">
                      {p.estimated_retainer_inr ? formatINR(p.estimated_retainer_inr) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
