'use client';

import { useState, useTransition } from 'react';
import { CalendarDays, Check, Plus, X } from 'lucide-react';
import { createSocialPostAction, updateSocialPostApprovalAction } from '@/lib/actions/operations';

export interface SocialPostRow {
  id: string;
  title: string;
  caption: string | null;
  scheduled_at: string | null;
  approval_status: string;
  publish_status: string;
  client_name: string;
}

export function SocialCalendar({
  posts,
  clients,
}: {
  posts: SocialPostRow[];
  clients: { id: string; name: string }[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createSocialPostAction(fd);
      if (res?.error) setError(res.error);
      else setModalOpen(false);
    });
  }

  function handleApprove(id: string, status: 'approved' | 'changes_requested') {
    startTransition(async () => {
      await updateSocialPostApprovalAction(id, status);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
            Social Media &amp; Content Calendar
          </h1>
          <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
            Plan posts, manage captions, and collect client approvals before publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-brand-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Post</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 p-10 text-center text-sm text-brand-slate dark:text-slate-400">
          No scheduled social posts yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 card-shadow flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-brand-blue">{post.client_name}</span>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize bg-brand-orange/12 text-brand-orange">
                    {post.approval_status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="font-display text-sm font-bold">{post.title}</h2>
                {post.caption && (
                  <p className="text-xs text-brand-slate dark:text-slate-300 line-clamp-3">
                    {post.caption}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'Unscheduled'}
                </span>
                {post.approval_status === 'pending' && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleApprove(post.id, 'approved')}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-brand-whatsapp px-2.5 py-1 font-semibold hover:bg-emerald-500/20 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Schedule Social Post</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-1 text-slate-400 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Client *</label>
                <select name="client_id" required className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm">
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Post Title *</label>
                <input name="title" required placeholder="Diwali Product Showcase Reel" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Caption</label>
                <textarea name="caption" rows={3} className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Scheduled Date</label>
                <input name="scheduled_at" type="datetime-local" className="w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-brand-navy-dark px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 dark:border-white/15 px-4 py-2 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isPending} className="btn-brand-primary rounded-xl px-4 py-2 text-xs cursor-pointer">
                  {isPending ? 'Saving...' : 'Schedule Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
