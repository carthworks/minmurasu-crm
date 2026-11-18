import { Suspense } from 'react';
import { FileCheck2 } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

async function DeliverablesContent() {
  const rows = isSupabaseConfigured()
    ? (
        await (await createClient())
          .from('deliverables')
          .select('id, title, status, file_url, clients(name), projects(name)')
          .order('created_at', { ascending: false })
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">Deliverables</h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Client assets, creatives, and campaign deliverables tracked by project.
        </p>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 p-6 card-shadow">
        {rows.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-brand-blue" />
            <span>No deliverables uploaded yet.</span>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/10 text-sm">
            {rows.map((d) => {
              const cl = d.clients as unknown as { name: string } | null;
              const pr = d.projects as unknown as { name: string } | null;
              return (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{d.title}</p>
                    <p className="text-xs text-slate-400">{cl?.name ?? '—'} · {pr?.name ?? '—'}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize bg-brand-blue/10 text-brand-blue">
                    {d.status.replace('_', ' ')}
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

export default function DeliverablesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading deliverables...</div>}>
      <DeliverablesContent />
    </Suspense>
  );
}
