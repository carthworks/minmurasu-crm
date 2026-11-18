import { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

async function ApprovalsContent() {
  const rows = isSupabaseConfigured()
    ? (
        await (await createClient())
          .from('client_approvals')
          .select('id, status, feedback, created_at, clients(name)')
          .order('created_at', { ascending: false })
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Client Approvals
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Review pending creative sign-offs and client feedback.
        </p>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <FileText className="h-5 w-5 text-brand-orange" />
            <span>No pending client approvals.</span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
            {rows.map((a) => {
              const cl = a.clients as unknown as { name: string } | null;
              return (
                <li key={a.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{cl?.name ?? 'Client'}</p>
                    <p className="text-xs text-slate-400">{a.feedback || 'Awaiting review'}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-brand-orange/12 text-brand-orange">
                    {a.status.replace('_', ' ')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading approvals...</div>}>
      <ApprovalsContent />
    </Suspense>
  );
}
