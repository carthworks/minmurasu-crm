import { Suspense } from 'react';
import { Bell } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

async function NotificationsContent() {
  const rows = isSupabaseConfigured()
    ? (
        await (await createClient())
          .from('notifications')
          .select('id, title, body, category, is_read, created_at')
          .order('created_at', { ascending: false })
          .limit(30)
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Notifications
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Real-time alerts for leads, WhatsApp enquiries, approvals, and overdue tasks.
        </p>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Bell className="h-5 w-5 text-brand-blue" />
            <span>You are all caught up.</span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
            {rows.map((n) => (
              <li key={n.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading notifications...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
