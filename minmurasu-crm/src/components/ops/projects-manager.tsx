'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, X } from 'lucide-react';
import { createProjectAction } from '@/lib/actions/operations';

export interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  client_name: string;
  status: string;
  progress_pct: number;
  due_date: string | null;
}

export function ProjectsManager({
  projects,
  clients,
}: {
  projects: ProjectRow[];
  clients: { id: string; name: string }[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createProjectAction(fd);
      if (res?.error) setError(res.error);
      else setModalOpen(false);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Projects
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Track agency deliverables, client onboarding, and campaign rollouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/tasks"
            className="rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-brand-navy px-3.5 py-2 text-xs font-semibold hover:border-brand-blue transition"
          >
            Task Board
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 p-10 text-center text-sm text-brand-slate dark:text-slate-400">
          No projects created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-display text-sm font-bold">{p.name}</h2>
                    <p className="text-xs text-brand-slate dark:text-slate-400">{p.client_name}</p>
                  </div>
                </div>
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp">
                  {p.status}
                </span>
              </div>

              {p.description && (
                <p className="text-xs text-brand-slate dark:text-slate-300 line-clamp-2">{p.description}</p>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progress</span>
                  <span className="font-semibold">{p.progress_pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-1.5 rounded-full bg-brand-orange" style={{ width: `${p.progress_pct}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">New Project</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Client *</label>
                <select name="client_id" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Project Name *</label>
                <input name="name" required placeholder="Next.js Website & CRO Redesign" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea name="description" rows={2} className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Due Date</label>
                <input name="due_date" type="date" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
