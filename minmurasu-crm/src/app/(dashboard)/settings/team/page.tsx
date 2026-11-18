import { Suspense } from 'react';
import { Users } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { ROLE_LABELS, type UserRole } from '@/lib/auth/rbac';

async function TeamContent() {
  const members = isSupabaseConfigured()
    ? (
        await (await createClient())
          .from('organization_members')
          .select('id, role, is_active, profiles(full_name, email, job_title)')
      ).data ?? []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-brand-navy dark:text-white">
          Team Members &amp; RBAC
        </h1>
        <p className="text-sm text-brand-slate dark:text-slate-300 mt-0.5">
          Role-based access control across MIN MURASU agency staff and client users.
        </p>
      </div>

      <div className="bg-white dark:bg-brand-navy rounded-2xl border border-slate-200/80 dark:border-white/10 card-shadow overflow-hidden">
        {members.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Users className="h-5 w-5 text-brand-blue" />
            <span>No organization members found.</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-brand-navy-surface text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-5">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {members.map((m) => {
                const prof = m.profiles as unknown as {
                  full_name: string;
                  email: string;
                  job_title: string | null;
                } | null;
                return (
                  <tr key={m.id}>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold">{prof?.full_name ?? 'User'}</p>
                      <p className="text-xs text-slate-400">{prof?.email ?? '—'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-brand-blue">
                      {ROLE_LABELS[m.role as UserRole] ?? m.role}
                    </td>
                    <td className="py-3.5 px-5 text-right text-xs">
                      {m.is_active ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-brand-slate">Loading team...</div>}>
      <TeamContent />
    </Suspense>
  );
}
