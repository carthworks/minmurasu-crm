'use client';

import { useState, useTransition } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { createContactAction } from '@/lib/actions/crm';

export interface ContactItem {
  id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  is_primary: boolean;
  client_name: string;
}

export function ContactsManager({
  contacts,
  clients,
}: {
  contacts: ContactItem[];
  clients: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = contacts.filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.full_name.toLowerCase().includes(q) ||
      c.client_name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createContactAction(formData);
      if (res?.error) setError(res.error);
      else setModalOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Contacts
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Client stakeholders, decision-makers, and WhatsApp communication contacts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Contact</span>
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts or client..."
          className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy pl-10 pr-4 py-2 text-sm"
        />
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-brand-slate dark:text-slate-400">
            No client contacts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-5 text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition">
                    <td className="py-3.5 px-5 font-semibold">
                      {c.full_name}
                      {c.is_primary && (
                        <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-orange/15 text-brand-orange">
                          Primary
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-brand-blue">{c.client_name}</td>
                    <td className="py-3.5 px-4 text-xs">{c.email || '—'}</td>
                    <td className="py-3.5 px-4 text-xs">{c.whatsapp_number || c.phone || '—'}</td>
                    <td className="py-3.5 px-5 text-right text-xs text-slate-400">{c.role_title || '—'}</td>
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
              <h3 className="font-display text-lg font-bold">Add Client Contact</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Client *</label>
                <select name="client_id" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                  {clients.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name *</label>
                  <input name="full_name" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Title</label>
                  <input name="role_title" placeholder="Marketing Head" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Email</label>
                  <input name="email" type="email" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">WhatsApp Number</label>
                  <input name="whatsapp_number" placeholder="+91 98765 43210" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-xs">
                <input type="checkbox" name="is_primary" className="accent-[#F58220]" />
                <span>Primary Decision Maker</span>
              </label>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
